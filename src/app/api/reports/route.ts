import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
import { InventoryItem, InventorySession } from "@/types/database";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface ReportData {
  summary: {
    totalSessions: number;
    todaySessions: number;
    totalItems: number;
    checkedItems: number;
    matchedItems: number;
    mismatchedItems: number;
    pendingItems: number;
    completionRate: number;
  };
  recentSessions: Array<{
    id: string;
    name: string;
    status: string;
    totalItems: number;
    checkedItems: number;
    createdAt: string;
  }>;
  mismatchedItems: Array<{
    sessionName: string;
    productName: string;
    barcode: string;
    expected: number;
    actual: number;
    difference: number;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "1", 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 세션 조회
    const { data: sessions } = await supabase
      .from("inventory_sessions")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    const sessionsData = (sessions as InventorySession[]) ?? [];

    // 모든 품목 조회
    const { data: allItems } = await supabase
      .from("inventory_items")
      .select("*, inventory_sessions!inner(name)")
      .gte("inventory_sessions.created_at", startDate.toISOString());

    const itemsData = (allItems as (InventoryItem & { inventory_sessions: { name: string } })[]) ?? [];

    // 통계 계산
    const totalItems = itemsData.length;
    const checkedItems = itemsData.filter((i) => i.status !== "pending").length;
    const matchedItems = itemsData.filter((i) => i.status === "matched").length;
    const mismatchedItems = itemsData.filter(
      (i) => i.status === "mismatched"
    ).length;
    const pendingItems = itemsData.filter((i) => i.status === "pending").length;
    const completionRate =
      totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    // 오늘 세션 수
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySessions = sessionsData.filter(
      (s) => new Date(s.created_at) >= today
    ).length;

    // 불일치 품목 상세
    const mismatchedDetails = itemsData
      .filter((i) => i.status === "mismatched")
      .map((item) => ({
        sessionName: item.inventory_sessions.name,
        productName: item.product_name,
        barcode: item.barcode,
        expected: item.expected_quantity,
        actual: item.actual_quantity ?? 0,
        difference: (item.actual_quantity ?? 0) - item.expected_quantity,
      }));

    const report: ReportData = {
      summary: {
        totalSessions: sessionsData.length,
        todaySessions,
        totalItems,
        checkedItems,
        matchedItems,
        mismatchedItems,
        pendingItems,
        completionRate,
      },
      recentSessions: sessionsData.slice(0, 5).map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        totalItems: s.total_items,
        checkedItems: s.checked_items,
        createdAt: s.created_at,
      })),
      mismatchedItems: mismatchedDetails,
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json(
      { error: "리포트 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}

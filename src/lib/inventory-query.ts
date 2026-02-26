import { createClient } from "@supabase/supabase-js";
import { InventoryItem, InventorySession } from "@/types/database";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
  return createClient(url, key);
}

export async function getInventoryContext(sessionId?: string): Promise<string> {
  const supabase = getSupabase();

  if (sessionId) {
    return await fetchSessionContext(sessionId);
  }

  const { data: sessions } = await supabase
    .from("inventory_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (!sessions || sessions.length === 0) {
    return "현재 등록된 재고 확인 세션이 없습니다.";
  }

  return await fetchSessionContext(sessions[0].id);
}

async function fetchSessionContext(sessionId: string): Promise<string> {
  const supabase = getSupabase();

  const [sessionRes, itemsRes] = await Promise.all([
    supabase
      .from("inventory_sessions")
      .select("*")
      .eq("id", sessionId)
      .single(),
    supabase
      .from("inventory_items")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at"),
  ]);

  const session = sessionRes.data as InventorySession | null;
  const items = (itemsRes.data as InventoryItem[]) ?? [];

  if (!session) return "세션을 찾을 수 없습니다.";

  const lines: string[] = [
    `세션: ${session.name}`,
    `상태: ${session.status === "completed" ? "완료" : "진행중"}`,
    `전체 품목: ${session.total_items}개, 확인 완료: ${session.checked_items}개`,
    "",
    "품목 목록:",
  ];

  for (const item of items) {
    const statusLabel =
      item.status === "matched"
        ? "일치"
        : item.status === "mismatched"
          ? "불일치"
          : "미확인";
    const actualQty =
      item.actual_quantity !== null ? `${item.actual_quantity}개` : "-";
    lines.push(
      `- ${item.product_name} (바코드: ${item.barcode}) | 재고서: ${item.expected_quantity}개 | 실물: ${actualQty} | 상태: ${statusLabel}`
    );
  }

  return lines.join("\n");
}

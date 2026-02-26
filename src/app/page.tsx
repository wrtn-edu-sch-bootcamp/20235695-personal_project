import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionCard } from "@/components/inventory/session-card";
import { createClient } from "@/lib/supabase/server";
import { InventorySession } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let sessions: InventorySession[] | null = null;
  let envError = false;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("inventory_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<InventorySession[]>();
    sessions = data;
  } catch (err) {
    console.error("HomePage error:", err);
    envError = true;
  }

  if (envError) {
    return (
      <div className="mx-auto max-w-md px-4 pt-20 text-center">
        <h1 className="text-xl font-bold text-destructive mb-4">환경변수 설정 오류</h1>
        <p className="text-sm text-muted-foreground mb-2">
          NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.
        </p>
        <p className="text-xs text-muted-foreground">
          Vercel Dashboard → Settings → Environment Variables에서 설정 후 Redeploy 해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">재고 확인</h1>
          <p className="text-sm text-muted-foreground">
            편의점 재고 대조 시스템
          </p>
        </div>
        <Link href="/upload">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />새 확인
          </Button>
        </Link>
      </header>

      {sessions && sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-lg font-semibold">아직 재고 확인이 없어요</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            재고서를 업로드하고 바코드 스캔으로
            <br />
            빠르게 재고를 확인해보세요
          </p>
          <Link href="/upload">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              첫 재고 확인 시작하기
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

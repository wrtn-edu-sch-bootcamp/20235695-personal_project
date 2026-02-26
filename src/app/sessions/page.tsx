import { createClient } from "@/lib/supabase/server";
import { SessionCard } from "@/components/inventory/session-card";
import { InventorySession } from "@/types/database";
import { ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("inventory_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<InventorySession[]>();

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <header className="mb-6">
        <h1 className="text-xl font-bold">전체 세션</h1>
        <p className="text-sm text-muted-foreground">
          재고 확인 이력을 확인하세요
        </p>
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
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-lg font-semibold">세션이 없습니다</h2>
          <p className="text-sm text-muted-foreground">
            재고서를 업로드하면 세션이 생성됩니다
          </p>
        </div>
      )}
    </div>
  );
}

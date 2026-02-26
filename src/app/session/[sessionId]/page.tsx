"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemList } from "@/components/inventory/item-list";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { InventoryItem, InventorySession, ItemStatus } from "@/types/database";
import {
  ArrowLeft,
  ScanBarcode,
  CheckCircle,
  AlertTriangle,
  Clock,
  Trash2,
} from "lucide-react";

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<InventorySession | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async () => {
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

    if (sessionRes.data) setSession(sessionRes.data as InventorySession);
    if (itemsRes.data) setItems(itemsRes.data as InventoryItem[]);
    setIsLoading(false);
  }, [supabase, sessionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!confirm("이 세션을 삭제하시겠습니까? 모든 품목 데이터가 삭제됩니다.")) {
      return;
    }

    const { error } = await supabase
      .from("inventory_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      toast.error("삭제에 실패했습니다");
      return;
    }

    toast.success("세션이 삭제되었습니다");
    router.push("/");
  };

  const handleComplete = async () => {
    const { error } = await supabase
      .from("inventory_sessions")
      .update({ status: "completed" })
      .eq("id", sessionId);

    if (error) {
      toast.error("상태 변경에 실패했습니다");
      return;
    }

    setSession((prev) => (prev ? { ...prev, status: "completed" } : null));
    toast.success("세션이 완료 처리되었습니다");
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 pt-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-20 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
        <h2 className="mb-2 text-lg font-semibold">세션을 찾을 수 없습니다</h2>
        <Link href="/">
          <Button variant="outline">홈으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  const progress =
    session.total_items > 0
      ? Math.round((session.checked_items / session.total_items) * 100)
      : 0;

  const matchedCount = items.filter((i) => i.status === "matched").length;
  const mismatchedCount = items.filter((i) => i.status === "mismatched").length;
  const pendingCount = items.filter((i) => i.status === "pending").length;

  const filteredItems =
    activeTab === "all"
      ? items
      : items.filter((i) => i.status === (activeTab as ItemStatus));

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <header className="mb-4 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{session.name}</h1>
          <p className="text-xs text-muted-foreground">
            {new Date(session.created_at).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </header>

      {/* 진행률 요약 카드 */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">진행률</span>
            <span className="text-2xl font-bold">{progress}%</span>
          </div>
          <Progress value={progress} className="mb-4 h-3" />
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md bg-muted p-2">
              <Clock className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
              <p className="text-lg font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">대기</p>
            </div>
            <div className="rounded-md bg-green-50 p-2 dark:bg-green-950/20">
              <CheckCircle className="mx-auto mb-1 h-4 w-4 text-green-600" />
              <p className="text-lg font-bold text-green-600">{matchedCount}</p>
              <p className="text-xs text-muted-foreground">일치</p>
            </div>
            <div className="rounded-md bg-red-50 p-2 dark:bg-red-950/20">
              <AlertTriangle className="mx-auto mb-1 h-4 w-4 text-destructive" />
              <p className="text-lg font-bold text-destructive">
                {mismatchedCount}
              </p>
              <p className="text-xs text-muted-foreground">불일치</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 액션 버튼 */}
      <div className="mb-4 flex gap-2">
        {session.status === "in_progress" && (
          <>
            <Link href={`/scan/${sessionId}`} className="flex-1">
              <Button className="w-full">
                <ScanBarcode className="mr-2 h-4 w-4" />
                스캔 계속하기
              </Button>
            </Link>
            <Button variant="outline" onClick={handleComplete}>
              완료
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* 품목 목록 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">전체 ({items.length})</TabsTrigger>
          <TabsTrigger value="pending">대기 ({pendingCount})</TabsTrigger>
          <TabsTrigger value="matched">일치 ({matchedCount})</TabsTrigger>
          <TabsTrigger value="mismatched">
            불일치 ({mismatchedCount})
          </TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-3">
          <ItemList items={filteredItems} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

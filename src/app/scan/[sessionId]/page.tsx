"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { BarcodeScanner } from "@/components/inventory/barcode-scanner";
import { QuantityInput } from "@/components/inventory/quantity-input";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { normalizeBarcode } from "@/lib/utils";
import { InventoryItem, InventorySession } from "@/types/database";
import {
  ArrowLeft,
  Search,
  ClipboardList,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function ScanPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<InventorySession | null>(null);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchSession = useCallback(async () => {
    const { data } = await supabase
      .from("inventory_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();
    if (data) setSession(data as InventorySession);
    setIsLoading(false);
  }, [supabase, sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleBarcodeScan = useCallback(
    async (rawBarcode: string) => {
      const barcode = normalizeBarcode(rawBarcode);
      const { data: items } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("session_id", sessionId)
        .eq("barcode", barcode)
        .eq("status", "pending")
        .limit(1);

      if (!items || items.length === 0) {
        const { data: checked } = await supabase
          .from("inventory_items")
          .select("*")
          .eq("session_id", sessionId)
          .eq("barcode", barcode)
          .neq("status", "pending")
          .limit(1);

        if (checked && checked.length > 0) {
          toast.info("이미 확인 완료된 상품입니다");
        } else {
          toast.warning("재고서에 없는 바코드입니다");
        }
        return;
      }

      setCurrentItem(items[0] as InventoryItem);
      toast.success(`${(items[0] as InventoryItem).product_name} 발견!`);
    },
    [supabase, sessionId]
  );

  const handleManualSearch = () => {
    if (!manualBarcode.trim()) return;
    handleBarcodeScan(manualBarcode.trim());
    setManualBarcode("");
  };

  const handleQuantitySubmit = async (itemId: string, quantity: number) => {
    const expectedQty = currentItem?.expected_quantity ?? 0;
    const status = quantity === expectedQty ? "matched" : "mismatched";

    const { error } = await supabase
      .from("inventory_items")
      .update({
        actual_quantity: quantity,
        status,
        checked_at: new Date().toISOString(),
      })
      .eq("id", itemId);

    if (error) {
      toast.error("저장에 실패했습니다");
      return;
    }

    // 세션의 checked_items 업데이트
    if (session) {
      const newChecked = session.checked_items + 1;
      const isComplete = newChecked >= session.total_items;

      await supabase
        .from("inventory_sessions")
        .update({
          checked_items: newChecked,
          status: isComplete ? "completed" : "in_progress",
        })
        .eq("id", sessionId);

      setSession({
        ...session,
        checked_items: newChecked,
        status: isComplete ? "completed" : "in_progress",
      });

      if (isComplete) {
        toast.success("모든 품목 확인 완료!");
      }
    }

    if (status === "matched") {
      toast.success("수량 일치! 확인 완료");
    } else {
      toast.warning("수량 불일치! 확인해주세요");
      
      // n8n Webhook 호출 (불일치 알림)
      const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
      if (n8nWebhookUrl && currentItem) {
        fetch(n8nWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "mismatched",
            product_name: currentItem.product_name,
            barcode: currentItem.barcode,
            expected_quantity: expectedQty,
            actual_quantity: quantity,
            session_name: session?.name,
          }),
        }).catch(() => {});
      }
    }

    setCurrentItem(null);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 pt-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
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

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <header className="mb-4 flex items-center gap-3">
        <Link href={`/session/${sessionId}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{session.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {session.checked_items}/{session.total_items} 품목
            </span>
            <span className="font-medium text-foreground">{progress}%</span>
          </div>
        </div>
        <Link href={`/session/${sessionId}`}>
          <Button variant="outline" size="sm">
            <ClipboardList className="mr-1 h-4 w-4" />
            목록
          </Button>
        </Link>
      </header>

      <Progress value={progress} className="mb-4 h-2" />

      {session.status === "completed" ? (
        <div className="flex flex-col items-center py-12 text-center">
          <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
          <h2 className="mb-2 text-xl font-bold">확인 완료!</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            모든 품목의 재고 확인이 완료되었습니다
          </p>
          <Link href={`/session/${sessionId}`}>
            <Button>결과 확인하기</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {currentItem ? (
            <QuantityInput
              item={currentItem}
              onSubmit={handleQuantitySubmit}
              onCancel={() => setCurrentItem(null)}
            />
          ) : (
            <>
              <BarcodeScanner onScan={handleBarcodeScan} />

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium">수동 바코드 입력</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="바코드 번호 입력"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                  />
                  <Button onClick={handleManualSearch} variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

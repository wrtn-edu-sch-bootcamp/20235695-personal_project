"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, FileText, Camera, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { parseCSV } from "@/lib/csv-parser";
import { extractTextFromImage, parseOCRText } from "@/lib/ocr";
import { NewInventoryItem } from "@/types/database";

export function UploadForm() {
  const router = useRouter();
  const [sessionName, setSessionName] = useState(
    `${new Date().toLocaleDateString("ko-KR")} 재고 확인`
  );
  const [items, setItems] = useState<NewInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("csv");

  const handleCSVUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      try {
        const text = await file.text();
        const parsed = parseCSV(text);
        setItems(parsed);
        toast.success(`${parsed.length}개 품목을 불러왔습니다`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "CSV 파싱에 실패했습니다"
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      try {
        toast.info("OCR 처리 중... 잠시 기다려주세요");
        const text = await extractTextFromImage(file);
        const parsed = parseOCRText(text);

        if (parsed.length === 0) {
          toast.warning(
            "인식된 품목이 없습니다. 이미지를 다시 확인하거나 CSV 업로드를 이용해주세요."
          );
          return;
        }

        setItems(parsed);
        toast.success(`${parsed.length}개 품목을 인식했습니다`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "OCR 처리에 실패했습니다"
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = async () => {
    if (!sessionName.trim()) {
      toast.error("세션 이름을 입력해주세요");
      return;
    }
    if (items.length === 0) {
      toast.error("품목을 먼저 업로드해주세요");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();

      const { data: session, error: sessionError } = await supabase
        .from("inventory_sessions")
        .insert({
          name: sessionName.trim(),
          status: "in_progress",
          total_items: items.length,
          checked_items: 0,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const inventoryItems = items.map((item) => ({
        session_id: session.id,
        barcode: item.barcode,
        product_name: item.product_name,
        expected_quantity: item.expected_quantity,
        status: "pending" as const,
      }));

      const { error: itemsError } = await supabase
        .from("inventory_items")
        .insert(inventoryItems);

      if (itemsError) throw itemsError;

      toast.success("재고 확인 세션이 생성되었습니다!");
      router.push(`/scan/${session.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "저장에 실패했습니다"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="session-name">세션 이름</Label>
        <Input
          id="session-name"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder="예: 2026-02-26 오전 재고"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="csv">
            <FileText className="mr-2 h-4 w-4" />
            CSV 파일
          </TabsTrigger>
          <TabsTrigger value="ocr">
            <Camera className="mr-2 h-4 w-4" />
            사진 (OCR)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="csv">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">CSV 파일 업로드</CardTitle>
            </CardHeader>
            <CardContent>
              <Label
                htmlFor="csv-file"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors hover:border-primary/50 hover:bg-muted/50"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  CSV 파일을 선택하세요
                </span>
                <span className="text-xs text-muted-foreground">
                  바코드, 상품명, 수량 컬럼 필요
                </span>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={handleCSVUpload}
                  disabled={isLoading}
                />
              </Label>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ocr">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">검수표 사진 업로드</CardTitle>
            </CardHeader>
            <CardContent>
              <Label
                htmlFor="ocr-file"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors hover:border-primary/50 hover:bg-muted/50"
              >
                <Camera className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  검수표 사진을 선택하세요
                </span>
                <span className="text-xs text-muted-foreground">
                  바코드, 상품명, 수량이 포함된 검수표
                </span>
                <Input
                  id="ocr-file"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isLoading}
                />
              </Label>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          처리 중...
        </div>
      )}

      {items.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                미리보기
                <Badge variant="secondary" className="ml-2">
                  {items.length}개
                </Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setItems([])}
                className="text-destructive"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                초기화
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">바코드</TableHead>
                    <TableHead>상품명</TableHead>
                    <TableHead className="w-[60px] text-right">수량</TableHead>
                    <TableHead className="w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs">
                        {item.barcode}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.product_name}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.expected_quantity}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeItem(idx)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={handleSave}
        disabled={items.length === 0 || isSaving}
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            저장 중...
          </>
        ) : (
          `재고 확인 시작 (${items.length}개 품목)`
        )}
      </Button>
    </div>
  );
}

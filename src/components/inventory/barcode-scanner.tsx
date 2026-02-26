"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  disabled?: boolean;
}

export function BarcodeScanner({ onScan, disabled }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScanRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  const startScanning = async () => {
    if (!containerRef.current) return;

    try {
      setError(null);
      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 100 },
          aspectRatio: 1.777,
        },
        (decodedText) => {
          const now = Date.now();
          // 같은 바코드 연속 스캔 방지 (2초 쿨다운)
          if (
            decodedText === lastScanRef.current &&
            now - lastScanTimeRef.current < 2000
          ) {
            return;
          }
          lastScanRef.current = decodedText;
          lastScanTimeRef.current = now;
          onScan(decodedText);
        },
        () => {}
      );

      setIsScanning(true);
    } catch (err) {
      setError(
        "카메라를 사용할 수 없습니다. 카메라 권한을 확인하거나 수동 입력을 이용해주세요."
      );
      console.error("Scanner error:", err);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
      scannerRef.current.clear();
    }
    scannerRef.current = null;
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="overflow-hidden rounded-lg border bg-muted"
      >
        <div id="barcode-reader" className="w-full" />
        {!isScanning && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Camera className="mb-2 h-8 w-8" />
            <p className="text-sm">카메라를 시작하세요</p>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        variant={isScanning ? "destructive" : "default"}
        className="w-full"
        onClick={isScanning ? stopScanning : startScanning}
        disabled={disabled}
      >
        {isScanning ? (
          <>
            <CameraOff className="mr-2 h-4 w-4" />
            카메라 중지
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            카메라 시작
          </>
        )}
      </Button>
    </div>
  );
}

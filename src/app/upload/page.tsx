export const dynamic = "force-dynamic";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UploadForm } from "@/components/inventory/upload-form";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">검수표 업로드</h1>
          <p className="text-sm text-muted-foreground">
            CSV 파일 또는 사진으로 검수표를 등록하세요
          </p>
        </div>
      </header>

      <UploadForm />
    </div>
  );
}

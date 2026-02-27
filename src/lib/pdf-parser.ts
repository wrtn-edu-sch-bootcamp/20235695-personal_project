import { NewInventoryItem } from "@/types/database";
import { normalizeBarcode } from "@/lib/utils";

export async function parsePDF(file: File): Promise<NewInventoryItem[]> {
  const pdfjsLib = await import("pdfjs-dist");

  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    fullText += pageText + "\n";
  }

  return parsePDFText(fullText);
}

function parsePDFText(text: string): NewInventoryItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const items: NewInventoryItem[] = [];

  // 바코드(8~13자리) + 상품명 + 수량 패턴
  const pattern = /(\d{8,13})\s+(.+?)\s+(\d+)\s*$/;

  for (const line of lines) {
    const match = line.match(pattern);
    if (match) {
      items.push({
        barcode: normalizeBarcode(match[1]),
        product_name: match[2].trim(),
        expected_quantity: parseInt(match[3], 10),
      });
    }
  }

  // 패턴 매칭 실패 시 탭/콤마 구분 시도
  if (items.length === 0) {
    for (const line of lines) {
      const sep = line.includes("\t") ? "\t" : ",";
      const cols = line.split(sep).map((c) => c.trim());
      if (cols.length >= 3) {
        const barcode = cols.find((c) => /^\d{8,13}$/.test(c));
        const qty = cols.find((c) => /^\d+$/.test(c) && !/^\d{8,}$/.test(c));
        const name = cols.find((c) => c !== barcode && c !== qty && c.length > 0);

        if (barcode && name) {
          items.push({
            barcode: normalizeBarcode(barcode),
            product_name: name,
            expected_quantity: qty ? parseInt(qty, 10) : 0,
          });
        }
      }
    }
  }

  return items;
}

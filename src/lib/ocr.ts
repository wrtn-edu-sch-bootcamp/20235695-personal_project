import { createWorker } from "tesseract.js";
import { NewInventoryItem } from "@/types/database";
import { normalizeBarcode } from "@/lib/utils";

export async function extractTextFromImage(
  imageSource: File | string
): Promise<string> {
  const worker = await createWorker("kor+eng");
  const {
    data: { text },
  } = await worker.recognize(imageSource);
  await worker.terminate();
  return text;
}

export function parseOCRText(text: string): NewInventoryItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const items: NewInventoryItem[] = [];

  // 바코드(숫자 8~13자리) + 상품명 + 수량(숫자) 패턴 매칭
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

  return items;
}

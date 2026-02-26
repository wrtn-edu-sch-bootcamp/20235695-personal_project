import { NewInventoryItem } from "@/types/database";
import { normalizeBarcode } from "@/lib/utils";

export function parseCSV(text: string): NewInventoryItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV 파일에 헤더와 최소 1개의 데이터 행이 필요합니다.");
  }

  const header = lines[0].toLowerCase();
  const separator = header.includes("\t") ? "\t" : ",";
  const columns = header.split(separator).map((col) => col.trim());

  const barcodeIdx = columns.findIndex(
    (c) => c.includes("barcode") || c.includes("바코드") || c.includes("코드") || c.includes("번호") || c.includes("품번")
  );
  const nameIdx = columns.findIndex(
    (c) =>
      c.includes("name") ||
      c.includes("상품") ||
      c.includes("품명") ||
      c.includes("제품")
  );
  const qtyIdx = columns.findIndex(
    (c) =>
      c.includes("quantity") ||
      c.includes("수량") ||
      c.includes("재고") ||
      c.includes("qty")
  );

  if (barcodeIdx === -1 || nameIdx === -1 || qtyIdx === -1) {
    throw new Error(
      "CSV 헤더에서 바코드, 상품명, 수량 컬럼을 찾을 수 없습니다. " +
        "컬럼명에 '바코드/barcode', '상품명/name', '수량/quantity'를 포함해주세요."
    );
  }

  const items: NewInventoryItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator).map((col) => col.trim());
    const rawBarcode = cols[barcodeIdx];
    const barcode = normalizeBarcode(rawBarcode);
    const productName = cols[nameIdx];
    const quantity = parseInt(cols[qtyIdx], 10);

    if (!barcode || !productName) continue;

    items.push({
      barcode,
      product_name: productName,
      expected_quantity: isNaN(quantity) ? 0 : quantity,
    });
  }

  if (items.length === 0) {
    throw new Error("파싱된 품목이 없습니다. CSV 형식을 확인해주세요.");
  }

  return items;
}

import * as XLSX from "xlsx";
import { NewInventoryItem } from "@/types/database";
import { normalizeBarcode } from "@/lib/utils";

export async function parseExcel(file: File): Promise<NewInventoryItem[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("Excel 파일에 시트가 없습니다.");

  const sheet = workbook.Sheets[sheetName];
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (rows.length < 2) {
    throw new Error("Excel 파일에 헤더와 최소 1개의 데이터 행이 필요합니다.");
  }

  const header = rows[0].map((c) => String(c ?? "").toLowerCase().trim());

  const barcodeIdx = header.findIndex(
    (c) =>
      c.includes("barcode") ||
      c.includes("바코드") ||
      c.includes("코드") ||
      c.includes("번호") ||
      c.includes("품번")
  );
  const nameIdx = header.findIndex(
    (c) =>
      c.includes("name") ||
      c.includes("상품") ||
      c.includes("품명") ||
      c.includes("제품")
  );
  const qtyIdx = header.findIndex(
    (c) =>
      c.includes("quantity") ||
      c.includes("수량") ||
      c.includes("재고") ||
      c.includes("qty")
  );

  if (barcodeIdx === -1 || nameIdx === -1 || qtyIdx === -1) {
    throw new Error(
      "Excel 헤더에서 바코드, 상품명, 수량 컬럼을 찾을 수 없습니다. " +
        "컬럼명에 '바코드/barcode', '상품명/name', '수량/quantity'를 포함해주세요."
    );
  }

  const items: NewInventoryItem[] = [];

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols || cols.length === 0) continue;

    const rawBarcode = String(cols[barcodeIdx] ?? "").trim();
    const barcode = normalizeBarcode(rawBarcode);
    const productName = String(cols[nameIdx] ?? "").trim();
    const quantity = parseInt(String(cols[qtyIdx] ?? "0"), 10);

    if (!barcode || !productName) continue;

    items.push({
      barcode,
      product_name: productName,
      expected_quantity: isNaN(quantity) ? 0 : quantity,
    });
  }

  if (items.length === 0) {
    throw new Error("파싱된 품목이 없습니다. Excel 형식을 확인해주세요.");
  }

  return items;
}

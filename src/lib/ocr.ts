import Tesseract from "tesseract.js";
import { NewInventoryItem } from "@/types/database";
import { normalizeBarcode } from "@/lib/utils";

export async function extractTextFromImage(
  imageSource: File | string
): Promise<string> {
  const worker = await Tesseract.createWorker("kor+eng");
  // 표/리스트 형태 문서를 더 잘 읽도록 세그먼트 모드를 조정
  // 6: Assume a single uniform block of text
  await worker.setParameters({
    tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
    preserve_interword_spaces: "1",
  });
  const {
    data: { text },
  } = await worker.recognize(imageSource);
  await worker.terminate();
  return text;
}

export function parseOCRText(text: string): NewInventoryItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\u00A0/g, " ").trim())
    .filter(Boolean);

  const items: NewInventoryItem[] = [];

  // OCR에서 한 품목이 여러 줄로 쪼개지는 경우가 많아서 상태 머신으로 복원
  let pendingBarcode: string | null = null;
  let pendingNameParts: string[] = [];

  const flushPending = (qty: number | null) => {
    if (!pendingBarcode) return;
    const name = cleanName(pendingNameParts.join(" "));
    items.push({
      barcode: pendingBarcode,
      product_name: name || "(인식된 상품명 없음)",
      expected_quantity: qty ?? 0,
    });
    pendingBarcode = null;
    pendingNameParts = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 한 줄에 바코드가 여러 개 붙는 경우(표가 한 줄로 뭉개진 OCR)도 일부 지원
    const barcodes = extractBarcodeCandidates(line);
    if (barcodes.length >= 2) {
      // 이전 pending이 있으면 일단 플러시
      flushPending(null);

      for (let bi = 0; bi < barcodes.length; bi++) {
        const cur = barcodes[bi];
        const next = barcodes[bi + 1];

        const segmentStart = cur.end;
        const segmentEnd = next ? next.start : line.length;
        const segment = line.slice(segmentStart, segmentEnd).trim();
        const { name, qty } = parseNameQty(segment);

        items.push({
          barcode: cur.value,
          product_name: name || "(인식된 상품명 없음)",
          expected_quantity: qty ?? 0,
        });
      }
      continue;
    }

    // 1) 바코드가 있는 줄이면 pending 갱신
    if (barcodes.length === 1) {
      const b = barcodes[0].value;

      // pending이 있었는데 새 바코드가 나오면 이전 건을 플러시(수량 미인식이면 0)
      if (pendingBarcode) flushPending(null);

      pendingBarcode = b;
      const rest = cleanName(removeBarcodeFromLine(line, barcodes[0]));
      const { name, qty } = parseNameQty(rest);
      if (name) pendingNameParts.push(name);

      if (qty !== null) {
        flushPending(qty);
      }
      continue;
    }

    // 2) 바코드 없는 줄이면, pending이 있을 때만 이름/수량 보강
    if (pendingBarcode) {
      const { name, qty } = parseNameQty(line);
      if (name) pendingNameParts.push(name);
      if (qty !== null) {
        flushPending(qty);
      }
    }
  }

  // 마지막 pending 처리
  flushPending(null);

  // 너무 공격적으로 뽑힌 값 정리(빈 바코드/상품명 제외)
  return items.filter(
    (it) => it.barcode.length >= 8 && it.barcode.length <= 13 && !!it.product_name
  );
}

function cleanName(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/[|·•]+/g, " ")
    .replace(/[\[\]\(\)]+/g, " ")
    .trim();
}

function extractBarcodeCandidates(line: string): Array<{
  value: string;
  start: number;
  end: number;
}> {
  const candidates: Array<{ value: string; start: number; end: number }> = [];
  // 숫자 사이에 공백/하이픈이 섞여도 바코드로 인식
  const re = /\d[\d\s-]{6,25}\d/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const normalized = normalizeBarcode(m[0]);
    if (normalized.length >= 8 && normalized.length <= 13) {
      candidates.push({ value: normalized, start: m.index, end: m.index + m[0].length });
    }
  }
  return candidates;
}

function removeBarcodeFromLine(
  line: string,
  barcode: { start: number; end: number }
): string {
  return (line.slice(0, barcode.start) + " " + line.slice(barcode.end)).trim();
}

function parseNameQty(input: string): { name: string; qty: number | null } {
  const str = normalizeTableishText(input).trim();
  if (!str) return { name: "", qty: null };

  // 1) 종이 검수표(표 형태) 라인: 바코드 뒤에 "상품명 ... 박스 발주 출고 ... 금액" 구조가 흔함
  // - 금액(예: 5,500) 같은 콤마 포함 숫자가 나오기 전까지의 숫자열을 기준으로 출고수량을 추정한다.
  // - 일반적으로 [박스개입, 발주수량, 출고수량, ...] 순서여서 3번째 정수를 우선 사용한다.
  const table = tryParseTableRow(str);
  if (table) return table;

  // 2) 일반 라인: 수량은 보통 줄 끝에 위치(예: 2, 2개, 2 EA)
  const qtyMatch = str.match(/(\d{1,6})\s*(?:ea|EA|개|pcs|PCS|p|P)?\s*$/);
  const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : null;

  const namePart = qtyMatch ? str.slice(0, qtyMatch.index).trim() : str;
  // 바코드처럼 긴 숫자열만 남는 경우는 이름으로 취급하지 않음
  const name =
    namePart && !/^\d{8,13}$/.test(normalizeBarcode(namePart)) ? cleanName(namePart) : "";

  return { name, qty: qty !== null && !Number.isNaN(qty) ? qty : null };
}

function normalizeTableishText(input: string): string {
  return (
    input
      // OCR에서 자주 섞이는 특수공백 정리
      .replace(/\u00A0/g, " ")
      // 숫자와 한글/영문이 붙는 케이스(예: "0박스1")를 분리
      .replace(/(\d)([A-Za-z가-힣])/g, "$1 $2")
      .replace(/([A-Za-z가-힣])(\d)/g, "$1 $2")
      // 가끔 들어오는 구분자 정리
      .replace(/[|]+/g, " ")
      .replace(/\s+/g, " ")
  );
}

function tryParseTableRow(str: string): { name: string; qty: number | null } | null {
  // 금액 컬럼(콤마 포함 숫자)이 보이면 표 형태일 가능성이 높음
  const hasMoney = /\d{1,3}(?:,\d{3})+/.test(str);
  if (!hasMoney) return null;

  const tokens = str.split(/\s+/).filter(Boolean);
  if (tokens.length < 3) return null;

  // 금액 토큰이 시작되기 전까지만 본문으로 본다
  const moneyIdx = tokens.findIndex((t) => /\d{1,3}(?:,\d{3})+/.test(t));
  const body = (moneyIdx === -1 ? tokens : tokens.slice(0, moneyIdx)).filter(Boolean);
  if (body.length < 2) return null;

  // 본문에서 순수 정수 토큰들을 모은다 (표의 수량/박스/출고 등)
  const ints: number[] = [];
  let firstIntIdx = -1;
  for (let i = 0; i < body.length; i++) {
    const t = body[i];
    if (/^\d{1,6}$/.test(t)) {
      if (firstIntIdx === -1) firstIntIdx = i;
      const n = parseInt(t, 10);
      // 가격/코드 같은 큰 숫자는 제외 (이 라인에서는 바코드가 이미 제거된 상태)
      if (!Number.isNaN(n) && n <= 10000) ints.push(n);
    }
  }

  // 숫자 토큰이 너무 적으면 표라고 보기 어려움
  if (ints.length < 2 || firstIntIdx === -1) return null;

  // 상품명: 숫자 컬럼 시작 전까지의 토큰
  const nameTokens = body.slice(0, firstIntIdx);
  const name = cleanName(nameTokens.join(" "));

  // 수량: [박스개입, 발주, 출고] 추정
  const qtyCandidate =
    ints.length >= 3 ? ints[2] : ints.length >= 2 ? ints[1] : ints[0];

  const qty = !Number.isNaN(qtyCandidate) ? qtyCandidate : null;
  if (!name) return { name: "", qty };

  return { name, qty };
}

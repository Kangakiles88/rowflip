import { amountWords, withCommas } from "./amount";
import { parseTable } from "./parser";

/**
 * 견적서 — 엑셀에서 복사한 품목 표를 읽어 공급가액·세액·합계를 계산한다.
 * 모든 처리는 브라우저 안에서만 한다(품목·거래처·공급자 정보는 저장·전송하지 않음).
 */

export type VatMode = "exclusive" | "inclusive" | "none";

export interface EstimateItem {
  name: string;
  spec: string;
  qty: number;
  price: number;
  note: string;
}

export interface EstimateLine extends EstimateItem {
  /** 공급가액(원) */
  supply: number;
  /** 세액(원) */
  tax: number;
}

export interface EstimateTotals {
  supply: number;
  tax: number;
  total: number;
}

export const ESTIMATE_SAMPLE =
  "품목\t규격\t수량\t단가\t비고\n사무용 의자\tT-ZERO\t4\t189,000\t\nA4 복사용지\t80g 2,500매\t10\t27,500\t\n모니터암\t듀얼\t2\t64,000\t설치 포함";

type Col = "name" | "spec" | "qty" | "price" | "note";

const ALIASES: Record<Col, string[]> = {
  name: ["품목", "품명", "상품명", "제품명", "항목", "내역", "품목명"],
  spec: ["규격", "사양", "모델", "옵션", "단위"],
  qty: ["수량", "개수", "qty"],
  price: ["단가", "가격", "금액단가", "판매가"],
  note: ["비고", "메모", "참고"],
};

const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

/** '1,200원', '₩ 3,500', '2.5' → 숫자. 비었거나 숫자가 아니면 null */
export function parseNumber(raw: string): number | null {
  const s = raw.replace(/[\s,₩￦]|원|개|EA/gi, "");
  if (s === "") return null;
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

function headerMap(row: string[]): Partial<Record<Col, number>> | null {
  const h = row.map(norm);
  const map: Partial<Record<Col, number>> = {};
  (Object.keys(ALIASES) as Col[]).forEach((col) => {
    const i = h.findIndex((x) => ALIASES[col].some((a) => x === norm(a)));
    if (i !== -1) map[col] = i;
  });
  // 품목과 (수량 또는 단가)가 있어야 머리글로 본다
  return map.name !== undefined && (map.qty !== undefined || map.price !== undefined) ? map : null;
}

/** 머리글이 없을 때 열 수로 순서를 정한다 */
function defaultMap(width: number): Partial<Record<Col, number>> {
  if (width <= 2) return { name: 0, price: 1 };
  if (width === 3) return { name: 0, qty: 1, price: 2 };
  if (width === 4) return { name: 0, spec: 1, qty: 2, price: 3 };
  return { name: 0, spec: 1, qty: 2, price: 3, note: 4 };
}

export function parseItems(raw: string): { items: EstimateItem[]; invalidLines: number[]; hasHeader: boolean } {
  const table = parseTable(raw);
  const rows = table.rows.map((r) => r.map((c) => c.trim()));
  const firstIdx = rows.findIndex((r) => r.some((c) => c !== ""));
  if (firstIdx === -1) return { items: [], invalidLines: [], hasHeader: false };
  const header = headerMap(rows[firstIdx]);
  const map = header ?? defaultMap(table.colCount);
  const start = header ? firstIdx + 1 : firstIdx;
  const get = (r: string[], c: Col) => (map[c] === undefined ? "" : (r[map[c]!] ?? ""));

  const items: EstimateItem[] = [];
  const invalidLines: number[] = [];
  for (let i = start; i < rows.length; i++) {
    const r = rows[i];
    if (r.every((c) => c === "")) continue;
    const name = get(r, "name");
    const qtyRaw = get(r, "qty");
    const priceRaw = get(r, "price");
    const qty = qtyRaw === "" ? 1 : parseNumber(qtyRaw);
    const price = priceRaw === "" ? 0 : parseNumber(priceRaw);
    if (qty === null || price === null || name === "") {
      invalidLines.push(i + 1);
      continue;
    }
    items.push({ name, spec: get(r, "spec"), qty, price, note: get(r, "note") });
  }
  return { items, invalidLines, hasHeader: header !== null };
}

/**
 * 부가세 계산 — 원 미만은 버린다(절사).
 * - exclusive(별도): 공급가액 = 수량×단가, 세액 = 공급가액의 10%
 * - inclusive(포함): 금액 = 수량×단가, 공급가액 = 금액÷1.1(반올림), 세액 = 금액 − 공급가액
 * - none(면세·간이): 세액 0
 */
export function computeLine(item: EstimateItem, mode: VatMode): EstimateLine {
  const amount = Math.round(item.qty * item.price);
  if (mode === "inclusive") {
    const supply = Math.round(amount / 1.1);
    return { ...item, supply, tax: amount - supply };
  }
  const tax = mode === "exclusive" ? Math.floor(amount / 10) : 0;
  return { ...item, supply: amount, tax };
}

export function computeEstimate(items: EstimateItem[], mode: VatMode): { lines: EstimateLine[]; totals: EstimateTotals } {
  const lines = items.map((it) => computeLine(it, mode));
  const supply = lines.reduce((s, l) => s + l.supply, 0);
  const tax = lines.reduce((s, l) => s + l.tax, 0);
  return { lines, totals: { supply, tax, total: supply + tax } };
}

/** 1234567 → '1,234,567' (음수 포함) */
export function won(n: number): string {
  const neg = n < 0;
  return (neg ? "-" : "") + withCommas(String(Math.abs(Math.round(n))));
}

/** 수량은 소수가 있을 수 있다 — 2.5 → '2.5', 1000 → '1,000' */
export function qtyText(n: number): string {
  const [i, f] = String(Math.abs(n)).split(".");
  return (n < 0 ? "-" : "") + withCommas(i) + (f ? `.${f}` : "");
}

/** 합계 → '일금 일백일십만원정 (₩1,100,000)' */
export function totalInWords(total: number): string {
  if (total < 0) return `₩${won(total)}`;
  return `일금 ${amountWords(String(Math.round(total)), "formal")}원정 (₩${won(total)})`;
}

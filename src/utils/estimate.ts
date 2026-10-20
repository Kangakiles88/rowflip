import { amountWords, withCommas } from "./amount";
import { parseAnyTable } from "./parser";

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
  /** 거래명세서의 월/일 칸(머리글 '월일·일자·날짜'가 있을 때만) */
  date?: string;
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

type Col = "name" | "spec" | "qty" | "price" | "note" | "date";

const ALIASES: Record<Col, string[]> = {
  name: ["품목", "품명", "상품명", "제품명", "항목", "내역", "품목명"],
  spec: ["규격", "사양", "모델", "옵션", "단위"],
  qty: ["수량", "개수", "qty"],
  price: ["단가", "가격", "금액단가", "판매가"],
  note: ["비고", "메모", "참고"],
  date: ["월일", "월/일", "일자", "날짜", "거래일", "거래일자", "납품일", "출고일"],
};

/** 날짜처럼 보이는 낱말 — 10/14, 10-14, 2026-10-14, 2026.10.14, 10월 14일 */
const looksDate = (t: string) => /^(\d{4}[-./])?\d{1,2}[-./]\d{1,2}\.?$|^\d{1,2}월\s*\d{1,2}일$/.test(t.trim());

/** 거래명세서 월/일 칸 — 엑셀 날짜(2026-10-14, 2026.10.14, 10/14, 10월 14일)를 '10/14'로. 모르는 모양은 그대로 */
export function monthDay(raw: string): string {
  const t = raw.trim();
  const m =
    t.match(/^\d{4}[-./]\s*(\d{1,2})[-./]\s*(\d{1,2})\.?$/) ??
    t.match(/^(\d{1,2})[-./](\d{1,2})\.?$/) ??
    t.match(/^(\d{1,2})월\s*(\d{1,2})일$/);
  return m ? `${Number(m[1])}/${Number(m[2])}` : t;
}

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

const isNum = (t: string) => parseNumber(t) !== null;

/**
 * 탭 없이 띄어쓰기로 입력한 줄(휴대폰 직접 입력 등)을 칸으로 나눈다.
 * 품목 이름에 띄어쓰기가 있을 수 있으므로 뒤에서부터 숫자를 찾는다:
 * 마지막 숫자 = 단가, 그 앞 숫자 = 수량, 숫자 뒤 글자 = 비고, 숫자 앞 = 품목(+규격).
 * 머리글과 낱말 수가 같으면 머리글 순서를 그대로 따른다.
 */
function splitSpacedRow(line: string, header: Partial<Record<Col, number>> | null, headerWidth: number): Record<Col, string> {
  const t = line.trim().split(/\s+/);
  const out: Record<Col, string> = { name: "", spec: "", qty: "", price: "", note: "", date: "" };
  if (header && t.length === headerWidth) {
    (Object.keys(header) as Col[]).forEach((c) => (out[c] = t[header[c]!] ?? ""));
    return out;
  }
  let end = t.length;
  while (end > 0 && !isNum(t[end - 1])) end--;
  // 숫자가 하나도 없으면 단가가 없는 줄 → 건너뛰도록 단가를 비워 둔다
  if (end === 0) return { ...out, name: t.join(" ") };
  out.note = t.slice(end).join(" ");
  out.price = t[end - 1];
  let rest = end - 1;
  if (rest > 1 && isNum(t[rest - 1])) {
    out.qty = t[rest - 1];
    rest--;
  }
  const head = t.slice(0, rest);
  // 머리글에 월일이 있고 맨 앞 낱말이 날짜 모양이면 월일로
  if (header?.date !== undefined && head.length >= 2 && looksDate(head[0])) {
    out.date = head.shift()!;
  }
  // 머리글에 규격이 있고 품목 앞부분이 두 낱말 이상이면 마지막 낱말을 규격으로
  if (header?.spec !== undefined && head.length >= 2) {
    out.spec = head.pop()!;
  }
  out.name = head.join(" ");
  return out;
}

export function parseItems(raw: string): {
  items: EstimateItem[];
  invalidLines: number[];
  hasHeader: boolean;
  /** 탭이 없어 띄어쓰기로 칸을 나눴는지 */
  spaced: boolean;
} {
  const table = parseAnyTable(raw);
  const rows = table.rows.map((r) => r.map((c) => c.trim()));
  const firstIdx = rows.findIndex((r) => r.some((c) => c !== ""));
  if (firstIdx === -1) return { items: [], invalidLines: [], hasHeader: false, spaced: false };

  // 탭이 하나도 없으면(휴대폰에서 직접 입력) 띄어쓰기로 나눈다
  const spaced = table.colCount <= 1 && rows.some((r) => /\s/.test(r[0] ?? ""));
  if (spaced) {
    const headTokens = rows[firstIdx][0].split(/\s+/);
    const header = headerMap(headTokens);
    const start = header ? firstIdx + 1 : firstIdx;
    const items: EstimateItem[] = [];
    const invalidLines: number[] = [];
    for (let i = start; i < rows.length; i++) {
      const line = rows[i][0] ?? "";
      if (line === "") continue;
      const c = splitSpacedRow(line, header, headTokens.length);
      const qty = c.qty === "" ? 1 : parseNumber(c.qty);
      const price = c.price === "" ? null : parseNumber(c.price);
      if (qty === null || price === null || c.name === "") {
        invalidLines.push(i + 1);
        continue;
      }
      items.push({ name: c.name, spec: c.spec, qty, price, note: c.note, ...(c.date ? { date: monthDay(c.date) } : {}) });
    }
    return { items, invalidLines, hasHeader: header !== null, spaced: true };
  }

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
    const date = get(r, "date");
    items.push({ name, spec: get(r, "spec"), qty, price, note: get(r, "note"), ...(date ? { date: monthDay(date) } : {}) });
  }
  return { items, invalidLines, hasHeader: header !== null, spaced: false };
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

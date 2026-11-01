import { looksLikeText } from "./excelClipboard";
import { parseAnyTable, type TableSource } from "./parser";
import { padRows, toHtmlTable, toTsv } from "./transpose";

/**
 * 엑셀 빈칸 채우기 — 병합을 풀어 생긴 빈칸을 위(또는 아래) 값이나 정한 값으로 채운다.
 * 모든 처리는 브라우저 안에서만 한다.
 */

/** above = 위 값으로, below = 아래 값으로, value = 정한 값으로(0, - 등) */
export type FillMode = "above" | "below" | "value";

export interface FillOptions {
  mode: FillMode;
  /** mode가 value일 때 넣을 값 */
  value: string;
  /** 채울 열(0부터). null이면 모든 열 */
  columns: number[] | null;
  /** 첫 행은 머리글 — 채우지도, 아래로 내려 보내지도 않음 */
  header: boolean;
  /** 공백만 있는 칸도 빈칸으로 본다 */
  spaceIsBlank: boolean;
  /** 모든 칸이 빈 행은 그대로 둔다(구분용 빈 줄) */
  keepEmptyRows: boolean;
}

export const DEFAULT_FILL_OPTIONS: FillOptions = {
  mode: "above",
  value: "0",
  columns: null,
  header: false,
  spaceIsBlank: true,
  keepEmptyRows: true,
};

export interface FillResult {
  rows: string[][];
  output: string;
  html: string;
  /** 채운 칸 수 */
  filled: number;
  /** 열마다 채운 칸 수 */
  filledByCol: number[];
  /** 위(아래)에 값이 없어 못 채운 칸 수 */
  leftBlank: number;
  inputRows: number;
  inputCols: number;
  source: TableSource;
}

export const FILL_SAMPLE = [
  "지역\t지점\t담당자\t1월 매출",
  "서울\t강남점\t김민준\t1,200",
  "\t\t이서연\t980",
  "\t서초점\t박지훈\t1,050",
  "\t\t\t870",
  "경기\t판교점\t최유진\t1,430",
  "\t\t정하늘\t760",
  "\t수원점\t한도윤\t1,120",
].join("\n");

/**
 * 첫 행이 머리글처럼 보이는지 — 빈칸 없이 모두 글자(숫자만 있는 칸 없음)이고, 아래쪽에 빈칸이 있는 표.
 * 병합 해제 표는 데이터에 숫자가 없을 수도 있어 dedupe의 looksLikeHeader보다 느슨하게 본다
 */
export function guessHeader(rows: string[][]): boolean {
  if (rows.length < 2) return false;
  const first = rows[0].map((c) => c.trim());
  if (first.length < 2 || first.some((c) => c === "")) return false;
  if (first.some((c) => /^[-+]?[\d,.]+%?$/.test(c))) return false;
  return rows.slice(1).some((r) => first.some((_, i) => (r[i] ?? "").trim() === ""));
}

const isBlank = (c: string, spaceIsBlank: boolean) => (spaceIsBlank ? c.trim() === "" : c === "");

/** 표(행 배열)의 빈칸을 채운다 — 원본은 바꾸지 않는다 */
export function fillRows(input: string[][], o: FillOptions): Omit<FillResult, "output" | "html" | "source"> {
  const rows = padRows(input.map((r) => [...r]));
  const width = rows[0]?.length ?? 0;
  const start = o.header && rows.length > 0 ? 1 : 0;
  const blank = (c: string) => isBlank(c, o.spaceIsBlank);
  // 한 열뿐이면 빈칸이 곧 빈 행이라 '빈 행 그대로'를 쓰지 않는다
  const emptyRow = rows.map((r) => width > 1 && r.every(blank));
  const targets = (o.columns ?? Array.from({ length: width }, (_, i) => i)).filter((c) => c >= 0 && c < width);
  const filledByCol = Array(width).fill(0);
  let leftBlank = 0;

  for (const c of targets) {
    if (o.mode === "value") {
      for (let r = start; r < rows.length; r++) {
        if (o.keepEmptyRows && emptyRow[r]) continue;
        if (blank(rows[r][c])) {
          rows[r][c] = o.value;
          filledByCol[c] += 1;
        }
      }
      continue;
    }
    const order =
      o.mode === "above"
        ? Array.from({ length: rows.length - start }, (_, i) => start + i)
        : Array.from({ length: rows.length - start }, (_, i) => rows.length - 1 - i);
    let carry: string | null = null;
    for (const r of order) {
      if (o.keepEmptyRows && emptyRow[r]) continue;
      const cell = rows[r][c];
      if (!blank(cell)) {
        carry = cell;
      } else if (carry !== null) {
        rows[r][c] = carry;
        filledByCol[c] += 1;
      } else {
        leftBlank += 1;
      }
    }
  }

  const filled = filledByCol.reduce((s, n) => s + n, 0);
  return { rows, filled, filledByCol, leftBlank, inputRows: rows.length, inputCols: width };
}

/** 붙여넣은 글 → 채운 표·탭 구분 글·엑셀용 HTML 표 */
export function fillBlanksText(raw: string, o: FillOptions): FillResult {
  const table = parseAnyTable(raw);
  const nonEmpty = raw.trim() === "" ? [] : table.rows;
  // 맨 끝 빈 줄(엑셀 복사 끝 줄바꿈)은 뺀다
  while (nonEmpty.length > 0 && nonEmpty[nonEmpty.length - 1].every((c) => c === "")) nonEmpty.pop();
  const r = fillRows(nonEmpty, o);
  return {
    ...r,
    output: r.rows.length ? toTsv(r.rows) : "",
    html: r.rows.length ? toHtmlTable(r.rows, looksLikeText) : "",
    source: table.source,
  };
}

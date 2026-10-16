import { parseTable } from "./parser";
import { toHtmlTable, toTsv } from "./transpose";

/**
 * 엑셀 셀 나누기 — 한 칸에 들어 있는 값(주소, 이름+연락처, 셀 안 줄바꿈 목록 등)을
 * 구분자나 글자 수로 잘라 옆 열(또는 아래 행)로 나눈다. 엑셀의 '텍스트 나누기'와 같은 일.
 */

export type CellDelimiter = "space" | "comma" | "slash" | "hyphen" | "newline" | "custom" | "width";
/** all = 모두 나누기, first = 첫 구분자에서 한 번만(앞·나머지), last = 마지막 구분자에서 한 번만(나머지·끝) */
export type SplitLimit = "all" | "first" | "last";
/** cols = 옆 열로, rows = 아래 행으로(다른 열 값은 줄마다 반복) */
export type SplitDirection = "cols" | "rows";

export interface CellSplitOptions {
  delimiter: CellDelimiter;
  /** delimiter가 custom일 때 구분자 */
  custom: string;
  /** delimiter가 width일 때 자를 글자 수 — "3,4"면 3자·4자·나머지 */
  widths: string;
  limit: SplitLimit;
  direction: SplitDirection;
  /** 첫 행을 머리글로(나누지 않고 열 이름에 번호를 붙인다) */
  header: boolean;
  /** 나누기 전 원래 열을 남긴다 */
  keepOriginal: boolean;
  /** 나눈 값 앞뒤 공백 제거 */
  trim: boolean;
  /** 구분자가 연달아 있으면 하나로 본다(빈 칸 만들지 않음) */
  collapse: boolean;
}

export const DEFAULT_CELL_SPLIT_OPTIONS: CellSplitOptions = {
  delimiter: "space",
  custom: "",
  widths: "1",
  limit: "all",
  direction: "cols",
  header: false,
  keepOriginal: false,
  trim: true,
  collapse: true,
};

export const CELL_DELIMITERS: { value: CellDelimiter; label: string; title: string }[] = [
  { value: "space", label: "띄어쓰기", title: "서울시 강남구 → 서울시 | 강남구" },
  { value: "comma", label: "쉼표", title: "A-10234, A-10235 → A-10234 | A-10235" },
  { value: "slash", label: "슬래시 /", title: "빨강/L → 빨강 | L" },
  { value: "hyphen", label: "하이픈 -", title: "010-1234-5678 → 010 | 1234 | 5678" },
  { value: "newline", label: "셀 안 줄바꿈", title: "Alt+Enter로 줄을 바꾼 셀" },
  { value: "custom", label: "직접 입력", title: "원하는 문자로 나누기" },
  { value: "width", label: "글자 수", title: "앞에서부터 정한 글자 수만큼 자르기" },
];

const DELIM_CHAR: Partial<Record<CellDelimiter, string>> = {
  comma: ",",
  slash: "/",
  hyphen: "-",
  newline: "\n",
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 구분자 정규식 — 쉼표는 전각 쉼표·세미콜론까지는 보지 않고 그대로 쉼표만 */
function delimiterPattern(o: Pick<CellSplitOptions, "delimiter" | "custom" | "collapse">): RegExp | null {
  if (o.delimiter === "width") return null;
  let unit: string;
  if (o.delimiter === "space") unit = "[ \\t\\u00a0\\u3000]";
  else if (o.delimiter === "custom") {
    if (o.custom === "") return null;
    unit = `(?:${escapeRe(o.custom)})`;
  } else unit = escapeRe(DELIM_CHAR[o.delimiter]!);
  return new RegExp(o.collapse || o.delimiter === "space" ? `${unit}+` : unit, "g");
}

/** "3,4" → [3, 4] (0이나 숫자가 아닌 값은 버림) */
export function parseWidths(raw: string): number[] {
  return raw
    .split(/[,\s/]+/)
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n > 0);
}

/** 글자 수로 자르기 — 한글·이모지도 한 글자로 센다. 남은 글자는 마지막 칸에 */
function splitByWidth(value: string, widths: number[], limit: SplitLimit): string[] {
  const chars = Array.from(value);
  if (widths.length === 0 || chars.length === 0) return [value];
  if (limit === "last") {
    // 뒤에서 첫 번째 너비만큼 떼어 낸다 (예: 끝 4자리)
    const n = widths[0];
    if (chars.length <= n) return [value];
    return [chars.slice(0, -n).join(""), chars.slice(-n).join("")];
  }
  const use = limit === "first" ? widths.slice(0, 1) : widths;
  const out: string[] = [];
  let i = 0;
  for (const w of use) {
    if (i >= chars.length) break;
    out.push(chars.slice(i, i + w).join(""));
    i += w;
  }
  if (i < chars.length) out.push(chars.slice(i).join(""));
  return out;
}

/** 한 칸 나누기 */
export function splitValue(value: string, o: CellSplitOptions): string[] {
  let parts: string[];
  if (o.delimiter === "width") {
    parts = splitByWidth(o.trim ? value.trim() : value, parseWidths(o.widths), o.limit);
  } else {
    const re = delimiterPattern(o);
    const src = o.delimiter === "space" || o.trim ? value.trim() : value;
    if (!re || src === "") return [o.trim ? value.trim() : value];
    if (o.limit === "all") {
      parts = src.split(re);
    } else {
      const matches = [...src.matchAll(re)];
      if (matches.length === 0) parts = [src];
      else {
        const m = o.limit === "first" ? matches[0] : matches[matches.length - 1];
        parts = [src.slice(0, m.index), src.slice(m.index! + m[0].length)];
      }
    }
  }
  if (o.trim) parts = parts.map((p) => p.trim());
  if (o.collapse && parts.length > 1) {
    const kept = parts.filter((p) => p !== "");
    parts = kept.length > 0 ? kept : [""];
  }
  return parts;
}

/** 이 칸에 구분자가 들어 있는지(나뉠 칸인지) */
function hasDelimiter(value: string, o: CellSplitOptions): boolean {
  if (o.delimiter === "width") return Array.from(value.trim()).length > (parseWidths(o.widths)[0] ?? Infinity);
  const re = delimiterPattern(o);
  if (!re) return false;
  return re.test(o.delimiter === "space" ? value.trim() : value);
}

/** 어느 구분자로 나누면 좋을지 — 셀 안 줄바꿈 > 쉼표 > 슬래시 > 띄어쓰기 > 하이픈 순으로, 칸의 절반 이상에 들어 있는 것 */
export function suggestDelimiter(cells: string[]): CellDelimiter | null {
  const filled = cells.filter((c) => c.trim() !== "");
  if (filled.length === 0) return null;
  const order: CellDelimiter[] = ["newline", "comma", "slash", "space", "hyphen"];
  for (const d of order) {
    const o = { ...DEFAULT_CELL_SPLIT_OPTIONS, delimiter: d };
    const hit = filled.filter((c) => hasDelimiter(c, o)).length;
    if (hit * 2 >= filled.length) return d;
  }
  return null;
}

/** 나눌 열 고르기 — 구분자가 들어 있는 칸이 가장 많은 열 */
export function pickColumn(rows: string[][], o: CellSplitOptions, skipHeader: boolean): number {
  const body = skipHeader ? rows.slice(1) : rows;
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
  let best = 0;
  let bestHits = -1;
  for (let c = 0; c < width; c++) {
    const hits = body.filter((r) => hasDelimiter(r[c] ?? "", o)).length;
    if (hits > bestHits) {
      best = c;
      bestHits = hits;
    }
  }
  return best;
}

export interface CellSplitResult {
  rows: string[][];
  /** 엑셀에 붙여넣을 탭 구분 글자 */
  output: string;
  /** 엑셀 붙여넣기용 표 형식 — 앞자리 0(010, 00123)이 지워지지 않게 텍스트 서식 */
  html: string;
  /** 실제로 나눈 열(0부터) */
  column: number;
  inputRows: number;
  inputCols: number;
  /** 구분자가 있어 나뉜 칸 수 */
  splitCount: number;
  /** 한 칸이 가장 많이 나뉜 개수 */
  maxParts: number;
  /** 원래 칸 중 구분자가 하나도 없는 열인지(안내용) */
  noMatch: boolean;
}

/** 앞자리 0이 있는 숫자, 16자리 이상 숫자처럼 엑셀이 숫자로 바꾸면 망가지는 값 */
export const looksLikeText = (s: string) => /^0\d+$/.test(s) || /^\d{16,}$/.test(s);

/**
 * 표 전체 처리. column이 null이면 구분자가 가장 많이 든 열을 고른다.
 */
export function splitTable(raw: string, o: CellSplitOptions, column: number | null = null): CellSplitResult {
  const table = parseTable(raw);
  const rows = table.rows;
  const empty: CellSplitResult = {
    rows: [],
    output: "",
    html: "",
    column: 0,
    inputRows: 0,
    inputCols: 0,
    splitCount: 0,
    maxParts: 0,
    noMatch: false,
  };
  if (rows.length === 0 || (rows.length === 1 && rows[0].every((c) => c === ""))) return empty;

  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const col = column !== null && column < width ? column : pickColumn(rows, o, o.header);
  const headerRow = o.header ? rows[0] : null;
  const body = o.header ? rows.slice(1) : rows;

  const pieces = body.map((r) => splitValue(r[col] ?? "", o));
  const splitCount = body.filter((r) => hasDelimiter(r[col] ?? "", o)).length;
  const maxParts = pieces.reduce((m, p) => Math.max(m, p.length), 0);
  const pad = (r: string[]) => Array.from({ length: width }, (_, i) => r[i] ?? "");

  let out: string[][];
  if (o.direction === "rows") {
    out = [];
    if (headerRow) out.push(pad(headerRow));
    body.forEach((r, i) => {
      const base = pad(r);
      for (const p of pieces[i]) {
        const row = [...base];
        row[col] = p;
        if (o.keepOriginal) row.splice(col, 0, base[col]);
        out.push(row);
      }
    });
    if (headerRow && o.keepOriginal) out[0].splice(col, 0, `${headerRow[col] ?? ""}(원본)`);
  } else {
    const n = Math.max(1, maxParts);
    const build = (r: string[], parts: string[]) => {
      const base = pad(r);
      const mid = Array.from({ length: n }, (_, k) => parts[k] ?? "");
      return [...base.slice(0, col), ...(o.keepOriginal ? [base[col]] : []), ...mid, ...base.slice(col + 1)];
    };
    out = body.map((r, i) => build(r, pieces[i]));
    if (headerRow) {
      const name = headerRow[col] ?? "";
      const names = Array.from({ length: n }, (_, k) => (name ? `${name}${k + 1}` : ""));
      out.unshift(build(headerRow, names));
    }
  }

  return {
    rows: out,
    output: toTsv(out),
    html: toHtmlTable(out, looksLikeText),
    column: col,
    inputRows: body.length,
    inputCols: width,
    splitCount,
    maxParts,
    noMatch: splitCount === 0,
  };
}

export const CELL_SPLIT_SAMPLE = [
  "이름\t주소\t연락처",
  "김민수\t서울시 강남구 테헤란로 152\t010-2345-6789",
  "이서연\t부산시 해운대구 센텀중앙로 79\t010-8765-4321",
  "박지훈\t대전시 유성구 대학로 99\t02-555-0123",
].join("\n");

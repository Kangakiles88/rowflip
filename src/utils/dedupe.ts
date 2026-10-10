import { parseTable } from "./parser";
import { padRows, toTsv } from "./transpose";

/** unique = 중복 제거 / duplicates = 중복된 값만(한 번씩) / count = 값마다 개수 */
export type DedupeMode = "unique" | "duplicates" | "count";
export type DedupeKeep = "first" | "last";
/** 무엇이 같으면 중복으로 볼지 — 행 전체 또는 특정 열(0부터) */
export type DedupeKey = "row" | number;

export interface DedupeOptions {
  mode: DedupeMode;
  key: DedupeKey;
  keep: DedupeKeep;
  /** 앞뒤 공백 무시(결과 셀도 공백을 정리해서 내보낸다) */
  trim: boolean;
  ignoreCase: boolean;
  /** 비교 대상이 비어 있는 행은 결과에서 뺀다 */
  removeEmpty: boolean;
  /** 첫 행을 머리글로 보고 비교에서 빼되 결과 맨 위에 남긴다 */
  header: boolean;
}

export interface DedupeStats {
  /** 비교한 행(머리글·빈 행 제외) */
  total: number;
  /** 서로 다른 값의 수 */
  unique: number;
  /** 두 번 이상 나온 값의 수 */
  duplicateValues: number;
  /** 중복 제거 모드에서 지워진 행 수 */
  removed: number;
  /** 빈 칸이라 뺀 행 수 */
  emptyRemoved: number;
}

export interface DedupeResult {
  rows: string[][];
  output: string;
  stats: DedupeStats;
  /** 입력이 한 행짜리 가로 목록이었는지 — 결과도 가로로 돌려준다 */
  horizontal: boolean;
  colCount: number;
}

const EMPTY_STATS: DedupeStats = { total: 0, unique: 0, duplicateValues: 0, removed: 0, emptyRemoved: 0 };

/** 비교용 값 — 원본 셀은 그대로 두고 비교할 때만 정규화한다 */
export function normalizeCell(s: string, o: Pick<DedupeOptions, "trim" | "ignoreCase">): string {
  let v = o.trim ? s.trim() : s;
  if (o.ignoreCase) v = v.toLocaleLowerCase("ko-KR");
  return v;
}

function keyCells(row: string[], key: DedupeKey): string[] {
  return key === "row" ? row : [row[key] ?? ""];
}

interface Group {
  count: number;
  first: number;
  last: number;
}

/**
 * 표(행 배열)에서 중복을 찾는다. 순수 함수.
 * 결과 순서는 남긴 행이 원본에 있던 순서를 따른다(개수 세기는 많이 나온 순).
 */
export function dedupeRows(input: string[][], o: DedupeOptions): { rows: string[][]; stats: DedupeStats } {
  let rows = input;
  if (o.trim) rows = rows.map((r) => r.map((s) => s.trim()));

  let head: string[] | null = null;
  if (o.header && rows.length > 0) {
    head = rows[0];
    rows = rows.slice(1);
  }

  let emptyRemoved = 0;
  if (o.removeEmpty) {
    const before = rows.length;
    rows = rows.filter((r) => keyCells(r, o.key).some((c) => c.trim() !== ""));
    emptyRemoved = before - rows.length;
  }

  const groups = new Map<string, Group>();
  const keys: string[] = new Array(rows.length);
  rows.forEach((r, i) => {
    const k = keyCells(r, o.key)
      .map((c) => normalizeCell(c, o))
      .join("\u0000");
    keys[i] = k;
    const g = groups.get(k);
    if (g) {
      g.count++;
      g.last = i;
    } else {
      groups.set(k, { count: 1, first: i, last: i });
    }
  });

  let duplicateValues = 0;
  for (const g of groups.values()) if (g.count > 1) duplicateValues++;

  const pick = (g: Group) => (o.keep === "first" ? g.first : g.last);
  let out: string[][];

  if (o.mode === "count") {
    const list = [...groups.values()].sort((a, b) => b.count - a.count || pick(a) - pick(b));
    out = list.map((g) => [...rows[pick(g)], String(g.count)]);
    if (head) head = [...head, "개수"];
  } else {
    const keepIdx: number[] = [];
    for (const g of groups.values()) {
      if (o.mode === "duplicates" && g.count < 2) continue;
      keepIdx.push(pick(g));
    }
    keepIdx.sort((a, b) => a - b);
    out = keepIdx.map((i) => rows[i]);
  }

  return {
    rows: head ? [head, ...out] : out,
    stats: {
      total: rows.length,
      unique: groups.size,
      duplicateValues,
      removed: rows.length - groups.size,
      emptyRemoved,
    },
  };
}

/**
 * 첫 행이 머리글(제목 행)처럼 보이는지 추측한다.
 * 조건: 두 행·두 열 이상, 첫 행 칸이 모두 채워져 있고 숫자가 없으며 서로 다르고,
 * 같은 열 아래쪽에 같은 값이 다시 나오지 않으며, 아래쪽 어딘가에는 숫자가 든 칸이 있다.
 */
export function looksLikeHeader(rows: string[][]): boolean {
  if (rows.length < 2) return false;
  const first = rows[0].map((c) => c.trim());
  if (first.length < 2) return false;
  if (first.some((c) => c === "" || /\d/.test(c))) return false;
  if (new Set(first).size !== first.length) return false;
  const body = rows.slice(1);
  for (let c = 0; c < first.length; c++) {
    if (body.some((r) => (r[c] ?? "").trim() === first[c])) return false;
  }
  return body.some((r) => r.some((cell) => /\d/.test(cell)));
}

/** 붙여넣은 텍스트 → 결과. 한 행짜리 가로 목록은 칸 하나하나를 목록으로 보고 결과도 가로로 돌려준다. */
export function dedupeText(raw: string, o: DedupeOptions): DedupeResult {
  const table = parseTable(raw);
  if (raw.trim() === "") {
    return { rows: [], output: "", stats: EMPTY_STATS, horizontal: false, colCount: 0 };
  }

  const horizontal = table.rowCount === 1 && table.colCount > 1;
  const source = horizontal ? table.rows[0].map((c) => [c]) : padRows(table.rows);
  const opts: DedupeOptions = horizontal ? { ...o, key: "row", header: false } : o;
  const { rows, stats } = dedupeRows(source, opts);

  let output: string;
  if (horizontal && opts.mode !== "count") output = toTsv([rows.map((r) => r[0])]);
  else output = toTsv(rows);

  return { rows, output, stats, horizontal, colCount: horizontal ? 1 : table.colCount };
}

export const DEFAULT_DEDUPE_OPTIONS: DedupeOptions = {
  mode: "unique",
  key: "row",
  keep: "first",
  trim: true,
  ignoreCase: false,
  removeEmpty: true,
  header: false,
};

export const DEDUPE_SAMPLE = [
  "주문번호\t고객명\t상품코드",
  "A-10234\t김민수\tP-301",
  "A-10235\t이서연\tP-118",
  "A-10234\t김민수\tP-301",
  "A-10236\t박지훈\tP-301",
  "A-10237\t이서연\tP-205",
  "A-10235\t이서연\tP-118",
  "A-10238\t최유진\tP-412",
].join("\n");

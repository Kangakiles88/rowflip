import type { ParsedTable } from "../types";
import { parseTable } from "./parser";

export type TableFormat = "excel" | "csv" | "markdown";

export interface TransposeOptions {
  trim: boolean;
  removeEmptyRows: boolean;
  removeEmptyCols: boolean;
  format: TableFormat;
}

export interface TransposeResult {
  /** 행열이 바뀐 표 — 모든 행의 길이가 같다 */
  rows: string[][];
  output: string;
  before: { rows: number; cols: number };
  after: { rows: number; cols: number };
}

/* ── 순수 함수 ─────────────────────────────────────── */

/** 길이가 들쭉날쭉한 행을 가장 긴 행에 맞춰 빈 칸으로 채운다. */
export function padRows(rows: string[][]): string[][] {
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
  return rows.map((r) => (r.length === width ? r : [...r, ...Array(width - r.length).fill("")]));
}

const isBlank = (s: string) => s.trim() === "";

export function dropEmptyRows(rows: string[][]): string[][] {
  return rows.filter((r) => !r.every(isBlank));
}

export function dropEmptyCols(rows: string[][]): string[][] {
  if (rows.length === 0) return rows;
  const keep = rows[0].map((_, c) => rows.some((r) => !isBlank(r[c] ?? "")));
  return rows.map((r) => r.filter((_, c) => keep[c]));
}

export function transposeRows(rows: string[][]): string[][] {
  const padded = padRows(rows);
  if (padded.length === 0) return [];
  return padded[0].map((_, c) => padded.map((r) => r[c]));
}

/** 엑셀이 읽는 방식 그대로: 탭·줄바꿈·따옴표가 든 셀만 큰따옴표로 감싼다. */
export function toTsv(rows: string[][]): string {
  const cell = (s: string) => (/[\t\n"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return rows.map((r) => r.map(cell).join("\t")).join("\n");
}

export function toCsv(rows: string[][]): string {
  const cell = (s: string) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return rows.map((r) => r.map(cell).join(",")).join("\n");
}

/** 첫 행을 머리글로 쓰는 마크다운 표 */
export function toMarkdown(rows: string[][]): string {
  if (rows.length === 0) return "";
  const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, "<br>").trim();
  const line = (r: string[]) => `| ${r.map(cell).join(" | ")} |`;
  const [head, ...body] = rows;
  return [line(head), `| ${head.map(() => "---").join(" | ")} |`, ...body.map(line)].join("\n");
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * 엑셀 붙여넣기용 표 형식(HTML). 셀 안 줄바꿈은 엑셀이 같은 칸 안 줄바꿈으로 읽는 <br>로 넣는다.
 * 줄바꿈이 든 셀이 있을 때만 쓴다(clipboard.ts 참고).
 */
export function toHtmlTable(rows: string[][], keepAsText?: (cell: string) => boolean): string {
  const cell = (s: string) =>
    escapeHtml(s)
      .split("\n")
      .join('<br style="mso-data-placement:same-cell">');
  // keepAsText가 참인 칸은 엑셀이 숫자로 바꾸지 않게 '텍스트' 서식으로 넣는다(앞자리 0 보존)
  const td = (c: string) => (keepAsText?.(c) ? `<td style='mso-number-format:"\\@"'>${cell(c)}</td>` : `<td>${cell(c)}</td>`);
  const body = rows.map((r) => `<tr>${r.map(td).join("")}</tr>`).join("");
  return `<meta charset="utf-8"><table>${body}</table>`;
}

export const hasMultilineCell = (rows: string[][]) => rows.some((r) => r.some((c) => c.includes("\n")));

export function formatTable(rows: string[][], format: TableFormat): string {
  if (format === "csv") return toCsv(rows);
  if (format === "markdown") return toMarkdown(rows);
  return toTsv(rows);
}

/* ── 전체 흐름 ───────────────────────────────────────── */

export function transposeText(raw: string, o: TransposeOptions): TransposeResult {
  const table: ParsedTable = parseTable(raw);
  let rows = padRows(table.rows);
  if (o.trim) rows = rows.map((r) => r.map((s) => s.trim()));
  if (o.removeEmptyRows) rows = dropEmptyRows(rows);
  if (o.removeEmptyCols) rows = dropEmptyCols(rows);

  const before = { rows: rows.length, cols: rows[0]?.length ?? 0 };
  const out = transposeRows(rows);
  return {
    rows: out,
    output: formatTable(out, o.format),
    before,
    after: { rows: out.length, cols: out[0]?.length ?? 0 },
  };
}

export const DEFAULT_TRANSPOSE_OPTIONS: TransposeOptions = {
  trim: true,
  removeEmptyRows: true,
  removeEmptyCols: false,
  format: "excel",
};

export const TRANSPOSE_SAMPLE = [
  "구분\t1월\t2월\t3월\t4월",
  "매출\t1,200\t1,350\t1,410\t1,520",
  "비용\t800\t820\t905\t940",
  "이익\t400\t530\t505\t580",
].join("\n");

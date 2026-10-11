import type { ColumnSelect, ParsedTable } from "../types";

export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

/**
 * Excel/Google Sheets는 줄바꿈·탭·따옴표가 들어간 셀만 큰따옴표로 감싸서 복사한다.
 * 그래서 내용에 \n, \t, "" 가 있는 경우에만 따옴표 셀로 해석하고,
 * 메모장에서 붙여넣은 "apple" 같은 값은 그대로 둔다.
 */
function findQuotedCellEnd(text: string, start: number): number {
  let hasSpecial = false;
  let j = start;
  while (j < text.length) {
    const ch = text[j];
    if (ch === '"') {
      if (text[j + 1] === '"') {
        hasSpecial = true;
        j += 2;
        continue;
      }
      const next = text[j + 1];
      const atBoundary = next === undefined || next === "\t" || next === "\n";
      return atBoundary && hasSpecial ? j : -1;
    }
    if (ch === "\n" || ch === "\t") hasSpecial = true;
    j++;
  }
  return -1;
}

export function parseTable(raw: string): ParsedTable {
  const text = normalizeNewlines(raw);
  if (text === "") return { rows: [], rowCount: 0, colCount: 0 };

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let cellStart = true;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (ch === '"' && cellStart) {
      const end = findQuotedCellEnd(text, i + 1);
      if (end !== -1) {
        cell = text.slice(i + 1, end).replace(/""/g, '"');
        cellStart = false;
        i = end + 1;
        continue;
      }
    }

    if (ch === "\t") {
      row.push(cell);
      cell = "";
      cellStart = true;
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      cellStart = true;
    } else {
      cell += ch;
      cellStart = false;
    }
    i++;
  }
  row.push(cell);
  rows.push(row);

  // 엑셀 복사본은 끝에 줄바꿈이 붙는다 — 마지막 빈 행 하나는 버린다.
  const last = rows[rows.length - 1];
  if (rows.length > 1 && last.length === 1 && last[0] === "") rows.pop();

  const colCount = rows.reduce((max, r) => Math.max(max, r.length), 0);
  return { rows, rowCount: rows.length, colCount };
}

export function extractCells(table: ParsedTable, column: ColumnSelect): string[] {
  if (column === "all") return table.rows.flat();
  return table.rows.map((r) => r[column] ?? "");
}

/**
 * 엑셀에서 셀을 복사해 글 도구(글자수·줄바꿈 제거 등)에 붙여넣을 때 쓰는 정리.
 * 엑셀은 줄바꿈이 든 셀을 "…"로 감싸 복사하므로, 한 열짜리 복사본이면 따옴표를 벗기고 셀마다 한 줄로 되돌린다.
 * 여러 열(탭이 든 표)이나 따옴표가 없는 글은 그대로 둔다.
 */
export function excelCellsToText(raw: string): string {
  if (!raw.includes('"')) return raw;
  const text = normalizeNewlines(raw);
  const table = parseTable(text);
  if (table.colCount !== 1) return raw;
  const joined = table.rows.map((r) => r[0]).join("\n");
  // 따옴표로 감싼 셀이 하나도 없었다면 원문 그대로 (끝 줄바꿈 등 보존)
  return joined === text.replace(/\n$/, "") ? raw : joined;
}

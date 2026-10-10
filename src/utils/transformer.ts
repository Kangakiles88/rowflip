import type {
  Numbering,
  OutputFormat,
  QuoteStyle,
  Separator,
  SortMode,
  TransformOptions,
  TransformResult,
} from "../types";
import { extractCells, parseTable } from "./parser";
import { splitCells, suggestInputSplit, unquote, unwrapBrackets } from "./split";

/* ── 각 단계는 독립된 순수 함수 ─────────────────────────── */

export const trimItems = (items: string[]): string[] => items.map((s) => s.trim());

export function removeEmptyItems(items: string[]): { items: string[]; removed: number } {
  const kept = items.filter((s) => s.trim() !== "");
  return { items: kept, removed: items.length - kept.length };
}

/** 첫 번째 값을 유지한다. */
export function dedupeItems(
  items: string[],
  ignoreCase = false,
): { items: string[]; removed: number } {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const item of items) {
    const key = ignoreCase ? item.toLocaleLowerCase() : item;
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(item);
  }
  return { items: kept, removed: items.length - kept.length };
}

const NUMERIC = /^[-+]?(\d{1,3}(,\d{3})+|\d+)?(\.\d+)?$/;

export function isNumericList(items: string[]): boolean {
  const values = items.map((s) => s.trim()).filter((s) => s !== "");
  return values.length > 0 && values.every((s) => NUMERIC.test(s) && /\d/.test(s));
}

const toNumber = (s: string) => Number(s.trim().replace(/,/g, ""));

/** 시드 고정 난수 — 같은 시드면 입력이 바뀌어도 섞는 순서가 유지된다. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const collator = new Intl.Collator("ko", { numeric: true, sensitivity: "base" });

export function sortItems(items: string[], mode: SortMode, seed = 1): string[] {
  const list = [...items];
  switch (mode) {
    case "original":
      return list;
    case "reverse":
      return list.reverse();
    case "random": {
      const rand = mulberry32(seed);
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      return list;
    }
    case "asc":
    case "desc": {
      const numeric = isNumericList(list);
      list.sort((a, b) => {
        if (numeric) {
          const blankA = a.trim() === "";
          const blankB = b.trim() === "";
          if (blankA || blankB) return Number(blankA) - Number(blankB);
          return toNumber(a) - toNumber(b);
        }
        return collator.compare(a, b);
      });
      return mode === "desc" ? list.reverse() : list;
    }
  }
}

export const applyAffixes = (items: string[], prefix: string, suffix: string): string[] =>
  prefix || suffix ? items.map((s) => `${prefix}${s}${suffix}`) : items;

export function applyQuote(items: string[], quote: QuoteStyle): string[] {
  if (quote === "none") return items;
  const q = quote === "single" ? "'" : '"';
  return items.map((s) => `${q}${s}${q}`);
}

export function applyNumbering(items: string[], numbering: Numbering): string[] {
  if (numbering === "none") return items;
  const width = Math.max(2, String(items.length).length);
  return items.map((s, i) => {
    const n = i + 1;
    if (numbering === "dot") return `${n}. ${s}`;
    if (numbering === "paren") return `${n}) ${s}`;
    return `${String(n).padStart(width, "0")}_${s}`;
  });
}

export function resolveSeparator(separator: Separator, custom: string): string {
  switch (separator) {
    case "newline":
      return "\n";
    case "comma-space":
      return ", ";
    case "comma":
      return ",";
    case "pipe":
      return " | ";
    case "slash":
      return " / ";
    case "space":
      return " ";
    case "tab":
      return "\t";
    case "custom":
      return custom.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
  }
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function formatItems(
  items: string[],
  format: Exclude<OutputFormat, "list">,
): string {
  if (items.length === 0) return "";
  switch (format) {
    case "sql-in":
      return `(${items.map((s) => `'${s.replace(/'/g, "''")}'`).join(",")})`;
    case "json":
      return JSON.stringify(items);
    case "js":
    case "python":
      return `[${items.map((s) => JSON.stringify(s)).join(", ")}]`;
    case "html":
      return `<ul>\n${items.map((s) => `  <li>${escapeHtml(s)}</li>`).join("\n")}\n</ul>`;
  }
}

/* ── 전체 파이프라인 ───────────────────────────────────── */

export function transform(raw: string, o: TransformOptions): TransformResult {
  const table = parseTable(raw);
  const column = o.column !== "all" && o.column >= table.colCount ? "all" : o.column;
  let items = extractCells(table, column);
  const suggestedSplit = o.inputSplit === "cells" ? suggestInputSplit(items) : null;
  if (o.unwrap) items = items.map(unwrapBrackets);
  items = splitCells(items, o.inputSplit, o.inputCustom);
  if (o.unwrap) items = items.map(unquote);
  const inputCells = items.length;

  if (o.trim) items = trimItems(items);

  let removedEmpty = 0;
  if (o.removeEmpty) ({ items, removed: removedEmpty } = removeEmptyItems(items));

  let removedDuplicates = 0;
  if (o.dedupe) ({ items, removed: removedDuplicates } = dedupeItems(items, o.ignoreCase));

  items = sortItems(items, o.sort, o.randomSeed);
  items = applyAffixes(items, o.prefix, o.suffix);

  let output: string;
  if (o.format === "list") {
    const decorated = applyNumbering(applyQuote(items, o.quote), o.numbering);
    output = decorated.join(resolveSeparator(o.separator, o.customSeparator));
  } else {
    output = formatItems(items, o.format);
  }

  return {
    output,
    items,
    suggestedSplit,
    stats: {
      rowCount: table.rowCount,
      colCount: table.colCount,
      inputCells,
      removedEmpty,
      removedDuplicates,
      outputCount: items.length,
    },
  };
}

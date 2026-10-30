import type { TransformOptions } from "../types";

export const DEFAULT_OPTIONS: TransformOptions = {
  inputSplit: "cells",
  inputCustom: "",
  unwrap: false,
  trim: true,
  removeEmpty: true,
  dedupe: false,
  ignoreCase: false,
  sort: "original",
  randomSeed: 1,
  prefix: "",
  suffix: "",
  quote: "none",
  numbering: "none",
  separator: "comma-space",
  customSeparator: "",
  format: "list",
  column: "all",
};

export interface Preset {
  id: string;
  label: string;
  /** 버튼 툴팁에 쓰는 결과 예시 */
  example: string;
  /** 영어 페이지(/en/)용 이름·예시 */
  en: { label: string; example: string };
  apply: (o: TransformOptions) => TransformOptions;
}

const plainList = (o: TransformOptions): TransformOptions => ({
  ...o,
  format: "list",
  quote: "none",
  numbering: "none",
});

export const PRESETS: Preset[] = [
  {
    id: "horizontal",
    label: "가로로",
    example: "탭으로 연결 — 엑셀 한 칸에 붙여넣으면 오른쪽으로 펼쳐집니다",
    en: { label: "To row", example: "Tab-separated — pastes across one row in Excel" },
    apply: (o) => ({ ...plainList(o), separator: "tab" }),
  },
  {
    id: "vertical",
    label: "세로로",
    example: "한 줄에 하나씩 — 엑셀에 붙여넣으면 아래로 이어집니다",
    en: { label: "To column", example: "One per line — pastes down one column in Excel" },
    apply: (o) => ({ ...plainList(o), separator: "newline" }),
  },
  {
    id: "comma",
    label: "쉼표로 연결",
    example: "a, b, c",
    en: { label: "Comma list", example: "a, b, c" },
    apply: (o) => ({ ...plainList(o), separator: "comma-space" }),
  },
  {
    id: "oneline",
    label: "한 줄로",
    example: "a b c",
    en: { label: "One line", example: "a b c" },
    apply: (o) => ({ ...plainList(o), separator: "space" }),
  },
  {
    id: "dedupe",
    label: "중복 제거",
    example: "a a b → a b",
    en: { label: "Remove duplicates", example: "a a b → a b" },
    apply: (o) => ({ ...o, trim: true, removeEmpty: true, dedupe: true }),
  },
  {
    id: "sql",
    label: "SQL IN",
    example: "('a','b','c')",
    en: { label: "SQL IN", example: "('a','b','c')" },
    apply: (o) => ({ ...o, trim: true, removeEmpty: true, dedupe: true, format: "sql-in" }),
  },
  {
    id: "json",
    label: "JSON 배열",
    example: '["a","b","c"]',
    en: { label: "JSON array", example: '["a","b","c"]' },
    apply: (o) => ({ ...o, trim: true, removeEmpty: true, format: "json" }),
  },
  {
    id: "number",
    label: "번호 붙이기",
    example: "1. a↵2. b",
    en: { label: "Number lines", example: "1. a↵2. b" },
    apply: (o) => ({ ...plainList(o), separator: "newline", numbering: "dot" }),
  },
  {
    id: "url",
    label: "URL 목록",
    example: "https://…/a",
    en: { label: "URL list", example: "https://…/a" },
    apply: (o) => ({
      ...plainList(o),
      separator: "newline",
      prefix: o.prefix || "https://example.com/",
    }),
  },
];

export const SAMPLE_INPUT = [
  "A-10234",
  " A-10871",
  "B-20017",
  "",
  "A-10234",
  "C-30552",
  "B-20017 ",
  "D-41009",
  "C-30577",
  "A-10871",
].join("\n");

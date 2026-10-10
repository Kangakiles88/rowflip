import type { InputSplit } from "../utils/split";

export type Separator =
  | "newline"
  | "comma-space"
  | "comma"
  | "pipe"
  | "slash"
  | "space"
  | "tab"
  | "custom";

export type QuoteStyle = "none" | "single" | "double";

/** dot: "1. a" · paren: "1) a" · underscore: "01_a" */
export type Numbering = "none" | "dot" | "paren" | "underscore";

export type SortMode = "original" | "asc" | "desc" | "reverse" | "random";

export type OutputFormat = "list" | "sql-in" | "json" | "js" | "python" | "html";

/** "all" = 모든 셀을 행 순서대로 펼침, 숫자 = 해당 열(0부터)만 사용 */
export type ColumnSelect = "all" | number;

export interface TransformOptions {
  /** 원본 셀을 다시 나눌 구분자 — "cells"면 엑셀 칸(탭·줄바꿈) 그대로 */
  inputSplit: InputSplit;
  inputCustom: string;
  /** ('a','b') · ["a","b"]의 괄호와 따옴표 벗기기 */
  unwrap: boolean;
  trim: boolean;
  removeEmpty: boolean;
  dedupe: boolean;
  ignoreCase: boolean;
  sort: SortMode;
  randomSeed: number;
  prefix: string;
  suffix: string;
  quote: QuoteStyle;
  numbering: Numbering;
  separator: Separator;
  customSeparator: string;
  format: OutputFormat;
  column: ColumnSelect;
}

export interface ParsedTable {
  rows: string[][];
  rowCount: number;
  colCount: number;
}

export interface TransformStats {
  rowCount: number;
  colCount: number;
  inputCells: number;
  removedEmpty: number;
  removedDuplicates: number;
  outputCount: number;
}

export interface TransformResult {
  output: string;
  items: string[];
  stats: TransformStats;
  /** 엑셀 칸으로만 나눴는데 쉼표·세미콜론 목록처럼 보이면 그 구분자 */
  suggestedSplit: InputSplit | null;
}

export interface BrandConnectProduct {
  /** 상품 이름 — 카드에 그대로 표시 */
  name: string;
  /** 브랜드커넥트에서 만든 내 링크 */
  href: string;
  /** public/ads/ 아래 이미지("/ads/파일명.webp"), 정사각형 권장 */
  image: string;
}

export interface BrandConnectConfig {
  enabled: boolean;
  /** 상품 줄 위에 붙는 제목 */
  title: string;
  /** 대가성 안내 — 필수. 띠 오른쪽(휴대폰은 아래)에 항상 보인다 */
  disclosureText: string;
  position: PromotionPosition;
  products: BrandConnectProduct[];
}

/** header = 메뉴 바로 아래·페이지 제목 위(한 줄 띠) */
export type PromotionPosition = "header" | "top" | "middle" | "bottom";

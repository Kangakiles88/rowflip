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
}

export interface BrandConnectBannerConfig {
  enabled: boolean;
  href: string;
  desktopImage?: string;
  mobileImage?: string;
  imageAlt?: string;
  title?: string;
  description?: string;
  ctaText?: string;
  disclosureText?: string;
  position: PromotionPosition;
}

export type PromotionPosition = "top" | "middle" | "bottom";

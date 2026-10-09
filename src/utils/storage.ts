import type { TransformOptions } from "../types";
import { DEFAULT_OPTIONS } from "./presets";

/**
 * LocalStorage에는 UI 설정만 저장한다.
 * 원본 데이터·결과는 물론, 사용자가 입력한 접두사/접미사도 저장하지 않는다.
 */
const KEY = "excel-garosero:settings:v1";

type StoredSettings = Pick<
  TransformOptions,
  | "trim"
  | "removeEmpty"
  | "dedupe"
  | "ignoreCase"
  | "sort"
  | "quote"
  | "numbering"
  | "separator"
  | "customSeparator"
  | "format"
>;

const STORED_KEYS: (keyof StoredSettings)[] = [
  "trim",
  "removeEmpty",
  "dedupe",
  "ignoreCase",
  "sort",
  "quote",
  "numbering",
  "separator",
  "customSeparator",
  "format",
];

export function loadSettings(): Partial<StoredSettings> {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of STORED_KEYS) {
      if (k in parsed && typeof parsed[k] === typeof DEFAULT_OPTIONS[k]) out[k] = parsed[k];
    }
    return out as Partial<StoredSettings>;
  } catch {
    return {};
  }
}

export function saveSettings(o: TransformOptions): void {
  try {
    const out: Record<string, unknown> = {};
    for (const k of STORED_KEYS) out[k] = o[k];
    window.localStorage.setItem(KEY, JSON.stringify(out));
  } catch {
    /* 저장 불가 환경(시크릿 창 등)은 무시 */
  }
}

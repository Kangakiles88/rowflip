import type { TransformOptions } from "../types";
import { DEFAULT_OPTIONS } from "./presets";
import { INPUT_SPLITS } from "./split";

/**
 * LocalStorage에는 UI 설정만 저장한다.
 * 원본 데이터·결과는 물론, 사용자가 입력한 접두사/접미사도 저장하지 않는다.
 */
const KEY = "rowflip:settings:v1";

type StoredSettings = Pick<
  TransformOptions,
  | "inputSplit"
  | "unwrap"
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
  "inputSplit",
  "unwrap",
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
    if ("inputSplit" in out && !INPUT_SPLITS.some((s) => s.value === out.inputSplit)) delete out.inputSplit;
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

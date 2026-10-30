"use client";

import { useLocale } from "@/i18n/locale";
import type { SortMode, TransformOptions } from "@/types";
import styles from "./tool.module.css";

interface Props {
  options: TransformOptions;
  update: (patch: Partial<TransformOptions>) => void;
}

const SORTS: { value: SortMode; label: string; en: string }[] = [
  { value: "original", label: "원래 순서", en: "Original order" },
  { value: "asc", label: "오름차순", en: "A → Z" },
  { value: "desc", label: "내림차순", en: "Z → A" },
  { value: "reverse", label: "역순", en: "Reverse" },
  { value: "random", label: "랜덤", en: "Random" },
];

export function CleanupOptions({ options, update }: Props) {
  const en = useLocale() === "en";
  return (
    <>
      <fieldset className={styles.group}>
        <legend className={styles.groupTitle}>{en ? "Clean up" : "정리"}</legend>
        <label className={styles.check}>
          <input type="checkbox" checked={options.trim} onChange={(e) => update({ trim: e.target.checked })} />
          {en ? "Trim spaces" : "앞뒤 공백 제거"}
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={options.removeEmpty}
            onChange={(e) => update({ removeEmpty: e.target.checked })}
          />
          {en ? "Remove empty lines" : "빈 줄 제거"}
        </label>
        <label className={styles.check}>
          <input type="checkbox" checked={options.dedupe} onChange={(e) => update({ dedupe: e.target.checked })} />
          {en ? "Remove duplicates" : "중복 제거"}
        </label>
        <label className={`${styles.check} ${styles.checkSub}`}>
          <input
            type="checkbox"
            checked={options.ignoreCase}
            disabled={!options.dedupe}
            onChange={(e) => update({ ignoreCase: e.target.checked })}
          />
          {en ? "Ignore case" : "대소문자 무시"}
        </label>
        <label
          className={styles.check}
          title={en ? `('A','B') · ["A", "B"] → A, B` : `('A','B') · ["A", "B"]를 A, B 목록으로`}
        >
          <input type="checkbox" checked={options.unwrap} onChange={(e) => update({ unwrap: e.target.checked })} />
          {en ? "Strip brackets and quotes" : "괄호·따옴표 벗기기"}
        </label>
        {options.inputSplit === "custom" && (
          <input
            className={`${styles.input} ${styles.mono}`}
            aria-label={en ? "Split character" : "원본을 나눌 문자"}
            placeholder={en ? "Split on (e.g. ::)" : "나눌 문자 (예: ::)"}
            value={options.inputCustom}
            onChange={(e) => update({ inputCustom: e.target.value })}
          />
        )}
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.groupTitle}>{en ? "Sort" : "정렬"}</legend>
        <div className={styles.inline}>
          <select
            aria-label={en ? "Sort" : "정렬"}
            className={styles.select}
            value={options.sort}
            onChange={(e) => {
              const sort = e.target.value as SortMode;
              update(sort === "random" ? { sort, randomSeed: Date.now() } : { sort });
            }}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {en ? s.en : s.label}
              </option>
            ))}
          </select>
          {options.sort === "random" && (
            <button type="button" className={styles.ghost} onClick={() => update({ randomSeed: Date.now() })}>
              {en ? "Shuffle again" : "다시 섞기"}
            </button>
          )}
        </div>
        <p className={styles.hint}>{en ? "Numbers are sorted by value." : "숫자만 있으면 숫자 크기로 정렬합니다."}</p>
      </fieldset>
    </>
  );
}

"use client";

import type { SortMode, TransformOptions } from "@/types";
import styles from "./tool.module.css";

interface Props {
  options: TransformOptions;
  update: (patch: Partial<TransformOptions>) => void;
}

const SORTS: { value: SortMode; label: string }[] = [
  { value: "original", label: "원래 순서" },
  { value: "asc", label: "오름차순" },
  { value: "desc", label: "내림차순" },
  { value: "reverse", label: "역순" },
  { value: "random", label: "랜덤" },
];

export function CleanupOptions({ options, update }: Props) {
  return (
    <>
      <fieldset className={styles.group}>
        <legend className={styles.groupTitle}>정리</legend>
        <label className={styles.check}>
          <input type="checkbox" checked={options.trim} onChange={(e) => update({ trim: e.target.checked })} />
          앞뒤 공백 제거
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={options.removeEmpty}
            onChange={(e) => update({ removeEmpty: e.target.checked })}
          />
          빈 줄 제거
        </label>
        <label className={styles.check}>
          <input type="checkbox" checked={options.dedupe} onChange={(e) => update({ dedupe: e.target.checked })} />
          중복 제거
        </label>
        <label className={`${styles.check} ${styles.checkSub}`}>
          <input
            type="checkbox"
            checked={options.ignoreCase}
            disabled={!options.dedupe}
            onChange={(e) => update({ ignoreCase: e.target.checked })}
          />
          대소문자 무시
        </label>
        <label className={styles.check} title="('A','B') · [&quot;A&quot;, &quot;B&quot;]를 A, B 목록으로">
          <input type="checkbox" checked={options.unwrap} onChange={(e) => update({ unwrap: e.target.checked })} />
          괄호·따옴표 벗기기
        </label>
        {options.inputSplit === "custom" && (
          <input
            className={`${styles.input} ${styles.mono}`}
            aria-label="원본을 나눌 문자"
            placeholder="나눌 문자 (예: ::)"
            value={options.inputCustom}
            onChange={(e) => update({ inputCustom: e.target.value })}
          />
        )}
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.groupTitle}>정렬</legend>
        <div className={styles.inline}>
          <select
            aria-label="정렬"
            className={styles.select}
            value={options.sort}
            onChange={(e) => {
              const sort = e.target.value as SortMode;
              update(sort === "random" ? { sort, randomSeed: Date.now() } : { sort });
            }}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {options.sort === "random" && (
            <button type="button" className={styles.ghost} onClick={() => update({ randomSeed: Date.now() })}>
              다시 섞기
            </button>
          )}
        </div>
        <p className={styles.hint}>숫자만 있으면 숫자 크기로 정렬합니다.</p>
      </fieldset>
    </>
  );
}

"use client";

import type { Numbering, OutputFormat, QuoteStyle, Separator, TransformOptions } from "@/types";
import { Segmented } from "./Segmented";
import styles from "./tool.module.css";

interface Props {
  options: TransformOptions;
  update: (patch: Partial<TransformOptions>) => void;
  prefixRef: React.RefObject<HTMLInputElement | null>;
}

const FORMATS: { value: OutputFormat; label: string; title: string }[] = [
  { value: "list", label: "목록", title: "구분자로 연결" },
  { value: "sql-in", label: "SQL IN", title: "('a','b')" },
  { value: "json", label: "JSON", title: '["a","b"]' },
  { value: "js", label: "JS", title: '["a", "b"]' },
  { value: "python", label: "Python", title: '["a", "b"]' },
  { value: "html", label: "HTML", title: "<ul><li>…" },
];

const SEPARATORS: { value: Separator; label: string }[] = [
  { value: "newline", label: "줄바꿈 (세로)" },
  { value: "comma-space", label: "쉼표 + 공백  a, b" },
  { value: "comma", label: "쉼표  a,b" },
  { value: "pipe", label: "파이프  a | b" },
  { value: "slash", label: "슬래시  a / b" },
  { value: "space", label: "공백  a b" },
  { value: "tab", label: "탭 (엑셀 가로 붙여넣기)" },
  { value: "custom", label: "직접 입력" },
];

const QUOTES: { value: QuoteStyle; label: string }[] = [
  { value: "none", label: "없음" },
  { value: "single", label: "'a'" },
  { value: "double", label: '"a"' },
];

const NUMBERINGS: { value: Numbering; label: string }[] = [
  { value: "none", label: "번호 없음" },
  { value: "dot", label: "1. a" },
  { value: "paren", label: "1) a" },
  { value: "underscore", label: "01_a" },
];

export function OutputOptions({ options, update, prefixRef }: Props) {
  const isList = options.format === "list";

  return (
    <>
      <fieldset className={styles.group}>
        <legend className={styles.groupTitle}>출력 형식</legend>
        <Segmented
          label="출력 형식"
          value={options.format}
          options={FORMATS}
          onChange={(format) => update({ format })}
        />
        <div className={styles.inline}>
          <select
            aria-label="구분자"
            className={styles.select}
            value={options.separator}
            disabled={!isList}
            onChange={(e) => update({ separator: e.target.value as Separator })}
          >
            {SEPARATORS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {options.separator === "custom" && isList && (
            <input
              aria-label="사용자 구분자"
              className={`${styles.input} ${styles.mono}`}
              value={options.customSeparator}
              placeholder="예: && 또는 \n"
              onChange={(e) => update({ customSeparator: e.target.value })}
              size={8}
            />
          )}
        </div>
        {!isList && <p className={styles.hint}>코드 형식에서는 구분자·따옴표·번호가 형식에 맞게 고정됩니다.</p>}
      </fieldset>

      <fieldset className={styles.group} disabled={!isList}>
        <legend className={styles.groupTitle}>따옴표 · 번호</legend>
        <Segmented
          label="따옴표"
          value={options.quote}
          options={QUOTES}
          onChange={(quote) => update({ quote })}
          disabled={!isList}
        />
        <select
          aria-label="번호 붙이기"
          className={styles.select}
          value={options.numbering}
          onChange={(e) => update({ numbering: e.target.value as Numbering })}
        >
          {NUMBERINGS.map((n) => (
            <option key={n.value} value={n.value}>
              {n.label}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.groupTitle}>앞뒤에 붙이기</legend>
        <label className={styles.field}>
          <span>접두사</span>
          <input
            ref={prefixRef}
            className={`${styles.input} ${styles.mono}`}
            value={options.prefix}
            placeholder="SKU-"
            onChange={(e) => update({ prefix: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span>접미사</span>
          <input
            className={`${styles.input} ${styles.mono}`}
            value={options.suffix}
            placeholder=".jpg"
            onChange={(e) => update({ suffix: e.target.value })}
          />
        </label>
      </fieldset>
    </>
  );
}

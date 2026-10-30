"use client";

import { useRef } from "react";
import { useLocale } from "@/i18n/locale";
import type { ColumnSelect } from "@/types";
import { INPUT_SPLITS, type InputSplit } from "@/utils/split";
import styles from "./tool.module.css";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSample: () => void;
  onClear: () => void;
  rowCount: number;
  colCount: number;
  /** 주면 여러 열일 때 '변환할 열' 선택이 나온다 */
  column?: ColumnSelect;
  onColumnChange?: (c: ColumnSelect) => void;
  placeholder?: string;
  /** 한 페이지에 입력창이 둘 이상일 때 구분용 */
  inputId?: string;
  title?: string;
  /** 주면 상태 표시줄에 '나누기' 선택이 나온다 */
  split?: InputSplit;
  onSplitChange?: (s: InputSplit) => void;
  /** 안내 버튼('쉼표로 나누기')을 눌렀을 때 — 없으면 onSplitChange */
  onSplitSuggest?: (s: InputSplit) => void;
  /** 쉼표 목록처럼 보일 때 바로 바꿀 수 있게 안내 */
  splitSuggestion?: InputSplit | null;
}

const PLACEHOLDER = `엑셀이나 텍스트 데이터를 여기에 붙여넣으세요.

예:
A-10234
A-10235
A-10236

팁: 엑셀에서 첫 칸을 누르고 Ctrl+Shift+↓(맥은 ⌘)를 누르면 열 끝까지 선택됩니다.`;

const PLACEHOLDER_EN = `Paste data from Excel, Google Sheets or a text file here.

Example:
A-10234
A-10235
A-10236

Tip: click the first cell in Excel and press Ctrl+Shift+↓ (⌘ on Mac) to select to the end of the column.`;

const fmt = (n: number) => n.toLocaleString("ko-KR");

export function InputPanel({
  value,
  onChange,
  onSample,
  onClear,
  rowCount,
  colCount,
  column = "all",
  onColumnChange,
  placeholder,
  inputId = "source",
  title,
  split,
  onSplitChange,
  onSplitSuggest,
  splitSuggestion,
}: Props) {
  const en = useLocale() === "en";
  const gutterRef = useRef<HTMLPreElement>(null);
  const lineCount = value === "" ? 1 : value.split("\n").length;
  // 줄 번호는 문자열 하나로 그린다 — 5만 줄이어도 DOM 노드는 하나.
  const gutter = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");
  const multiColumn = colCount > 1;

  return (
    <section className={`${styles.pane} ${styles.inputPane}`} aria-labelledby={`${inputId}-label`}>
      <div className={styles.paneHead}>
        <label id={`${inputId}-label`} htmlFor={inputId} className={styles.paneTitle}>
          {title ?? (en ? "Source data" : "원본 데이터")}
        </label>
        <div className={styles.paneActions}>
          <button type="button" className={styles.ghost} onClick={onSample}>
            {en ? "Sample" : "샘플 넣기"}
          </button>
          <button type="button" className={styles.ghost} onClick={onClear} disabled={value === ""}>
            {en ? "Clear" : "지우기"}
          </button>
        </div>
      </div>

      <div className={styles.editor}>
        <pre ref={gutterRef} className={styles.gutter} aria-hidden="true">
          {gutter}
        </pre>
        <textarea
          id={inputId}
          className={styles.code}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={(e) => {
            if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
          }}
          placeholder={placeholder ?? (en ? PLACEHOLDER_EN : PLACEHOLDER)}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          wrap="off"
        />
      </div>

      <div className={styles.status}>
        <span>
          {en
            ? onColumnChange || colCount <= 1
              ? `${fmt(rowCount)} rows · ${fmt(value.length)} chars`
              : `${fmt(rowCount)} rows × ${fmt(colCount)} cols · ${fmt(value.length)} chars`
            : onColumnChange || colCount <= 1
              ? `${fmt(rowCount)}행 · ${fmt(value.length)}자`
              : `${fmt(rowCount)}행 × ${fmt(colCount)}열 · ${fmt(value.length)}자`}
        </span>
        {split && onSplitChange && (
          <span className={styles.statusControls}>
            {splitSuggestion && (
              <button type="button" className={styles.statusAction} onClick={() => (onSplitSuggest ?? onSplitChange)(splitSuggestion)}>
                {en
                  ? `Split by ${INPUT_SPLITS.find((s) => s.value === splitSuggestion)?.enShort}`
                  : `${INPUT_SPLITS.find((s) => s.value === splitSuggestion)?.short}로 나누기`}
              </button>
            )}
            <label className={split === "cells" ? undefined : styles.statusNotice}>
              {en ? "Split" : "나누기"}{" "}
              <select
                aria-label={en ? "Split source by" : "원본을 나눌 기준"}
                className={styles.statusSelect}
                value={split}
                onChange={(e) => onSplitChange(e.target.value as InputSplit)}
              >
                {INPUT_SPLITS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {en ? s.en : s.label}
                  </option>
                ))}
              </select>
            </label>
          </span>
        )}
        {multiColumn && onColumnChange && (
          <span className={styles.statusNotice}>
            {en ? `${fmt(rowCount)} rows × ${colCount} cols` : `${fmt(rowCount)}행 × ${colCount}열 감지`}
            <select
              aria-label={en ? "Column to convert" : "변환할 열"}
              className={styles.statusSelect}
              value={String(column)}
              onChange={(e) =>
                onColumnChange(e.target.value === "all" ? "all" : Number(e.target.value))
              }
            >
              <option value="all">{en ? "All cells" : "전체 셀"}</option>
              {Array.from({ length: colCount }, (_, i) => (
                <option key={i} value={i}>
                  {en ? `Column ${i + 1} only` : `${i + 1}열만`}
                </option>
              ))}
            </select>
          </span>
        )}
      </div>
    </section>
  );
}

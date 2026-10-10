"use client";

import { useRef } from "react";
import type { ColumnSelect } from "@/types";
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
}

const PLACEHOLDER = `엑셀이나 텍스트 데이터를 여기에 붙여넣으세요.

예:
A-10234
A-10235
A-10236`;

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
  placeholder = PLACEHOLDER,
}: Props) {
  const gutterRef = useRef<HTMLPreElement>(null);
  const lineCount = value === "" ? 1 : value.split("\n").length;
  // 줄 번호는 문자열 하나로 그린다 — 5만 줄이어도 DOM 노드는 하나.
  const gutter = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");
  const multiColumn = colCount > 1;

  return (
    <section className={`${styles.pane} ${styles.inputPane}`} aria-labelledby="input-label">
      <div className={styles.paneHead}>
        <label id="input-label" htmlFor="source" className={styles.paneTitle}>
          원본 데이터
        </label>
        <div className={styles.paneActions}>
          <button type="button" className={styles.ghost} onClick={onSample}>
            샘플 넣기
          </button>
          <button type="button" className={styles.ghost} onClick={onClear} disabled={value === ""}>
            지우기
          </button>
        </div>
      </div>

      <div className={styles.editor}>
        <pre ref={gutterRef} className={styles.gutter} aria-hidden="true">
          {gutter}
        </pre>
        <textarea
          id="source"
          className={styles.code}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={(e) => {
            if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
          }}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          wrap="off"
        />
      </div>

      <div className={styles.status}>
        <span>
          {onColumnChange || colCount <= 1
            ? `${fmt(rowCount)}행 · ${fmt(value.length)}자`
            : `${fmt(rowCount)}행 × ${fmt(colCount)}열 · ${fmt(value.length)}자`}
        </span>
        {multiColumn && onColumnChange && (
          <span className={styles.statusNotice}>
            {fmt(rowCount)}행 × {colCount}열 감지
            <select
              aria-label="변환할 열"
              className={styles.statusSelect}
              value={String(column)}
              onChange={(e) =>
                onColumnChange(e.target.value === "all" ? "all" : Number(e.target.value))
              }
            >
              <option value="all">전체 셀</option>
              {Array.from({ length: colCount }, (_, i) => (
                <option key={i} value={i}>
                  {i + 1}열만
                </option>
              ))}
            </select>
          </span>
        )}
      </div>
    </section>
  );
}

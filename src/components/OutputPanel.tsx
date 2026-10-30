"use client";

import { useRef } from "react";
import { useLocale } from "@/i18n/locale";
import type { TransformStats } from "@/types";
import styles from "./tool.module.css";

interface Props {
  value: string;
  stats: TransformStats;
  pending: boolean;
  modKey: string;
  onCopy: () => void;
  onResetOptions: () => void;
  /** 첫 변환 전 대기 상태 — 결과 대신 안내를 보여 준다 */
  waiting?: boolean;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

export function OutputPanel({ value, stats, pending, modKey, onCopy, onResetOptions, waiting }: Props) {
  const en = useLocale() === "en";
  const ref = useRef<HTMLTextAreaElement>(null);

  const selectAll = () => {
    ref.current?.focus();
    ref.current?.select();
  };

  const removed: string[] = [];
  if (stats.removedDuplicates > 0) removed.push(en ? `${fmt(stats.removedDuplicates)} duplicates` : `중복 ${fmt(stats.removedDuplicates)}`);
  if (stats.removedEmpty > 0) removed.push(en ? `${fmt(stats.removedEmpty)} empty` : `빈 칸 ${fmt(stats.removedEmpty)}`);

  return (
    <section className={`${styles.pane} ${styles.outputPane}`} aria-labelledby="output-label">
      <div className={styles.paneHead}>
        <label id="output-label" htmlFor="result" className={styles.paneTitle}>
          {en ? "Result" : "변환 결과"}
        </label>
        <div className={styles.paneActions}>
          <button type="button" className={styles.ghost} onClick={onResetOptions}>
            {en ? "Reset options" : "옵션 초기화"}
          </button>
          <button type="button" className={styles.ghost} onClick={selectAll} disabled={!value}>
            {en ? "Select all" : "전체 선택"}
          </button>
          <button type="button" className={styles.primary} onClick={onCopy} disabled={!value}>
            {en ? "Copy" : "복사"}
            <kbd className={styles.kbd}>{modKey}↵</kbd>
          </button>
        </div>
      </div>

      <div className={styles.editor} data-pending={pending || undefined}>
        <textarea
          ref={ref}
          id="result"
          className={`${styles.code} ${styles.codeWrap}`}
          value={value}
          readOnly
          placeholder={
            en
              ? "Paste source data and the result appears here."
              : waiting
                ? "‘변환하기’를 누르면 결과가 여기에 표시됩니다."
                : "원본 데이터를 붙여넣으면 변환 결과가 여기에 바로 표시됩니다."
          }
          spellCheck={false}
        />
      </div>

      <div className={styles.status} aria-live="polite">
        {waiting ? (
          <span>변환 대기 중</span>
        ) : (
          <>
            <span>
              {en
                ? `${fmt(stats.outputCount)} items · ${fmt(value.length)} chars`
                : `${fmt(stats.outputCount)}개 항목 · ${fmt(value.length)}자`}
            </span>
            {removed.length > 0 && <span>{en ? `${removed.join(" · ")} removed` : `${removed.join(" · ")} 제거됨`}</span>}
          </>
        )}
      </div>
    </section>
  );
}

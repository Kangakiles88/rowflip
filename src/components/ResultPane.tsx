"use client";

import type { ReactNode } from "react";
import styles from "./tool.module.css";

interface Props {
  title: string;
  /** 텍스트 결과. children을 주면 textarea 대신 children을 그린다 */
  value?: string;
  children?: ReactNode;
  waiting: boolean;
  pending: boolean;
  modKey: string;
  onCopy: () => void;
  canCopy: boolean;
  /** 결과 머리에 붙는 추가 버튼(보기 전환 등) */
  actions?: ReactNode;
  /** 하단 상태 표시줄 */
  status: ReactNode;
  placeholder: string;
  /** 긴 줄을 줄바꿈해서 보여 줄지 */
  wrap?: boolean;
  /** 주 버튼 이름 — 기본 '복사' (상장 만들기는 '인쇄·PDF 저장') */
  primaryLabel?: string;
}

/** 결과 창 — 제목·복사 버튼·결과·상태 표시줄. 첫 변환 전에는 결과를 비우고 안내만 보여 준다. */
export function ResultPane({
  title,
  value = "",
  children,
  waiting,
  pending,
  modKey,
  onCopy,
  canCopy,
  actions,
  status,
  placeholder,
  wrap = true,
  primaryLabel = "복사",
}: Props) {
  return (
    <section className={`${styles.pane} ${styles.outputPane}`} aria-labelledby="result-title">
      <div className={styles.paneHead}>
        <label id="result-title" htmlFor="result" className={styles.paneTitle}>
          {title}
        </label>
        <div className={styles.paneActions}>
          {actions}
          <button type="button" className={styles.primary} onClick={onCopy} disabled={!canCopy}>
            {primaryLabel}
            <kbd className={styles.kbd}>{modKey}↵</kbd>
          </button>
        </div>
      </div>

      <div className={styles.editor} data-pending={pending || undefined}>
        {waiting ? (
          <textarea
            id="result"
            className={`${styles.code} ${styles.codeWrap}`}
            value=""
            readOnly
            placeholder="‘변환하기’를 누르면 결과가 여기에 표시됩니다."
          />
        ) : children ? (
          children
        ) : (
          <textarea
            id="result"
            className={`${styles.code} ${wrap ? styles.codeWrap : ""}`}
            value={value}
            readOnly
            wrap={wrap ? "soft" : "off"}
            spellCheck={false}
            placeholder={placeholder}
          />
        )}
      </div>

      <div className={styles.status} aria-live="polite">
        {waiting ? <span>변환 대기 중</span> : status}
      </div>
    </section>
  );
}

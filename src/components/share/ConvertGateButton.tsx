"use client";

import { shareConfig } from "@/config/share";
import styles from "../tool.module.css";

interface Props {
  disabled: boolean;
  onClick: () => void;
}

/** 원본과 결과 사이에 처음 한 번만 나오는 [변환하기] 버튼 */
export function ConvertGateButton({ disabled, onClick }: Props) {
  return (
    <div className={styles.areaGate}>
      <button
        type="button"
        className={styles.gateButton}
        disabled={disabled}
        onClick={onClick}
        title={disabled ? "원본을 붙여넣으면 누를 수 있습니다" : undefined}
      >
        <span>{shareConfig.buttonLabel}</span>
        <span className={styles.gateArrow} aria-hidden="true" />
      </button>
      {disabled ? (
        <span className={styles.gateHint}>원본을 붙여넣으면 누를 수 있습니다</span>
      ) : (
        <span className={styles.gateNote}>{shareConfig.buttonNote}</span>
      )}
    </div>
  );
}

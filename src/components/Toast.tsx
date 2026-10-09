"use client";

import styles from "./tool.module.css";

export function Toast({ message }: { message: string | null }) {
  return (
    <div className={styles.toastRegion} role="status" aria-live="polite">
      {message && <div className={styles.toast}>{message}</div>}
    </div>
  );
}

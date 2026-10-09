"use client";

import { PRESETS } from "@/utils/presets";
import styles from "./tool.module.css";

interface Props {
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function PresetButtons({ activeId, onSelect }: Props) {
  return (
    <div className={styles.presets}>
      <span className={styles.presetsLabel}>빠른 변환</span>
      <div className={styles.presetList}>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={styles.preset}
            aria-pressed={activeId === p.id}
            title={p.example}
            onClick={() => onSelect(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

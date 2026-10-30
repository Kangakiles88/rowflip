"use client";

import { useLocale } from "@/i18n/locale";
import { PRESETS } from "@/utils/presets";
import styles from "./tool.module.css";

interface Props {
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function PresetButtons({ activeId, onSelect }: Props) {
  const en = useLocale() === "en";
  return (
    <div className={styles.presets}>
      <span className={styles.presetsLabel}>{en ? "Quick convert" : "빠른 변환"}</span>
      <div className={styles.presetList}>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={styles.preset}
            aria-pressed={activeId === p.id}
            title={en ? p.en.example : p.example}
            onClick={() => onSelect(p.id)}
          >
            {en ? p.en.label : p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

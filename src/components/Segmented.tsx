"use client";

import styles from "./tool.module.css";

interface Option<T extends string> {
  value: T;
  label: string;
  title?: string;
}

interface Props<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function Segmented<T extends string>({ label, value, options, onChange, disabled }: Props<T>) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label={label} aria-disabled={disabled}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          disabled={disabled}
          className={styles.segment}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

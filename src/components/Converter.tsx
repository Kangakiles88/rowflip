"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { TransformOptions } from "@/types";
import { DEFAULT_OPTIONS, PRESETS, SAMPLE_INPUT } from "@/utils/presets";
import { loadSettings, saveSettings } from "@/utils/storage";
import { transform } from "@/utils/transformer";
import { CleanupOptions } from "./CleanupOptions";
import { InputPanel } from "./InputPanel";
import { OutputOptions } from "./OutputOptions";
import { OutputPanel } from "./OutputPanel";
import { PresetButtons } from "./PresetButtons";
import { Toast } from "./Toast";
import styles from "./tool.module.css";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 클립보드 API가 막힌 환경용 대체 경로
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function Converter() {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<TransformOptions>(DEFAULT_OPTIONS);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [modKey, setModKey] = useState("Ctrl");
  const loaded = useRef(false);
  const prefixRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // 저장된 UI 설정 복원 (데이터는 저장하지 않음) — 서버 렌더와 맞추려고 마운트 후에 읽는다.
  useEffect(() => {
    const saved = loadSettings();
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 전용 값을 마운트 후 1회 반영
    setOptions((o) => ({ ...o, ...saved }));
    setModKey(isMac ? "⌘" : "Ctrl");
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (loaded.current) saveSettings(options);
  }, [options]);

  // 큰 데이터를 붙여넣어도 입력이 끊기지 않도록 변환은 한 박자 늦게 따라온다.
  const deferredInput = useDeferredValue(input);
  const result = useMemo(() => transform(deferredInput, options), [deferredInput, options]);
  const pending = deferredInput !== input;

  const update = useCallback((patch: Partial<TransformOptions>) => {
    setOptions((o) => ({ ...o, ...patch }));
    setActivePreset(null);
  }, []);

  const applyPreset = (id: string) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setOptions((o) => preset.apply(o));
    setActivePreset(id);
    if (id === "url") requestAnimationFrame(() => prefixRef.current?.select());
  };

  const showToast = useCallback((message: string) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 1500);
  }, []);

  const copy = useCallback(async () => {
    if (!result.output) return;
    const ok = await copyText(result.output);
    showToast(ok ? "복사되었습니다." : "복사하지 못했습니다. 결과를 직접 선택해 주세요.");
  }, [result.output, showToast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void copy();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copy]);

  return (
    <div className={styles.tool}>
      <div className={styles.areaPresets}>
        <PresetButtons activeId={activePreset} onSelect={applyPreset} />
      </div>

      <div className={styles.areaInput}>
        <InputPanel
          value={input}
          onChange={setInput}
          onSample={() => setInput(SAMPLE_INPUT)}
          onClear={() => setInput("")}
          rowCount={result.stats.rowCount}
          colCount={result.stats.colCount}
          column={options.column}
          onColumnChange={(column) => update({ column })}
        />
      </div>

      <div className={styles.areaOutput}>
        <OutputPanel
          value={result.output}
          stats={result.stats}
          pending={pending}
          modKey={modKey}
          onCopy={copy}
          onResetOptions={() => {
            setOptions(DEFAULT_OPTIONS);
            setActivePreset(null);
          }}
        />
      </div>

      <div className={`${styles.areaOptions} ${styles.options}`}>
        <CleanupOptions options={options} update={update} />
        <OutputOptions options={options} update={update} prefixRef={prefixRef} />
      </div>

      <Toast message={toast} />
    </div>
  );
}

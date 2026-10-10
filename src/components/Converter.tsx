"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { TransformOptions } from "@/types";
import { copyText } from "@/utils/clipboard";
import { DEFAULT_OPTIONS, PRESETS, SAMPLE_INPUT } from "@/utils/presets";
import { loadSettings, saveSettings } from "@/utils/storage";
import { extractCells, parseTable } from "@/utils/parser";
import { splitForSingleCell } from "@/utils/split";
import { transform } from "@/utils/transformer";
import { CleanupOptions } from "./CleanupOptions";
import { InputPanel } from "./InputPanel";
import { OutputOptions } from "./OutputOptions";
import { OutputPanel } from "./OutputPanel";
import { PresetButtons } from "./PresetButtons";
import { ConvertGateButton } from "./share/ConvertGateButton";
import { ShareDialog } from "./share/ShareDialog";
import { useConvertGate } from "./share/useConvertGate";
import { Toast } from "./Toast";
import styles from "./tool.module.css";

export function Converter() {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<TransformOptions>(DEFAULT_OPTIONS);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [modKey, setModKey] = useState("Ctrl");
  const loaded = useRef(false);
  const prefixRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const gate = useConvertGate();
  const [shareOpen, setShareOpen] = useState(false);

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
    // 값이 한 칸뿐인데 '세로로'·'가로로'를 누르면 돌릴 것이 없으니, 그 칸을 쉼표·띄어쓰기로 나눈다
    const turn = id === "vertical" || id === "horizontal";
    const autoSplit =
      turn && options.inputSplit === "cells" ? splitForSingleCell(extractCells(parseTable(input), "all")) : null;
    setOptions((o) => ({ ...preset.apply(o), ...(autoSplit ? { inputSplit: autoSplit } : {}) }));
    setActivePreset(id);
    if (id === "url") requestAnimationFrame(() => prefixRef.current?.select());
  };

  const showToast = useCallback((message: string) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 1500);
  }, []);

  const hasInput = input.trim() !== "";
  const startConvert = useCallback(() => {
    if (!hasInput) return;
    gate.unlock();
    setShareOpen(true);
  }, [hasInput, gate]);

  const copy = useCallback(async () => {
    if (gate.locked) {
      startConvert();
      return;
    }
    if (!result.output) return;
    const ok = await copyText(result.output);
    showToast(ok ? "복사되었습니다." : "복사하지 못했습니다. 결과를 직접 선택해 주세요.");
  }, [gate.locked, startConvert, result.output, showToast]);

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
    <div className={`${styles.tool} ${gate.locked ? styles.toolGated : ""}`}>
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
          split={options.inputSplit}
          onSplitChange={(inputSplit) =>
            // 쉼표로 나눈 뒤 다시 쉼표로 이으면 결과가 그대로라 세로 목록으로 바꿔 준다
            update(
              inputSplit === "comma" &&
                options.format === "list" &&
                (options.separator === "comma" || options.separator === "comma-space")
                ? { inputSplit, separator: "newline" }
                : { inputSplit },
            )
          }
          splitSuggestion={result.suggestedSplit}
        />
      </div>

      {gate.locked && <ConvertGateButton disabled={!hasInput} onClick={startConvert} />}

      <div className={styles.areaOutput}>
        <OutputPanel
          waiting={gate.locked}
          value={gate.locked ? "" : result.output}
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
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        path="/"
        summary={`${result.stats.outputCount.toLocaleString("ko-KR")}개 항목`}
      />
    </div>
  );
}

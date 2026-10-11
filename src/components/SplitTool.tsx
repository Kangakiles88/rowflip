"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { Separator, TransformOptions } from "@/types";
import { copyText } from "@/utils/clipboard";
import { DEFAULT_OPTIONS } from "@/utils/presets";
import { INPUT_SPLITS, type InputSplit } from "@/utils/split";
import { transform } from "@/utils/transformer";
import { InputPanel } from "./InputPanel";
import { OutputPanel } from "./OutputPanel";
import { Segmented } from "./Segmented";
import { ConvertGateButton } from "./share/ConvertGateButton";
import { ShareDialog } from "./share/ShareDialog";
import { useConvertGate } from "./share/useConvertGate";
import { Toast } from "./Toast";
import styles from "./tool.module.css";

const STORAGE_KEY = "rowflip:split:v1";
/** 브라우저에 기억하는 설정 — 직접 입력한 구분자는 저장하지 않는다 */
/** 괄호·따옴표 벗기기는 저장하지 않고 늘 켠 채로 시작한다 — 괄호·따옴표가 없는 목록에는 영향이 없다 */
const STORED = ["inputSplit", "separator", "trim", "removeEmpty", "dedupe"] as const;

export const SPLIT_DEFAULTS: TransformOptions = {
  ...DEFAULT_OPTIONS,
  inputSplit: "comma",
  separator: "newline",
  unwrap: true,
};

const SPLIT_SAMPLE = "A-10234, A-10235, A-10236, B-20001, A-10235";

const SPLITS = INPUT_SPLITS.filter((s) => s.value !== "cells").map((s) => ({ value: s.value, label: s.short }));

const SHAPES: { value: Extract<Separator, "newline" | "tab">; label: string }[] = [
  { value: "newline", label: "세로 (줄바꿈)" },
  { value: "tab", label: "가로 (엑셀 한 행)" },
];

const SHAPE_HINT = {
  newline: "한 줄에 하나씩 나옵니다. 엑셀 칸 하나에 붙여넣으면 아래로 한 칸씩 들어갑니다.",
  tab: "탭으로 이어집니다. 엑셀 칸 하나에 붙여넣으면 오른쪽으로 한 칸씩 들어갑니다.",
} as const;

export function SplitTool() {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<TransformOptions>(SPLIT_DEFAULTS);
  const [toast, setToast] = useState<string | null>(null);
  const [modKey, setModKey] = useState("Ctrl");
  const loaded = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const gate = useConvertGate();
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const saved: Partial<TransformOptions> = {};
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      for (const k of STORED) {
        if (typeof parsed[k] === typeof SPLIT_DEFAULTS[k]) Object.assign(saved, { [k]: parsed[k] });
      }
      if (!SPLITS.some((s) => s.value === saved.inputSplit)) delete saved.inputSplit;
      if (!SHAPES.some((s) => s.value === saved.separator)) delete saved.separator;
    } catch {
      /* 무시 */
    }
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 전용 값을 마운트 후 1회 반영
    setOptions((o) => ({ ...o, ...saved }));
    setModKey(isMac ? "⌘" : "Ctrl");
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      const out: Record<string, unknown> = {};
      for (const k of STORED) out[k] = options[k];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
    } catch {
      /* 무시 */
    }
  }, [options]);

  const deferredInput = useDeferredValue(input);
  const result = useMemo(() => transform(deferredInput, options), [deferredInput, options]);
  const pending = deferredInput !== input;
  const update = (patch: Partial<TransformOptions>) => setOptions((o) => ({ ...o, ...patch }));

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
    clearTimeout(toastTimer.current);
    setToast(ok ? "복사되었습니다." : "복사하지 못했습니다. 결과를 직접 선택해 주세요.");
    toastTimer.current = setTimeout(() => setToast(null), 1500);
  }, [gate.locked, startConvert, result.output]);

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

  const shape = options.separator === "tab" ? "tab" : "newline";

  return (
    <div className={`${styles.tool} ${styles.toolTranspose} ${gate.locked ? styles.toolGated : ""}`}>
      <div className={styles.areaInput}>
        <InputPanel
          value={input}
          onChange={setInput}
          onSample={() => setInput(SPLIT_SAMPLE)}
          onClear={() => setInput("")}
          rowCount={result.stats.rowCount}
          colCount={1}
          placeholder={"쉼표나 띄어쓰기로 이어진 목록을 붙여넣으세요.\n\n예:\nA-10234, A-10235, A-10236"}
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
          onResetOptions={() => setOptions(SPLIT_DEFAULTS)}
        />
      </div>

      <div className={`${styles.areaOptions} ${styles.options} ${styles.optionsSplit}`}>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>나눌 기준</legend>
          <Segmented
            label="나눌 기준"
            value={options.inputSplit}
            options={SPLITS}
            onChange={(inputSplit: InputSplit) => update({ inputSplit })}
          />
          {options.inputSplit === "custom" && (
            <input
              className={`${styles.input} ${styles.mono}`}
              aria-label="나눌 문자"
              placeholder="나눌 문자 (예: ::)"
              value={options.inputCustom}
              onChange={(e) => update({ inputCustom: e.target.value })}
            />
          )}
          <p className={styles.hint}>줄바꿈과 탭은 항상 나눕니다. 큰따옴표로 감싼 값 안의 쉼표는 나누지 않습니다.</p>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>결과 모양</legend>
          <Segmented label="결과 모양" value={shape} options={SHAPES} onChange={(separator) => update({ separator })} />
          <p className={styles.hint}>{SHAPE_HINT[shape]}</p>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>정리</legend>
          <label className={styles.check}>
            <input type="checkbox" checked={options.trim} onChange={(e) => update({ trim: e.target.checked })} />
            앞뒤 공백 제거
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={options.removeEmpty}
              onChange={(e) => update({ removeEmpty: e.target.checked })}
            />
            빈 항목 제거
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={options.dedupe} onChange={(e) => update({ dedupe: e.target.checked })} />
            중복 제거
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={options.unwrap} onChange={(e) => update({ unwrap: e.target.checked })} />
            괄호·따옴표 벗기기
          </label>
        </fieldset>
      </div>

      <Toast message={toast} />
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        path="/split/"
        summary={`${result.stats.outputCount.toLocaleString("ko-KR")}개 항목`}
      />
    </div>
  );
}

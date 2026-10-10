"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { copyText } from "@/utils/clipboard";
import {
  DEDUPE_SAMPLE,
  DEFAULT_DEDUPE_OPTIONS,
  dedupeText,
  looksLikeHeader,
  type DedupeKeep,
  type DedupeMode,
  type DedupeOptions,
} from "@/utils/dedupe";
import { parseTable } from "@/utils/parser";
import { InputPanel } from "./InputPanel";
import { Segmented } from "./Segmented";
import { SheetPreview } from "./SheetPreview";
import { ConvertGateButton } from "./share/ConvertGateButton";
import { ShareDialog } from "./share/ShareDialog";
import { useConvertGate } from "./share/useConvertGate";
import { Toast } from "./Toast";
import styles from "./tool.module.css";

const STORAGE_KEY = "rowflip:dedupe:v1";
const PREVIEW_ROWS = 200;
const PREVIEW_COLS = 40;
/** 브라우저에 기억하는 설정 — 비교 기준 열·머리글처럼 데이터에 따라 달라지는 값은 저장하지 않는다 */
const STORED: (keyof DedupeOptions)[] = [
  "mode",
  "keep",
  "trim",
  "ignoreCase",
  "removeEmpty",
];

const MODES: { value: DedupeMode; label: string; title: string }[] = [
  { value: "unique", label: "중복 제거", title: "같은 값은 하나만 남긴다" },
  {
    value: "duplicates",
    label: "중복된 값만",
    title: "두 번 이상 나온 값만 한 번씩",
  },
  { value: "count", label: "개수 세기", title: "값마다 몇 번 나왔는지" },
];

const MODE_HINT: Record<DedupeMode, string> = {
  unique:
    "같은 값이 여러 번 나오면 하나만 남깁니다. 남은 행은 원래 순서를 유지합니다.",
  duplicates:
    "두 번 이상 나온 값만 한 번씩 보여 줍니다. 어떤 값이 겹치는지 확인할 때 씁니다.",
  count: "값마다 나온 횟수를 오른쪽 열에 붙이고, 많이 나온 순으로 정렬합니다.",
};

const KEEPS: { value: DedupeKeep; label: string }[] = [
  { value: "first", label: "처음 나온 행" },
  { value: "last", label: "마지막 행" },
];

const fmt = (n: number) => n.toLocaleString("ko-KR");

export function DedupeTool() {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<DedupeOptions>(DEFAULT_DEDUPE_OPTIONS);
  const [toast, setToast] = useState<string | null>(null);
  const [modKey, setModKey] = useState("Ctrl");
  const loaded = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const gate = useConvertGate();
  const [shareOpen, setShareOpen] = useState(false);
  const [headerChoice, setHeaderChoice] = useState<{
    sig: string;
    value: boolean;
  } | null>(null);
  const [view, setView] = useState<"table" | "text">("table");

  useEffect(() => {
    const saved: Partial<DedupeOptions> = {};
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      for (const k of STORED) {
        if (typeof parsed[k] === typeof DEFAULT_DEDUPE_OPTIONS[k])
          Object.assign(saved, { [k]: parsed[k] });
      }
      if (!MODES.some((m) => m.value === saved.mode)) delete saved.mode;
      if (saved.keep !== "first" && saved.keep !== "last") delete saved.keep;
    } catch {
      /* 무시 */
    }
    const isMac = /Mac|iPhone|iPad/.test(
      navigator.platform || navigator.userAgent,
    );
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
  const pending = deferredInput !== input;

  // 열 수와 머리글 이름 — 비교 기준 선택에 쓴다
  const table = useMemo(() => parseTable(deferredInput), [deferredInput]);
  const colCount = table.rowCount === 1 ? 1 : table.colCount;
  const key =
    typeof options.key === "number" && options.key >= colCount
      ? "row"
      : options.key;

  // 머리글: 새 표를 붙여넣으면 자동으로 추측하고, 사용자가 체크박스를 바꾸면 그 표에서는 그 선택을 따른다
  const firstLine = table.rows[0]?.join("\t") ?? "";
  const guessedHeader = useMemo(() => looksLikeHeader(table.rows), [table]);
  const manualHeader =
    headerChoice?.sig === firstLine ? headerChoice.value : null;
  const header = colCount > 1 && (manualHeader ?? guessedHeader);

  const effective = useMemo(
    () => ({ ...options, key, header }),
    [options, key, header],
  );

  const result = useMemo(
    () => dedupeText(deferredInput, effective),
    [deferredInput, effective],
  );
  const update = (patch: Partial<DedupeOptions>) =>
    setOptions((o) => ({ ...o, ...patch }));

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
    setToast(
      ok
        ? "복사되었습니다."
        : "복사하지 못했습니다. 결과를 직접 선택해 복사해 주세요.",
    );
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

  const output = gate.locked ? "" : result.output;
  const { stats } = result;
  const head = header ? table.rows[0] : undefined;
  const tableResult = !gate.locked && (result.rows[0]?.length ?? 0) > 1;
  const showTable = tableResult && view === "table";
  const columnName = (i: number) => {
    const name = head?.[i]?.trim();
    return name
      ? `${i + 1}열 · ${name.length > 14 ? `${name.slice(0, 14)}…` : name}`
      : `${i + 1}열`;
  };

  const unit = colCount > 1 ? "행" : "개";
  let summary = `0${unit}`;
  if (gate.locked) summary = "변환 대기 중";
  else if (stats.total > 0) {
    if (options.mode === "unique")
      summary = `${fmt(stats.total)}${unit} → ${fmt(stats.unique)}${unit} · 중복 ${fmt(stats.removed)}${unit} 제거`;
    else if (options.mode === "duplicates")
      summary =
        stats.duplicateValues > 0
          ? `중복된 값 ${fmt(stats.duplicateValues)}개`
          : "중복된 값이 없습니다";
    else
      summary = `${fmt(stats.total)}${unit} 중 서로 다른 값 ${fmt(stats.unique)}개`;
  }

  return (
    <div
      className={`${styles.tool} ${styles.toolTranspose} ${gate.locked ? styles.toolGated : ""}`}
    >
      <div className={styles.areaInput}>
        <InputPanel
          value={input}
          onChange={setInput}
          onSample={() => setInput(DEDUPE_SAMPLE)}
          onClear={() => setInput("")}
          rowCount={table.rowCount}
          colCount={table.colCount}
          placeholder={
            "중복을 찾을 목록이나 표를 붙여넣으세요.\n\n예:\nA-10234\nA-10235\nA-10234"
          }
        />
      </div>

      {gate.locked && (
        <ConvertGateButton disabled={!hasInput} onClick={startConvert} />
      )}

      <div className={styles.areaOutput}>
        <section
          className={`${styles.pane} ${styles.outputPane}`}
          aria-labelledby="dedupe-output"
        >
          <div className={styles.paneHead}>
            <label
              id="dedupe-output"
              htmlFor="result"
              className={styles.paneTitle}
            >
              {MODES.find((m) => m.value === options.mode)?.label} 결과
            </label>
            <div className={styles.paneActions}>
              {tableResult && (
                <Segmented
                  label="결과 보기 방식"
                  value={view}
                  options={[
                    { value: "table", label: "표" },
                    { value: "text", label: "텍스트" },
                  ]}
                  onChange={setView}
                />
              )}
              <button
                type="button"
                className={styles.primary}
                onClick={copy}
                disabled={!output}
              >
                복사
                <kbd className={styles.kbd}>{modKey}↵</kbd>
              </button>
            </div>
          </div>

          <div className={styles.editor} data-pending={pending || undefined}>
            {showTable ? (
              <SheetPreview
                rows={result.rows}
                maxRows={PREVIEW_ROWS}
                maxCols={PREVIEW_COLS}
                headerRow={header}
              />
            ) : (
              <textarea
                id="result"
                className={styles.code}
                value={output}
                readOnly
                wrap="off"
                spellCheck={false}
                placeholder={
                  gate.locked
                    ? "‘변환하기’를 누르면 결과가 여기에 표시됩니다."
                    : "원본을 붙여넣으면 중복을 정리한 결과가 여기에 표시됩니다."
                }
              />
            )}
          </div>

          <div className={styles.status} aria-live="polite">
            <span>{summary}</span>
            {!gate.locked && stats.emptyRemoved > 0 && (
              <span>빈 칸 {fmt(stats.emptyRemoved)}개 제외</span>
            )}
            {showTable && result.rows.length > PREVIEW_ROWS && (
              <span>미리보기는 {PREVIEW_ROWS}행까지 · 복사는 전체</span>
            )}
          </div>
        </section>
      </div>

      <div
        className={`${styles.areaOptions} ${styles.options} ${colCount > 1 ? styles.optionsDedupe : styles.optionsDedupe3}`}
      >
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>결과</legend>
          <Segmented
            label="결과"
            value={options.mode}
            options={MODES}
            onChange={(mode) => update({ mode })}
          />
          <p className={styles.hint}>{MODE_HINT[options.mode]}</p>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>비교 기준</legend>
          {colCount > 1 ? (
            <>
              <select
                aria-label="비교 기준"
                className={`${styles.select} ${styles.selectFull}`}
                value={String(key)}
                onChange={(e) =>
                  update({
                    key:
                      e.target.value === "row" ? "row" : Number(e.target.value),
                  })
                }
              >
                <option value="row">행 전체가 같을 때</option>
                {Array.from({ length: colCount }, (_, i) => (
                  <option key={i} value={i}>
                    {columnName(i)} 값이 같을 때
                  </option>
                ))}
              </select>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={header}
                  onChange={(e) =>
                    setHeaderChoice({ sig: firstLine, value: e.target.checked })
                  }
                />
                첫 행은 머리글
              </label>
              {manualHeader === null && guessedHeader && (
                <p className={styles.hint}>
                  첫 행이 제목처럼 보여 비교에서 뺐습니다.
                </p>
              )}
            </>
          ) : (
            <p className={styles.hint}>
              한 열짜리 목록은 값 전체를 비교합니다. 여러 열을 붙여넣으면 기준
              열을 고를 수 있습니다.
            </p>
          )}
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>비교 방법</legend>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={options.trim}
              onChange={(e) => update({ trim: e.target.checked })}
            />
            앞뒤 공백 무시
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={options.ignoreCase}
              onChange={(e) => update({ ignoreCase: e.target.checked })}
            />
            대소문자 무시
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={options.removeEmpty}
              onChange={(e) => update({ removeEmpty: e.target.checked })}
            />
            빈 칸 제외
          </label>
        </fieldset>

        {colCount > 1 && (
          <fieldset className={styles.group}>
            <legend className={styles.groupTitle}>남길 행</legend>
            <Segmented
              label="남길 행"
              value={options.keep}
              options={KEEPS}
              onChange={(keep) => update({ keep })}
            />
            <p className={styles.hint}>
              {options.keep === "first"
                ? "같은 값 중 처음 나온 행을 남깁니다."
                : "같은 값 중 마지막에 나온 행을 남깁니다. 최신 기록을 남길 때 씁니다."}
            </p>
          </fieldset>
        )}
      </div>

      <Toast message={toast} />
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        path="/dedupe/"
        summary={
          options.mode === "unique"
            ? `중복 ${fmt(stats.removed)}개 제거`
            : `서로 다른 값 ${fmt(stats.unique)}개`
        }
      />
    </div>
  );
}

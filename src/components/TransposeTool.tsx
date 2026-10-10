"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { copyText } from "@/utils/clipboard";
import {
  DEFAULT_TRANSPOSE_OPTIONS,
  TRANSPOSE_SAMPLE,
  transposeText,
  type TableFormat,
  type TransposeOptions,
} from "@/utils/transpose";
import { InputPanel } from "./InputPanel";
import { Segmented } from "./Segmented";
import { ConvertGateButton } from "./share/ConvertGateButton";
import { ShareDialog } from "./share/ShareDialog";
import { useConvertGate } from "./share/useConvertGate";
import { Toast } from "./Toast";
import styles from "./tool.module.css";

const PREVIEW_ROWS = 200;
const PREVIEW_COLS = 40;
const STORAGE_KEY = "rowflip:transpose:v1";

const FORMATS: { value: TableFormat; label: string; title: string }[] = [
  { value: "excel", label: "엑셀 붙여넣기", title: "탭으로 구분 — 엑셀·구글 시트에 그대로 붙여넣기" },
  { value: "csv", label: "CSV", title: "쉼표로 구분된 값" },
  { value: "markdown", label: "마크다운 표", title: "첫 행을 머리글로 쓰는 표" },
];

const FORMAT_HINT: Record<TableFormat, string> = {
  excel: "엑셀이나 구글 시트에서 시작할 칸 하나를 선택하고 붙여넣으면 표 모양 그대로 들어갑니다.",
  csv: "쉼표·따옴표·줄바꿈이 든 셀은 큰따옴표로 감쌉니다.",
  markdown: "첫 행이 머리글이 됩니다. 노션, 깃허브, 블로그 에디터에 붙여넣을 수 있습니다.",
};

const fmt = (n: number) => n.toLocaleString("ko-KR");

export function TransposeTool() {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<TransposeOptions>(DEFAULT_TRANSPOSE_OPTIONS);
  const [view, setView] = useState<"table" | "text">("table");
  const [toast, setToast] = useState<string | null>(null);
  const [modKey, setModKey] = useState("Ctrl");
  const loaded = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const gate = useConvertGate();
  const [shareOpen, setShareOpen] = useState(false);

  // 결과 형식만 기억한다 (데이터는 저장하지 않음)
  useEffect(() => {
    let saved: Partial<TransposeOptions> = {};
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as { format?: unknown }) : {};
      if (parsed.format === "excel" || parsed.format === "csv" || parsed.format === "markdown") {
        saved = { format: parsed.format };
      }
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
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ format: options.format }));
    } catch {
      /* 무시 */
    }
  }, [options.format]);

  const deferredInput = useDeferredValue(input);
  const result = useMemo(() => transposeText(deferredInput, options), [deferredInput, options]);
  const pending = deferredInput !== input;
  const update = (patch: Partial<TransposeOptions>) => setOptions((o) => ({ ...o, ...patch }));

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
    setToast(ok ? "복사되었습니다." : "복사하지 못했습니다. 텍스트 보기에서 직접 선택해 주세요.");
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

  const { before, after } = result;
  const rows = gate.locked ? [] : result.rows;
  const output = gate.locked ? "" : result.output;
  const shownRows = rows.slice(0, PREVIEW_ROWS);
  const clipped = rows.length > PREVIEW_ROWS || after.cols > PREVIEW_COLS;

  return (
    <div className={`${styles.tool} ${styles.toolTranspose} ${gate.locked ? styles.toolGated : ""}`}>
      <div className={styles.areaInput}>
        <InputPanel
          value={input}
          onChange={setInput}
          onSample={() => setInput(TRANSPOSE_SAMPLE)}
          onClear={() => setInput("")}
          rowCount={before.rows}
          colCount={before.cols}
          placeholder={"엑셀이나 구글 시트에서 표를 복사해 여기에 붙여넣으세요.\n\n행은 줄바꿈, 열은 탭으로 구분됩니다."}
        />
      </div>

      {gate.locked && <ConvertGateButton disabled={!hasInput} onClick={startConvert} />}

      <div className={styles.areaOutput}>
        <section className={`${styles.pane} ${styles.outputPane}`} aria-labelledby="transpose-output">
          <div className={styles.paneHead}>
            <span id="transpose-output" className={styles.paneTitle}>
              행열 바꾼 결과
            </span>
            <div className={styles.paneActions}>
              <Segmented
                label="결과 보기 방식"
                value={view}
                options={[
                  { value: "table", label: "표" },
                  { value: "text", label: "텍스트" },
                ]}
                onChange={setView}
              />
              <button type="button" className={styles.primary} onClick={copy} disabled={!output}>
                복사
                <kbd className={styles.kbd}>{modKey}↵</kbd>
              </button>
            </div>
          </div>

          <div className={styles.editor} data-pending={pending || undefined}>
            {view === "text" ? (
              <textarea
                ref={textRef}
                id="result"
                className={styles.code}
                value={output}
                readOnly
                wrap="off"
                spellCheck={false}
                placeholder={
                  gate.locked
                    ? "‘변환하기’를 누르면 결과가 여기에 표시됩니다."
                    : "원본 표를 붙여넣으면 행과 열이 바뀐 결과가 여기에 표시됩니다."
                }
              />
            ) : rows.length === 0 ? (
              <p className={styles.emptyNote}>
                {gate.locked
                  ? "‘변환하기’를 누르면 행과 열이 바뀐 표가 여기에 표시됩니다."
                  : "원본 표를 붙여넣으면 행과 열이 바뀐 표가 여기에 표시됩니다."}
              </p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.grid}>
                  <thead>
                    <tr>
                      <th aria-hidden="true" />
                      {shownRows[0].slice(0, PREVIEW_COLS).map((_, c) => (
                        <th key={c} scope="col">
                          {columnLetter(c)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shownRows.map((r, i) => (
                      <tr key={i}>
                        <th scope="row">{i + 1}</th>
                        {r.slice(0, PREVIEW_COLS).map((cell, c) => (
                          <td key={c}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className={styles.status} aria-live="polite">
            <span>
              {gate.locked
                ? "변환 대기 중"
                : before.rows > 0
                  ? `${fmt(before.rows)}행 × ${fmt(before.cols)}열 → ${fmt(after.rows)}행 × ${fmt(after.cols)}열`
                  : "0행 × 0열"}
            </span>
            {clipped && view === "table" && (
              <span>
                미리보기는 {PREVIEW_ROWS}행 × {PREVIEW_COLS}열까지 · 복사는 전체
              </span>
            )}
          </div>
        </section>
      </div>

      <div className={`${styles.areaOptions} ${styles.options} ${styles.optionsTranspose}`}>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>정리</legend>
          <label className={styles.check}>
            <input type="checkbox" checked={options.trim} onChange={(e) => update({ trim: e.target.checked })} />
            셀 앞뒤 공백 제거
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={options.removeEmptyRows}
              onChange={(e) => update({ removeEmptyRows: e.target.checked })}
            />
            빈 행 제거
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={options.removeEmptyCols}
              onChange={(e) => update({ removeEmptyCols: e.target.checked })}
            />
            빈 열 제거
          </label>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>복사할 형식</legend>
          <Segmented label="복사할 형식" value={options.format} options={FORMATS} onChange={(format) => update({ format })} />
          <p className={styles.hint}>{FORMAT_HINT[options.format]}</p>
        </fieldset>
      </div>

      <Toast message={toast} />
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        path="/transpose/"
        summary={`${fmt(after.rows)}행 × ${fmt(after.cols)}열`}
      />
    </div>
  );
}

/** 0 → A, 25 → Z, 26 → AA — 엑셀 열 이름 */
function columnLetter(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

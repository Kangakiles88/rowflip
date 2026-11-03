"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { copyText } from "@/utils/clipboard";
import { columnName, evaluateFormula, rangeLabel, sameResult, type CellRange } from "@/utils/formula";
import { parseAnyTable } from "@/utils/parser";
import { trackCopy } from "@/utils/tracking";
import styles from "./tool.module.css";
import fx from "./formula.module.css";
import { Toast } from "./Toast";
import { useCopyShortcut } from "./useToolBasics";

export interface LabExample {
  label: string;
  formula: string;
  note: string;
}

export interface LabTask {
  q: string;
  answer: string;
  /** 이 함수를 써야 정답으로 본다("IF|IFS"는 둘 중 하나) */
  mustUse: string[];
  hint: string;
}

export interface LabData {
  sheetTitle: string;
  sheet: string[][];
  /** 함수 형식 한 줄(예: =SUMIF(조건 범위, 조건, [더할 범위])) */
  syntax: string;
  defaultFormula: string;
  examples: LabExample[];
  tasks: LabTask[];
}

const MAX_ROWS = 200;
const MAX_COLS = 26;

type TaskState = { input: string; status: "idle" | "ok" | "bad" | "wrongFn"; message: string; shown: boolean };

/** 셀 강조용 — 수식이 가리키는 범위 안의 칸인지 */
function inRefs(refs: CellRange[], r: number, c: number): boolean {
  return refs.some((x) => r >= x.r1 && r <= x.r2 && c >= x.c1 && c <= x.c2);
}

/**
 * 함수 연습장 — 예제 표 + 수식 입력줄 + 결과 + 연습 문제.
 * 계산은 utils/formula.ts(브라우저 안 수식 엔진). 붙여넣은 표·입력한 수식은 저장하지 않는다.
 */
export function FormulaLab({ data }: { data: LabData }) {
  const [sheet, setSheet] = useState<string[][]>(data.sheet);
  const [custom, setCustom] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [formula, setFormula] = useState(data.defaultFormula);
  const [tasks, setTasks] = useState<TaskState[]>(() =>
    data.tasks.map(() => ({ input: "", status: "idle", message: "", shown: false })),
  );
  const [toast, setToast] = useState<string | null>(null);
  const [modKey, setModKey] = useState("Ctrl");
  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 전용 값을 마운트 후 1회 반영
    setModKey(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl");
  }, []);

  const deferred = useDeferredValue(formula);
  const result = useMemo(() => evaluateFormula(deferred, sheet), [deferred, sheet]);
  const isFormula = formula.trim().startsWith("=") || formula.trim().startsWith("＝");
  const shownRows = sheet.slice(0, MAX_ROWS);
  const width = Math.min(
    MAX_COLS,
    shownRows.reduce((m, r) => Math.max(m, r.length), 0),
  );
  const activeExample = data.examples.find((e) => e.formula === formula);

  const showToast = (m: string) => {
    clearTimeout(toastTimer.current);
    setToast(m);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  const copy = async () => {
    if (!formula.trim()) return;
    const ok = await copyText(formula.trim());
    if (ok) trackCopy();
    showToast(ok ? "수식을 복사했습니다. 엑셀 칸에 붙여넣으세요." : "복사하지 못했습니다. 수식을 직접 선택해 주세요.");
  };
  useCopyShortcut(() => void copy());

  /** 표의 칸을 누르면 입력줄 커서 자리에 그 칸 주소를 넣는다(엑셀에서 칸을 클릭하듯) */
  const insertAddress = (addr: string) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? formula.length;
    const end = el?.selectionEnd ?? formula.length;
    const base = formula === "" ? "=" : formula;
    const s = formula === "" ? 1 : start;
    const e = formula === "" ? 1 : end;
    const next = base.slice(0, s) + addr + base.slice(e);
    setFormula(next);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = s + addr.length;
      el?.setSelectionRange(pos, pos);
    });
  };

  const applyPaste = () => {
    const parsed = parseAnyTable(pasteText);
    if (parsed.rows.length === 0 || pasteText.trim() === "") {
      showToast("붙여넣은 표가 없습니다.");
      return;
    }
    setSheet(parsed.rows);
    setCustom(true);
    setPasting(false);
    setPasteText("");
    setFormula("=");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const resetSheet = () => {
    setSheet(data.sheet);
    setCustom(false);
    setPasting(false);
    setFormula(data.defaultFormula);
  };

  const checkTask = (i: number) => {
    setTasks((all) =>
      all.map((t, j) => {
        if (j !== i) return t;
        const src = t.input.trim();
        if (src === "") return { ...t, status: "idle", message: "" };
        if (!/^[=＝]/.test(src)) return { ...t, status: "bad", message: "수식은 =로 시작합니다." };
        const task = data.tasks[i];
        const mine = evaluateFormula(src, data.sheet);
        const answer = evaluateFormula(task.answer, data.sheet);
        if (!mine.ok) return { ...t, status: "bad", message: `${mine.code} — ${mine.message}` };
        if (!sameResult(mine, answer)) return { ...t, status: "bad", message: `결과가 ${mine.display || "빈 값"}입니다. ${task.hint}` };
        const missing = task.mustUse.filter((f) => !f.split("|").some((name) => mine.functions.includes(name)));
        if (missing.length > 0)
          return {
            ...t,
            status: "wrongFn",
            message: `값은 맞습니다. 이번에는 ${missing.map((f) => f.split("|").join("이나 ")).join("·")} 함수로 풀어 보세요.`,
          };
        const shown = typeof mine.value === "number" ? mine.value.toLocaleString("ko-KR", { maximumFractionDigits: 10 }) : mine.display;
        return { ...t, status: "ok", message: `정답입니다. 결과 ${shown}` };
      }),
    );
  };

  const setTask = (i: number, patch: Partial<TaskState>) =>
    setTasks((all) => all.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  const solved = tasks.filter((t) => t.status === "ok").length;

  return (
    <div className={`${styles.tool} ${styles.toolTranspose}`}>
      <div className={styles.areaInput}>
        <section className={styles.pane} aria-labelledby="lab-sheet-title">
          <div className={styles.paneHead}>
            <span id="lab-sheet-title" className={styles.paneTitle}>
              {custom ? "붙여넣은 표" : data.sheetTitle}
            </span>
            <div className={styles.paneActions}>
              {custom && (
                <button type="button" className={styles.ghost} onClick={resetSheet}>
                  예제 표로
                </button>
              )}
              <button type="button" className={styles.ghost} onClick={() => setPasting((p) => !p)} aria-expanded={pasting}>
                {pasting ? "붙여넣기 닫기" : "내 표 붙여넣기"}
              </button>
            </div>
          </div>
          <div className={styles.editor}>
            {pasting ? (
              <div className={fx.paste}>
                <textarea
                  className={`${styles.code} ${styles.codeWrap}`}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  spellCheck={false}
                  aria-label="연습할 표 붙여넣기"
                  placeholder={
                    "엑셀에서 머리글을 포함해 표를 복사해 붙여넣으세요. A1 칸부터 들어갑니다.\n붙여넣은 표는 이 화면에서만 쓰고 저장하지 않습니다.\n\n팁: 표 안의 칸을 누르고 Ctrl+A를 누르면 표 전체가 선택됩니다."
                  }
                />
                <div className={fx.pasteBar}>
                  <button type="button" className={styles.primary} onClick={applyPaste} disabled={pasteText.trim() === ""}>
                    표에 넣기
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={`${styles.grid} ${styles.gridHead} ${fx.sheet}`}>
                  <thead>
                    <tr>
                      <th aria-hidden="true" />
                      {Array.from({ length: width }, (_, c) => (
                        <th
                          key={c}
                          scope="col"
                          data-ref={result.refs.some((x) => c >= x.c1 && c <= x.c2) || undefined}
                        >
                          {columnName(c)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shownRows.map((row, r) => (
                      <tr key={r}>
                        <th scope="row" data-ref={result.refs.some((x) => r >= x.r1 && r <= x.r2) || undefined}>
                          {r + 1}
                        </th>
                        {Array.from({ length: width }, (_, c) => {
                          const addr = `${columnName(c)}${r + 1}`;
                          return (
                            <td
                              key={c}
                              data-ref={inRefs(result.refs, r, c) || undefined}
                              title={`${addr} — 누르면 수식에 넣기`}
                              onClick={() => insertAddress(addr)}
                            >
                              {row[c] ?? ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className={styles.status}>
            <span>
              {sheet.length.toLocaleString("ko-KR")}행 × {width}열
              {sheet.length > MAX_ROWS && ` · 앞 ${MAX_ROWS}행만 표시(계산은 전체)`}
            </span>
            <span>칸을 누르면 수식에 주소가 들어갑니다</span>
          </div>
        </section>
      </div>

      <div className={styles.areaOutput}>
        <section className={`${styles.pane} ${styles.outputPane}`} aria-labelledby="lab-fx-title">
          <div className={styles.paneHead}>
            <label id="lab-fx-title" htmlFor="lab-fx" className={styles.paneTitle}>
              수식 입력
            </label>
            <div className={styles.paneActions}>
              <button type="button" className={styles.ghost} onClick={() => setFormula("")} disabled={formula === ""}>
                지우기
              </button>
              <button type="button" className={styles.primary} onClick={() => void copy()} disabled={!formula.trim()}>
                수식 복사
                <kbd className={styles.kbd}>{modKey}↵</kbd>
              </button>
            </div>
          </div>
          <div className={fx.fxBar}>
            <span className={fx.fxLabel} aria-hidden="true">
              fx
            </span>
            <input
              id="lab-fx"
              ref={inputRef}
              className={fx.fxInput}
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="=SUM(D2:D9)처럼 =로 시작해 입력하세요"
            />
          </div>
          <div className={fx.body}>
            <div className={fx.result} data-error={(!result.ok && isFormula) || undefined} aria-live="polite">
              <span className={fx.resultLabel}>결과</span>
              {!isFormula ? (
                <p className={fx.resultMsg}>
                  {formula.trim() === "" ? "수식을 입력하면 바로 계산합니다." : "=로 시작해야 수식으로 계산합니다. 지금은 글자로 들어갑니다."}
                </p>
              ) : result.ok ? (
                <p className={fx.resultValue}>
                  {typeof result.value === "number"
                    ? result.value.toLocaleString("ko-KR", { maximumFractionDigits: 10 })
                    : result.display === ""
                      ? "(빈 글자)"
                      : result.display}
                </p>
              ) : (
                <>
                  <p className={fx.resultCode}>{result.code}</p>
                  <p className={fx.resultMsg}>{result.message}</p>
                </>
              )}
            </div>

            <div className={fx.syntax}>
              <span className={fx.syntaxLabel}>형식</span>
              <code>{data.syntax}</code>
            </div>

            <div>
              <p className={fx.subTitle}>예제 수식</p>
              <div className={fx.exampleList}>
                {data.examples.map((e) => (
                  <button
                    key={e.formula}
                    type="button"
                    className={styles.preset}
                    aria-pressed={e.formula === formula}
                    onClick={() => setFormula(e.formula)}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
              {activeExample && !custom && <p className={fx.exampleNote}>{activeExample.note}</p>}
            </div>
          </div>
          <div className={styles.status}>
            <span>{result.refs.length > 0 ? `참조 ${result.refs.map(rangeLabel).join(", ")}` : "참조 없음"}</span>
            {result.functions.length > 0 && <span>함수 {result.functions.join(", ")}</span>}
          </div>
        </section>
      </div>

      <section className={`${styles.areaOptions} ${fx.tasks}`} aria-labelledby="lab-task-title">
        <div className={fx.tasksHead}>
          <h2 id="lab-task-title" className={fx.tasksTitle}>
            연습 문제
          </h2>
          <span className={fx.score}>
            {data.tasks.length}문제 중 {solved}문제 정답
          </span>
        </div>
        {custom ? (
          <p className={styles.emptyNote}>연습 문제는 예제 표로 풉니다. 위의 ‘예제 표로’를 누르세요.</p>
        ) : (
          <ol className={fx.taskList}>
            {data.tasks.map((task, i) => {
              const t = tasks[i];
              const id = `task-${i}`;
              return (
                <li key={task.q} className={fx.task} data-status={t.status}>
                  <label htmlFor={id} className={fx.taskQ}>
                    {task.q}
                  </label>
                  <div className={fx.taskRow}>
                    <input
                      id={id}
                      className={fx.taskInput}
                      value={t.input}
                      placeholder="="
                      spellCheck={false}
                      autoComplete="off"
                      autoCapitalize="off"
                      autoCorrect="off"
                      onChange={(e) => setTask(i, { input: e.target.value, status: "idle", message: "" })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
                          e.preventDefault();
                          checkTask(i);
                        }
                      }}
                    />
                    <button type="button" className={styles.outlineBtn} onClick={() => checkTask(i)} disabled={t.input.trim() === ""}>
                      채점
                    </button>
                    <button type="button" className={styles.ghost} onClick={() => setTask(i, { shown: !t.shown })} aria-expanded={t.shown}>
                      {t.shown ? "정답 숨기기" : "정답 보기"}
                    </button>
                  </div>
                  {t.message && <p className={fx.taskMsg}>{t.message}</p>}
                  {t.shown && (
                    <p className={fx.taskAnswer}>
                      <code>{task.answer}</code>
                      <button type="button" className={styles.ghost} onClick={() => setFormula(task.answer)}>
                        위 입력줄에서 보기
                      </button>
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <Toast message={toast} />
    </div>
  );
}

"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  CELL_DELIMITERS,
  CELL_SPLIT_SAMPLE,
  DEFAULT_CELL_SPLIT_OPTIONS,
  splitTable,
  suggestDelimiter,
  type CellDelimiter,
  type CellSplitOptions,
  type SplitDirection,
  type SplitLimit,
} from "@/utils/cellSplit";
import { copiedMessage } from "@/utils/bookmarkHint";
import { copyText } from "@/utils/clipboard";
import { looksLikeHeader } from "@/utils/dedupe";
import { parseTable } from "@/utils/parser";
import { trackCopy } from "@/utils/tracking";
import { InputPanel } from "./InputPanel";
import { ResultPane } from "./ResultPane";
import { Segmented } from "./Segmented";
import { SheetPreview, columnLetter } from "./SheetPreview";
import { ConvertGateButton } from "./share/ConvertGateButton";
import { ShareDialog } from "./share/ShareDialog";
import { Toast } from "./Toast";
import styles from "./tool.module.css";
import { useCopyShortcut, useToolBasics } from "./useToolBasics";

const PREVIEW_ROWS = 200;
const PREVIEW_COLS = 40;

const LIMITS: { value: SplitLimit; label: string; title: string }[] = [
  { value: "all", label: "모두", title: "구분자마다 나누기" },
  { value: "first", label: "첫 번째만", title: "앞 한 칸 + 나머지" },
  { value: "last", label: "마지막만", title: "나머지 + 끝 한 칸" },
];

const DIRECTIONS: { value: SplitDirection; label: string }[] = [
  { value: "cols", label: "옆 열로" },
  { value: "rows", label: "아래 행으로" },
];

const DIRECTION_HINT: Record<SplitDirection, string> = {
  cols: "나눈 값이 오른쪽 칸으로 들어갑니다. 엑셀의 ‘텍스트 나누기’와 같습니다.",
  rows: "나눈 값마다 행이 하나씩 생기고, 다른 열 값은 줄마다 그대로 반복됩니다.",
};

const LIMIT_HINT: Record<CellDelimiter | "default", string> = {
  default: "첫 번째만: 서울시 | 강남구 테헤란로 152 · 마지막만: 서울시 강남구 테헤란로 | 152",
  space: "첫 번째만: 서울시 | 강남구 테헤란로 152 · 마지막만: 서울시 강남구 테헤란로 | 152",
  comma: "첫 번째만: 앞 한 칸과 나머지로 · 마지막만: 끝 한 칸과 나머지로",
  slash: "첫 번째만: 앞 한 칸과 나머지로 · 마지막만: 끝 한 칸과 나머지로",
  hyphen: "첫 번째만: 010 | 2345-6789 · 마지막만: 010-2345 | 6789",
  newline: "첫 번째만: 첫 줄과 나머지 줄로 · 마지막만: 마지막 줄과 나머지로",
  custom: "첫 번째만: 앞 한 칸과 나머지로 · 마지막만: 끝 한 칸과 나머지로",
  width: "첫 번째만: 첫 글자 수만 떼기 · 마지막만: 끝에서 첫 글자 수만큼 떼기",
};

const fmt = (n: number) => n.toLocaleString("ko-KR");

export function CellSplitTool() {
  const [input, setInput] = useState("");
  const t = useToolBasics<CellSplitOptions>({
    storageKey: "rowflip:cellsplit:v1",
    defaults: DEFAULT_CELL_SPLIT_OPTIONS,
    // 직접 입력한 구분자, 나눌 열, 머리글 여부는 데이터마다 달라 저장하지 않는다
    storedKeys: ["delimiter", "widths", "limit", "direction", "keepOriginal", "trim", "collapse"],
    sanitize: (s) => {
      if (s.delimiter && !CELL_DELIMITERS.some((d) => d.value === s.delimiter)) delete s.delimiter;
      if (s.limit && !LIMITS.some((d) => d.value === s.limit)) delete s.limit;
      if (s.direction && !DIRECTIONS.some((d) => d.value === s.direction)) delete s.direction;
      return s;
    },
  });
  const { options: o, update, gate } = t;
  const [view, setView] = useState<"table" | "text">("table");

  const deferred = useDeferredValue(input);
  const pending = deferred !== input;
  const table = useMemo(() => parseTable(deferred), [deferred]);
  const firstLine = table.rows[0]?.join("\t") ?? "";

  // 머리글·나눌 열은 붙여넣은 데이터가 바뀌면(첫 행이 달라지면) 다시 자동으로 정한다
  const [headerChoice, setHeaderChoice] = useState<{ sig: string; value: boolean } | null>(null);
  const [columnChoice, setColumnChoice] = useState<{ sig: string; value: number } | null>(null);
  const guessedHeader = useMemo(() => looksLikeHeader(table.rows), [table]);
  const header = table.colCount > 1 && (headerChoice?.sig === firstLine ? headerChoice.value : guessedHeader);
  const manualColumn = columnChoice?.sig === firstLine ? columnChoice.value : null;

  const opts = useMemo(() => ({ ...o, header }), [o, header]);
  const result = useMemo(() => splitTable(deferred, opts, manualColumn), [deferred, opts, manualColumn]);

  // 지금 구분자로는 하나도 안 나뉘는데 다른 구분자가 보이면 바꾸자고 안내
  const suggestion = useMemo(() => {
    if (!result.noMatch || result.inputRows === 0) return null;
    const body = header ? table.rows.slice(1) : table.rows;
    const cells = table.colCount > 1 ? body.map((r) => r[result.column] ?? "") : body.map((r) => r[0] ?? "");
    const s = suggestDelimiter(cells);
    return s && s !== o.delimiter ? s : null;
  }, [result.noMatch, result.inputRows, result.column, header, table, o.delimiter]);

  const hasInput = input.trim() !== "";
  const copy = async () => {
    if (gate.locked) {
      if (hasInput) t.startConvert();
      return;
    }
    if (!result.output) return;
    // 표 형식도 함께 — 엑셀이 010 같은 앞자리 0을 지우지 않게, 셀 안 줄바꿈도 그대로
    const ok = await copyText(result.output, result.html);
    if (ok) trackCopy();
    t.showToast(ok ? copiedMessage() : "복사하지 못했습니다. 텍스트 보기에서 직접 선택해 주세요.");
  };
  useCopyShortcut(() => void copy());

  const head = header ? table.rows[0] : undefined;
  const columnName = (i: number) => {
    const name = head?.[i]?.trim();
    return name ? `${columnLetter(i)}열 · ${name.length > 14 ? `${name.slice(0, 14)}…` : name}` : `${columnLetter(i)}열`;
  };
  const delimLabel = (d: CellDelimiter) => CELL_DELIMITERS.find((x) => x.value === d)?.label ?? "";

  const outCols = result.rows[0]?.length ?? 0;
  const status = (
    <>
      <span>
        {result.inputRows > 0
          ? `${fmt(result.inputRows)}행 × ${fmt(result.inputCols)}열 → ${fmt(result.rows.length - (header ? 1 : 0))}행 × ${fmt(outCols)}열 · 나뉜 칸 ${fmt(result.splitCount)}개`
          : "0행"}
      </span>
      {result.inputCols > 1 && result.inputRows > 0 && (
        <label>
          나눌 열{" "}
          <select
            aria-label="나눌 열 (결과 아래)"
            className={styles.statusSelect}
            value={String(result.column)}
            onChange={(e) => setColumnChoice({ sig: firstLine, value: Number(e.target.value) })}
          >
            {Array.from({ length: result.inputCols }, (_, i) => (
              <option key={i} value={i}>
                {columnName(i)}
              </option>
            ))}
          </select>
        </label>
      )}
      {suggestion && (
        <button type="button" className={styles.statusAction} onClick={() => update({ delimiter: suggestion })}>
          {delimLabel(suggestion)}로 나누기
        </button>
      )}
      {result.noMatch && result.inputRows > 0 && !suggestion && (
        <span className={styles.statusNotice}>지금 기준({delimLabel(o.delimiter)})으로 나뉘는 칸이 없습니다</span>
      )}
      {view === "table" && (result.rows.length > PREVIEW_ROWS || outCols > PREVIEW_COLS) && (
        <span>
          미리보기는 {PREVIEW_ROWS}행 × {PREVIEW_COLS}열까지 · 복사는 전체
        </span>
      )}
    </>
  );

  return (
    <div className={`${styles.tool} ${styles.toolTranspose} ${gate.locked ? styles.toolGated : ""}`}>
      <div className={styles.areaInput}>
        <InputPanel
          value={input}
          onChange={setInput}
          onSample={() => {
            setInput(CELL_SPLIT_SAMPLE);
            update({ delimiter: "space" });
          }}
          onClear={() => setInput("")}
          rowCount={table.rowCount}
          colCount={table.colCount}
          placeholder={
            "엑셀에서 나눌 칸(열)을 복사해 붙여넣으세요. 다른 열을 함께 복사해도 됩니다.\n\n예:\n서울시 강남구 테헤란로 152\n010-2345-6789\nA-10234, A-10235\n\n팁: 엑셀에서 첫 칸을 누르고 Ctrl+Shift+↓(맥은 ⌘)를 누르면 열 끝까지 선택됩니다."
          }
        />
      </div>

      {gate.locked && <ConvertGateButton disabled={!hasInput} onClick={t.startConvert} />}

      <div className={styles.areaOutput}>
        <ResultPane
          title="나눈 결과"
          waiting={gate.locked}
          pending={pending}
          modKey={t.modKey}
          onCopy={() => void copy()}
          canCopy={!gate.locked && result.output !== ""}
          placeholder="붙여넣으면 나눈 결과가 여기에 표시됩니다."
          actions={
            <Segmented
              label="결과 보기 방식"
              value={view}
              options={[
                { value: "table", label: "표" },
                { value: "text", label: "텍스트" },
              ]}
              onChange={setView}
            />
          }
          value={result.output}
          wrap={false}
          status={status}
        >
          {view === "table" ? (
            result.rows.length === 0 ? (
              <p className={styles.emptyNote}>붙여넣으면 나눈 표가 여기에 표시됩니다.</p>
            ) : (
              <SheetPreview rows={result.rows} maxRows={PREVIEW_ROWS} maxCols={PREVIEW_COLS} headerRow={header} />
            )
          ) : undefined}
        </ResultPane>
      </div>

      <div className={`${styles.areaOptions} ${styles.options} ${styles.optionsSplit}`}>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>나눌 기준</legend>
          <Segmented
            label="나눌 기준"
            value={o.delimiter}
            options={CELL_DELIMITERS}
            onChange={(delimiter) => update({ delimiter })}
          />
          {o.delimiter === "custom" && (
            <input
              className={`${styles.input} ${styles.mono}`}
              aria-label="나눌 문자"
              placeholder="나눌 문자 (예: | 또는 ::)"
              value={o.custom}
              onChange={(e) => update({ custom: e.target.value })}
            />
          )}
          {o.delimiter === "width" && (
            <label className={styles.inline}>
              <input
                className={`${styles.input} ${styles.mono}`}
                aria-label="자를 글자 수"
                inputMode="numeric"
                size={10}
                value={o.widths}
                onChange={(e) => update({ widths: e.target.value })}
              />
              <span className={styles.hint}>글자씩 자르기 · 1이면 성/이름, 3,4면 010 | 2345 | 6789</span>
            </label>
          )}
          <div className={styles.inline}>
            <span className={styles.hint}>나누는 곳</span>
            <Segmented label="나누는 곳" value={o.limit} options={LIMITS} onChange={(limit) => update({ limit })} />
          </div>
          <p className={styles.hint}>{LIMIT_HINT[o.delimiter] ?? LIMIT_HINT.default}</p>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>결과 모양</legend>
          <Segmented
            label="결과 모양"
            value={o.direction}
            options={DIRECTIONS}
            onChange={(direction) => update({ direction })}
          />
          <p className={styles.hint}>{DIRECTION_HINT[o.direction]}</p>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={header}
              disabled={table.colCount <= 1}
              onChange={(e) => setHeaderChoice({ sig: firstLine, value: e.target.checked })}
            />
            첫 행은 머리글 (나누지 않고 열 이름에 번호)
          </label>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>정리</legend>
          <label className={styles.check}>
            <input type="checkbox" checked={o.trim} onChange={(e) => update({ trim: e.target.checked })} />
            앞뒤 공백 제거
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={o.collapse} onChange={(e) => update({ collapse: e.target.checked })} />
            빈 칸 만들지 않기
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={o.keepOriginal}
              onChange={(e) => update({ keepOriginal: e.target.checked })}
            />
            원래 열 남기기
          </label>
          <p className={styles.hint}>복사하면 010처럼 앞자리 0이 있는 값도 엑셀에서 지워지지 않습니다.</p>
        </fieldset>
      </div>

      <Toast message={t.toast} />
      <ShareDialog
        open={t.shareOpen}
        onClose={() => t.setShareOpen(false)}
        path="/cell-split/"
        summary={`${fmt(result.splitCount)}칸 나눔`}
      />
    </div>
  );
}

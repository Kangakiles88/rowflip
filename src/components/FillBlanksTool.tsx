"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { copiedMessage } from "@/utils/bookmarkHint";
import { copyText } from "@/utils/clipboard";
import {
  DEFAULT_FILL_OPTIONS,
  FILL_SAMPLE,
  fillBlanksText,
  guessHeader,
  type FillMode,
  type FillOptions,
} from "@/utils/fillBlanks";
import { parseAnyTable } from "@/utils/parser";
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
/** 열이 이보다 많으면 열 고르기 칸은 앞쪽만 보여 준다 */
const PICK_COLS = 26;

type StoredOptions = Pick<FillOptions, "mode" | "spaceIsBlank" | "keepEmptyRows">;
const STORED_DEFAULTS: StoredOptions = {
  mode: DEFAULT_FILL_OPTIONS.mode,
  spaceIsBlank: DEFAULT_FILL_OPTIONS.spaceIsBlank,
  keepEmptyRows: DEFAULT_FILL_OPTIONS.keepEmptyRows,
};

const MODES: { value: FillMode; label: string; title: string }[] = [
  { value: "above", label: "위 값으로", title: "빈칸을 바로 위에 있는 값으로" },
  { value: "below", label: "아래 값으로", title: "빈칸을 바로 아래에 있는 값으로" },
  { value: "value", label: "정한 값으로", title: "빈칸에 0, - 같은 값 넣기" },
];
const MODE_HINT: Record<FillMode, string> = {
  above: "병합을 풀면 첫 칸에만 값이 남습니다. 그 아래 빈칸을 같은 값으로 채워 정렬·필터·피벗이 되게 합니다.",
  below: "소계·합계가 묶음 맨 아래에 있는 표처럼, 빈칸을 아래쪽 값으로 채웁니다.",
  value: "빈칸에 0이나 - 같은 값을 넣습니다. 숫자 열을 계산하기 전에 빈칸을 없앨 때 씁니다.",
};

const fmt = (n: number) => n.toLocaleString("ko-KR");

export function FillBlanksTool() {
  const [input, setInput] = useState("");
  const t = useToolBasics<StoredOptions>({
    storageKey: "rowflip:fillblanks:v1",
    defaults: STORED_DEFAULTS,
    // 채우는 방식·정리 옵션만 기억한다. 넣을 값·채울 열·머리글은 데이터마다 달라 저장하지 않는다
    storedKeys: ["mode", "spaceIsBlank", "keepEmptyRows"],
    sanitize: (s) => {
      if (s.mode && !MODES.some((m) => m.value === s.mode)) delete s.mode;
      return s;
    },
  });
  const { options: o, update, gate } = t;
  const [value, setValue] = useState("0");
  const [view, setView] = useState<"table" | "text">("table");

  const deferred = useDeferredValue(input);
  const pending = deferred !== input;
  const table = useMemo(() => parseAnyTable(deferred), [deferred]);
  const firstLine = table.rows[0]?.join("\t") ?? "";

  // 머리글·채울 열은 붙여넣은 데이터가 바뀌면(첫 행이 달라지면) 다시 자동으로
  const [headerChoice, setHeaderChoice] = useState<{ sig: string; value: boolean } | null>(null);
  const [colChoice, setColChoice] = useState<{ sig: string; value: number[] } | null>(null);
  const guessedHeader = useMemo(() => guessHeader(table.rows), [table]);
  const header = headerChoice?.sig === firstLine ? headerChoice.value : guessedHeader;
  const columns = colChoice?.sig === firstLine ? colChoice.value : null;

  const opts: FillOptions = useMemo(
    () => ({ ...o, value, columns, header }),
    [o, value, columns, header],
  );
  const result = useMemo(() => fillBlanksText(deferred, opts), [deferred, opts]);
  // 열마다 빈칸 수(모든 열 기준) — 열 고르기 옆에 보여 준다
  const blanksByCol = useMemo(
    () => fillBlanksText(deferred, { ...opts, mode: "value", value: "x", columns: null }).filledByCol,
    [deferred, opts],
  );

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

  const width = result.inputCols;
  const selected = new Set(columns ?? Array.from({ length: width }, (_, i) => i));
  const toggleCol = (c: number) => {
    const next = new Set(selected);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    setColChoice({ sig: firstLine, value: [...next].sort((a, b) => a - b) });
  };
  const head = header ? table.rows[0] : undefined;
  const colName = (i: number) => {
    const name = head?.[i]?.trim();
    return name ? `${columnLetter(i)} · ${name.length > 10 ? `${name.slice(0, 10)}…` : name}` : `${columnLetter(i)}열`;
  };

  const dataRows = result.inputRows - (header ? 1 : 0);
  const status = (
    <>
      <span>
        {result.inputRows > 0 ? `${fmt(dataRows)}행 × ${fmt(width)}열 · 채운 칸 ${fmt(result.filled)}개` : "0행"}
      </span>
      {result.source !== "tab" && result.inputRows > 0 && (
        <span>{result.source === "csv" ? "CSV(쉼표 구분)로 읽음" : "마크다운 표로 읽음"}</span>
      )}
      {result.leftBlank > 0 && o.mode !== "value" && (
        <span className={styles.statusNotice}>
          {o.mode === "above" ? "위" : "아래"}에 값이 없어 남은 빈칸 {fmt(result.leftBlank)}개
        </span>
      )}
      {result.inputRows > 0 && result.filled === 0 && (
        <span className={styles.statusNotice}>채울 빈칸이 없습니다</span>
      )}
      {view === "table" && (result.rows.length > PREVIEW_ROWS || width > PREVIEW_COLS) && (
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
            setInput(FILL_SAMPLE);
            setColChoice({ sig: FILL_SAMPLE.split("\n")[0], value: [0, 1] });
          }}
          onClear={() => setInput("")}
          rowCount={table.rowCount}
          colCount={table.colCount}
          placeholder={
            "엑셀에서 병합을 푼 표(빈칸이 있는 표)를 복사해 붙여넣으세요.\n\n예:\n지역\t지점\t매출\n서울\t강남점\t1,200\n\t\t980\n\t서초점\t1,050\n\n팁: 엑셀에서 표 안의 칸 하나를 누르고 Ctrl+A(맥은 ⌘+A)를 누르면 표 전체가 선택됩니다."
          }
        />
      </div>

      {gate.locked && <ConvertGateButton disabled={!hasInput} onClick={t.startConvert} />}

      <div className={styles.areaOutput}>
        <ResultPane
          title="빈칸 채운 결과"
          waiting={gate.locked}
          pending={pending}
          modKey={t.modKey}
          onCopy={() => void copy()}
          canCopy={!gate.locked && result.output !== ""}
          placeholder="붙여넣으면 빈칸을 채운 표가 여기에 표시됩니다."
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
              <p className={styles.emptyNote}>붙여넣으면 빈칸을 채운 표가 여기에 표시됩니다.</p>
            ) : (
              <SheetPreview rows={result.rows} maxRows={PREVIEW_ROWS} maxCols={PREVIEW_COLS} headerRow={header} />
            )
          ) : undefined}
        </ResultPane>
      </div>

      <div className={`${styles.areaOptions} ${styles.options} ${styles.optionsSplit}`}>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>채우는 값</legend>
          <Segmented label="채우는 값" value={o.mode} options={MODES} onChange={(mode) => update({ mode })} />
          {o.mode === "value" && (
            <input
              className={`${styles.input} ${styles.mono}`}
              aria-label="빈칸에 넣을 값"
              placeholder="넣을 값 (예: 0, -, 없음)"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          )}
          <p className={styles.hint}>{MODE_HINT[o.mode]}</p>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>채울 열</legend>
          {width === 0 ? (
            <p className={styles.hint}>붙여넣으면 열마다 고를 수 있습니다. 기본은 모든 열입니다.</p>
          ) : (
            <>
              <div className={styles.inline} style={{ flexWrap: "wrap" }}>
                {Array.from({ length: Math.min(width, PICK_COLS) }, (_, c) => (
                  <label key={c} className={styles.check}>
                    <input type="checkbox" checked={selected.has(c)} onChange={() => toggleCol(c)} />
                    {colName(c)}
                    {blanksByCol[c] > 0 && <span className={styles.hint}> 빈칸 {fmt(blanksByCol[c])}</span>}
                  </label>
                ))}
              </div>
              <p className={styles.hint}>
                병합했던 열(지역·부서·날짜 같은 묶음 열)만 고르세요. 원래 비어 있어야 하는 열까지 채우지 않게 합니다.
              </p>
            </>
          )}
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>정리</legend>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={header}
              onChange={(e) => setHeaderChoice({ sig: firstLine, value: e.target.checked })}
            />
            첫 행은 머리글 (채우지 않음)
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={o.spaceIsBlank}
              onChange={(e) => update({ spaceIsBlank: e.target.checked })}
            />
            공백만 있는 칸도 빈칸으로
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={o.keepEmptyRows}
              onChange={(e) => update({ keepEmptyRows: e.target.checked })}
            />
            완전히 빈 행은 그대로 두기
          </label>
          <p className={styles.hint}>복사하면 010처럼 앞자리 0이 있는 값도 엑셀에서 지워지지 않습니다.</p>
        </fieldset>
      </div>

      <Toast message={t.toast} />
      <ShareDialog
        open={t.shareOpen}
        onClose={() => t.setShareOpen(false)}
        path="/fill-blanks/"
        summary={`빈칸 ${fmt(result.filled)}개 채움`}
      />
    </div>
  );
}

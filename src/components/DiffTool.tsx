"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  DEFAULT_DIFF_OPTIONS,
  DIFF_SAMPLE_A,
  DIFF_SAMPLE_B,
  diffText,
  diffToText,
  type DiffOptions,
  type DiffRow,
  type Part,
} from "@/utils/diff";
import { InputPanel } from "./InputPanel";
import { ResultPane } from "./ResultPane";
import { Segmented } from "./Segmented";
import { ConvertGateButton } from "./share/ConvertGateButton";
import { ShareDialog } from "./share/ShareDialog";
import { Toast } from "./Toast";
import styles from "./tool.module.css";
import { useCopyShortcut, useToolBasics } from "./useToolBasics";

type View = "all" | "changes";
interface Opts extends DiffOptions {
  view: View;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");
/** 화면에 그리는 줄 수 상한 — 복사는 전체 */
const MAX_ROWS = 3000;
/** '바뀐 부분만'에서 바뀐 줄 앞뒤로 남기는 같은 줄 수 */
const CONTEXT = 2;

type Line = DiffRow | { type: "gap"; count: number };

function visibleLines(rows: DiffRow[], view: View): Line[] {
  if (view === "all") return rows;
  const keep = rows.map((r) => r.type !== "equal");
  const near = keep.map((_, i) => {
    for (let d = -CONTEXT; d <= CONTEXT; d++) if (keep[i + d]) return true;
    return false;
  });
  const out: Line[] = [];
  let gap = 0;
  rows.forEach((r, i) => {
    if (near[i]) {
      if (gap > 0) out.push({ type: "gap", count: gap });
      gap = 0;
      out.push(r);
    } else gap++;
  });
  if (gap > 0) out.push({ type: "gap", count: gap });
  return out;
}

function Text({ text, parts, kind }: { text: string; parts?: Part[]; kind: "del" | "ins" }) {
  if (!parts) return <>{text === "" ? " " : text}</>;
  const Mark = kind === "del" ? "del" : "ins";
  return (
    <>
      {parts.map((p, i) =>
        p.changed ? (
          <Mark key={i} className={styles.diffMark}>
            {p.text}
          </Mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

export function DiffTool() {
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const t = useToolBasics<Opts>({
    storageKey: "rowflip:diff:v1",
    defaults: { ...DEFAULT_DIFF_OPTIONS, view: "all" },
    storedKeys: ["ignoreWhitespace", "ignoreCase", "view"],
    sanitize: (s) => {
      if (s.view && s.view !== "all" && s.view !== "changes") delete s.view;
      return s;
    },
  });
  const { options: o, update, gate } = t;

  const dBefore = useDeferredValue(before);
  const dAfter = useDeferredValue(after);
  const diffOpts = useMemo(
    () => ({ ignoreWhitespace: o.ignoreWhitespace, ignoreCase: o.ignoreCase }),
    [o.ignoreWhitespace, o.ignoreCase],
  );
  const result = useMemo(() => diffText(dBefore, dAfter, diffOpts), [dBefore, dAfter, diffOpts]);
  const lines = useMemo(() => visibleLines(result.rows, o.view), [result.rows, o.view]);
  const pending = dBefore !== before || dAfter !== after;
  const hasInput = before.trim() !== "" || after.trim() !== "";
  const identical = hasInput && result.added === 0 && result.removed === 0;

  const copy = () => void t.copy(diffToText(result.rows), hasInput);
  useCopyShortcut(copy);

  return (
    <div className={styles.diffTool}>
      <div className={styles.diffInputs}>
        <InputPanel
          inputId="before"
          title="원본 (고치기 전)"
          value={before}
          onChange={setBefore}
          onSample={() => {
            setBefore(DIFF_SAMPLE_A);
            setAfter(DIFF_SAMPLE_B);
          }}
          onClear={() => setBefore("")}
          rowCount={before === "" ? 0 : before.split("\n").length}
          colCount={1}
          placeholder="원래 글을 붙여넣으세요."
        />
        <InputPanel
          inputId="after"
          title="수정본 (고친 뒤)"
          value={after}
          onChange={setAfter}
          onSample={() => {
            setBefore(DIFF_SAMPLE_A);
            setAfter(DIFF_SAMPLE_B);
          }}
          onClear={() => setAfter("")}
          rowCount={after === "" ? 0 : after.split("\n").length}
          colCount={1}
          placeholder="고친 글을 붙여넣으세요."
        />
      </div>

      {gate.locked && <ConvertGateButton disabled={!hasInput} onClick={t.startConvert} />}

      <div className={styles.diffResult}>
        <ResultPane
          title="비교 결과"
          waiting={gate.locked}
          pending={pending}
          modKey={t.modKey}
          onCopy={copy}
          canCopy={!gate.locked && hasInput}
          placeholder=""
          actions={
            <Segmented
              label="보기"
              value={o.view}
              options={[
                { value: "all", label: "전체" },
                { value: "changes", label: "바뀐 부분만" },
              ]}
              onChange={(view) => update({ view })}
            />
          }
          status={
            !hasInput ? (
              <span>두 칸에 글을 붙여넣으면 비교합니다</span>
            ) : identical ? (
              <span>두 글이 같습니다</span>
            ) : (
              <>
                <span>
                  추가 {fmt(result.added)}줄 · 삭제 {fmt(result.removed)}줄 · 같은 줄 {fmt(result.same)}
                </span>
                {result.tooDifferent && <span>차이가 많아 줄 단위로만 비교했습니다</span>}
                {lines.length > MAX_ROWS && <span>화면에는 {fmt(MAX_ROWS)}줄까지 · 복사는 전체</span>}
              </>
            )
          }
        >
          {hasInput ? (
            <div className={styles.diffView} id="result" role="table" aria-label="비교 결과">
              {lines.slice(0, MAX_ROWS).map((l, i) =>
                l.type === "gap" ? (
                  <div key={i} className={styles.diffGap} role="row">
                    <span role="cell">같은 줄 {fmt(l.count)}개</span>
                  </div>
                ) : (
                  <div key={i} className={styles.diffRow} data-type={l.type} role="row">
                    <span className={styles.diffNo} role="cell">
                      {l.type !== "ins" ? l.aNo : ""}
                    </span>
                    <span className={styles.diffNo} role="cell">
                      {l.type === "equal" ? l.bNo : l.type === "ins" ? l.bNo : ""}
                    </span>
                    <span className={styles.diffSign} role="cell" aria-label={l.type === "del" ? "삭제" : l.type === "ins" ? "추가" : "같음"}>
                      {l.type === "del" ? "−" : l.type === "ins" ? "+" : ""}
                    </span>
                    <span className={styles.diffText} role="cell">
                      {l.type === "equal" ? l.text || " " : <Text text={l.text} parts={l.parts} kind={l.type} />}
                    </span>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className={styles.emptyNote}>원본과 수정본을 붙여넣으면 바뀐 줄과 낱말을 색으로 표시합니다.</p>
          )}
        </ResultPane>
      </div>

      <div className={`${styles.options} ${styles.optionsTwo}`}>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>비교 방법</legend>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={o.ignoreWhitespace}
              onChange={(e) => update({ ignoreWhitespace: e.target.checked })}
            />
            띄어쓰기 차이 무시
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={o.ignoreCase} onChange={(e) => update({ ignoreCase: e.target.checked })} />
            영문 대소문자 무시
          </label>
        </fieldset>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>색 안내</legend>
          <p className={styles.diffLegend}>
            <span data-type="del">− 지운 줄</span>
            <span data-type="ins">+ 더한 줄</span>
            <span>
              줄 안에서 바뀐 낱말은 <del className={styles.diffMark}>진하게</del> <ins className={styles.diffMark}>표시</ins>
            </span>
          </p>
        </fieldset>
      </div>

      <Toast message={t.toast} />
      <ShareDialog
        open={t.shareOpen}
        onClose={() => t.setShareOpen(false)}
        path="/diff/"
        summary={`추가 ${fmt(result.added)}줄 · 삭제 ${fmt(result.removed)}줄`}
      />
    </div>
  );
}

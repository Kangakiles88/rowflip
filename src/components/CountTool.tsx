"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { COUNT_SAMPLE, countText, DEFAULT_COUNT_OPTIONS, limitValue, type CountOptions } from "@/utils/count";
import { excelCellsToText } from "@/utils/parser";
import { InputPanel } from "./InputPanel";
import { ResultPane } from "./ResultPane";
import { ConvertGateButton } from "./share/ConvertGateButton";
import { ShareDialog } from "./share/ShareDialog";
import { Toast } from "./Toast";
import styles from "./tool.module.css";
import { useCopyShortcut, useToolBasics } from "./useToolBasics";

const fmt = (n: number) => n.toLocaleString("ko-KR");
const BASIS_LABEL: Record<CountOptions["limitBasis"], string> = {
  with: "공백 포함",
  without: "공백 제외",
  bytes2: "바이트",
};

export function CountTool() {
  const [input, setInput] = useState("");
  const t = useToolBasics<CountOptions>({
    storageKey: "rowflip:count:v1",
    defaults: DEFAULT_COUNT_OPTIONS,
    storedKeys: ["newlineAsChar", "limit", "limitBasis"],
    sanitize: (s) => {
      if (s.limitBasis && !(s.limitBasis in BASIS_LABEL)) delete s.limitBasis;
      if (typeof s.limit === "number" && !(s.limit >= 0)) delete s.limit;
      return s;
    },
  });
  const { options: o, update, gate } = t;

  const deferred = useDeferredValue(input);
  // 엑셀에서 줄바꿈이 든 셀을 복사하면 "…"로 감싸져 온다 — 따옴표는 글자수에서 뺀다
  const text = useMemo(() => excelCellsToText(deferred), [deferred]);
  const stats = useMemo(() => countText(text, o), [text, o]);
  const pending = deferred !== input;
  const hasInput = input.trim() !== "";

  const summary = [
    `공백 포함 ${fmt(stats.withSpaces)}자`,
    `공백 제외 ${fmt(stats.withoutSpaces)}자`,
    `${fmt(stats.bytes2)}바이트`,
  ].join(" / ");
  const copy = () => void t.copy(summary, hasInput);
  useCopyShortcut(copy);

  const current = limitValue(stats, o.limitBasis);
  const over = o.limit > 0 && current > o.limit;
  const ratio = o.limit > 0 ? Math.min(1, current / o.limit) : 0;

  return (
    <div className={`${styles.tool} ${styles.toolTranspose} ${gate.locked ? styles.toolGated : ""}`}>
      <div className={styles.areaInput}>
        <InputPanel
          value={input}
          onChange={setInput}
          onSample={() => setInput(COUNT_SAMPLE)}
          onClear={() => setInput("")}
          rowCount={stats.lines}
          colCount={1}
          placeholder={"글자수를 셀 글을 붙여넣거나 입력하세요.\n\n자기소개서, 보고서, 블로그 글, 광고 문구 등"}
        />
      </div>

      {gate.locked && <ConvertGateButton disabled={!hasInput} onClick={t.startConvert} />}

      <div className={styles.areaOutput}>
        <ResultPane
          title="글자수"
          waiting={gate.locked}
          pending={pending}
          modKey={t.modKey}
          onCopy={copy}
          canCopy={!gate.locked && hasInput}
          placeholder=""
          status={<span>복사하면 ‘{summary}’ 형식으로 담깁니다</span>}
        >
          <div className={styles.stats} id="result">
            <div className={styles.statMain}>
              <div className={styles.statBig}>
                <span>공백 포함</span>
                <strong>
                  {fmt(stats.withSpaces)}
                  <small>자</small>
                </strong>
              </div>
              <div className={styles.statBig}>
                <span>공백 제외</span>
                <strong>
                  {fmt(stats.withoutSpaces)}
                  <small>자</small>
                </strong>
              </div>
            </div>

            {o.limit > 0 && (
              <div className={styles.limit} data-over={over || undefined}>
                <div className={styles.limitText}>
                  <span>
                    목표 {fmt(o.limit)}자 ({BASIS_LABEL[o.limitBasis]})
                  </span>
                  <strong>{over ? `${fmt(current - o.limit)}자 초과` : `${fmt(o.limit - current)}자 남음`}</strong>
                </div>
                <div className={styles.limitBar} aria-hidden="true">
                  <span style={{ width: `${ratio * 100}%` }} />
                </div>
              </div>
            )}

            <dl className={styles.statList}>
              <div>
                <dt>바이트 (한글 2바이트)</dt>
                <dd>{fmt(stats.bytes2)}</dd>
              </div>
              <div>
                <dt>바이트 (UTF-8, 한글 3바이트)</dt>
                <dd>{fmt(stats.bytesUtf8)}</dd>
              </div>
              <div>
                <dt>단어</dt>
                <dd>{fmt(stats.words)}</dd>
              </div>
              <div>
                <dt>줄</dt>
                <dd>{fmt(stats.lines)}</dd>
              </div>
              <div>
                <dt>문단</dt>
                <dd>{fmt(stats.paragraphs)}</dd>
              </div>
              <div>
                <dt>줄바꿈</dt>
                <dd>{fmt(stats.newlines)}</dd>
              </div>
            </dl>
          </div>
        </ResultPane>
      </div>

      <div className={`${styles.areaOptions} ${styles.options} ${styles.optionsTwo}`}>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>세는 방법</legend>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={o.newlineAsChar}
              onChange={(e) => update({ newlineAsChar: e.target.checked })}
            />
            줄바꿈도 ‘공백 포함’ 글자수에 넣기
          </label>
          <p className={styles.hint}>
            워드·한글 프로그램은 줄바꿈을 세지 않습니다. 제출처가 줄바꿈을 1자로 센다면 켜세요.
          </p>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>목표 글자수</legend>
          <div className={styles.inline}>
            <input
              className={`${styles.input} ${styles.mono}`}
              type="number"
              min={0}
              step={100}
              inputMode="numeric"
              aria-label="목표 글자수"
              placeholder="예: 1000"
              value={o.limit || ""}
              onChange={(e) => update({ limit: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
              style={{ width: 120 }}
            />
            <select
              aria-label="목표 글자수 기준"
              className={styles.select}
              value={o.limitBasis}
              onChange={(e) => update({ limitBasis: e.target.value as CountOptions["limitBasis"] })}
            >
              <option value="with">공백 포함</option>
              <option value="without">공백 제외</option>
              <option value="bytes2">바이트 (한글 2)</option>
            </select>
          </div>
          <p className={styles.hint}>비워 두면 표시하지 않습니다. 남은 글자수와 초과한 글자수를 보여 줍니다.</p>
        </fieldset>
      </div>

      <Toast message={t.toast} />
      <ShareDialog
        open={t.shareOpen}
        onClose={() => t.setShareOpen(false)}
        path="/count/"
        summary={`공백 포함 ${fmt(stats.withSpaces)}자`}
      />
    </div>
  );
}

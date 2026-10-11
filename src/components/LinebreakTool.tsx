"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  DEFAULT_LINEBREAK_OPTIONS,
  LINEBREAK_SAMPLE,
  removeLinebreaks,
  type LinebreakMode,
  type LinebreakOptions,
} from "@/utils/linebreak";
import { InputPanel } from "./InputPanel";
import { ResultPane } from "./ResultPane";
import { Segmented } from "./Segmented";
import { ConvertGateButton } from "./share/ConvertGateButton";
import { ShareDialog } from "./share/ShareDialog";
import { Toast } from "./Toast";
import styles from "./tool.module.css";
import { useCopyShortcut, useToolBasics } from "./useToolBasics";

const fmt = (n: number) => n.toLocaleString("ko-KR");

const MODES: { value: LinebreakMode; label: string }[] = [
  { value: "space", label: "띄어쓰기로" },
  { value: "paragraph", label: "문단 유지" },
  { value: "join", label: "붙이기" },
  { value: "emptyLines", label: "빈 줄만 삭제" },
];

const MODE_HINT: Record<LinebreakMode, string> = {
  space: "모든 줄바꿈을 띄어쓰기 하나로 바꿔 한 문단으로 만듭니다.",
  paragraph: "빈 줄로 나뉜 문단은 남기고, 문단 안에서 끊긴 줄만 이어 붙입니다.",
  join: "줄바꿈을 띄어쓰기 없이 지웁니다. 낱말 중간에서 끊긴 글에 씁니다.",
  emptyLines: "줄바꿈은 그대로 두고 비어 있는 줄만 지웁니다.",
};

export function LinebreakTool() {
  const [input, setInput] = useState("");
  const t = useToolBasics<LinebreakOptions>({
    storageKey: "rowflip:linebreak:v1",
    defaults: DEFAULT_LINEBREAK_OPTIONS,
    storedKeys: ["mode", "collapseSpaces", "trimLines", "joinHyphen"],
    sanitize: (s) => {
      if (s.mode && !MODES.some((m) => m.value === s.mode)) delete s.mode;
      return s;
    },
  });
  const { options: o, update, gate } = t;

  const deferred = useDeferredValue(input);
  const result = useMemo(() => removeLinebreaks(deferred, o), [deferred, o]);
  const pending = deferred !== input;
  const hasInput = input.trim() !== "";
  const copy = () => void t.copy(result.output, hasInput);
  useCopyShortcut(copy);

  return (
    <div className={`${styles.tool} ${styles.toolTranspose} ${gate.locked ? styles.toolGated : ""}`}>
      <div className={styles.areaInput}>
        <InputPanel
          value={input}
          onChange={setInput}
          onSample={() => setInput(LINEBREAK_SAMPLE)}
          onClear={() => setInput("")}
          rowCount={result.linesBefore}
          colCount={1}
          placeholder={"PDF·웹페이지에서 복사해 줄마다 끊긴 글을 붙여넣으세요."}
        />
      </div>

      {gate.locked && <ConvertGateButton disabled={!hasInput} onClick={t.startConvert} />}

      <div className={styles.areaOutput}>
        <ResultPane
          title="줄바꿈 제거 결과"
          value={result.output}
          waiting={gate.locked}
          pending={pending}
          modKey={t.modKey}
          onCopy={copy}
          canCopy={!gate.locked && result.output !== ""}
          placeholder="원본을 붙여넣으면 줄바꿈을 정리한 결과가 여기에 표시됩니다."
          status={
            <>
              <span>
                {fmt(result.linesBefore)}줄 → {fmt(result.linesAfter)}줄 · {fmt(result.output.length)}자
              </span>
              {result.removedBreaks > 0 && <span>줄바꿈 {fmt(result.removedBreaks)}개 제거</span>}
            </>
          }
        />
      </div>

      <div className={`${styles.areaOptions} ${styles.options} ${styles.optionsTwo}`}>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>줄바꿈 처리</legend>
          <Segmented label="줄바꿈 처리" value={o.mode} options={MODES} onChange={(mode) => update({ mode })} />
          <p className={styles.hint}>{MODE_HINT[o.mode]}</p>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>공백 정리</legend>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={o.collapseSpaces}
              onChange={(e) => update({ collapseSpaces: e.target.checked })}
            />
            연속된 띄어쓰기를 하나로
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={o.trimLines} onChange={(e) => update({ trimLines: e.target.checked })} />
            줄마다 앞뒤 공백 제거
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={o.joinHyphen} onChange={(e) => update({ joinHyphen: e.target.checked })} />
            하이픈(-)으로 잘린 영어 단어 잇기
          </label>
        </fieldset>
      </div>

      <Toast message={t.toast} />
      <ShareDialog
        open={t.shareOpen}
        onClose={() => t.setShareOpen(false)}
        path="/linebreak/"
        summary={`줄바꿈 ${fmt(result.removedBreaks)}개 제거`}
      />
    </div>
  );
}

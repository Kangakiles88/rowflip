"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { engToKor, guessHanyangMode, HANYANG_SAMPLE, korToEng, type HanyangMode } from "@/utils/hanyang";
import { InputPanel } from "./InputPanel";
import { ResultPane } from "./ResultPane";
import { Segmented } from "./Segmented";
import { ConvertGateButton } from "./share/ConvertGateButton";
import { ShareDialog } from "./share/ShareDialog";
import { Toast } from "./Toast";
import styles from "./tool.module.css";
import { useCopyShortcut, useToolBasics } from "./useToolBasics";

type Direction = HanyangMode | "auto";

const DIRECTIONS: { value: Direction; label: string }[] = [
  { value: "auto", label: "자동" },
  { value: "eng-to-kor", label: "영타 → 한글" },
  { value: "kor-to-eng", label: "한글 → 영타" },
];

export function HanyangTool() {
  const [input, setInput] = useState("");
  const t = useToolBasics<{ direction: Direction }>({
    storageKey: "rowflip:hanyang:v1",
    defaults: { direction: "auto" },
    storedKeys: ["direction"],
    sanitize: (s) => (DIRECTIONS.some((d) => d.value === s.direction) ? s : {}),
  });
  const { options: o, update, gate } = t;

  const deferred = useDeferredValue(input);
  const mode: HanyangMode = o.direction === "auto" ? guessHanyangMode(deferred) : o.direction;
  const output = useMemo(() => (mode === "eng-to-kor" ? engToKor(deferred) : korToEng(deferred)), [deferred, mode]);
  const pending = deferred !== input;
  const hasInput = input.trim() !== "";
  const copy = () => void t.copy(output, hasInput);
  useCopyShortcut(copy);

  return (
    <div className={`${styles.tool} ${styles.toolTranspose} ${gate.locked ? styles.toolGated : ""}`}>
      <div className={styles.areaInput}>
        <InputPanel
          value={input}
          onChange={setInput}
          onSample={() => setInput(HANYANG_SAMPLE)}
          onClear={() => setInput("")}
          rowCount={input === "" ? 0 : input.split("\n").length}
          colCount={1}
          placeholder={"한/영 키를 잘못 놓고 친 글을 붙여넣으세요.\n\n예: dkssudgktpdy → 안녕하세요"}
        />
      </div>

      {gate.locked && <ConvertGateButton disabled={!hasInput} onClick={t.startConvert} />}

      <div className={styles.areaOutput}>
        <ResultPane
          title={mode === "eng-to-kor" ? "한글로 바꾼 결과" : "영문 자판으로 바꾼 결과"}
          value={output}
          waiting={gate.locked}
          pending={pending}
          modKey={t.modKey}
          onCopy={copy}
          canCopy={!gate.locked && output !== ""}
          placeholder="영타로 친 글을 붙여넣으면 한글로 바꾼 결과가 여기에 표시됩니다."
          status={
            <>
              <span>{output.length.toLocaleString("ko-KR")}자</span>
              {o.direction === "auto" && hasInput && (
                <span>자동: {mode === "eng-to-kor" ? "영타 → 한글" : "한글 → 영타"}</span>
              )}
            </>
          }
        />
      </div>

      <div className={`${styles.areaOptions} ${styles.options} ${styles.optionsTwo}`}>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>바꿀 방향</legend>
          <Segmented
            label="바꿀 방향"
            value={o.direction}
            options={DIRECTIONS}
            onChange={(direction) => update({ direction })}
          />
          <p className={styles.hint}>자동은 입력에 영문이 더 많으면 한글로, 한글이 더 많으면 영문 자판으로 바꿉니다.</p>
        </fieldset>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>자판</legend>
          <p className={styles.hint}>
            두벌식 표준 자판 기준입니다. 쌍자음(ㄲ·ㄸ·ㅃ·ㅆ·ㅉ)과 ㅒ·ㅖ는 Shift를 누른 대문자(R·E·Q·T·W·O·P)로 읽고, 나머지
            대문자는 소문자와 같게 봅니다. 숫자·기호·띄어쓰기는 그대로 둡니다.
          </p>
        </fieldset>
      </div>

      <Toast message={t.toast} />
      <ShareDialog
        open={t.shareOpen}
        onClose={() => t.setShareOpen(false)}
        path="/hanyang/"
        summary={mode === "eng-to-kor" ? "영타 → 한글" : "한글 → 영타"}
      />
    </div>
  );
}

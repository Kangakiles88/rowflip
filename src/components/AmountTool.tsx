"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  AMOUNT_SAMPLE,
  convertAmounts,
  DEFAULT_AMOUNT_OPTIONS,
  type AmountOptions,
  type AmountStyle,
} from "@/utils/amount";
import { InputPanel } from "./InputPanel";
import { ResultPane } from "./ResultPane";
import { Segmented } from "./Segmented";
import { ConvertGateButton } from "./share/ConvertGateButton";
import { ShareDialog } from "./share/ShareDialog";
import { Toast } from "./Toast";
import styles from "./tool.module.css";
import { useCopyShortcut, useToolBasics } from "./useToolBasics";

const STYLES: { value: AmountStyle; label: string; title: string }[] = [
  { value: "formal", label: "금액(일금)", title: "일천이백삼십사만오천" },
  { value: "plain", label: "읽기", title: "천이백삼십사만 오천" },
  { value: "mixed", label: "숫자+단위", title: "1,234만 5,000" },
  { value: "hanja", label: "한자(갖은자)", title: "壹仟貳佰參拾肆萬伍仟" },
];

const STYLE_HINT: Record<AmountStyle, string> = {
  formal: "계약서·견적서·영수증에 쓰는 표기입니다. 고쳐 쓰지 못하게 일십·일백처럼 ‘일’을 붙이고 띄어 쓰지 않습니다.",
  plain: "소리 나는 대로 읽는 표기입니다. 한글 맞춤법대로 만 단위로 띄어 씁니다.",
  mixed: "숫자와 만·억 단위를 섞어 씁니다. 보고서·기사에서 큰 금액을 읽기 쉽게 적을 때 씁니다.",
  hanja: "壹·貳·參처럼 획을 늘린 한자(갖은자)입니다. 어음·차용증처럼 고쳐 쓰면 안 되는 문서에 씁니다.",
};

const WRAP_LABEL: Record<AmountStyle, string> = {
  formal: "‘일금 … 원정’ 붙이기",
  plain: "‘원’ 붙이기",
  mixed: "‘원’ 붙이기",
  hanja: "‘金 … 원整’ 붙이기",
};

export function AmountTool() {
  const [input, setInput] = useState("");
  const t = useToolBasics<AmountOptions>({
    storageKey: "rowflip:amount:v1",
    defaults: DEFAULT_AMOUNT_OPTIONS,
    storedKeys: ["style", "wrap", "withNumber", "spacing"],
    sanitize: (s) => {
      if (s.style && !STYLES.some((x) => x.value === s.style)) delete s.style;
      return s;
    },
  });
  const { options: o, update, gate } = t;

  const deferred = useDeferredValue(input);
  const result = useMemo(() => convertAmounts(deferred, o), [deferred, o]);
  const pending = deferred !== input;
  const hasInput = input.trim() !== "";
  const copy = () => void t.copy(result.output, hasInput);
  useCopyShortcut(copy);

  const fmt = (n: number) => n.toLocaleString("ko-KR");
  const bad = result.invalidLines;

  return (
    <div className={`${styles.tool} ${styles.toolTranspose} ${gate.locked ? styles.toolGated : ""}`}>
      <div className={styles.areaInput}>
        <InputPanel
          value={input}
          onChange={setInput}
          onSample={() => setInput(AMOUNT_SAMPLE)}
          onClear={() => setInput("")}
          rowCount={input === "" ? 0 : input.replace(/\n$/, "").split("\n").length}
          colCount={1}
          placeholder={"한글로 바꿀 금액을 붙여넣으세요. 엑셀 한 열을 그대로 붙여넣어도 됩니다.\n\n예:\n1200000\n35,000,000\n₩4,500"}
        />
      </div>

      {gate.locked && <ConvertGateButton disabled={!hasInput} onClick={t.startConvert} />}

      <div className={styles.areaOutput}>
        <ResultPane
          title={`${STYLES.find((s) => s.value === o.style)?.label} 결과`}
          value={result.output}
          waiting={gate.locked}
          pending={pending}
          modKey={t.modKey}
          onCopy={copy}
          canCopy={!gate.locked && result.converted > 0}
          placeholder="금액을 붙여넣으면 한글로 바꾼 결과가 줄마다 나옵니다."
          status={
            <>
              <span>{fmt(result.converted)}개 변환 · 줄 수는 원본과 같습니다</span>
              {bad.length > 0 && (
                <span className={styles.statusNotice}>
                  숫자가 아닌 줄 {fmt(bad.length)}개는 비웠습니다 ({bad.slice(0, 5).join(", ")}
                  {bad.length > 5 ? " …" : ""}번째 줄)
                </span>
              )}
            </>
          }
        />
      </div>

      <div className={`${styles.areaOptions} ${styles.options} ${styles.optionsTwo}`}>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>표기 방식</legend>
          <Segmented label="표기 방식" value={o.style} options={STYLES} onChange={(style) => update({ style })} />
          <p className={styles.hint}>{STYLE_HINT[o.style]}</p>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>붙이기</legend>
          <label className={styles.check}>
            <input type="checkbox" checked={o.wrap} onChange={(e) => update({ wrap: e.target.checked })} />
            {WRAP_LABEL[o.style]}
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={o.withNumber}
              onChange={(e) => update({ withNumber: e.target.checked })}
            />
            숫자 함께 쓰기 (₩1,234,000)
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={o.spacing}
              disabled={o.style !== "plain"}
              onChange={(e) => update({ spacing: e.target.checked })}
            />
            만 단위로 띄어 쓰기 (읽기 표기)
          </label>
        </fieldset>
      </div>

      <Toast message={t.toast} />
      <ShareDialog
        open={t.shareOpen}
        onClose={() => t.setShareOpen(false)}
        path="/amount/"
        summary={`${fmt(result.converted)}개 금액`}
      />
    </div>
  );
}

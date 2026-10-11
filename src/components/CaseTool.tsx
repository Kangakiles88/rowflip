"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { CASE_SAMPLE, convertCase, type CaseMode } from "@/utils/caseConvert";
import { InputPanel } from "./InputPanel";
import { ResultPane } from "./ResultPane";
import { Segmented } from "./Segmented";
import { ConvertGateButton } from "./share/ConvertGateButton";
import { ShareDialog } from "./share/ShareDialog";
import { Toast } from "./Toast";
import styles from "./tool.module.css";
import { useCopyShortcut, useToolBasics } from "./useToolBasics";

const TEXT_MODES: { value: CaseMode; label: string; title: string }[] = [
  { value: "upper", label: "대문자", title: "HELLO WORLD" },
  { value: "lower", label: "소문자", title: "hello world" },
  { value: "sentence", label: "문장 첫 글자", title: "Hello world. Next one" },
  { value: "title", label: "단어 첫 글자", title: "Hello World" },
  { value: "toggle", label: "반전", title: "hELLO wORLD" },
];

const CODE_MODES: { value: CaseMode; label: string; title: string }[] = [
  { value: "camel", label: "camelCase", title: "helloWorld" },
  { value: "pascal", label: "PascalCase", title: "HelloWorld" },
  { value: "snake", label: "snake_case", title: "hello_world" },
  { value: "constant", label: "UPPER_SNAKE", title: "HELLO_WORLD" },
  { value: "kebab", label: "kebab-case", title: "hello-world" },
];

const ALL = [...TEXT_MODES, ...CODE_MODES];

export function CaseTool() {
  const [input, setInput] = useState("");
  const t = useToolBasics<{ mode: CaseMode }>({
    storageKey: "rowflip:case:v1",
    defaults: { mode: "upper" },
    storedKeys: ["mode"],
    sanitize: (s) => (ALL.some((m) => m.value === s.mode) ? s : {}),
  });
  const { options: o, update, gate } = t;

  const deferred = useDeferredValue(input);
  const output = useMemo(() => convertCase(deferred, o.mode), [deferred, o.mode]);
  const pending = deferred !== input;
  const hasInput = input.trim() !== "";
  const copy = () => void t.copy(output, hasInput);
  useCopyShortcut(copy);
  const isCode = CODE_MODES.some((m) => m.value === o.mode);

  return (
    <div className={`${styles.tool} ${styles.toolTranspose} ${gate.locked ? styles.toolGated : ""}`}>
      <div className={styles.areaInput}>
        <InputPanel
          value={input}
          onChange={setInput}
          onSample={() => setInput(CASE_SAMPLE)}
          onClear={() => setInput("")}
          rowCount={input === "" ? 0 : input.split("\n").length}
          colCount={1}
          placeholder={"대소문자를 바꿀 영문을 붙여넣으세요.\n\n여러 줄이면 줄마다 따로 바꿉니다."}
        />
      </div>

      {gate.locked && <ConvertGateButton disabled={!hasInput} onClick={t.startConvert} />}

      <div className={styles.areaOutput}>
        <ResultPane
          title={`${ALL.find((m) => m.value === o.mode)?.label} 결과`}
          value={output}
          waiting={gate.locked}
          pending={pending}
          modKey={t.modKey}
          onCopy={copy}
          canCopy={!gate.locked && output !== ""}
          wrap={!isCode}
          placeholder="영문을 붙여넣으면 바꾼 결과가 여기에 표시됩니다."
          status={
            <span>
              {(output === "" ? 0 : output.split("\n").length).toLocaleString("ko-KR")}줄 ·{" "}
              {output.length.toLocaleString("ko-KR")}자
            </span>
          }
        />
      </div>

      <div className={`${styles.areaOptions} ${styles.options} ${styles.optionsTwo}`}>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>글 · 제목</legend>
          <Segmented
            label="글 · 제목 형식"
            value={isCode ? ("" as CaseMode) : o.mode}
            options={TEXT_MODES}
            onChange={(mode) => update({ mode })}
          />
          <p className={styles.hint}>영문 글자만 바꾸고 한글·숫자·기호는 그대로 둡니다.</p>
        </fieldset>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>변수 · 파일 이름</legend>
          <Segmented
            label="변수 · 파일 이름 형식"
            value={isCode ? o.mode : ("" as CaseMode)}
            options={CODE_MODES}
            onChange={(mode) => update({ mode })}
          />
          <p className={styles.hint}>띄어쓰기·기호·대소문자 경계에서 낱말을 나눠 이어 붙입니다. 줄마다 따로 바꿉니다.</p>
        </fieldset>
      </div>

      <Toast message={t.toast} />
      <ShareDialog
        open={t.shareOpen}
        onClose={() => t.setShareOpen(false)}
        path="/case/"
        summary={`${ALL.find((m) => m.value === o.mode)?.label}`}
      />
    </div>
  );
}

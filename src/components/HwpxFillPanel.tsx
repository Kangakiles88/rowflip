"use client";

import { useState } from "react";
import { fillTemplate, HwpxError, inputHeaderFor, inspectTemplate, ITEM_FIELDS, type ItemField, type TemplateInfo } from "@/utils/hwpx";
import {
  ESTIMATE_TOKENS,
  estimateFillLines,
  estimateFillTotals,
  estimateTokens,
  type EstimateFillSource,
} from "@/utils/hwpxEstimate";
import styles from "./tool.module.css";

/**
 * 견적서를 사용자의 한글(HWPX) 양식에 채워 내려받기.
 * 양식 파일은 브라우저 메모리에만 두고 서버로 보내거나 저장하지 않는다.
 */
export function HwpxFillPanel({
  source,
  onHeader,
}: {
  source: EstimateFillSource;
  /** 양식을 열면 그 표의 칸 순서로 만든 머리글 줄을 넘긴다(입력 칸이 비어 있을 때 채움) */
  onHeader?: (header: string) => void;
}) {
  const [file, setFile] = useState<{ name: string; bytes: Uint8Array; info: TemplateInfo } | null>(null);
  const [tableIndex, setTableIndex] = useState<number | null>(null);
  const [fields, setFields] = useState<Record<number, ItemField>>({});
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const open = async (f: File) => {
    setError("");
    setResult("");
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      const info = inspectTemplate(bytes);
      setFile({ name: f.name, bytes, info });
      setTableIndex(info.tables[0]?.index ?? null);
      setFields({});
      if (info.tables[0]) onHeader?.(inputHeaderFor(info.tables[0].columns));
    } catch (e) {
      setFile(null);
      setError(e instanceof HwpxError ? e.message : "양식을 읽지 못했습니다. 한글에서 HWPX로 다시 저장해 보세요.");
    }
  };

  const table = file?.info.tables.find((t) => t.index === tableIndex);
  const fieldOf = (col: number, guessed: ItemField) => (col in fields ? fields[col] : guessed);

  const download = () => {
    if (!file) return;
    setError("");
    try {
      const { bytes, report } = fillTemplate(file.bytes, {
        tableIndex,
        fields,
        lines: estimateFillLines(source.lines),
        totals: estimateFillTotals(source.totals),
        tokens: estimateTokens(source),
      });
      const blob = new Blob([bytes as BlobPart], { type: "application/hwp+zip" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${file.name.replace(/\.hwpx$/i, "")}-작성.hwpx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      const parts = [];
      if (tableIndex !== null) parts.push(`품목 ${report.filled}줄${report.addedRows ? `(줄 ${report.addedRows}개 늘림)` : ""}`);
      if (report.usedTokens.length) parts.push(`자리 표시 ${report.usedTokens.length}개`);
      setResult(
        `내려받았습니다: ${parts.join(", ") || "바꾼 내용 없음"}.` +
          (report.unknownTokens.length ? ` 모르는 이름: ${report.unknownTokens.map((x) => `{{${x}}}`).join(" ")}` : ""),
      );
    } catch (e) {
      setError(e instanceof HwpxError ? e.message : "파일을 만들지 못했습니다.");
    }
  };

  return (
    <fieldset className={styles.group}>
      <legend className={styles.groupTitle}>한글(HWPX) 양식에 넣기</legend>
      <div className={styles.certRow}>
        <span>양식</span>
        <span className={styles.inline}>
          <label className={styles.fileBtn}>
            {file ? "다른 양식 열기" : "HWPX 양식 열기"}
            <input
              type="file"
              accept=".hwpx"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void open(f);
                e.target.value = "";
              }}
            />
          </label>
          {file && <span className={styles.hint}>{file.name}</span>}
        </span>
      </div>

      {file && file.info.tables.length > 1 && (
        <label className={styles.certRow}>
          <span>품목 표</span>
          <select
            className={styles.select}
            value={tableIndex ?? ""}
            onChange={(e) => {
              setTableIndex(e.target.value === "" ? null : Number(e.target.value));
              setFields({});
            }}
          >
            {file.info.tables.map((t, i) => (
              <option key={t.index} value={t.index}>
                {i + 1}번째 표 ({t.columns.map((c) => c.header).filter(Boolean).slice(0, 3).join("·")}…)
              </option>
            ))}
            <option value="">표는 채우지 않음</option>
          </select>
        </label>
      )}

      {file && !file.info.tables.length && (
        <p className={styles.hintStrong}>
          품목·수량·단가 같은 머리글이 있는 표를 찾지 못했습니다. {"{{이름}}"} 자리 표시만 바꿉니다.
        </p>
      )}

      {table && (
        <>
          <p className={styles.hint}>
            양식 표의 머리글에 맞춰 칸을 연결했습니다. 빈 줄 {table.rows}줄
            {table.hasTotal ? ", 합계 줄 있음" : ""}. 틀린 칸만 고치세요.
          </p>
          {table.columns.map((c) => (
            <label key={c.col} className={styles.certRow}>
              <span title={c.header}>{c.header || `${c.col + 1}번째 칸`}</span>
              <select
                className={styles.select}
                value={fieldOf(c.col, c.field)}
                onChange={(e) => setFields((m) => ({ ...m, [c.col]: e.target.value as ItemField }))}
              >
                {ITEM_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </>
      )}

      {file && tableIndex !== null && !source.lines.length && (
        <p className={styles.hintStrong}>
          왼쪽 입력 칸에 품목을 넣으세요. 첫 줄에 양식에 맞춘 머리글을 넣어 두었으니, 엑셀에서 붙여넣거나 다음 줄부터
          ‘의자 T-ZERO 1 134000’처럼 같은 순서로 띄어 쓰면 됩니다.
        </p>
      )}
      {file && (
        <div className={styles.inline}>
          <button type="button" className={styles.outlineBtn} onClick={download} disabled={!source.lines.length && tableIndex !== null}>
            채워서 HWPX로 내려받기
          </button>
        </div>
      )}

      {error && <p className={styles.hintStrong}>{error}</p>}
      {result && <p className={styles.hint}>{result}</p>}
      <p className={styles.hint}>
        회사에서 쓰는 한글 견적서 양식에 위 품목과 정보를 채웁니다. 표는 머리글(품목·규격·수량·단가·금액)을 읽어 아래 빈 줄에
        넣고, 줄이 모자라면 늘립니다. 양식 본문에 {ESTIMATE_TOKENS.slice(0, 6).map((t) => `{{${t}}}`).join(" ")} 같은
        자리 표시를 적어 두면 그 자리에 값이 들어갑니다.
      </p>
      <p className={styles.hint}>
        예전 HWP 파일은 한글에서 ‘다른 이름으로 저장 → HWPX’로 바꿔 올리세요. 양식 파일은 서버로 보내거나 저장하지
        않습니다.
      </p>
    </fieldset>
  );
}

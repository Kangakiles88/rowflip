"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  autoMap,
  buildCertificates,
  getTemplate,
  parseRoster,
  TEMPLATES,
  type CommonValues,
  type DateStyle,
  type FieldKey,
  type FieldMapping,
  type TemplateId,
} from "@/utils/certificate";
import { trackPrint } from "@/utils/tracking";
import { CertificatePage } from "./CertificatePage";
import { InputPanel } from "./InputPanel";
import { ResultPane } from "./ResultPane";
import { Segmented } from "./Segmented";
import { ConvertGateButton } from "./share/ConvertGateButton";
import { ShareDialog } from "./share/ShareDialog";
import { Toast } from "./Toast";
import styles from "./tool.module.css";
import { useCopyShortcut, useToolBasics } from "./useToolBasics";

/** 한 번에 인쇄하는 최대 장 수 — 브라우저가 버거워하지 않을 만큼 */
const MAX_PRINT = 500;

interface CertOptions {
  template: TemplateId;
  font: "serif" | "sans";
  dateStyle: DateStyle;
}

const DEFAULTS: CertOptions = { template: "award", font: "serif", dateStyle: "dot" };
const TEMPLATE_CHOICES = TEMPLATES.map((t) => ({ value: t.id, label: t.label }));
const FONT_CHOICES = [
  { value: "serif" as const, label: "명조" },
  { value: "sans" as const, label: "고딕" },
];

function todayIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function CertificateTool() {
  const [input, setInput] = useState("");
  const t = useToolBasics<CertOptions>({
    storageKey: "rowflip:certificate:v1",
    defaults: DEFAULTS,
    // 양식·글꼴·날짜 형식만 기억한다. 명단·기관명·본문 문구는 저장하지 않는다
    storedKeys: ["template", "font", "dateStyle"],
    sanitize: (s) => {
      if (s.template && !TEMPLATES.some((x) => x.id === s.template)) delete s.template;
      if (s.font && s.font !== "serif" && s.font !== "sans") delete s.font;
      if (s.dateStyle && s.dateStyle !== "dot" && s.dateStyle !== "korean") delete s.dateStyle;
      return s;
    },
  });
  const { options: o, update, gate } = t;
  const template = getTemplate(o.template);

  const [common, setCommon] = useState<Omit<CommonValues, "dateStyle">>({
    date: "",
    issuer: "",
    signer: "",
    autoNumber: true,
    numberPrefix: "",
    body: template.body,
  });
  const setC = (patch: Partial<typeof common>) => setCommon((c) => ({ ...c, ...patch }));

  // 오늘 날짜·올해 번호는 브라우저에서 정한다(정적 HTML에 빌드 날짜가 박히지 않게)
  useEffect(() => {
    const today = todayIso();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 날짜를 마운트 후 1회 반영
    setCommon((c) => ({
      ...c,
      date: c.date || today,
      numberPrefix: c.numberPrefix || `${today.slice(0, 4)}-`,
    }));
  }, []);

  // 저장된 양식을 불러오면 본문도 그 양식 기본 문구로
  const [bodyFor, setBodyFor] = useState<TemplateId>(DEFAULTS.template);
  useEffect(() => {
    if (bodyFor === o.template) return;
    const prev = getTemplate(bodyFor);
    // 본문을 고치지 않았을 때만 새 양식 문구로 바꾼다
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 양식이 바뀔 때 기본 문구 맞추기
    setCommon((c) => (c.body === prev.body ? { ...c, body: getTemplate(o.template).body } : c));
    setBodyFor(o.template);
  }, [o.template, bodyFor]);

  const deferred = useDeferredValue(input);
  const roster = useMemo(() => parseRoster(deferred), [deferred]);
  const pending = deferred !== input;

  // 칸 연결: 머리글로 자동 연결 + 사용자가 고친 것. 양식이나 머리글이 바뀌면 다시 자동으로
  const sig = `${o.template}\u0000${roster.headers.join("\u0001")}`;
  const auto = useMemo(() => autoMap(template, roster.headers), [template, roster.headers]);
  const [manual, setManual] = useState<{ sig: string; map: FieldMapping }>({ sig: "", map: {} });
  const mapping = useMemo<FieldMapping>(
    () => (manual.sig === sig ? { ...auto, ...manual.map } : auto),
    [auto, manual, sig],
  );
  const setField = (key: FieldKey, col: number) =>
    setManual((m) => ({ sig, map: { ...(m.sig === sig ? m.map : {}), [key]: col } }));

  const commonValues: CommonValues = useMemo(() => ({ ...common, dateStyle: o.dateStyle }), [common, o.dateStyle]);
  const built = useMemo(
    () => buildCertificates(roster, template, mapping, commonValues, MAX_PRINT),
    [roster, template, mapping, commonValues],
  );
  const { items, total, missing } = built;

  const [page, setPage] = useState(0);
  const current = Math.min(page, Math.max(0, items.length - 1));

  const hasInput = total > 0;
  const print = useCallback(() => {
    if (gate.locked) {
      if (hasInput) t.startConvert();
      return;
    }
    if (!hasInput) return;
    trackPrint();
    window.print();
  }, [gate.locked, hasInput, t]);
  useCopyShortcut(print);

  const sample = () => {
    setInput(template.sample);
    setCommon((c) => ({
      ...c,
      issuer: c.issuer || template.sampleIssuer,
      signer: c.signer || template.sampleSigner,
    }));
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 포털은 브라우저에서만
    setMounted(true);
  }, []);

  // 크게 보기 — 결과 창이 작아 글씨를 확인하기 어려워서 화면 가득 한 장씩 본다
  const [zoom, setZoom] = useState(false);
  const zoomRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = zoomRef.current;
    if (!d) return;
    if (zoom && !d.open) d.showModal();
    if (!zoom && d.open) d.close();
  }, [zoom]);

  const numberMapped = (mapping.number ?? -1) >= 0;
  const fmt = (n: number) => n.toLocaleString("ko-KR");

  const status = (
    <>
      <span>
        {fmt(total)}명 · {fmt(items.length)}장 인쇄
        {total > MAX_PRINT && ` (한 번에 ${fmt(MAX_PRINT)}장까지 — 명단을 나눠 주세요)`}
      </span>
      {missing.length > 0 ? (
        <span className={styles.statusNotice}>
          본문의 {missing.map((m) => `{${m}}`).join(", ")}에 넣을 값이 없습니다
        </span>
      ) : (
        <span>인쇄 창에서 ‘PDF로 저장’을 고르면 PDF 파일이 됩니다</span>
      )}
    </>
  );

  const go = useCallback(
    (delta: number) => setPage((p) => Math.min(Math.max(0, Math.min(p, items.length - 1) + delta), items.length - 1)),
    [items.length],
  );
  const pagerControls = (
    <span className={styles.certPager}>
      <button type="button" className={styles.ghost} onClick={() => go(-1)} disabled={current === 0} aria-label="이전 장">
        ‹
      </button>
      <span className={styles.certPagerText}>
        {current + 1} / {fmt(items.length)}
      </span>
      <button
        type="button"
        className={styles.ghost}
        onClick={() => go(1)}
        disabled={current >= items.length - 1}
        aria-label="다음 장"
      >
        ›
      </button>
    </span>
  );
  const canPreview = !gate.locked && hasInput && !!items[current];
  const pager = canPreview ? (
    <>
      {items.length > 1 && pagerControls}
      <button type="button" className={`${styles.ghost} ${styles.certZoomBtn}`} onClick={() => setZoom(true)}>
        크게 보기
      </button>
    </>
  ) : null;

  return (
    <div className={`${styles.tool} ${styles.toolTranspose} ${gate.locked ? styles.toolGated : ""}`}>
      <div className={styles.areaInput}>
        <InputPanel
          value={input}
          onChange={setInput}
          onSample={sample}
          onClear={() => setInput("")}
          rowCount={total}
          colCount={roster.headers.length}
          placeholder={
            "엑셀에서 명단을 머리글(첫 행)까지 복사해 붙여넣으세요.\n\n예:\n성명\t소속\t수상명\n김민준\t2학년 3반\t우수상\n이서연\t2학년 1반\t최우수상"
          }
        />
      </div>

      {gate.locked && <ConvertGateButton disabled={!hasInput} onClick={t.startConvert} />}

      <div className={styles.areaOutput}>
        <ResultPane
          title="미리보기"
          primaryLabel="인쇄·PDF 저장"
          waiting={gate.locked}
          pending={pending}
          modKey={t.modKey}
          onCopy={print}
          canCopy={hasInput}
          actions={pager}
          placeholder="명단을 붙여넣으면 한 사람에 한 장씩 미리보기가 나옵니다."
          status={hasInput ? status : <span>첫 행은 머리글(성명·소속 등)로 봅니다</span>}
        >
          {hasInput && items[current] ? (
            <div className={styles.certViewer} id="result">
              <button
                type="button"
                className={styles.certSheet}
                onClick={() => setZoom(true)}
                aria-label="크게 보기"
                title="크게 보기"
              >
                <CertificatePage cert={items[current]} font={o.font} preview />
              </button>
            </div>
          ) : undefined}
        </ResultPane>
      </div>

      <div className={`${styles.areaOptions} ${styles.options} ${styles.optionsCert}`}>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>양식</legend>
          <Segmented
            label="양식"
            value={o.template}
            options={TEMPLATE_CHOICES}
            onChange={(template: TemplateId) => update({ template })}
          />
          <div className={styles.inline}>
            <span className={styles.certLabel}>글꼴</span>
            <Segmented label="글꼴" value={o.font} options={FONT_CHOICES} onChange={(font) => update({ font })} />
          </div>
          <p className={styles.hint}>A4 세로 한 장에 한 사람씩 들어갑니다.</p>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>칸 연결</legend>
          {template.fields.map((f) => (
            <label key={f.key} className={styles.certRow}>
              <span>{f.label}</span>
              <select
                className={styles.select}
                value={mapping[f.key] ?? -1}
                onChange={(e) => setField(f.key, Number(e.target.value))}
              >
                <option value={-1}>{f.place === "number" ? "자동 번호" : "넣지 않음"}</option>
                {roster.headers.map((h, i) => (
                  <option key={i} value={i}>
                    {h}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <p className={styles.hint}>
            {template.fields.some((f) => f.place === "title")
              ? "수상명은 큰 제목으로 들어갑니다. 비우면 ‘상 장’."
              : "머리글 이름이 같으면 자동으로 연결됩니다."}
          </p>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>발급 정보</legend>
          <div className={styles.certRow}>
            <span>발급일</span>
            <span className={styles.inline}>
              <input
                className={styles.input}
                type="date"
                aria-label="발급일"
                value={common.date}
                onChange={(e) => setC({ date: e.target.value })}
              />
              <select
                aria-label="날짜 형식"
                className={styles.select}
                value={o.dateStyle}
                onChange={(e) => update({ dateStyle: e.target.value as DateStyle })}
              >
                <option value="dot">2026. 10. 11.</option>
                <option value="korean">2026년 10월 11일</option>
              </select>
            </span>
          </div>
          <label className={styles.certRow}>
            <span>기관·직함</span>
            <input
              className={styles.input}
              placeholder="예: 한빛초등학교장"
              value={common.issuer}
              onChange={(e) => setC({ issuer: e.target.value })}
            />
          </label>
          <label className={styles.certRow}>
            <span>대표자</span>
            <input
              className={styles.input}
              placeholder="예: 이서준"
              value={common.signer}
              onChange={(e) => setC({ signer: e.target.value })}
            />
          </label>
          <div className={styles.certRow}>
            <span>번호</span>
            <span className={styles.inline}>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={common.autoNumber}
                  disabled={numberMapped}
                  onChange={(e) => setC({ autoNumber: e.target.checked })}
                />
                자동
              </label>
              <input
                className={`${styles.input} ${styles.mono}`}
                aria-label="번호 앞부분"
                style={{ width: 84 }}
                value={common.numberPrefix}
                disabled={numberMapped || !common.autoNumber}
                onChange={(e) => setC({ numberPrefix: e.target.value })}
              />
              <span className={styles.hint}>제 {common.numberPrefix}001 호</span>
            </span>
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>본문 문구</legend>
          <textarea
            className={`${styles.input} ${styles.certBody}`}
            aria-label="본문 문구"
            value={common.body}
            onChange={(e) => setC({ body: e.target.value })}
            rows={4}
          />
          <div className={styles.inline}>
            <p className={styles.hint}>
              {"{성명}"}처럼 칸 이름이나 머리글을 넣으면 사람마다 바뀝니다. 뒤 조사(은/는·으로/로)도 맞춰 줍니다.
            </p>
            {common.body !== template.body && (
              <button type="button" className={styles.ghost} onClick={() => setC({ body: template.body })}>
                기본 문구로
              </button>
            )}
          </div>
        </fieldset>
      </div>

      {mounted &&
        !gate.locked &&
        hasInput &&
        createPortal(
          <div className="certPrintRoot" aria-hidden="true">
            <style>{"@page { size: A4 portrait; margin: 0; }"}</style>
            {items.map((c, i) => (
              <CertificatePage key={i} cert={c} font={o.font} />
            ))}
          </div>,
          document.body,
        )}

      <dialog
        ref={zoomRef}
        className={styles.certZoom}
        aria-label="미리보기 크게 보기"
        onClose={() => setZoom(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setZoom(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
      >
        <div className={styles.certZoomHead}>
          <strong>미리보기</strong>
          {items.length > 1 && pagerControls}
          <button type="button" className={styles.ghost} onClick={() => setZoom(false)}>
            닫기
          </button>
        </div>
        <div className={styles.certZoomBody}>
          {zoom && canPreview && (
            <div className={styles.certZoomSheet}>
              <CertificatePage cert={items[current]} font={o.font} preview />
            </div>
          )}
        </div>
      </dialog>

      <Toast message={t.toast} />
      <ShareDialog
        open={t.shareOpen}
        onClose={() => t.setShareOpen(false)}
        path="/certificate/"
        summary={`${fmt(total)}장`}
      />
    </div>
  );
}

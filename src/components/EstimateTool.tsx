"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatDate } from "@/utils/certificate";
import { computeEstimate, ESTIMATE_SAMPLE, parseItems, won, type VatMode } from "@/utils/estimate";
import { trackPrint } from "@/utils/tracking";
import { EstimateDoc, type EstimateDocData, type Supplier } from "./EstimateDoc";
import { InputPanel } from "./InputPanel";
import { ResultPane } from "./ResultPane";
import { Segmented } from "./Segmented";
import { ConvertGateButton } from "./share/ConvertGateButton";
import { ShareDialog } from "./share/ShareDialog";
import { Toast } from "./Toast";
import styles from "./tool.module.css";
import { useCopyShortcut, useToolBasics } from "./useToolBasics";

interface EstimateOptions {
  vat: VatMode;
  /** 유효기간: 견적일로부터 며칠(0 = 표시 안 함) */
  validDays: number;
}

const DEFAULTS: EstimateOptions = { vat: "exclusive", validDays: 30 };

const VAT_CHOICES: { value: VatMode; label: string }[] = [
  { value: "exclusive", label: "부가세 별도" },
  { value: "inclusive", label: "부가세 포함" },
  { value: "none", label: "없음(면세)" },
];
const VAT_HINT: Record<VatMode, string> = {
  exclusive: "단가는 공급가액입니다. 세액 10%를 따로 더합니다(원 미만 버림).",
  inclusive: "단가에 부가세가 들어 있습니다. 금액을 공급가액(÷1.1)과 세액으로 나눕니다.",
  none: "면세 품목이나 간이과세자처럼 세액을 따로 적지 않을 때 고르세요.",
};
const VALID_CHOICES = [0, 7, 15, 30, 60];

const EMPTY_SUPPLIER: Supplier = { bizNo: "", name: "", ceo: "", address: "", bizType: "", bizItem: "", phone: "" };
const SAMPLE_SUPPLIER: Supplier = {
  bizNo: "123-45-67890",
  name: "한빛오피스",
  ceo: "이서준",
  address: "서울특별시 중구 세종대로 110, 3층",
  bizType: "도소매",
  bizItem: "사무용품",
  phone: "02-1234-5678",
};

const SUPPLIER_FIELDS: { key: keyof Supplier; label: string; placeholder: string }[] = [
  { key: "name", label: "상호", placeholder: "예: 한빛오피스" },
  { key: "ceo", label: "대표자", placeholder: "예: 이서준" },
  { key: "bizNo", label: "등록번호", placeholder: "000-00-00000" },
  { key: "address", label: "주소", placeholder: "사업장 주소" },
  { key: "bizType", label: "업태", placeholder: "예: 도소매" },
  { key: "bizItem", label: "종목", placeholder: "예: 사무용품" },
  { key: "phone", label: "연락처", placeholder: "예: 02-1234-5678" },
];

function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return isoDate(new Date(y, m - 1, d + days));
}

export function EstimateTool() {
  const [input, setInput] = useState("");
  const t = useToolBasics<EstimateOptions>({
    storageKey: "rowflip:estimate:v1",
    defaults: DEFAULTS,
    // 부가세 방식·유효기간만 기억한다. 품목·거래처·공급자 정보는 저장하지 않는다
    storedKeys: ["vat", "validDays"],
    sanitize: (s) => {
      if (s.vat && !VAT_CHOICES.some((c) => c.value === s.vat)) delete s.vat;
      if (s.validDays !== undefined && !VALID_CHOICES.includes(s.validDays)) delete s.validDays;
      return s;
    },
  });
  const { options: o, update, gate } = t;

  const [date, setDate] = useState("");
  const [client, setClient] = useState("");
  const [number, setNumber] = useState("");
  const [note, setNote] = useState("");
  const [supplier, setSupplier] = useState<Supplier>(EMPTY_SUPPLIER);
  const setSp = (key: keyof Supplier, value: string) => setSupplier((sp) => ({ ...sp, [key]: value }));

  // 오늘 날짜는 브라우저에서 정한다(정적 HTML에 빌드 날짜가 박히지 않게)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 날짜를 마운트 후 1회 반영
    setDate((d) => d || isoDate(new Date()));
  }, []);

  const deferred = useDeferredValue(input);
  const parsed = useMemo(() => parseItems(deferred), [deferred]);
  const { lines, totals } = useMemo(() => computeEstimate(parsed.items, o.vat), [parsed.items, o.vat]);
  const pending = deferred !== input;
  const hasInput = lines.length > 0;

  const data: EstimateDocData = {
    date: date ? formatDate(date, "dot") : "",
    validUntil: date && o.validDays > 0 ? formatDate(addDays(date, o.validDays), "dot") : "",
    number: number.trim(),
    client: client.trim(),
    supplier,
    lines,
    totals,
    vat: o.vat,
    note,
  };

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
    setInput(ESTIMATE_SAMPLE);
    setClient((c) => c || "주식회사 다온");
    setSupplier((sp) => (Object.values(sp).some((x) => x) ? sp : SAMPLE_SUPPLIER));
    setNote((n) => n || "· 결제 조건: 납품 후 30일 이내 계좌 이체\n· 납기: 발주 후 7일 이내");
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 포털은 브라우저에서만
    setMounted(true);
  }, []);

  // 크게 보기
  const [zoom, setZoom] = useState(false);
  const zoomRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = zoomRef.current;
    if (!d) return;
    if (zoom && !d.open) d.showModal();
    if (!zoom && d.open) d.close();
  }, [zoom]);

  const bad = parsed.invalidLines;
  const status = (
    <>
      <span>
        품목 {lines.length}개 · 공급가액 {won(totals.supply)} · 세액 {won(totals.tax)} · 합계 {won(totals.total)}원
      </span>
      {parsed.spaced && parsed.items.length > 0 && (
        <span className={styles.statusNotice}>띄어쓰기로 칸을 나눴습니다. 품목이 잘못 나뉘면 칸 사이를 탭으로 띄우거나 엑셀에서 복사해 넣으세요.</span>
      )}
      {bad.length > 0 && (
        <span className={styles.statusNotice}>
          수량·단가가 숫자가 아닌 줄 {bad.length}개는 뺐습니다 ({bad.slice(0, 5).join(", ")}번째 줄)
        </span>
      )}
    </>
  );

  const canPreview = !gate.locked && hasInput;

  return (
    <div className={`${styles.tool} ${styles.toolTranspose} ${gate.locked ? styles.toolGated : ""}`}>
      <div className={styles.areaInput}>
        <InputPanel
          title="품목 (엑셀에서 붙여넣기)"
          value={input}
          onChange={setInput}
          onSample={sample}
          onClear={() => setInput("")}
          rowCount={parsed.items.length}
          colCount={1}
          placeholder={
            "엑셀에서 품목 표를 복사해 붙여넣으세요. 첫 행에 머리글(품목·규격·수량·단가·비고)이 있으면 순서가 달라도 됩니다.\n\n예:\n품목\t규격\t수량\t단가\n사무용 의자\tT-ZERO\t4\t189,000\nA4 복사용지\t80g\t10\t27,500\n\n팁: 엑셀에서 표 안의 칸 하나를 누르고 Ctrl+A(맥은 ⌘+A)를 누르면 표 전체가 선택됩니다."
          }
        />
      </div>

      {gate.locked && <ConvertGateButton disabled={!hasInput} onClick={t.startConvert} />}

      <div className={styles.areaOutput}>
        <ResultPane
          title="견적서 미리보기"
          primaryLabel="인쇄·PDF 저장"
          waiting={gate.locked}
          pending={pending}
          modKey={t.modKey}
          onCopy={print}
          canCopy={hasInput}
          actions={
            canPreview ? (
              <button type="button" className={`${styles.ghost} ${styles.certZoomBtn}`} onClick={() => setZoom(true)}>
                크게 보기
              </button>
            ) : null
          }
          placeholder="품목을 붙여넣으면 견적서 미리보기가 나옵니다."
          status={hasInput ? status : <span>공급자·거래처 정보는 아래에서 넣습니다</span>}
        >
          {canPreview ? (
            <div className={styles.certViewer} id="result">
              <button
                type="button"
                className={`${styles.certSheet} ${styles.estSheet}`}
                onClick={() => setZoom(true)}
                aria-label="크게 보기"
                title="크게 보기"
              >
                <EstimateDoc data={data} preview />
              </button>
            </div>
          ) : undefined}
        </ResultPane>
      </div>

      <div className={`${styles.areaOptions} ${styles.options} ${styles.optionsCert}`}>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>받는 곳 · 견적 정보</legend>
          <label className={styles.certRow}>
            <span>거래처</span>
            <input
              className={styles.input}
              placeholder="예: 주식회사 다온"
              value={client}
              onChange={(e) => setClient(e.target.value)}
            />
          </label>
          <label className={styles.certRow}>
            <span>견적일</span>
            <input className={styles.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className={styles.certRow}>
            <span>유효기간</span>
            <select
              className={styles.select}
              value={o.validDays}
              onChange={(e) => update({ validDays: Number(e.target.value) })}
            >
              {VALID_CHOICES.map((d) => (
                <option key={d} value={d}>
                  {d === 0 ? "표시 안 함" : `견적일로부터 ${d}일`}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.certRow}>
            <span>견적번호</span>
            <input
              className={`${styles.input} ${styles.mono}`}
              placeholder="선택 (예: Q-2026-001)"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </label>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>공급자 (보내는 쪽)</legend>
          {SUPPLIER_FIELDS.map((f) => (
            <label key={f.key} className={styles.certRow}>
              <span>{f.label}</span>
              <input
                className={styles.input}
                placeholder={f.placeholder}
                value={supplier[f.key]}
                onChange={(e) => setSp(f.key, e.target.value)}
              />
            </label>
          ))}
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>부가세</legend>
          <Segmented label="부가세" value={o.vat} options={VAT_CHOICES} onChange={(vat) => update({ vat })} />
          <p className={styles.hint}>{VAT_HINT[o.vat]}</p>
          <p className={styles.hint}>
            합계는 ‘일금 ○○원정 (₩…)’으로 한글과 숫자를 함께 적습니다.
          </p>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>비고</legend>
          <textarea
            className={`${styles.input} ${styles.certBody}`}
            aria-label="비고"
            placeholder={"결제 조건, 납기, 하자 보증 기간 등\n예: 납품 후 30일 이내 계좌 이체"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
          />
          <p className={styles.hint}>입력한 거래처·공급자 정보와 품목은 저장하지 않습니다. 새로고침하면 지워집니다.</p>
        </fieldset>
      </div>

      <dialog
        ref={zoomRef}
        className={styles.certZoom}
        aria-label="견적서 크게 보기"
        onClose={() => setZoom(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setZoom(false);
        }}
      >
        <div className={styles.certZoomHead}>
          <strong>견적서 미리보기</strong>
          <button type="button" className={styles.ghost} onClick={() => setZoom(false)}>
            닫기
          </button>
        </div>
        <div className={styles.certZoomBody}>
          {zoom && canPreview && (
            <div className={`${styles.certZoomSheet} ${styles.estZoomSheet}`}>
              <EstimateDoc data={data} preview />
            </div>
          )}
        </div>
      </dialog>

      {mounted &&
        canPreview &&
        createPortal(
          <div className="certPrintRoot" aria-hidden="true">
            <style>{"@page { size: A4 portrait; margin: 12mm; }"}</style>
            <EstimateDoc data={data} />
          </div>,
          document.body,
        )}

      <Toast message={t.toast} />
      <ShareDialog
        open={t.shareOpen}
        onClose={() => t.setShareOpen(false)}
        path="/estimate/"
        summary={`합계 ${won(totals.total)}원`}
      />
    </div>
  );
}

"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatDate } from "@/utils/certificate";
import { computeEstimate, parseItems, won, type VatMode } from "@/utils/estimate";
import { moneyInput, STATEMENT_SAMPLE, statementBalance } from "@/utils/statement";
import { trackPrint } from "@/utils/tracking";
import { EMPTY_PARTY, isoDate, PARTY_FIELDS, SAMPLE_SUPPLIER, VAT_CHOICES, VAT_HINT } from "./docFields";
import type { Supplier } from "./EstimateDoc";
import { InputPanel } from "./InputPanel";
import { ResultPane } from "./ResultPane";
import { Segmented } from "./Segmented";
import { ConvertGateButton } from "./share/ConvertGateButton";
import { ShareDialog } from "./share/ShareDialog";
import { StatementDoc, type StatementCopies, type StatementDocData } from "./StatementDoc";
import { Toast } from "./Toast";
import styles from "./tool.module.css";
import { useCopyShortcut, useToolBasics } from "./useToolBasics";

interface StatementOptions {
  vat: VatMode;
  copies: StatementCopies;
}

const DEFAULTS: StatementOptions = { vat: "exclusive", copies: "two" };

const COPY_CHOICES: { value: StatementCopies; label: string }[] = [
  { value: "two", label: "두 부 (위·아래)" },
  { value: "one", label: "한 부" },
];
const COPY_HINT: Record<StatementCopies, string> = {
  two: "A4 한 장에 공급자 보관용과 공급받는자 보관용을 위아래로 찍습니다. 품목이 많으면 한 부씩 다음 쪽으로 넘어갑니다.",
  one: "A4 한 장에 한 부만 크게 찍습니다. 품목이 많으면 다음 쪽으로 이어지고 표 머리글이 반복됩니다.",
};

const SAMPLE_BUYER: Supplier = {
  bizNo: "214-86-12345",
  name: "주식회사 다온",
  ceo: "김민수",
  address: "서울특별시 강남구 테헤란로 152, 12층",
  bizType: "서비스",
  bizItem: "소프트웨어 개발",
  phone: "02-555-0123",
};

export function StatementTool() {
  const [input, setInput] = useState("");
  const t = useToolBasics<StatementOptions>({
    storageKey: "rowflip:statement:v1",
    defaults: DEFAULTS,
    // 부가세 방식·찍는 부수만 기억한다. 품목·거래처·공급자·금액은 저장하지 않는다
    storedKeys: ["vat", "copies"],
    sanitize: (s) => {
      if (s.vat && !VAT_CHOICES.some((c) => c.value === s.vat)) delete s.vat;
      if (s.copies && !COPY_CHOICES.some((c) => c.value === s.copies)) delete s.copies;
      return s;
    },
  });
  const { options: o, update, gate } = t;

  const [date, setDate] = useState("");
  const [number, setNumber] = useState("");
  const [prev, setPrev] = useState("");
  const [paid, setPaid] = useState("");
  const [note, setNote] = useState("");
  const [buyer, setBuyer] = useState<Supplier>(EMPTY_PARTY);
  const [supplier, setSupplier] = useState<Supplier>(EMPTY_PARTY);

  // 오늘 날짜는 브라우저에서 정한다(정적 HTML에 빌드 날짜가 박히지 않게)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 날짜를 마운트 후 1회 반영
    setDate((d) => d || isoDate(new Date()));
  }, []);

  const deferred = useDeferredValue(input);
  const parsed = useMemo(() => parseItems(deferred), [deferred]);
  const { lines, totals } = useMemo(() => computeEstimate(parsed.items, o.vat), [parsed.items, o.vat]);
  const balance = statementBalance(totals.total, moneyInput(prev), moneyInput(paid));
  const pending = deferred !== input;
  const hasInput = lines.length > 0;

  const data: StatementDocData = {
    date: date ? formatDate(date, "dot") : "",
    number: number.trim(),
    buyer,
    supplier,
    lines,
    totals,
    balance,
    vat: o.vat,
    note,
    copies: o.copies,
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
    setInput(STATEMENT_SAMPLE);
    setBuyer((b) => (Object.values(b).some((x) => x) ? b : SAMPLE_BUYER));
    setSupplier((sp) => (Object.values(sp).some((x) => x) ? sp : SAMPLE_SUPPLIER));
    setPrev((p) => p || "350,000");
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 포털은 브라우저에서만
    setMounted(true);
  }, []);

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
        품목 {lines.length}개 · 합계 {won(totals.total)}원 · 잔액 {won(balance.balance)}원
      </span>
      {parsed.spaced && parsed.items.length > 0 && (
        <span className={styles.statusNotice}>
          띄어쓰기로 칸을 나눴습니다. 품목이 잘못 나뉘면 칸 사이를 탭으로 띄우거나 엑셀에서 복사해 넣으세요.
        </span>
      )}
      {bad.length > 0 && (
        <span className={styles.statusNotice}>
          수량·단가가 숫자가 아닌 줄 {bad.length}개는 뺐습니다 ({bad.slice(0, 5).join(", ")}번째 줄)
        </span>
      )}
    </>
  );

  const canPreview = !gate.locked && hasInput;
  const partyGroup = (title: string, value: Supplier, set: (v: Supplier) => void) => (
    <fieldset className={styles.group}>
      <legend className={styles.groupTitle}>{title}</legend>
      {PARTY_FIELDS.map((f) => (
        <label key={f.key} className={styles.certRow}>
          <span>{f.label}</span>
          <input
            className={styles.input}
            placeholder={f.placeholder}
            value={value[f.key]}
            onChange={(e) => set({ ...value, [f.key]: e.target.value })}
          />
        </label>
      ))}
    </fieldset>
  );

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
            "엑셀에서 품목 표를 머리글까지 복사해 붙여넣으세요. 머리글(월일·품목·규격·수량·단가·비고)이 있으면 순서가 달라도 됩니다.\n\n예:\n월일\t품목\t수량\t단가\n10/14\tA4 복사용지\t10\t27,500\n10/17\t사무용 의자\t4\t189,000\n\n팁: 엑셀에서 표 안의 칸 하나를 누르고 Ctrl+A(맥은 ⌘+A)를 누르면 표 전체가 선택됩니다."
          }
        />
      </div>

      {gate.locked && <ConvertGateButton disabled={!hasInput} onClick={t.startConvert} />}

      <div className={styles.areaOutput}>
        <ResultPane
          title="거래명세서 미리보기"
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
          placeholder="품목을 붙여넣으면 거래명세서 미리보기가 나옵니다."
          status={hasInput ? status : <span>공급자·공급받는자 정보는 아래에서 넣습니다</span>}
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
                <StatementDoc data={data} preview />
              </button>
            </div>
          ) : undefined}
        </ResultPane>
      </div>

      <div className={`${styles.areaOptions} ${styles.options} ${styles.optionsCert}`}>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>거래 정보</legend>
          <label className={styles.certRow}>
            <span>거래일자</span>
            <input className={styles.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className={styles.certRow}>
            <span>번호</span>
            <input
              className={`${styles.input} ${styles.mono}`}
              placeholder="선택 (예: 2026-1020-01)"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </label>
          <label className={styles.certRow}>
            <span>전잔액</span>
            <input
              className={`${styles.input} ${styles.mono}`}
              inputMode="numeric"
              placeholder="지난 미수금 (없으면 비움)"
              value={prev}
              onChange={(e) => setPrev(e.target.value)}
            />
          </label>
          <label className={styles.certRow}>
            <span>입금액</span>
            <input
              className={`${styles.input} ${styles.mono}`}
              inputMode="numeric"
              placeholder="이번에 받은 돈 (없으면 비움)"
              value={paid}
              onChange={(e) => setPaid(e.target.value)}
            />
          </label>
          <p className={styles.hint}>잔액 = 전잔액 + 이번 합계 − 입금액</p>
        </fieldset>

        {partyGroup("공급받는자 (받는 쪽)", buyer, setBuyer)}
        {partyGroup("공급자 (보내는 쪽)", supplier, setSupplier)}

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>부가세 · 인쇄</legend>
          <Segmented label="부가세" value={o.vat} options={VAT_CHOICES} onChange={(vat) => update({ vat })} />
          <p className={styles.hint}>{VAT_HINT[o.vat]}</p>
          <Segmented
            label="찍는 부수"
            value={o.copies}
            options={COPY_CHOICES}
            onChange={(copies) => update({ copies })}
          />
          <p className={styles.hint}>{COPY_HINT[o.copies]}</p>
          <textarea
            className={`${styles.input} ${styles.certBody}`}
            aria-label="비고"
            placeholder={"비고 (선택)\n예: 계좌 국민 123456-01-123456 한빛오피스"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
          <p className={styles.hint}>입력한 거래처·금액·품목은 저장하지 않습니다. 새로고침하면 지워집니다.</p>
          <p className={styles.hint}>인쇄 창 ‘설정 더보기’에서 ‘머리글과 바닥글’을 끄면 종이에 주소·날짜가 찍히지 않습니다.</p>
        </fieldset>
      </div>

      <dialog
        ref={zoomRef}
        className={styles.certZoom}
        aria-label="거래명세서 크게 보기"
        onClose={() => setZoom(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setZoom(false);
        }}
      >
        <div className={styles.certZoomHead}>
          <strong>거래명세서 미리보기</strong>
          <button type="button" className={styles.ghost} onClick={() => setZoom(false)}>
            닫기
          </button>
        </div>
        <div className={styles.certZoomBody}>
          {zoom && canPreview && (
            <div className={`${styles.certZoomSheet} ${styles.estZoomSheet}`}>
              <StatementDoc data={data} preview />
            </div>
          )}
        </div>
      </dialog>

      {mounted &&
        canPreview &&
        createPortal(
          <div className="certPrintRoot" aria-hidden="true">
            <style>{"@page { size: A4 portrait; margin: 10mm; }"}</style>
            <StatementDoc data={data} />
          </div>,
          document.body,
        )}

      <Toast message={t.toast} />
      <ShareDialog
        open={t.shareOpen}
        onClose={() => t.setShareOpen(false)}
        path="/statement/"
        summary={`합계 ${won(totals.total)}원`}
      />
    </div>
  );
}

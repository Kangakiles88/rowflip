"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { copyText } from "@/utils/clipboard";
import { copiedMessage } from "@/utils/bookmarkHint";
import {
  DONATION_CODES,
  DONATION_SAMPLE,
  detectYear,
  maskId,
  parseLedger,
  receiptLines,
  serialNo,
  sortDonors,
  summaryTable,
  type DetailMode,
  type DonationCode,
  type SortMode,
} from "@/utils/donation";
import { won } from "@/utils/estimate";
import { excelHtmlForRows } from "@/utils/excelClipboard";
import { loadSealImage } from "@/utils/sealImage";
import { trackCopy, trackPrint } from "@/utils/tracking";
import { isoDate } from "./docFields";
import {
  DonationDoc,
  type DonationOrg,
  type DonationReceipt,
} from "./DonationDoc";
import { InputPanel } from "./InputPanel";
import { ResultPane } from "./ResultPane";
import { Segmented } from "./Segmented";
import { SheetPreview } from "./SheetPreview";
import { ConvertGateButton } from "./share/ConvertGateButton";
import { ShareDialog } from "./share/ShareDialog";
import { Toast } from "./Toast";
import styles from "./tool.module.css";
import { useCopyShortcut, useToolBasics } from "./useToolBasics";

type View = "receipt" | "summary";

interface DonationOptions {
  code: DonationCode;
  detail: DetailMode;
  sort: SortMode;
  mask: boolean;
  sealSize: number;
}

const DEFAULTS: DonationOptions = {
  code: "41",
  detail: "month",
  sort: "name",
  mask: false,
  sealSize: 16,
};

const DETAIL_CHOICES: { value: DetailMode; label: string }[] = [
  { value: "month", label: "월별" },
  { value: "year", label: "연간 한 줄" },
  { value: "each", label: "날짜별" },
];
const DETAIL_HINT: Record<DetailMode, string> = {
  month:
    "기부한 달마다 한 줄씩 적습니다(예: 2026.01.01 ~ 2026.01.31). 교회·단체에서 가장 많이 쓰는 방식입니다.",
  year: "1년 합계를 한 줄로 적습니다(2026.01.01 ~ 2026.12.31). 내역에 날짜가 없으면 이 방식이 됩니다.",
  each: "기부한 날짜마다 한 줄씩 적습니다. 같은 날 두 번은 합칩니다. 줄이 많으면 다음 쪽으로 이어집니다.",
};
const SORT_CHOICES: { value: SortMode; label: string }[] = [
  { value: "name", label: "이름순" },
  { value: "input", label: "입력순" },
];
const VIEW_CHOICES: { value: View; label: string }[] = [
  { value: "receipt", label: "영수증" },
  { value: "summary", label: "이름별 합계" },
];
const SEAL_SIZES = [14, 16, 18, 20, 24];
const MAX_PRINT = 500;

const EMPTY_ORG: DonationOrg = {
  name: "",
  bizNo: "",
  address: "",
  law: "",
  rep: "",
};
const SAMPLE_ORG: DonationOrg = {
  name: "한빛교회",
  bizNo: "123-82-12345",
  address: "서울특별시 중구 세종대로 110",
  law: "",
  rep: "이서준",
};

/** 연말정산용 영수증은 보통 이듬해 1~3월에 발급한다 — 그때는 지난해를 기본으로 */
function defaultYear(now: Date): number {
  return now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
}

function koreanDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일` : "";
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

export function DonationTool() {
  const [input, setInput] = useState("");
  const t = useToolBasics<DonationOptions>({
    storageKey: "rowflip:donation:v1",
    defaults: DEFAULTS,
    // 코드·적는 방식·정렬·가리기·직인 크기만 기억한다. 내역·이름·주민번호·단체 정보는 저장하지 않는다
    storedKeys: ["code", "detail", "sort", "mask", "sealSize"],
    sanitize: (s) => {
      if (s.code && !DONATION_CODES.some((c) => c.value === s.code))
        delete s.code;
      if (s.detail && !DETAIL_CHOICES.some((c) => c.value === s.detail))
        delete s.detail;
      if (s.sort && !SORT_CHOICES.some((c) => c.value === s.sort))
        delete s.sort;
      if (s.mask !== undefined && typeof s.mask !== "boolean") delete s.mask;
      if (s.sealSize !== undefined && !SEAL_SIZES.includes(s.sealSize))
        delete s.sealSize;
      return s;
    },
  });
  const { options: o, update, gate } = t;

  const [view, setView] = useState<View>("receipt");
  const [org, setOrg] = useState<DonationOrg>(EMPTY_ORG);
  const [lawTouched, setLawTouched] = useState(false);
  const [yearText, setYearText] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [prefix, setPrefix] = useState("");
  const [nowYear, setNowYear] = useState(0);

  // 오늘 날짜는 브라우저에서 정한다(정적 HTML에 빌드 날짜가 박히지 않게)
  useEffect(() => {
    const now = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 날짜를 마운트 후 1회 반영
    setIssueDate((d) => d || isoDate(now));
    setNowYear(defaultYear(now));
  }, []);

  const deferred = useDeferredValue(input);
  const pending = deferred !== input;
  const detected = useMemo(() => detectYear(deferred), [deferred]);
  const typedYear = /^\d{4}$/.test(yearText.trim())
    ? Number(yearText.trim())
    : null;
  const year = typedYear ?? detected ?? nowYear;
  const ledger = useMemo(() => parseLedger(deferred, year), [deferred, year]);
  const donors = useMemo(
    () => sortDonors(ledger.donors, o.sort),
    [ledger.donors, o.sort],
  );

  const codeInfo =
    DONATION_CODES.find((c) => c.value === o.code) ?? DONATION_CODES[0];
  const law = lawTouched ? org.law : codeInfo.law;
  const orgShown: DonationOrg = { ...org, law };
  const serialPrefix = prefix || `${year}-`;

  const receipts: DonationReceipt[] = useMemo(
    () =>
      donors.slice(0, MAX_PRINT).map((d, i) => ({
        serial: serialNo(serialPrefix, i),
        donorName: d.name,
        donorId: o.mask ? maskId(d.id) : d.id,
        donorAddress: d.address,
        lines: receiptLines(d, o.detail, year, o.code),
        total: d.total,
      })),
    [donors, serialPrefix, o.mask, o.detail, o.code, year],
  );
  const table = useMemo(
    () => (donors.length ? summaryTable(donors, ledger.hasDates, o.mask) : []),
    [donors, ledger.hasDates, o.mask],
  );

  // 직인 이미지 — 브라우저 안에서만 쓰고 저장하지 않는다(새로고침하면 사라짐)
  const [sealSrc, setSealSrc] = useState<string | null>(null);
  const [sealError, setSealError] = useState("");
  const onSealFile = async (file: File | undefined) => {
    if (!file) return;
    setSealError("");
    try {
      setSealSrc(await loadSealImage(file));
    } catch (err) {
      setSealError(
        err instanceof Error ? err.message : "이미지를 읽지 못했습니다.",
      );
    }
  };
  const issue = {
    date: koreanDate(issueDate),
    seal: sealSrc ? { src: sealSrc, size: o.sealSize } : null,
  };

  const [page, setPage] = useState(0);
  const current = Math.min(page, Math.max(0, receipts.length - 1));
  const hasInput = donors.length > 0;
  const inputLines = useMemo(
    () => deferred.split("\n").filter((l) => l.trim() !== "").length,
    [deferred],
  );
  const grand = donors.reduce((s, d) => s + d.total, 0);

  const copySummary = useCallback(async () => {
    const text = table.map((r) => r.join("\t")).join("\n");
    const ok = await copyText(text, excelHtmlForRows(table));
    if (ok) trackCopy();
    t.showToast(
      ok ? copiedMessage() : "복사하지 못했습니다. 표를 직접 선택해 주세요.",
    );
  }, [table, t]);

  const primary = useCallback(() => {
    if (gate.locked) {
      if (hasInput) t.startConvert();
      return;
    }
    if (!hasInput) return;
    if (view === "summary") {
      void copySummary();
      return;
    }
    trackPrint();
    window.print();
  }, [gate.locked, hasInput, t, view, copySummary]);
  useCopyShortcut(primary);

  const sample = () => {
    setInput(DONATION_SAMPLE);
    setOrg((g) => (g.name || g.bizNo || g.address || g.rep ? g : SAMPLE_ORG));
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

  const go = useCallback(
    (delta: number) =>
      setPage((p) =>
        Math.min(
          Math.max(0, Math.min(p, receipts.length - 1) + delta),
          Math.max(0, receipts.length - 1),
        ),
      ),
    [receipts.length],
  );
  const canPreview = !gate.locked && hasInput && !!receipts[current];
  const missingId = hasInput && donors.every((d) => !d.id);

  const pagerControls = (
    <span className={styles.certPager}>
      <button
        type="button"
        className={styles.ghost}
        onClick={() => go(-1)}
        disabled={current === 0}
        aria-label="이전 장"
      >
        ‹
      </button>
      <span className={styles.certPagerText}>
        {current + 1} / {fmt(receipts.length)}
      </span>
      <button
        type="button"
        className={styles.ghost}
        onClick={() => go(1)}
        disabled={current >= receipts.length - 1}
        aria-label="다음 장"
      >
        ›
      </button>
    </span>
  );

  const actions = canPreview ? (
    <>
      {view === "receipt" && receipts.length > 1 && pagerControls}
      {view === "receipt" && (
        <button
          type="button"
          className={`${styles.ghost} ${styles.certZoomBtn}`}
          onClick={() => setZoom(true)}
        >
          크게 보기
        </button>
      )}
    </>
  ) : null;

  const bad = ledger.invalidLines;
  const status = (
    <>
      <span>
        기부자 {fmt(donors.length)}명 · 합계 {won(grand)}원 · {year}년
        {donors.length > MAX_PRINT &&
          ` (영수증은 한 번에 ${fmt(MAX_PRINT)}장까지 — 내역을 나눠 주세요)`}
      </span>
      {ledger.wide && <span>1월~12월 열로 된 표로 읽었습니다</span>}
      {ledger.spaced && (
        <span className={styles.statusNotice}>
          띄어쓰기로 칸을 나눴습니다. 이름이 잘못 나뉘면 엑셀에서 복사해
          넣으세요.
        </span>
      )}
      {ledger.otherYear > 0 && (
        <span className={styles.statusNotice}>
          {year}년이 아닌 내역 {fmt(ledger.otherYear)}건은 뺐습니다. 다른 해
          영수증은 ‘기부 연도’를 바꾸세요.
        </span>
      )}
      {bad.length > 0 && (
        <span className={styles.statusNotice}>
          금액을 읽지 못한 줄 {bad.length}개는 뺐습니다 (
          {bad.slice(0, 5).join(", ")}번째 줄)
        </span>
      )}
      {missingId && (
        <span className={styles.statusNotice}>
          주민등록번호 열이 없습니다. 연말정산에 쓰려면 기부자 주민등록번호가
          필요합니다.
        </span>
      )}
      {view === "receipt" && !sealSrc && (
        <span className={styles.statusNotice}>
          직인은 아래 ‘직인 이미지 넣기’로 찍을 수 있습니다
        </span>
      )}
      {view === "summary" && (
        <span>복사하면 엑셀에 표 그대로 붙여넣을 수 있습니다</span>
      )}
    </>
  );

  const setO = (patch: Partial<DonationOrg>) =>
    setOrg((g) => ({ ...g, ...patch }));

  return (
    <div
      className={`${styles.tool} ${styles.toolTranspose} ${gate.locked ? styles.toolGated : ""}`}
    >
      <div className={styles.areaInput}>
        <InputPanel
          title="헌금·후원 내역 (엑셀에서 붙여넣기)"
          value={input}
          onChange={setInput}
          onSample={sample}
          onClear={() => setInput("")}
          rowCount={inputLines}
          colCount={1}
          placeholder={
            "엑셀에서 헌금·후원 내역을 머리글까지 복사해 붙여넣으세요. 같은 사람의 여러 줄은 1년 합계로 합칩니다.\n\n예:\n날짜\t성명\t주민등록번호\t금액\n2026-01-04\t김민준\t800101-1000001\t100,000\n2026-01-11\t김민준\t800101-1000001\t50,000\n\n‘성명 | 1월 | 2월 …’처럼 달마다 열이 있는 표도 됩니다.\n\n팁: 엑셀에서 표 안의 칸 하나를 누르고 Ctrl+A(맥은 ⌘+A)를 누르면 표 전체가 선택됩니다."
          }
        />
      </div>

      {gate.locked && (
        <ConvertGateButton disabled={!hasInput} onClick={t.startConvert} />
      )}

      <div className={styles.areaOutput}>
        <ResultPane
          title={view === "summary" ? "이름별 합계" : "미리보기"}
          primaryLabel={view === "summary" ? "복사" : "인쇄·PDF 저장"}
          waiting={gate.locked}
          pending={pending}
          modKey={t.modKey}
          onCopy={primary}
          canCopy={hasInput}
          actions={actions}
          placeholder="내역을 붙여넣으면 기부자마다 기부금 영수증 미리보기가 나옵니다."
          status={
            hasInput ? (
              status
            ) : (
              <>
                <span>같은 이름(주민번호)은 한 사람으로 합칩니다</span>
                <span className={styles.statusNotice}>
                  직인 이미지도 넣을 수 있습니다(아래 ‘직인 이미지 넣기’)
                </span>
              </>
            )
          }
        >
          {canPreview ? (
            <div className={styles.viewStack}>
              <div className={styles.viewBar}>
                <Segmented
                  label="보기"
                  value={view}
                  options={VIEW_CHOICES}
                  onChange={setView}
                />
                <span className={styles.hint}>
                  {view === "summary"
                    ? "기부자별 건수·월별·합계 — 복사해 엑셀에 붙여넣기"
                    : "한 사람에 한 장씩 인쇄됩니다"}
                </span>
              </div>
              {view === "summary" ? (
                <div id="result">
                  <SheetPreview rows={table} headerRow />
                </div>
              ) : (
                <div className={styles.certViewer} id="result">
                  <button
                    type="button"
                    className={`${styles.certSheet} ${styles.estSheet}`}
                    onClick={() => setZoom(true)}
                    aria-label="크게 보기"
                    title="크게 보기"
                  >
                    <DonationDoc
                      r={receipts[current]}
                      org={orgShown}
                      issue={issue}
                      preview
                    />
                  </button>
                </div>
              )}
            </div>
          ) : undefined}
        </ResultPane>
      </div>

      <div
        className={`${styles.areaOptions} ${styles.options} ${styles.optionsCert}`}
      >
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>
            기부금 단체 (발급하는 곳)
          </legend>
          <label className={styles.certRow}>
            <span>단체명</span>
            <input
              className={styles.input}
              placeholder="예: 한빛교회"
              value={org.name}
              onChange={(e) => setO({ name: e.target.value })}
            />
          </label>
          <label className={styles.certRow}>
            <span>고유번호</span>
            <input
              className={`${styles.input} ${styles.mono}`}
              placeholder="사업자등록번호(고유번호) 000-00-00000"
              value={org.bizNo}
              onChange={(e) => setO({ bizNo: e.target.value })}
            />
          </label>
          <label className={styles.certRow}>
            <span>소재지</span>
            <input
              className={styles.input}
              placeholder="단체 주소"
              value={org.address}
              onChange={(e) => setO({ address: e.target.value })}
            />
          </label>
          <label className={styles.certRow}>
            <span>대표자</span>
            <input
              className={styles.input}
              placeholder="예: 이서준 (담임목사·대표)"
              value={org.rep}
              onChange={(e) => setO({ rep: e.target.value })}
            />
          </label>
          <label className={styles.certRow}>
            <span>근거법령</span>
            <input
              className={styles.input}
              value={law}
              onChange={(e) => {
                setLawTouched(true);
                setO({ law: e.target.value });
              }}
            />
          </label>
          <p className={styles.hint}>
            근거법령은 기부금 코드에 맞춰 채워집니다. 단체 정보는 저장하지
            않으니 새로 열면 다시 넣어 주세요.
          </p>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>기부내용</legend>
          <label className={styles.certRow}>
            <span>기부 연도</span>
            <input
              className={`${styles.input} ${styles.mono}`}
              inputMode="numeric"
              placeholder={String(detected ?? nowYear ?? "")}
              value={yearText}
              onChange={(e) =>
                setYearText(e.target.value.replace(/[^\d]/g, "").slice(0, 4))
              }
            />
          </label>
          <label className={styles.certRow}>
            <span>코드</span>
            <select
              className={styles.select}
              value={o.code}
              onChange={(e) => update({ code: e.target.value as DonationCode })}
            >
              {DONATION_CODES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.inline}>
            <span className={styles.certLabel}>기부내용</span>
            <Segmented
              label="기부내용 적는 방식"
              value={o.detail}
              options={DETAIL_CHOICES}
              onChange={(detail) => update({ detail })}
            />
          </div>
          <p className={styles.hint}>{DETAIL_HINT[o.detail]}</p>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>발급 정보</legend>
          <label className={styles.certRow}>
            <span>발급일</span>
            <input
              className={styles.input}
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </label>
          <label className={styles.certRow}>
            <span>일련번호</span>
            <span className={styles.inline}>
              <input
                className={`${styles.input} ${styles.mono}`}
                style={{ width: 96 }}
                placeholder={`${year}-`}
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
              />
              <span className={styles.hint}>
                {serialNo(serialPrefix, 0)}부터
              </span>
            </span>
          </label>
          <div className={styles.inline}>
            <span className={styles.certLabel}>순서</span>
            <Segmented
              label="영수증 순서"
              value={o.sort}
              options={SORT_CHOICES}
              onChange={(sort) => update({ sort })}
            />
          </div>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={o.mask}
              onChange={(e) => update({ mask: e.target.checked })}
            />
            주민등록번호 뒷자리 가리기 (900101-1******)
          </label>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>직인</legend>

          <div className={styles.certRow}>
            <span>직인</span>
            <span className={styles.inline}>
              <label className={styles.fileBtn}>
                {sealSrc ? "직인 이미지 바꾸기" : "직인 이미지 넣기"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    void onSealFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              {sealSrc && (
                <>
                  <select
                    aria-label="직인 크기"
                    className={styles.select}
                    value={o.sealSize}
                    onChange={(e) =>
                      update({ sealSize: Number(e.target.value) })
                    }
                  >
                    {SEAL_SIZES.map((n) => (
                      <option key={n} value={n}>
                        {n}mm
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={styles.outlineBtn}
                    onClick={() => setSealSrc(null)}
                  >
                    빼기
                  </button>
                </>
              )}
            </span>
          </div>
          {sealError ? (
            <p className={styles.hintStrong}>{sealError}</p>
          ) : (
            <p className={styles.hint}>
              단체 직인을 스캔하거나 찍은 사진(PNG·JPG)을 넣으면 흰 바탕을
              지우고 ‘기부금 수령인’ 자리에 찍습니다. 이미지는 저장하지
              않습니다.
            </p>
          )}
          <p className={styles.hint}>
            내역·이름·주민등록번호는 이 브라우저 안에서만 처리하고 서버로
            보내거나 저장하지 않습니다. 인쇄 창 ‘설정 더보기’에서 ‘머리글과
            바닥글’을 끄면 종이에 주소·날짜가 찍히지 않습니다.
          </p>
        </fieldset>
      </div>

      <dialog
        ref={zoomRef}
        className={styles.certZoom}
        aria-label="기부금 영수증 크게 보기"
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
          <strong>기부금 영수증 미리보기</strong>
          {receipts.length > 1 && pagerControls}
          <button
            type="button"
            className={styles.ghost}
            onClick={() => setZoom(false)}
          >
            닫기
          </button>
        </div>
        <div className={styles.certZoomBody}>
          {zoom && canPreview && (
            <div className={`${styles.certZoomSheet} ${styles.estZoomSheet}`}>
              <DonationDoc
                r={receipts[current]}
                org={orgShown}
                issue={issue}
                preview
              />
            </div>
          )}
        </div>
      </dialog>

      {mounted &&
        canPreview &&
        createPortal(
          <div className="certPrintRoot" aria-hidden="true">
            <style>{"@page { size: A4 portrait; margin: 12mm; }"}</style>
            {receipts.map((r, i) => (
              <DonationDoc key={i} r={r} org={orgShown} issue={issue} />
            ))}
          </div>,
          document.body,
        )}

      <Toast message={t.toast} />
      <ShareDialog
        open={t.shareOpen}
        onClose={() => t.setShareOpen(false)}
        path="/donation-receipt/"
        summary={`영수증 ${fmt(receipts.length)}장`}
      />
    </div>
  );
}

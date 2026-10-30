import type { FillLine } from "./hwpx";
import { qtyText, totalInWords, won, type EstimateLine, type EstimateTotals } from "./estimate";

/** 견적서 내용 → HWPX 양식에 넣을 값 */

export interface EstimateFillSource {
  date: string;
  validUntil: string;
  number: string;
  client: string;
  supplier: { bizNo: string; name: string; ceo: string; address: string; bizType: string; bizItem: string; phone: string };
  lines: EstimateLine[];
  totals: EstimateTotals;
  note: string;
}

/** 양식에 적을 수 있는 {{이름}} — 화면 안내와 같은 순서 */
export const ESTIMATE_TOKENS = [
  "받는곳",
  "견적일",
  "유효기간",
  "견적번호",
  "합계금액",
  "합계",
  "공급가액",
  "세액",
  "상호",
  "대표자",
  "등록번호",
  "주소",
  "업태",
  "종목",
  "연락처",
  "비고",
] as const;

export function estimateFillLines(lines: EstimateLine[]): FillLine[] {
  return lines.map((l) => ({
    name: l.name,
    spec: l.spec,
    qty: qtyText(l.qty),
    price: won(l.price),
    supply: won(l.supply),
    tax: won(l.tax),
    total: won(l.supply + l.tax),
    note: l.note,
  }));
}

export function estimateFillTotals(t: EstimateTotals): Partial<FillLine> {
  return { supply: won(t.supply), tax: won(t.tax), total: won(t.total) };
}

export function estimateTokens(d: EstimateFillSource): Record<string, string> {
  const sp = d.supplier;
  const v: Record<(typeof ESTIMATE_TOKENS)[number], string> = {
    받는곳: d.client,
    견적일: d.date,
    유효기간: d.validUntil ? `${d.validUntil}까지` : "",
    견적번호: d.number,
    // 양식에 (₩{{합계}})를 따로 적는 경우가 많아 한글 금액만 넣는다
    합계금액: d.lines.length ? totalInWords(d.totals.total).replace(/ \(₩[^)]*\)$/, "") : "",
    합계: d.lines.length ? won(d.totals.total) : "",
    공급가액: d.lines.length ? won(d.totals.supply) : "",
    세액: d.lines.length ? won(d.totals.tax) : "",
    상호: sp.name,
    대표자: sp.ceo,
    등록번호: sp.bizNo,
    주소: sp.address,
    업태: sp.bizType,
    종목: sp.bizItem,
    연락처: sp.phone,
    비고: d.note,
  };
  // 자주 쓰는 다른 이름도 받는다
  return { ...v, 거래처: v.받는곳, 수신: v.받는곳, 날짜: v.견적일, 공급자: v.상호, 대표: v.대표자, 사업자번호: v.등록번호, 전화: v.연락처 };
}

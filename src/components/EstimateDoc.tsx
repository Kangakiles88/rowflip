import type { ReactNode } from "react";
import { priceVatLabel, qtyText, totalInWords, totalVatLabel, won, type EstimateLine, type EstimateTotals, type VatMode } from "@/utils/estimate";
import { LogoMark, SealMark, type DocLogo, type DocSeal } from "./DocImages";
import s from "./estimate.module.css";

export interface Supplier {
  bizNo: string;
  name: string;
  ceo: string;
  address: string;
  bizType: string;
  bizItem: string;
  phone: string;
}

export interface EstimateDocData {
  date: string;
  validUntil: string;
  number: string;
  client: string;
  supplier: Supplier;
  lines: EstimateLine[];
  totals: EstimateTotals;
  vat: VatMode;
  note: string;
  seal?: DocSeal | null;
  logo?: DocLogo | null;
}

/** 빈 표 줄을 채워 견적서다운 모양을 만든다(품목이 적을 때) */
const MIN_ROWS = 10;


/** 견적서 한 부 — 미리보기와 인쇄가 같은 마크업을 쓴다 */
export function EstimateDoc({ data, preview = false }: { data: EstimateDocData; preview?: boolean }) {
  const { supplier: sp, lines, totals, vat } = data;
  const showTax = vat !== "none";
  // 미리보기에서는 빈 칸에 흐린 안내를, 인쇄에서는 비워 둔다
  const v = (value: string, hint: string): ReactNode =>
    value || (preview ? <span className={s.placeholder}>{hint}</span> : null);
  const filler = Math.max(0, MIN_ROWS - lines.length);
  const cols = showTax ? 8 : 7;

  return (
    <article className={`${s.doc} ${preview ? s.preview : ""}`}>
      <p className={s.title}>
        <LogoMark logo={data.logo} />
        견적서
      </p>

      <div className={s.top}>
        <div>
          <dl className={s.meta}>
            <dt>견적일자</dt>
            <dd>{data.date}</dd>
            {data.number && (
              <>
                <dt>견적번호</dt>
                <dd>{data.number}</dd>
              </>
            )}
            {data.validUntil && (
              <>
                <dt>유효기간</dt>
                <dd>{data.validUntil}까지</dd>
              </>
            )}
          </dl>
          <p className={s.client}>
            {v(data.client, "거래처")}
            <small>귀하</small>
          </p>
          <p className={s.lead}>아래와 같이 견적합니다.</p>
        </div>

        <table className={`${s.table} ${s.supplier}`}>
          <tbody>
            <tr>
              <th rowSpan={5} scope="rowgroup">
                공<br />급<br />자
              </th>
              <th scope="row">등록번호</th>
              <td colSpan={3}>{v(sp.bizNo, "000-00-00000")}</td>
            </tr>
            <tr>
              <th scope="row">상호</th>
              <td>{v(sp.name, "상호")}</td>
              <th scope="row">성명</th>
              <td>
                {v(sp.ceo, "대표자")}
                <SealMark seal={data.seal} />
              </td>
            </tr>
            <tr>
              <th scope="row">주소</th>
              <td colSpan={3}>{v(sp.address, "사업장 주소")}</td>
            </tr>
            <tr>
              <th scope="row">업태</th>
              <td>{v(sp.bizType, "업태")}</td>
              <th scope="row">종목</th>
              <td>{v(sp.bizItem, "종목")}</td>
            </tr>
            <tr>
              <th scope="row">연락처</th>
              <td colSpan={3}>{v(sp.phone, "전화번호")}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <table className={`${s.table} ${s.totalBar}`}>
        <tbody>
          <tr>
            <th scope="row">
              합계금액
              <small>{totalVatLabel(vat)}</small>
            </th>
            <td>{totalInWords(totals.total)}</td>
          </tr>
        </tbody>
      </table>

      <table className={`${s.table} ${s.items}`}>
        <colgroup>
          <col style={{ width: "7%" }} />
          <col />
          <col style={{ width: "13%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "14%" }} />
          {showTax && <col style={{ width: "11%" }} />}
          <col style={{ width: "11%" }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">번호</th>
            <th scope="col">품목</th>
            <th scope="col">규격</th>
            <th scope="col">수량</th>
            <th scope="col">
              단가
              {priceVatLabel(vat) && <small className={s.colNote}>{priceVatLabel(vat)}</small>}
            </th>
            <th scope="col">공급가액</th>
            {showTax && <th scope="col">세액</th>}
            <th scope="col">비고</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td className={s.center}>{i + 1}</td>
              <td>{l.name}</td>
              <td>{l.spec}</td>
              <td className={s.num}>{qtyText(l.qty)}</td>
              <td className={s.num}>{won(l.price)}</td>
              <td className={s.num}>{won(l.supply)}</td>
              {showTax && <td className={s.num}>{won(l.tax)}</td>}
              <td>{l.note}</td>
            </tr>
          ))}
          {Array.from({ length: filler }, (_, i) => (
            <tr key={`f${i}`} aria-hidden="true">
              {Array.from({ length: cols }, (_, c) => (
                <td key={c} />
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={5}>
              합계
            </th>
            <td className={s.num}>{won(totals.supply)}</td>
            {showTax && <td className={s.num}>{won(totals.tax)}</td>}
            <td />
          </tr>
        </tfoot>
      </table>

      <section className={s.note}>
        <p className={s.noteHead}>비고</p>
        <p>{v(data.note, "결제 조건, 납기, 하자 보증 기간 등")}</p>
      </section>
    </article>
  );
}

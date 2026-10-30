import type { ReactNode } from "react";
import { priceVatLabel, qtyText, totalInWords, totalVatLabel, won, type EstimateLine, type EstimateTotals, type VatMode } from "@/utils/estimate";
import type { StatementBalance } from "@/utils/statement";
import type { Supplier } from "./EstimateDoc";
import e from "./estimate.module.css";
import s from "./statement.module.css";

export type StatementCopies = "two" | "one";

export interface StatementDocData {
  date: string;
  number: string;
  buyer: Supplier;
  supplier: Supplier;
  lines: EstimateLine[];
  totals: EstimateTotals;
  balance: StatementBalance;
  vat: VatMode;
  note: string;
  copies: StatementCopies;
}


/** 품목이 적을 때 빈 줄을 채워 명세서 모양을 맞춘다 — 두 부 찍기는 반쪽에 들어가게 적게 */
const MIN_ROWS = { one: 15, two: 6 } as const;

function Party({ title, p, v }: { title: string; p: Supplier; v: (value: string, hint: string) => ReactNode }) {
  return (
    <table className={`${e.table} ${s.party}`}>
      <tbody>
        <tr>
          <th rowSpan={5} scope="rowgroup" className={s.partyTitle}>
            {Array.from(title).map((ch, i) => (
              <span key={i}>{ch}</span>
            ))}
          </th>
          <th scope="row">등록번호</th>
          <td colSpan={3}>{v(p.bizNo, "000-00-00000")}</td>
        </tr>
        <tr>
          <th scope="row">상호</th>
          <td>{v(p.name, "상호")}</td>
          <th scope="row">성명</th>
          <td>
            {v(p.ceo, "대표자")}
            <span className={e.seal}>(인)</span>
          </td>
        </tr>
        <tr>
          <th scope="row">주소</th>
          <td colSpan={3}>{v(p.address, "사업장 주소")}</td>
        </tr>
        <tr>
          <th scope="row">업태</th>
          <td>{v(p.bizType, "업태")}</td>
          <th scope="row">종목</th>
          <td>{v(p.bizItem, "종목")}</td>
        </tr>
        <tr>
          <th scope="row">연락처</th>
          <td colSpan={3}>{v(p.phone, "전화번호")}</td>
        </tr>
      </tbody>
    </table>
  );
}

function Copy({ data, label, preview }: { data: StatementDocData; label?: string; preview: boolean }) {
  const { lines, totals, vat, balance: b } = data;
  const showTax = vat !== "none";
  const v = (value: string, hint: string): ReactNode =>
    value || (preview ? <span className={e.placeholder}>{hint}</span> : null);
  const filler = Math.max(0, MIN_ROWS[data.copies] - lines.length);
  const cols = showTax ? 8 : 7;

  return (
    <section className={s.copy}>
      <div className={s.head}>
        <p className={s.title}>거래명세서</p>
        {label && <span className={s.copyLabel}>({label})</span>}
      </div>
      <p className={s.info}>
        <span>
          거래일자 <strong>{data.date}</strong>
        </span>
        {data.number && (
          <span>
            번호 <strong>{data.number}</strong>
          </span>
        )}
      </p>

      <div className={s.parties}>
        <Party title="공급받는자" p={data.buyer} v={v} />
        <Party title="공급자" p={data.supplier} v={v} />
      </div>

      <table className={`${e.table} ${e.totalBar} ${s.totalBar}`}>
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

      <table className={`${e.table} ${e.items} ${s.items}`}>
        <colgroup>
          <col style={{ width: "8%" }} />
          <col />
          <col style={{ width: "13%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "11%" }} />
          <col style={{ width: "13%" }} />
          {showTax && <col style={{ width: "11%" }} />}
          <col style={{ width: "10%" }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">월/일</th>
            <th scope="col">품목</th>
            <th scope="col">규격</th>
            <th scope="col">수량</th>
            <th scope="col">
              단가
              {priceVatLabel(vat) && <small className={e.colNote}>{priceVatLabel(vat)}</small>}
            </th>
            <th scope="col">공급가액</th>
            {showTax && <th scope="col">세액</th>}
            <th scope="col">비고</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td className={e.center}>{l.date ?? ""}</td>
              <td>{l.name}</td>
              <td>{l.spec}</td>
              <td className={e.num}>{qtyText(l.qty)}</td>
              <td className={e.num}>{won(l.price)}</td>
              <td className={e.num}>{won(l.supply)}</td>
              {showTax && <td className={e.num}>{won(l.tax)}</td>}
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
            <td className={e.num}>{won(totals.supply)}</td>
            {showTax && <td className={e.num}>{won(totals.tax)}</td>}
            <td />
          </tr>
        </tfoot>
      </table>

      <table className={`${e.table} ${s.balance}`}>
        <tbody>
          <tr>
            <th scope="col">전잔액</th>
            <th scope="col">이번 합계</th>
            <th scope="col">입금액</th>
            <th scope="col">잔액</th>
            <th scope="col">인수자</th>
          </tr>
          <tr>
            <td className={e.num}>{b.prev ? won(b.prev) : ""}</td>
            <td className={e.num}>{won(b.total)}</td>
            <td className={e.num}>{b.paid ? won(b.paid) : ""}</td>
            <td className={e.num}>{won(b.balance)}</td>
            <td>
              <span className={e.seal}>(인)</span>
            </td>
          </tr>
        </tbody>
      </table>

      {data.note.trim() && (
        <p className={s.note}>
          <strong>비고</strong> {data.note}
        </p>
      )}
    </section>
  );
}

/** 거래명세서 — 두 부 찍기면 A4 한 장에 공급자 보관용·공급받는자 보관용을 위아래로 */
export function StatementDoc({ data, preview = false }: { data: StatementDocData; preview?: boolean }) {
  const two = data.copies === "two";
  return (
    <article className={`${e.doc} ${s.doc} ${two ? s.twoUp : ""} ${preview ? e.preview : ""}`}>
      {two ? (
        <>
          <Copy data={data} label="공급자 보관용" preview={preview} />
          <div className={s.cut} aria-hidden="true">
            <span>자르는 선</span>
          </div>
          <Copy data={data} label="공급받는자 보관용" preview={preview} />
        </>
      ) : (
        <Copy data={data} preview={preview} />
      )}
    </article>
  );
}

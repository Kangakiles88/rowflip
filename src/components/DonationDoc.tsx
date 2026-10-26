import type { ReactNode } from "react";
import { won } from "@/utils/estimate";
import type { ReceiptLine } from "@/utils/donation";
import e from "./estimate.module.css";
import s from "./donation.module.css";

/** 영수증 한 장에 들어갈 값 — 화면에서 만든 그대로 그린다 */
export interface DonationReceipt {
  serial: string;
  donorName: string;
  donorId: string;
  donorAddress: string;
  lines: ReceiptLine[];
  total: number;
}

export interface DonationOrg {
  name: string;
  bizNo: string;
  address: string;
  law: string;
  /** 대표자(기부금 수령인) */
  rep: string;
}

export interface DonationIssue {
  /** '2027년 1월 10일' */
  date: string;
  seal: { src: string; size: number } | null;
}

/** 기부내용이 적을 때 빈 줄을 채워 서식 모양을 맞춘다 */
const MIN_ROWS = 8;

/** 「소득세법 시행규칙」 별지 제45호의2서식(개정 2023. 3. 20.) 기부금 영수증 한 장 */
export function DonationDoc({
  r,
  org,
  issue,
  preview = false,
}: {
  r: DonationReceipt;
  org: DonationOrg;
  issue: DonationIssue;
  preview?: boolean;
}) {
  const v = (value: string, hint: string): ReactNode =>
    value || (preview ? <span className={e.placeholder}>{hint}</span> : null);
  const filler = Math.max(0, MIN_ROWS - r.lines.length);

  return (
    <article className={`${e.doc} ${s.doc} ${preview ? e.preview : s.printPage}`}>
      <p className={s.formNo}>■ 소득세법 시행규칙 [별지 제45호의2서식] &lt;개정 2023. 3. 20.&gt;</p>
      <table className={`${e.table} ${s.serial}`}>
        <tbody>
          <tr>
            <th scope="row">일련번호</th>
            <td>{r.serial}</td>
          </tr>
        </tbody>
      </table>
      <p className={s.title}>기부금 영수증</p>

      <p className={s.sec}>① 기부자</p>
      <table className={`${e.table} ${s.grid}`}>
        <colgroup>
          <col className={s.colTh} />
          <col />
          <col className={s.colTh2} />
          <col />
        </colgroup>
        <tbody>
          <tr>
            <th scope="row">성명(법인명)</th>
            <td>{r.donorName}</td>
            <th scope="row">
              주민등록번호
              <br />
              (사업자등록번호)
            </th>
            <td className={s.mono}>{v(r.donorId, "주민등록번호")}</td>
          </tr>
          <tr>
            <th scope="row">주소(소재지)</th>
            <td colSpan={3}>{v(r.donorAddress, "주소")}</td>
          </tr>
        </tbody>
      </table>

      <p className={s.sec}>② 기부금 단체</p>
      <table className={`${e.table} ${s.grid}`}>
        <colgroup>
          <col className={s.colTh} />
          <col />
          <col className={s.colTh2} />
          <col />
        </colgroup>
        <tbody>
          <tr>
            <th scope="row">단체명</th>
            <td>{v(org.name, "단체명")}</td>
            <th scope="row">
              사업자등록번호
              <br />
              (고유번호)
            </th>
            <td className={s.mono}>{v(org.bizNo, "000-00-00000")}</td>
          </tr>
          <tr>
            <th scope="row">소재지</th>
            <td colSpan={3}>{v(org.address, "소재지")}</td>
          </tr>
          <tr>
            <th scope="row">
              기부금공제대상
              <br />
              기부금단체 근거법령
            </th>
            <td colSpan={3}>{v(org.law, "근거법령")}</td>
          </tr>
        </tbody>
      </table>

      <p className={s.sec}>③ 기부금 모집처(언론기관 등)</p>
      <table className={`${e.table} ${s.grid}`}>
        <colgroup>
          <col className={s.colTh} />
          <col />
          <col className={s.colTh2} />
          <col />
        </colgroup>
        <tbody>
          <tr>
            <th scope="row">단체명</th>
            <td />
            <th scope="row">사업자등록번호</th>
            <td />
          </tr>
          <tr>
            <th scope="row">소재지</th>
            <td colSpan={3} />
          </tr>
        </tbody>
      </table>

      <p className={s.sec}>④ 기부내용</p>
      <table className={`${e.table} ${e.items} ${s.items}`}>
        <colgroup>
          <col style={{ width: "8%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "29%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "20%" }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" rowSpan={2}>
              코드
            </th>
            <th scope="col" rowSpan={2}>
              구분
              <br />
              <small>(금전 또는 현물)</small>
            </th>
            <th scope="col" rowSpan={2}>
              연월일
            </th>
            <th scope="colgroup" colSpan={3}>
              내용
            </th>
            <th scope="col" rowSpan={2}>
              금액
            </th>
          </tr>
          <tr>
            <th scope="col">품명</th>
            <th scope="col">수량</th>
            <th scope="col">단가</th>
          </tr>
        </thead>
        <tbody>
          {r.lines.map((l, i) => (
            <tr key={i}>
              <td className={e.center}>{l.code}</td>
              <td className={e.center}>{l.kind}</td>
              <td className={e.center}>{l.date}</td>
              <td />
              <td />
              <td />
              <td className={e.num}>{won(l.amount)}</td>
            </tr>
          ))}
          {Array.from({ length: filler }, (_, i) => (
            <tr key={`f${i}`} aria-hidden="true">
              {Array.from({ length: 7 }, (_, c) => (
                <td key={c} />
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={6}>
              합계
            </th>
            <td className={e.num}>{won(r.total)}</td>
          </tr>
        </tfoot>
      </table>

      <div className={s.sign}>
        <p className={s.statement}>
          「소득세법」 제34조, 「조세특례제한법」 제58조ㆍ제76조ㆍ제88조의4 및 「법인세법」 제24조에 따른 기부금을 위와
          같이 기부하였음을 증명하여 주시기 바랍니다.
        </p>
        <p className={s.date}>{v(issue.date, "발급일")}</p>
        <p className={s.signer}>
          <span className={s.role}>신청인</span>
          <span className={s.who}>{r.donorName}</span>
          <span className={s.mark}>(서명 또는 인)</span>
        </p>

        <p className={s.statement}>위와 같이 기부금을 기부받았음을 증명합니다.</p>
        <p className={s.date}>{v(issue.date, "발급일")}</p>
        <p className={s.signer}>
          <span className={s.role}>기부금 수령인</span>
          <span className={s.who}>
            {v(org.name, "단체명")} {org.rep && <>대표 {org.rep}</>}
          </span>
          <span className={s.mark}>
            (서명 또는 인)
            {issue.seal && (
              /* eslint-disable-next-line @next/next/no-img-element -- 사용자가 올린 이미지(데이터 주소)라 최적화 대상이 아님 */
              <img
                className={s.seal}
                src={issue.seal.src}
                alt=""
                style={{ width: `calc(${issue.seal.size} * var(--mm))`, height: `calc(${issue.seal.size} * var(--mm))` }}
              />
            )}
            {!issue.seal && preview && <span className={s.sealHint}>직인</span>}
          </span>
        </p>
      </div>
    </article>
  );
}

/**
 * 거래명세서 — 품목 계산은 견적서(estimate.ts)와 같고, 여기에는 거래명세서에만 있는 잔액 계산을 둔다.
 * 모든 처리는 브라우저 안에서만 한다(품목·거래처 정보는 저장·전송하지 않음).
 */

export interface StatementBalance {
  /** 전잔액 — 지난 거래에서 남은 미수금 */
  prev: number;
  /** 이번 거래 합계(공급가액+세액) */
  total: number;
  /** 전잔액 + 이번 합계 */
  sum: number;
  /** 입금액 */
  paid: number;
  /** 잔액 = 전잔액 + 이번 합계 − 입금액 */
  balance: number;
}

export function statementBalance(total: number, prev: number, paid: number): StatementBalance {
  const sum = prev + total;
  return { prev, total, sum, paid, balance: sum - paid };
}

/** '1,200,000원' → 1200000. 비었거나 숫자가 아니면 0 */
export function moneyInput(raw: string): number {
  const s = raw.replace(/[\s,₩￦원]/g, "");
  return /^-?\d+$/.test(s) ? Number(s) : 0;
}

export const STATEMENT_SAMPLE =
  "월일\t품목\t규격\t수량\t단가\t비고\n10/14\tA4 복사용지\t80g 2,500매\t10\t27,500\t\n10/14\t토너 카트리지\tTK-5240\t2\t89,000\t\n10/17\t사무용 의자\tT-ZERO\t4\t189,000\t퀵 배송";

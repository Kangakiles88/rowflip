import { describe, expect, it } from "vitest";
import { computeEstimate, monthDay, parseItems } from "./estimate";
import { moneyInput, STATEMENT_SAMPLE, statementBalance } from "./statement";

describe("거래명세서", () => {
  it("월일 머리글을 읽고 날짜를 월/일로", () => {
    const r = parseItems(STATEMENT_SAMPLE);
    expect(r.items[0]).toMatchObject({ date: "10/14", name: "A4 복사용지", qty: 10, price: 27500 });
    expect(r.items[2]).toMatchObject({ date: "10/17", note: "퀵 배송" });
  });
  it("여러 날짜 모양", () => {
    expect(monthDay("2026-10-14")).toBe("10/14");
    expect(monthDay("2026.10.04.")).toBe("10/4");
    expect(monthDay("10월 9일")).toBe("10/9");
    expect(monthDay("10-09")).toBe("10/9");
    expect(monthDay("수시")).toBe("수시");
  });
  it("월일 칸이 없으면 date도 없다(견적서와 같음)", () => {
    expect(parseItems("품목\t수량\t단가\n볼펜\t2\t500").items[0].date).toBeUndefined();
  });
  it("잔액 = 전잔액 + 이번 합계 − 입금액", () => {
    const { totals } = computeEstimate(parseItems(STATEMENT_SAMPLE).items, "exclusive");
    expect(totals).toEqual({ supply: 1209000, tax: 120900, total: 1329900 });
    expect(statementBalance(1000000, 200000, 500000)).toEqual({
      prev: 200000,
      total: 1000000,
      sum: 1200000,
      paid: 500000,
      balance: 700000,
    });
  });
  it("금액 입력칸", () => {
    expect(moneyInput("1,200,000원")).toBe(1200000);
    expect(moneyInput("")).toBe(0);
    expect(moneyInput("모름")).toBe(0);
  });
});

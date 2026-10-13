import { describe, expect, it } from "vitest";
import {
  computeEstimate,
  computeLine,
  ESTIMATE_SAMPLE,
  parseItems,
  parseNumber,
  qtyText,
  totalInWords,
  won,
} from "./estimate";

describe("parseNumber", () => {
  it("쉼표·원·₩을 지운다", () => {
    expect(parseNumber("₩ 1,200원")).toBe(1200);
    expect(parseNumber("2.5")).toBe(2.5);
    expect(parseNumber("10개")).toBe(10);
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("별도 문의")).toBeNull();
  });
});

describe("parseItems", () => {
  it("머리글로 열을 찾는다", () => {
    const r = parseItems(ESTIMATE_SAMPLE);
    expect(r.hasHeader).toBe(true);
    expect(r.items[0]).toEqual({ name: "사무용 의자", spec: "T-ZERO", qty: 4, price: 189000, note: "" });
    expect(r.items).toHaveLength(3);
    expect(r.items[2].note).toBe("설치 포함");
  });
  it("머리글 순서가 달라도", () => {
    const r = parseItems("단가\t품명\t수량\n5,000\t볼펜\t20");
    expect(r.items[0]).toEqual({ name: "볼펜", spec: "", qty: 20, price: 5000, note: "" });
  });
  it("머리글이 없으면 열 수로 — 3열은 품목·수량·단가", () => {
    expect(parseItems("볼펜\t20\t500").items[0]).toMatchObject({ name: "볼펜", qty: 20, price: 500 });
    expect(parseItems("볼펜\t0.5mm\t20\t500").items[0]).toMatchObject({ spec: "0.5mm", qty: 20, price: 500 });
  });
  it("수량이 비면 1, 숫자가 아니면 건너뛰고 줄 번호를 알려 준다", () => {
    const r = parseItems("품목\t수량\t단가\n설치비\t\t50,000\n출장비\t1\t별도 문의\n\n배송비\t1\t3,000");
    expect(r.items.map((i) => [i.name, i.qty])).toEqual([
      ["설치비", 1],
      ["배송비", 1],
    ]);
    expect(r.invalidLines).toEqual([3]);
  });
});

describe("computeLine", () => {
  const item = { name: "a", spec: "", qty: 3, price: 33333, note: "" };
  it("부가세 별도: 세액은 10%, 원 미만 버림", () => {
    expect(computeLine(item, "exclusive")).toMatchObject({ supply: 99999, tax: 9999 });
  });
  it("부가세 포함: 금액을 공급가액과 세액으로 나눈다", () => {
    expect(computeLine({ ...item, qty: 1, price: 110000 }, "inclusive")).toMatchObject({ supply: 100000, tax: 10000 });
    const l = computeLine({ ...item, qty: 1, price: 12345 }, "inclusive");
    expect(l.supply + l.tax).toBe(12345);
  });
  it("면세", () => {
    expect(computeLine(item, "none")).toMatchObject({ supply: 99999, tax: 0 });
  });
});

describe("computeEstimate", () => {
  it("샘플 합계", () => {
    const { totals } = computeEstimate(parseItems(ESTIMATE_SAMPLE).items, "exclusive");
    expect(totals).toEqual({ supply: 756000 + 275000 + 128000, tax: 115900, total: 1274900 });
  });
});

describe("표기", () => {
  it("원·수량·한글 합계", () => {
    expect(won(1274900)).toBe("1,274,900");
    expect(qtyText(2.5)).toBe("2.5");
    expect(qtyText(1000)).toBe("1,000");
    expect(totalInWords(1100000)).toBe("일금 일백일십만원정 (₩1,100,000)");
  });
});

import { describe, expect, it } from "vitest";
import {
  computeEstimate,
  computeLine,
  ESTIMATE_SAMPLE,
  parseItems,
  parseNumber,
  priceVatLabel,
  qtyText,
  totalInWords,
  totalVatLabel,
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
  it("머리글 없이 띄어쓰기: 영문·숫자 낱말은 규격으로, 한글 낱말은 품목에", () => {
    const r = parseItems("의자 box 1ea 134,000\n사무용 의자 4 189000\nA4 복사용지 80g 10 27500");
    expect(r.items.map((x) => [x.name, x.spec, x.qty, x.price])).toEqual([
      ["의자", "box", 1, 134000],
      ["사무용 의자", "", 4, 189000],
      ["A4 복사용지", "80g", 10, 27500],
    ]);
  });
  it("탭 머리글 아래 띄어쓰기로 친 줄", () => {
    const r = parseItems("품목\t규격\t수량\t단가\t비고\n사무용 의자 T-ZERO 4 189,000\n모니터암 듀얼 2 64000 설치 포함\n볼펜\t\t20\t500");
    expect(r.items).toEqual([
      { name: "사무용 의자", spec: "T-ZERO", qty: 4, price: 189000, note: "" },
      { name: "모니터암", spec: "듀얼", qty: 2, price: 64000, note: "설치 포함" },
      { name: "볼펜", spec: "", qty: 20, price: 500, note: "" },
    ]);
  });
  it("머리글 순서가 달라도", () => {
    const r = parseItems("단가\t품명\t수량\n5,000\t볼펜\t20");
    expect(r.items[0]).toEqual({ name: "볼펜", spec: "", qty: 20, price: 5000, note: "" });
  });
  it("머리글이 없으면 열 수로 — 3열은 품목·수량·단가", () => {
    expect(parseItems("볼펜\t20\t500").items[0]).toMatchObject({ name: "볼펜", qty: 20, price: 500 });
    expect(parseItems("볼펜\t0.5mm\t20\t500").items[0]).toMatchObject({ spec: "0.5mm", qty: 20, price: 500 });
  });
  it("탭 없이 띄어쓰기로 입력해도(휴대폰) 칸을 나눈다", () => {
    const r = parseItems("품목 규격 수량 단가\n의자 ea 1 123000");
    expect(r.spaced).toBe(true);
    expect(r.hasHeader).toBe(true);
    expect(r.items).toEqual([{ name: "의자", spec: "ea", qty: 1, price: 123000, note: "" }]);
  });
  it("띄어쓰기 입력 — 품목 이름에 띄어쓰기가 있으면 뒤에서부터 숫자를 찾는다", () => {
    const r = parseItems("사무용 의자 4 189,000\nA4 복사용지 10 27,500 택배\n설치비 50000\n출장비 별도");
    expect(r.items).toEqual([
      { name: "사무용 의자", spec: "", qty: 4, price: 189000, note: "" },
      { name: "A4 복사용지", spec: "", qty: 10, price: 27500, note: "택배" },
      { name: "설치비", spec: "", qty: 1, price: 50000, note: "" },
    ]);
    expect(r.invalidLines).toEqual([4]);
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

describe("부가세 표기", () => {
  it("합계는 세액이 들어 있으면 부가세 포함", () => {
    expect(totalVatLabel("exclusive")).toBe("(부가세 포함)");
    expect(totalVatLabel("inclusive")).toBe("(부가세 포함)");
    expect(totalVatLabel("none")).toBe("(부가세 없음)");
  });
  it("단가 머리글은 계산 방식을 그대로", () => {
    expect(priceVatLabel("exclusive")).toBe("부가세 별도");
    expect(priceVatLabel("inclusive")).toBe("부가세 포함");
    expect(priceVatLabel("none")).toBe("");
  });
});

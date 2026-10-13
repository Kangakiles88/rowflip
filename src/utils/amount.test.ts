import { describe, expect, it } from "vitest";
import { amountWords, convertAmounts, DEFAULT_AMOUNT_OPTIONS, formatAmount, parseAmount } from "./amount";

const o = DEFAULT_AMOUNT_OPTIONS;

describe("parseAmount", () => {
  it("쉼표·원·₩·공백을 지운다", () => {
    expect(parseAmount("₩1,234,000원")).toEqual({ ok: true, negative: false, digits: "1234000" });
    expect(parseAmount(" -5,000 ")).toEqual({ ok: true, negative: true, digits: "5000" });
    expect(parseAmount("1200.00")).toEqual({ ok: true, negative: false, digits: "1200" });
  });
  it("숫자가 아니거나 소수면 실패", () => {
    expect(parseAmount("백만원").ok).toBe(false);
    expect(parseAmount("1.5")).toEqual({ ok: false, reason: "decimal" });
    expect(parseAmount("1.2E+11")).toEqual({ ok: false, reason: "invalid" });
    expect(parseAmount("1".repeat(25))).toEqual({ ok: false, reason: "tooBig" });
  });
});

describe("amountWords", () => {
  it("금액 표기는 십·백·천 앞에도 '일'을 붙이고 붙여 쓴다", () => {
    expect(amountWords("12345000", "formal")).toBe("일천이백삼십사만오천");
    expect(amountWords("1010000", "formal")).toBe("일백일만");
    expect(amountWords("110", "formal")).toBe("일백일십");
  });
  it("읽기 표기는 '일'을 빼고 만 단위로 띄어 쓴다", () => {
    expect(amountWords("12345000", "plain")).toBe("천이백삼십사만 오천");
    expect(amountWords("10000", "plain")).toBe("만");
    expect(amountWords("15000", "plain")).toBe("만 오천");
    expect(amountWords("100010000", "plain")).toBe("일억 일만");
    expect(amountWords("12345000", "plain", false)).toBe("천이백삼십사만오천");
  });
  it("숫자+단위", () => {
    expect(amountWords("12345000", "mixed")).toBe("1,234만 5,000");
    expect(amountWords("300000000", "mixed")).toBe("3억");
  });
  it("갖은자", () => {
    expect(amountWords("1230000", "hanja")).toBe("壹佰貳拾參萬");
  });
  it("0과 큰 수", () => {
    expect(amountWords("0", "formal")).toBe("영");
    expect(amountWords("1000000000000", "formal")).toBe("일조");
  });
});

describe("formatAmount", () => {
  it("일금 ○○원정 + 숫자 병기", () => {
    expect(formatAmount("12,345,000", o)).toBe("일금 일천이백삼십사만오천원정");
    expect(formatAmount("12,345,000", { ...o, withNumber: true })).toBe(
      "일금 일천이백삼십사만오천원정 (₩12,345,000)",
    );
  });
  it("형식별 감싸기", () => {
    expect(formatAmount("1230000", { ...o, style: "hanja" })).toBe("金 壹佰貳拾參萬원整");
    expect(formatAmount("15000", { ...o, style: "plain" })).toBe("만 오천원");
    expect(formatAmount("15000", { ...o, style: "plain", wrap: false })).toBe("만 오천");
  });
  it("음수", () => {
    expect(formatAmount("-5000", { ...o, wrap: false })).toBe("마이너스 오천");
  });
});

describe("convertAmounts", () => {
  it("줄 수를 유지하고 숫자가 아닌 줄은 비운다", () => {
    const r = convertAmounts("1000\n\n합계\n2000\n", { ...o, wrap: false });
    expect(r.output).toBe("일천\n\n\n이천");
    expect(r.converted).toBe(2);
    expect(r.invalidLines).toEqual([3]);
  });
});

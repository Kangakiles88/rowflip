import { describe, expect, it } from "vitest";
import { computeEstimate } from "./estimate";
import { estimateFillLines, estimateFillTotals, estimateTokens } from "./hwpxEstimate";

const { lines, totals } = computeEstimate(
  [
    { name: "사무용 의자", spec: "T-ZERO", qty: 4, price: 189000, note: "" },
    { name: "A4 복사용지", spec: "80g", qty: 2.5, price: 27500, note: "" },
  ],
  "exclusive",
);

describe("견적서 → HWPX 값", () => {
  it("줄 값은 천 단위 쉼표", () => {
    const [a, b] = estimateFillLines(lines);
    expect(a).toMatchObject({ qty: "4", price: "189,000", supply: "756,000", tax: "75,600", total: "831,600" });
    expect(b.qty).toBe("2.5");
    expect(estimateFillTotals(totals)).toEqual({ supply: "824,750", tax: "82,475", total: "907,225" });
  });
  it("자리 표시 값과 다른 이름", () => {
    const v = estimateTokens({
      date: "2026. 10. 30.",
      validUntil: "2026. 11. 29.",
      number: "",
      client: "가온디자인",
      supplier: { bizNo: "123-45-67890", name: "한빛오피스", ceo: "이서준", address: "", bizType: "", bizItem: "", phone: "" },
      lines,
      totals,
      note: "",
    });
    expect(v.합계).toBe("907,225");
    expect(v.합계금액).toBe("일금 구십만칠천이백이십오원정");
    expect(v.유효기간).toBe("2026. 11. 29.까지");
    expect(v.거래처).toBe("가온디자인");
    expect(v.사업자번호).toBe("123-45-67890");
  });
});

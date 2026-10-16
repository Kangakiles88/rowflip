import { describe, expect, it } from "vitest";
import {
  CELL_SPLIT_SAMPLE,
  DEFAULT_CELL_SPLIT_OPTIONS as D,
  looksLikeText,
  parseWidths,
  splitTable,
  splitValue,
  suggestDelimiter,
  type CellSplitOptions,
} from "./cellSplit";

const o = (patch: Partial<CellSplitOptions>): CellSplitOptions => ({ ...D, ...patch });

describe("splitValue", () => {
  it("띄어쓰기 — 연속 공백은 하나로", () => {
    expect(splitValue("서울시  강남구 테헤란로 152", o({}))).toEqual(["서울시", "강남구", "테헤란로", "152"]);
  });
  it("하이픈 — 전화번호", () => {
    expect(splitValue("010-2345-6789", o({ delimiter: "hyphen" }))).toEqual(["010", "2345", "6789"]);
  });
  it("쉼표 — 앞뒤 공백 정리, 연속 쉼표 처리", () => {
    expect(splitValue("A-10234, A-10235,,A-10236", o({ delimiter: "comma" }))).toEqual(["A-10234", "A-10235", "A-10236"]);
    expect(splitValue("a,,b", o({ delimiter: "comma", collapse: false }))).toEqual(["a", "", "b"]);
  });
  it("셀 안 줄바꿈", () => {
    expect(splitValue("1월 매출\n2월 매출", o({ delimiter: "newline" }))).toEqual(["1월 매출", "2월 매출"]);
  });
  it("직접 입력 구분자(여러 글자, 특수문자)", () => {
    expect(splitValue("A|B|C", o({ delimiter: "custom", custom: "|" }))).toEqual(["A", "B", "C"]);
    expect(splitValue("A :: B", o({ delimiter: "custom", custom: "::" }))).toEqual(["A", "B"]);
    expect(splitValue("A|B", o({ delimiter: "custom", custom: "" }))).toEqual(["A|B"]);
  });
  it("첫 구분자에서만 / 마지막 구분자에서만", () => {
    expect(splitValue("서울시 강남구 테헤란로 152", o({ limit: "first" }))).toEqual(["서울시", "강남구 테헤란로 152"]);
    expect(splitValue("서울시 강남구 테헤란로 152", o({ limit: "last" }))).toEqual(["서울시 강남구 테헤란로", "152"]);
  });
  it("글자 수 — 성과 이름, 전화번호, 끝에서 자르기", () => {
    expect(splitValue("김민수", o({ delimiter: "width", widths: "1" }))).toEqual(["김", "민수"]);
    expect(splitValue("01023456789", o({ delimiter: "width", widths: "3,4" }))).toEqual(["010", "2345", "6789"]);
    expect(splitValue("A-10234", o({ delimiter: "width", widths: "4", limit: "last" }))).toEqual(["A-1", "0234"]);
  });
  it("구분자가 없으면 그대로 한 칸", () => {
    expect(splitValue("김민수", o({}))).toEqual(["김민수"]);
    expect(splitValue("", o({}))).toEqual([""]);
  });
});

describe("parseWidths", () => {
  it("쉼표·띄어쓰기로 구분, 잘못된 값은 버림", () => {
    expect(parseWidths("3, 4 x 0")).toEqual([3, 4]);
  });
});

describe("suggestDelimiter", () => {
  it("셀 안 줄바꿈 > 쉼표 > … 순", () => {
    expect(suggestDelimiter(["a\nb", "c"])).toBe("newline");
    expect(suggestDelimiter(["a, b", "c, d"])).toBe("comma");
    expect(suggestDelimiter(["010-1234-5678"])).toBe("hyphen");
    expect(suggestDelimiter(["김민수"])).toBeNull();
  });
});

describe("splitTable", () => {
  it("구분자가 가장 많은 열을 골라 옆 열로 나누고 다른 열은 그대로", () => {
    const r = splitTable(CELL_SPLIT_SAMPLE, o({ header: true }));
    expect(r.column).toBe(1);
    expect(r.rows[0]).toEqual(["이름", "주소1", "주소2", "주소3", "주소4", "연락처"]);
    expect(r.rows[1]).toEqual(["김민수", "서울시", "강남구", "테헤란로", "152", "010-2345-6789"]);
    expect(r.splitCount).toBe(3);
    expect(r.maxParts).toBe(4);
  });
  it("열을 직접 고르고 원래 열 남기기", () => {
    const r = splitTable(CELL_SPLIT_SAMPLE, o({ header: true, delimiter: "hyphen", keepOriginal: true }), 2);
    expect(r.rows[0]).toEqual(["이름", "주소", "연락처", "연락처1", "연락처2", "연락처3"]);
    expect(r.rows[3].slice(2)).toEqual(["02-555-0123", "02", "555", "0123"]);
  });
  it("아래 행으로 나누기 — 다른 열 값은 줄마다 반복", () => {
    const r = splitTable("담당\t상품코드\n김민수\tA-10234, A-10235\n이서연\tB-200", o({ header: true, delimiter: "comma", direction: "rows" }));
    expect(r.rows).toEqual([
      ["담당", "상품코드"],
      ["김민수", "A-10234"],
      ["김민수", "A-10235"],
      ["이서연", "B-200"],
    ]);
  });
  it("엑셀 셀 안 줄바꿈(따옴표로 감싼 칸)", () => {
    const r = splitTable('사번\t메모\nE-1001\t"1월 매출 1,200\n2월 매출 900"', o({ header: true, delimiter: "newline" }));
    expect(r.rows[1]).toEqual(["E-1001", "1월 매출 1,200", "2월 매출 900"]);
  });
  it("결과는 탭 구분, 앞자리 0은 표 형식에서 텍스트 서식", () => {
    const r = splitTable("010-2345-6789", o({ delimiter: "hyphen" }));
    expect(r.output).toBe("010\t2345\t6789");
    expect(r.html).toContain("mso-number-format");
    expect(looksLikeText("010")).toBe(true);
    expect(looksLikeText("2345")).toBe(false);
  });
  it("나뉠 칸이 없으면 noMatch", () => {
    const r = splitTable("김민수\n이서연", o({ delimiter: "comma" }));
    expect(r.noMatch).toBe(true);
    expect(r.rows).toEqual([["김민수"], ["이서연"]]);
  });
});

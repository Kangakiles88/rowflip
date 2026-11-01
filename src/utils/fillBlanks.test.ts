import { describe, expect, it } from "vitest";
import { DEFAULT_FILL_OPTIONS, FILL_SAMPLE, fillBlanksText, fillRows, guessHeader, type FillOptions } from "./fillBlanks";

const o = (patch: Partial<FillOptions> = {}): FillOptions => ({ ...DEFAULT_FILL_OPTIONS, ...patch });

describe("fillRows", () => {
  it("위 값으로 채운다", () => {
    const r = fillRows([["서울", "1"], ["", "2"], ["", "3"], ["경기", "4"], ["", "5"]], o());
    expect(r.rows.map((x) => x[0])).toEqual(["서울", "서울", "서울", "경기", "경기"]);
    expect(r.filled).toBe(3);
  });

  it("아래 값으로 채운다", () => {
    const r = fillRows([[""], [""], ["소계"], [""], ["합계"]], o({ mode: "below" }));
    expect(r.rows.map((x) => x[0])).toEqual(["소계", "소계", "소계", "합계", "합계"]);
  });

  it("정한 값으로 채운다", () => {
    const r = fillRows([["김", "10"], ["이", ""], ["박", " "]], o({ mode: "value", value: "0" }));
    expect(r.rows.map((x) => x[1])).toEqual(["10", "0", "0"]);
  });

  it("고른 열만 채운다", () => {
    const r = fillRows([["서울", "강남", "1"], ["", "", "2"]], o({ columns: [0] }));
    expect(r.rows[1]).toEqual(["서울", "", "2"]);
  });

  it("머리글은 채우지도 내려 보내지도 않는다", () => {
    const r = fillRows([["지역", "매출"], ["", "1"], ["서울", "2"], ["", "3"]], o({ header: true }));
    expect(r.rows.map((x) => x[0])).toEqual(["지역", "", "서울", "서울"]);
    expect(r.leftBlank).toBe(1);
  });

  it("모든 칸이 빈 행은 그대로 두고 그 다음도 이어 채운다", () => {
    const r = fillRows([["서울", "1"], ["", ""], ["", "2"]], o());
    expect(r.rows).toEqual([["서울", "1"], ["", ""], ["서울", "2"]]);
  });

  it("한 열뿐이면 빈칸을 모두 채운다", () => {
    const r = fillRows([["A"], [""], [""], ["B"]], o());
    expect(r.rows.map((x) => x[0])).toEqual(["A", "A", "A", "B"]);
  });

  it("공백만 있는 칸은 옵션에 따라", () => {
    expect(fillRows([["A"], [" "]], o()).rows[1][0]).toBe("A");
    expect(fillRows([["A"], [" "]], o({ spaceIsBlank: false })).rows[1][0]).toBe(" ");
  });
});

describe("fillBlanksText", () => {
  it("샘플 — 지역·지점을 채우고 담당자 빈칸도 위 값", () => {
    const r = fillBlanksText(FILL_SAMPLE, o({ header: true, columns: [0, 1] }));
    expect(r.rows[2]).toEqual(["서울", "강남점", "이서연", "980"]);
    expect(r.rows[4]).toEqual(["서울", "서초점", "", "870"]);
    expect(r.rows[6]).toEqual(["경기", "판교점", "정하늘", "760"]);
    expect(r.filled).toBe(8);
    expect(r.output.split("\n")).toHaveLength(8);
  });
  it("끝 빈 줄은 빼고, 앞자리 0은 HTML 표에서 텍스트로", () => {
    const r = fillBlanksText("코드\n0123\n\n", o());
    expect(r.rows).toEqual([["코드"], ["0123"]]);
    expect(r.html).toContain("0123");
  });
  it("빈 입력", () => {
    expect(fillBlanksText("", o()).output).toBe("");
  });
});

describe("guessHeader", () => {
  it("빈칸 없는 글자 첫 행 + 아래 빈칸이면 머리글", () => {
    expect(guessHeader([["부서", "이름"], ["영업팀", "김민준"], ["", "이서연"]])).toBe(true);
    expect(guessHeader([["지역", "1월 매출"], ["서울", "1,200"], ["", "980"]])).toBe(true);
  });
  it("첫 행에 숫자 칸·빈칸이 있으면 데이터", () => {
    expect(guessHeader([["서울", "1,200"], ["", "980"]])).toBe(false);
    expect(guessHeader([["서울", ""], ["", "980"]])).toBe(false);
  });
});

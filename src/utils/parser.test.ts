import { describe, expect, it } from "vitest";
import { parseAnyTable, parseCsvLine } from "./parser";

describe("parseAnyTable", () => {
  it("탭이 있으면 탭=열, 칸 안의 쉼표는 값", () => {
    const t = parseAnyTable("이름\t주소\n김민수\t서울시, 강남구");
    expect(t.source).toBe("tab");
    expect(t.rows[1]).toEqual(["김민수", "서울시, 강남구"]);
  });
  it("탭이 없고 줄마다 쉼표 칸 수가 같으면 CSV", () => {
    const t = parseAnyTable('사번,이름,주소\nE-1001,김민수,"서울시, 강남구"\nE-1002,이서연,부산시\n');
    expect(t.source).toBe("csv");
    expect(t.colCount).toBe(3);
    expect(t.rows[1]).toEqual(["E-1001", "김민수", "서울시, 강남구"]);
  });
  it("천 단위 쉼표 때문에 칸 수가 다르면 CSV로 보지 않는다", () => {
    const t = parseAnyTable("1월 매출 1,200\n2월 매출 900");
    expect(t.source).toBe("tab");
    expect(t.colCount).toBe(1);
  });
  it("한 줄짜리 쉼표 목록은 그대로(한 칸)", () => {
    expect(parseAnyTable("A-10234, A-10235").colCount).toBe(1);
  });
  it("마크다운 표", () => {
    const t = parseAnyTable("| 상품코드 | 수량 |\n|---|---:|\n| A-10234 | 3 |\n| B-200 | 1 |");
    expect(t.source).toBe("markdown");
    expect(t.rows).toEqual([
      ["상품코드", "수량"],
      ["A-10234", "3"],
      ["B-200", "1"],
    ]);
  });
  it("CSV 따옴표 안의 \"\"는 따옴표 하나", () => {
    expect(parseCsvLine('a,"say ""hi"", ok",c')).toEqual(["a", 'say "hi", ok', "c"]);
  });
});

import { describe, expect, it } from "vitest";
import { DEFAULT_OPTIONS } from "./presets";
import { splitCell, splitCells, suggestInputSplit, unquote, unwrapBrackets } from "./split";
import { transform } from "./transformer";

describe("splitCell", () => {
  it("쉼표 — 전각 쉼표·가운뎃점 쉼표도 나눈다", () => {
    expect(splitCell("A-10234, A-10235，A-10236、A-10237", "comma")).toEqual([
      "A-10234",
      " A-10235",
      "A-10236",
      "A-10237",
    ]);
  });
  it("큰따옴표로 감싼 값 안의 쉼표는 나누지 않는다", () => {
    expect(splitCell('"서울, 강남", 부산', "comma")).toEqual(["서울, 강남", " 부산"]);
    expect(splitCell('"a ""b"" c", d', "comma")).toEqual(['a "b" c', " d"]);
  });
  it("값 중간의 따옴표는 그대로 둔다", () => {
    expect(splitCell('27" 모니터, 키보드', "comma")).toEqual(['27" 모니터', " 키보드"]);
  });
  it("띄어쓰기 — 연속 공백과 전각 공백도 하나로", () => {
    expect(splitCell("사과  배　포도", "space")).toEqual(["사과", "배", "포도"]);
  });
  it("세미콜론·슬래시·파이프", () => {
    expect(splitCell("a;b；c", "semicolon")).toEqual(["a", "b", "c"]);
    expect(splitCell("a/b", "slash")).toEqual(["a", "b"]);
    expect(splitCell("a|b", "pipe")).toEqual(["a", "b"]);
  });
  it("직접 입력 — 여러 글자 구분자, 비어 있으면 나누지 않음", () => {
    expect(splitCell("a :: b :: c", "custom", " :: ")).toEqual(["a", "b", "c"]);
    expect(splitCell("a,b", "custom", "")).toEqual(["a,b"]);
  });
  it("cells는 그대로", () => {
    expect(splitCells(["a,b", "c"], "cells")).toEqual(["a,b", "c"]);
  });
});

describe("unwrap", () => {
  it("괄호와 따옴표를 벗긴다", () => {
    expect(unwrapBrackets("('A-1','A-2')")).toBe("'A-1','A-2'");
    expect(unwrapBrackets('["a", "b"]')).toBe('"a", "b"');
    expect(unwrapBrackets("(a")).toBe("(a");
    expect(unquote(" 'A-1' ")).toBe("A-1");
    expect(unquote("'it''s'")).toBe("it's");
    expect(unquote("'a\"")).toBe("'a\"");
  });
});

describe("suggestInputSplit", () => {
  it("칸이 적고 모두 쉼표가 있으면 쉼표", () => {
    expect(suggestInputSplit(["A, B, C"])).toBe("comma");
    expect(suggestInputSplit(["a;b"])).toBe("semicolon");
  });
  it("엑셀 목록이면 추측하지 않는다", () => {
    expect(suggestInputSplit(["a", "b", "c", "d"])).toBeNull();
    expect(suggestInputSplit(["제목이 아닙니다 애플"])).toBeNull();
  });
});

describe("transform — 원본 나누기", () => {
  it("쉼표 목록을 세로로", () => {
    const r = transform("A-10234, A-10235, A-10236", {
      ...DEFAULT_OPTIONS,
      inputSplit: "comma",
      separator: "newline",
    });
    expect(r.output).toBe("A-10234\nA-10235\nA-10236");
    expect(r.stats.outputCount).toBe(3);
  });
  it("SQL IN 조건을 목록으로 되돌린다", () => {
    const r = transform("('A-10234','A-10235')", {
      ...DEFAULT_OPTIONS,
      inputSplit: "comma",
      unwrap: true,
      separator: "newline",
    });
    expect(r.output).toBe("A-10234\nA-10235");
  });
  it("엑셀 칸 모드에서 쉼표 목록이면 안내용 추측을 돌려준다", () => {
    expect(transform("a, b, c", DEFAULT_OPTIONS).suggestedSplit).toBe("comma");
    expect(transform("a, b, c", { ...DEFAULT_OPTIONS, inputSplit: "comma" }).suggestedSplit).toBeNull();
  });
});

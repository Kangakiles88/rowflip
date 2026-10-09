import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRANSPOSE_OPTIONS as D,
  dropEmptyCols,
  toCsv,
  toMarkdown,
  toTsv,
  transposeRows,
  transposeText,
} from "./transpose";

describe("행열 바꾸기", () => {
  it("3행×2열 → 2행×3열", () => {
    const r = transposeText("a\t1\nb\t2\nc\t3\n", D);
    expect(r.output).toBe("a\tb\tc\n1\t2\t3");
    expect(r.before).toEqual({ rows: 3, cols: 2 });
    expect(r.after).toEqual({ rows: 2, cols: 3 });
  });

  it("두 번 바꾸면 원래대로", () => {
    const src = [["구분", "1월", "2월"], ["매출", "10", "20"]];
    expect(transposeRows(transposeRows(src))).toEqual(src);
  });

  it("길이가 다른 행은 빈 칸으로 채움", () => {
    expect(transposeRows([["a", "b", "c"], ["d"]])).toEqual([["a", "d"], ["b", ""], ["c", ""]]);
  });

  it("한 열 → 한 행", () => {
    expect(transposeText("사과\n배\n포도", D).output).toBe("사과\t배\t포도");
  });

  it("빈 행 제거 / 빈 열 제거", () => {
    expect(transposeText("a\t\tb\n\t\t\nc\t\td", { ...D, removeEmptyCols: true }).output).toBe("a\tc\nb\td");
    expect(dropEmptyCols([["a", " ", "b"]])).toEqual([["a", "b"]]);
  });

  it("줄바꿈이 든 엑셀 셀을 깨지 않음", () => {
    const r = transposeText('"첫줄\n둘째줄"\tx\ny\tz', D);
    expect(r.rows).toEqual([["첫줄\n둘째줄", "y"], ["x", "z"]]);
    expect(r.output).toBe('"첫줄\n둘째줄"\ty\nx\tz');
  });

  it("빈 입력", () => {
    expect(transposeText("", D)).toMatchObject({ output: "", after: { rows: 0, cols: 0 } });
  });
});

describe("출력 형식", () => {
  const rows = [["이름", "메모"], ["김, 철수", 'a "b"'], ["x|y", "z"]];
  it("TSV", () => expect(toTsv([["a", 'b"c']])).toBe('a\t"b""c"'));
  it("CSV", () => expect(toCsv(rows)).toBe('이름,메모\n"김, 철수","a ""b"""\nx|y,z'));
  it("마크다운", () =>
    expect(toMarkdown(rows)).toBe("| 이름 | 메모 |\n| --- | --- |\n| 김, 철수 | a \"b\" |\n| x\\|y | z |"));
});

describe("성능", () => {
  it("1,000행 × 50열", () => {
    const raw = Array.from({ length: 1000 }, (_, r) => Array.from({ length: 50 }, (_, c) => `${r}-${c}`).join("\t")).join("\n");
    const t0 = performance.now();
    const res = transposeText(raw, D);
    expect(res.after).toEqual({ rows: 50, cols: 1000 });
    expect(performance.now() - t0).toBeLessThan(1000);
  });
});

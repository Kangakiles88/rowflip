import { describe, expect, it } from "vitest";
import type { TransformOptions } from "../types";
import { parseTable } from "./parser";
import { DEFAULT_OPTIONS, PRESETS } from "./presets";
import { applyNumbering, sortItems, transform } from "./transformer";

const run = (raw: string, o: Partial<TransformOptions> = {}) =>
  transform(raw, { ...DEFAULT_OPTIONS, ...o }).output;
const preset = (id: string) => PRESETS.find((p) => p.id === id)!.apply(DEFAULT_OPTIONS);

describe("사용 사례", () => {
  it("Case 1. 세로 → 쉼표", () => {
    expect(run("사과\n배\n포도\n수박")).toBe("사과, 배, 포도, 수박");
  });
  it("Case 2. 가로(탭) → 세로", () => {
    expect(transform("사과\t배\t포도\t수박", preset("vertical")).output).toBe("사과\n배\n포도\n수박");
  });
  it("Case 3. 중복 제거 — 첫 값 유지", () => {
    expect(run("apple\nbanana\napple\nmelon\nbanana", { dedupe: true, separator: "newline" })).toBe(
      "apple\nbanana\nmelon",
    );
  });
  it("Case 4. SQL IN", () => {
    expect(transform("apple\nbanana\nmelon", preset("sql")).output).toBe("('apple','banana','melon')");
  });
  it("Case 5. URL 목록", () => {
    expect(transform("apple\nbanana\nmelon", preset("url")).output).toBe(
      "https://example.com/apple\nhttps://example.com/banana\nhttps://example.com/melon",
    );
  });
});

describe("정리", () => {
  it("공백 제거 + 빈 줄 제거 + CRLF", () => {
    expect(run(" apple \r\n\r\n banana\r\n")).toBe("apple, banana");
  });
  it("공백 제거 끄면 원문 유지", () => {
    expect(run(" a \nb", { trim: false })).toBe(" a , b");
  });
  it("대소문자 무시 중복 제거", () => {
    expect(run("Apple\napple\nAPPLE\nb", { dedupe: true, ignoreCase: true })).toBe("Apple, b");
  });
  it("통계", () => {
    const r = transform("a\n\na\nb", { ...DEFAULT_OPTIONS, dedupe: true });
    expect(r.stats).toMatchObject({ inputCells: 4, removedEmpty: 1, removedDuplicates: 1, outputCount: 2 });
  });
});

describe("출력 형식", () => {
  const base = "apple\nbanana\nmelon";
  it("구분자들", () => {
    expect(run(base, { separator: "comma" })).toBe("apple,banana,melon");
    expect(run(base, { separator: "pipe" })).toBe("apple | banana | melon");
    expect(run(base, { separator: "tab" })).toBe("apple\tbanana\tmelon");
    expect(run(base, { separator: "custom", customSeparator: " && " })).toBe("apple && banana && melon");
  });
  it("접두사 + 접미사 동시", () => {
    expect(run("apple\nbanana", { prefix: "SKU-", suffix: ".jpg", separator: "newline" })).toBe(
      "SKU-apple.jpg\nSKU-banana.jpg",
    );
  });
  it("따옴표", () => {
    expect(run(base, { quote: "single", separator: "comma" })).toBe("'apple','banana','melon'");
    expect(run(base, { quote: "double", separator: "comma" })).toBe('"apple","banana","melon"');
  });
  it("번호", () => {
    expect(applyNumbering(["a", "b"], "dot")).toEqual(["1. a", "2. b"]);
    expect(applyNumbering(["a", "b"], "paren")).toEqual(["1) a", "2) b"]);
    expect(applyNumbering(["a", "b"], "underscore")).toEqual(["01_a", "02_b"]);
    expect(applyNumbering(Array(120).fill("x"), "underscore")[0]).toBe("001_x");
  });
  it("JSON / JS / Python / HTML", () => {
    expect(run(base, { format: "json" })).toBe('["apple","banana","melon"]');
    expect(run(base, { format: "js" })).toBe('["apple", "banana", "melon"]');
    expect(run(base, { format: "python" })).toBe('["apple", "banana", "melon"]');
    expect(run("a<b\nc", { format: "html" })).toBe("<ul>\n  <li>a&lt;b</li>\n  <li>c</li>\n</ul>");
  });
  it("SQL IN 작은따옴표 이스케이프", () => {
    expect(run("O'Neil", { format: "sql-in" })).toBe("('O''Neil')");
  });
  it("JSON 특수문자 이스케이프", () => {
    expect(run('say "hi"', { format: "json" })).toBe('["say \\"hi\\""]');
  });
});

describe("정렬", () => {
  it("숫자만 있으면 숫자 기준", () => {
    expect(sortItems(["10", "9", "1,000", "2"], "asc")).toEqual(["2", "9", "10", "1,000"]);
    expect(sortItems(["10", "9", "2"], "desc")).toEqual(["10", "9", "2"]);
  });
  it("문자는 한국어 자연 정렬", () => {
    expect(sortItems(["포도", "사과", "item10", "item2"], "asc")).toEqual(["사과", "포도", "item2", "item10"]);
  });
  it("역순 / 랜덤(시드 고정)", () => {
    expect(sortItems(["a", "b", "c"], "reverse")).toEqual(["c", "b", "a"]);
    const r1 = sortItems(["a", "b", "c", "d", "e"], "random", 42);
    expect(sortItems(["a", "b", "c", "d", "e"], "random", 42)).toEqual(r1);
    expect([...r1].sort()).toEqual(["a", "b", "c", "d", "e"]);
  });
});

describe("엑셀 파싱", () => {
  it("행 × 열 감지, 끝 줄바꿈 무시", () => {
    const t = parseTable("a\t1\nb\t2\nc\t3\n");
    expect([t.rowCount, t.colCount]).toEqual([3, 2]);
  });
  it("열 선택", () => {
    expect(run("a\t1\nb\t2", { column: 1 })).toBe("1, 2");
    expect(run("a\t1\nb\t2", { column: "all" })).toBe("a, 1, b, 2");
  });
  it("줄바꿈 들어간 엑셀 셀", () => {
    const t = parseTable('"첫줄\n둘째줄"\tx\ny\tz');
    expect(t.rows).toEqual([["첫줄\n둘째줄", "x"], ["y", "z"]]);
  });
  it("메모장의 따옴표 값은 그대로", () => {
    expect(run('"apple"\n"banana"')).toBe('"apple", "banana"');
  });
});

describe("성능", () => {
  it("50,000행을 빠르게 처리", () => {
    const raw = Array.from({ length: 50000 }, (_, i) => `item-${i % 30000}`).join("\n");
    const t0 = performance.now();
    const r = transform(raw, { ...DEFAULT_OPTIONS, dedupe: true, sort: "asc", format: "sql-in" });
    expect(r.items.length).toBe(30000);
    expect(performance.now() - t0).toBeLessThan(1500);
  });
});

describe("가로로 프리셋", () => {
  it("세로 목록 → 탭 연결 (엑셀 한 행으로 붙여넣기)", () => {
    expect(transform("사과\n배\n포도", preset("horizontal")).output).toBe("사과\t배\t포도");
  });
});

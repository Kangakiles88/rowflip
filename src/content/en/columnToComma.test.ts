import { describe, expect, it } from "vitest";
import { EN_TOOL_PAGES, enHrefFor } from "../../config/navEn";
import { bookmarkMessage } from "../../utils/bookmarkHint";
import { DEFAULT_OPTIONS, PRESETS } from "../../utils/presets";
import { INPUT_SPLITS } from "../../utils/split";
import { transform } from "../../utils/transformer";
import { EN_FAQ, EN_GUIDES, EN_HOME } from "./columnToComma";

const hangul = /[가-힣]/;

describe("영어 첫 페이지(/en/)", () => {
  it("빠른 변환·나누기 기준에 영어 이름이 모두 있다", () => {
    for (const p of PRESETS) {
      expect(p.en.label).not.toMatch(hangul);
      expect(p.en.example).not.toMatch(hangul);
    }
    for (const s of INPUT_SPLITS) {
      expect(s.en).not.toMatch(hangul);
      expect(s.enShort).not.toMatch(hangul);
    }
    expect(bookmarkMessage(false, "en")).toBe("Copied. Press Ctrl+D to bookmark this page for next time.");
  });

  it("FAQ 평문이 화면 문구와 같고 한글이 없다", () => {
    for (const f of EN_FAQ) {
      expect(f.plain).toBe(f.a);
      expect(f.q + f.plain).not.toMatch(hangul);
    }
    expect(EN_HOME.description.length).toBeGreaterThan(80);
    expect(EN_HOME.description.length).toBeLessThanOrEqual(170);
  });

  it("안내 예시가 실제 변환 결과와 같다", () => {
    const preset = (id: string) => PRESETS.find((p) => p.id === id)!.apply(DEFAULT_OPTIONS);
    const out = (id: string) => EN_GUIDES.find((g) => g.id === id)!;
    const run = (id: string, o: typeof DEFAULT_OPTIONS) => transform(out(id).input, o).output;
    expect(run("column-to-comma", preset("comma"))).toBe(out("column-to-comma").output);
    expect(run("comma-to-column", { ...preset("vertical"), inputSplit: "comma" })).toBe(out("comma-to-column").output);
    expect(run("column-to-row", preset("horizontal")).replace(/\t/g, "⇥")).toBe(out("column-to-row").output);
    expect(run("sql-in", preset("sql"))).toBe(out("sql-in").output);
    expect(run("json-array", preset("json"))).toBe(out("json-array").output);
    expect(run("dedupe-sort", { ...preset("dedupe"), sort: "asc", separator: "newline" })).toBe(out("dedupe-sort").output);
  });

  it("한·영 주소를 서로 찾는다", () => {
    expect(enHrefFor("/")).toBe("/en/");
    expect(enHrefFor("/transpose/")).toBeUndefined();
    expect(EN_TOOL_PAGES[0].href).toBe(EN_HOME.path);
  });
});

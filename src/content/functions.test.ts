import { describe, expect, it } from "vitest";
import { evaluateFormula, parseNumber, SUPPORTED_FUNCTIONS } from "../utils/formula";
import { FUNCTION_LESSONS, FUNCTIONS_INDEX } from "./functions";

const ALL = [FUNCTIONS_INDEX, ...FUNCTION_LESSONS];

/** 안내 예시의 결과(1,234 같은 표기)와 실제 계산 결과가 같은지 */
function matches(display: string, expected: string): boolean {
  const n = parseNumber(expected);
  if (n !== null) return Number(display) === n;
  return display === expected;
}

describe.each(ALL.map((l) => [l.meta.path, l] as const))("%s", (_path, lesson) => {
  const sheet = lesson.lab.sheet;

  it("안내 예시 수식이 예제 표에서 적힌 결과대로 계산된다", () => {
    for (const g of lesson.guides) {
      if (!g.input.startsWith("=")) continue;
      const r = evaluateFormula(g.input, sheet);
      const shown = r.ok ? r.display : r.code;
      expect(matches(shown, g.output), `${g.id}: ${g.input} → ${shown}, 기대 ${g.output}`).toBe(true);
    }
  });

  it("예제 수식은 오류 없이 계산된다", () => {
    for (const e of [...lesson.lab.examples, { label: "기본", formula: lesson.lab.defaultFormula, note: "" }]) {
      const r = evaluateFormula(e.formula, sheet);
      expect(r.ok, `${e.label}: ${e.formula} ${r.ok ? "" : r.message}`).toBe(true);
    }
  });

  it("연습 문제 정답은 계산되고 지정한 함수를 쓴다", () => {
    for (const t of lesson.lab.tasks) {
      const r = evaluateFormula(t.answer, sheet);
      expect(r.ok, t.answer).toBe(true);
      for (const f of t.mustUse) {
        const names = f.split("|");
        expect(names.some((n) => SUPPORTED_FUNCTIONS.includes(n))).toBe(true);
        expect(names.some((n) => r.functions.includes(n)), `${t.answer}에 ${f}`).toBe(true);
      }
    }
  });

  it("메타 길이", () => {
    expect(lesson.meta.title.length).toBeLessThanOrEqual(60);
    expect(lesson.meta.description.length).toBeGreaterThanOrEqual(80);
    expect(lesson.meta.description.length).toBeLessThanOrEqual(170);
    for (const f of lesson.faq) expect(f.a).toBe(f.plain);
  });
});

it("연습 문제 정답 값", () => {
  const values = (l: (typeof ALL)[number]) =>
    l.lab.tasks.map((t) => {
      const r = evaluateFormula(t.answer, l.lab.sheet);
      return r.ok ? r.display : r.code;
    });
  expect(values(FUNCTIONS_INDEX)).toEqual(["8490", "1430", "2"]);
  expect(values(FUNCTION_LESSONS[0])).toEqual(["3050", "4800", "2380", "6610"]);
  expect(values(FUNCTION_LESSONS[1])).toEqual(["7", "3", "1", "7"]);
  expect(values(FUNCTION_LESSONS[2])).toEqual(["15800", "340", "3", "확인 필요"]);
  expect(values(FUNCTION_LESSONS[3])).toEqual(["달성", "감소", "O", "S"]);
});

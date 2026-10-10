import { describe, expect, it } from "vitest";
import { DEFAULT_DEDUPE_OPTIONS as D, DEDUPE_SAMPLE, dedupeRows, dedupeText, type DedupeOptions } from "./dedupe";

const opts = (patch: Partial<DedupeOptions> = {}): DedupeOptions => ({ ...D, ...patch });
const list = (...v: string[]) => v.join("\n");

describe("dedupeText — 한 열 목록", () => {
  it("처음 나온 순서대로 중복을 지운다", () => {
    const r = dedupeText(list("A-10234", "A-10235", "A-10234", "B-20001", "A-10235"), opts());
    expect(r.output).toBe(list("A-10234", "A-10235", "B-20001"));
    expect(r.stats).toMatchObject({ total: 5, unique: 3, removed: 2, duplicateValues: 2 });
  });

  it("마지막에 나온 것을 남기면 순서가 마지막 위치를 따른다", () => {
    const r = dedupeText(list("a", "b", "a", "c"), opts({ keep: "last" }));
    expect(r.output).toBe(list("b", "a", "c"));
  });

  it("중복된 값만 한 번씩 보여 준다", () => {
    const r = dedupeText(list("x", "y", "x", "z", "y", "x"), opts({ mode: "duplicates" }));
    expect(r.output).toBe(list("x", "y"));
  });

  it("개수 세기는 많이 나온 순, 같으면 먼저 나온 순", () => {
    const r = dedupeText(list("서울", "부산", "서울", "대구", "부산", "서울"), opts({ mode: "count" }));
    expect(r.output).toBe(list("서울\t3", "부산\t2", "대구\t1"));
  });

  it("앞뒤 공백 무시를 끄면 공백이 다른 값은 다른 값이다", () => {
    expect(dedupeText(list("A1", " A1 "), opts()).output).toBe("A1");
    expect(dedupeText(list("A1", " A1 "), opts({ trim: false })).output).toBe(list("A1", " A1 "));
  });

  it("대소문자 무시", () => {
    expect(dedupeText(list("abc", "ABC"), opts()).stats.unique).toBe(2);
    expect(dedupeText(list("abc", "ABC"), opts({ ignoreCase: true })).output).toBe("abc");
  });

  it("빈 줄은 기본으로 빼고 개수를 센다", () => {
    const r = dedupeText(list("a", "", "a", "  ", "b"), opts());
    expect(r.output).toBe(list("a", "b"));
    expect(r.stats.emptyRemoved).toBe(2);
  });

  it("빈 입력", () => {
    expect(dedupeText("", opts()).output).toBe("");
    expect(dedupeText("  \n", opts()).stats.total).toBe(0);
  });
});

describe("dedupeText — 표", () => {
  it("행 전체가 같을 때만 중복", () => {
    const r = dedupeText(DEDUPE_SAMPLE, opts({ header: true }));
    expect(r.rows).toHaveLength(1 + 5);
    expect(r.rows[0]).toEqual(["주문번호", "고객명", "상품코드"]);
    expect(r.stats.removed).toBe(2);
  });

  it("특정 열만 기준으로 비교한다", () => {
    const r = dedupeText(DEDUPE_SAMPLE, opts({ header: true, key: 1 }));
    expect(r.rows.slice(1).map((row) => row[1])).toEqual(["김민수", "이서연", "박지훈", "최유진"]);
  });

  it("개수 세기는 머리글에 '개수' 열을 붙인다", () => {
    const r = dedupeText(DEDUPE_SAMPLE, opts({ header: true, key: 2, mode: "count" }));
    expect(r.rows[0]).toEqual(["주문번호", "고객명", "상품코드", "개수"]);
    expect(r.rows[1]).toEqual(["A-10234", "김민수", "P-301", "3"]);
  });

  it("줄바꿈이 든 셀은 다시 따옴표로 감싸서 내보낸다", () => {
    const r = dedupeText('"서울\n강남"\t1\n"서울\n강남"\t1', opts());
    expect(r.output).toBe('"서울\n강남"\t1');
  });
});

describe("dedupeText — 한 행짜리 가로 목록", () => {
  it("칸 하나하나를 목록으로 보고 결과도 가로로", () => {
    const r = dedupeText("A\tB\tA\tC", opts({ header: true, key: 2 }));
    expect(r.horizontal).toBe(true);
    expect(r.output).toBe("A\tB\tC");
  });
});

describe("dedupeRows", () => {
  it("짧은 행의 없는 열은 빈 칸으로 본다", () => {
    const r = dedupeRows([["a"], ["b", "x"]], opts({ key: 1, removeEmpty: true }));
    expect(r.rows).toEqual([["b", "x"]]);
    expect(r.stats.emptyRemoved).toBe(1);
  });
});

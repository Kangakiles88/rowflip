import { describe, expect, it } from "vitest";
import { CASE_SAMPLE, convertCase, splitWords } from "./caseConvert";
import { countText } from "./count";
import { DIFF_SAMPLE_A, DIFF_SAMPLE_B, diffSequence, diffText, diffToText } from "./diff";
import { engToKor, guessHanyangMode, HANYANG_SAMPLE, korToEng } from "./hanyang";
import { DEFAULT_LINEBREAK_OPTIONS as LB, removeLinebreaks } from "./linebreak";

describe("countText", () => {
  it("공백 포함·제외, 바이트", () => {
    const s = countText("가나 ab", { newlineAsChar: false });
    expect(s).toMatchObject({ withSpaces: 5, withoutSpaces: 4, bytes2: 7, bytesUtf8: 9, words: 2, lines: 1 });
  });
  it("줄바꿈은 기본으로 글자수에서 빼고, 옵션으로 넣는다", () => {
    expect(countText("가\n나", { newlineAsChar: false }).withSpaces).toBe(2);
    expect(countText("가\r\n나", { newlineAsChar: true }).withSpaces).toBe(3);
    expect(countText("가\n나", { newlineAsChar: true }).withoutSpaces).toBe(2);
  });
  it("이모지와 조합 문자는 한 글자", () => {
    expect(countText("👍🏻한", { newlineAsChar: false }).withSpaces).toBe(2);
  });
  it("문단과 줄", () => {
    const s = countText("첫 줄\n둘째 줄\n\n새 문단", { newlineAsChar: false });
    expect(s).toMatchObject({ lines: 4, paragraphs: 2, newlines: 3 });
  });
  it("빈 입력", () => {
    expect(countText("", { newlineAsChar: false })).toMatchObject({ withSpaces: 0, words: 0, lines: 0, paragraphs: 0 });
  });
});

describe("removeLinebreaks", () => {
  const text = "매출은\n12% 늘었다.\n\n4분기  목표는\n배송 단축.";
  it("줄바꿈을 띄어쓰기로", () => {
    expect(removeLinebreaks(text, LB).output).toBe("매출은 12% 늘었다. 4분기 목표는 배송 단축.");
  });
  it("문단 유지", () => {
    expect(removeLinebreaks(text, { ...LB, mode: "paragraph" }).output).toBe(
      "매출은 12% 늘었다.\n\n4분기 목표는 배송 단축.",
    );
  });
  it("띄어쓰기 없이 붙이기", () => {
    expect(removeLinebreaks("가나\n다라", { ...LB, mode: "join" }).output).toBe("가나다라");
  });
  it("빈 줄만 지우기", () => {
    const r = removeLinebreaks("a\n\n\nb\n  \nc", { ...LB, mode: "emptyLines" });
    expect(r.output).toBe("a\nb\nc");
    expect(r.removedBreaks).toBe(3);
  });
  it("하이픈으로 잘린 영문 낱말 잇기", () => {
    expect(removeLinebreaks("infor-\nmation and well-\nKnown", LB).output).toBe("information and well- Known");
    expect(removeLinebreaks("infor-\nmation", { ...LB, joinHyphen: false }).output).toBe("infor- mation");
  });
  it("공백 정리를 끄면 그대로", () => {
    expect(removeLinebreaks(" a  \n b", { ...LB, collapseSpaces: false, trimLines: false }).output).toBe(" a    b");
  });
});

describe("한영 타자 변환", () => {
  it("영타 → 한글", () => {
    expect(engToKor("dkssudgktpdy")).toBe("안녕하세요");
    expect(engToKor(HANYANG_SAMPLE)).toBe("안녕하세요. 2026년 3분기 매출 보고서 보내드립니다.");
  });
  it("겹받침과 받침 넘김", () => {
    expect(engToKor("dlfrrl")).toBe("읽기");
    expect(engToKor("rkqt")).toBe("값");
    expect(engToKor("dkswdk")).toBe("앉아");
  });
  it("겹모음·쌍자음(Shift)", () => {
    expect(engToKor("Rhkwk")).toBe("꽈자");
    expect(engToKor("dml")).toBe("의");
    expect(engToKor("RkRk")).toBe("까까");
  });
  it("자음만·모음만 남은 글자", () => {
    expect(engToKor("rr")).toBe("ㄱㄱ");
    expect(engToKor("k")).toBe("ㅏ");
  });
  it("한글 → 영타, 되돌리면 원래대로", () => {
    expect(korToEng("안녕하세요")).toBe("dkssudgktpdy");
    expect(korToEng("읽기 값 꽈자")).toBe("dlfrrl rkqt Rhkwk");
    expect(engToKor(korToEng("데이터 정리 도구"))).toBe("데이터 정리 도구");
  });
  it("안내 예시", () => {
    expect(korToEng("ㅗ디ㅣㅐ")).toBe("hello");
    expect(engToKor("Rkcl")).toBe("까치");
    expect(korToEng("ㄱㅐㅈ1234")).toBe("row1234");
    expect(engToKor("dkssudgktpdy. qksrkqtmqslek.")).toBe("안녕하세요. 반갑습니다.");
  });
  it("방향 추측", () => {
    expect(guessHanyangMode("dkssud")).toBe("eng-to-kor");
    expect(guessHanyangMode("안녕하세요 hi")).toBe("kor-to-eng");
  });
});

describe("대소문자 변환", () => {
  it("기본", () => {
    expect(convertCase("Hello World 한글", "upper")).toBe("HELLO WORLD 한글");
    expect(convertCase("Hello World", "lower")).toBe("hello world");
    expect(convertCase("Hello", "toggle")).toBe("hELLO");
  });
  it("문장·제목", () => {
    expect(convertCase("THE END. next one", "sentence")).toBe("The end. Next one");
    expect(convertCase("monthly sales report", "title")).toBe("Monthly Sales Report");
  });
  it("이름 형식 — 줄마다", () => {
    expect(convertCase(CASE_SAMPLE, "camel")).toBe("monthlySalesReport\ncustomerId\norderStatus\nshippingAddress");
    expect(convertCase(CASE_SAMPLE, "snake")).toBe("monthly_sales_report\ncustomer_id\norder_status\nshipping_address");
    expect(convertCase("shippingAddress", "kebab")).toBe("shipping-address");
    expect(convertCase("customer id", "pascal")).toBe("CustomerId");
    expect(convertCase("customer id", "constant")).toBe("CUSTOMER_ID");
  });
  it("낱말 나누기", () => {
    expect(splitWords("XMLHttpRequest")).toEqual(["XML", "Http", "Request"]);
  });
});

describe("텍스트 비교", () => {
  it("diffSequence 최소 편집", () => {
    const ops = diffSequence(["a", "b", "c"], ["a", "x", "c"], (x, y) => x === y, 100)!;
    expect(ops.map((o) => o.type)).toEqual(["equal", "del", "ins", "equal"]);
  });
  it("줄 비교 + 글자 표시", () => {
    const r = diffText(DIFF_SAMPLE_A, DIFF_SAMPLE_B, { ignoreWhitespace: false, ignoreCase: false });
    expect(r).toMatchObject({ added: 3, removed: 2, same: 2, tooDifferent: false });
    const del = r.rows.find((x) => x.type === "del" && x.aNo === 3);
    expect(del && "parts" in del && del.parts?.filter((p) => p.changed).map((p) => p.text)).toEqual(["1,200만"]);
  });
  it("공백·대소문자 무시", () => {
    expect(diffText("A  b", "a b", { ignoreWhitespace: true, ignoreCase: true }).same).toBe(1);
    expect(diffText("A  b", "a b", { ignoreWhitespace: false, ignoreCase: false }).same).toBe(0);
  });
  it("복사용 텍스트", () => {
    const r = diffText("a\nb", "a\nc", { ignoreWhitespace: false, ignoreCase: false });
    expect(diffToText(r.rows)).toBe("  a\n- b\n+ c");
  });
  it("한쪽이 비어 있으면 전부 추가", () => {
    expect(diffText("", "x\ny", { ignoreWhitespace: false, ignoreCase: false })).toMatchObject({ added: 2, removed: 0 });
  });
  it("큰 입력도 끝까지 계산", () => {
    const a = Array.from({ length: 5000 }, (_, i) => `줄 ${i}`).join("\n");
    const b = a.replace("줄 2500", "줄 2500 수정");
    expect(diffText(a, b, { ignoreWhitespace: false, ignoreCase: false })).toMatchObject({ added: 1, removed: 1 });
  });
});

import { describe, expect, it } from "vitest";
import { bookmarkMessage, nextBookmarkHint, toastDuration } from "./bookmarkHint";
import { excelHtmlForRows, excelHtmlForText, looksLikeText } from "./excelClipboard";

describe("excelClipboard", () => {
  it("앞자리 0·16자리 이상 숫자만 텍스트로 본다", () => {
    expect(looksLikeText("00123")).toBe(true);
    expect(looksLikeText("1234567890123456")).toBe(true);
    expect(looksLikeText("0")).toBe(false);
    expect(looksLikeText("1,200")).toBe(false);
    expect(looksLikeText("A-0123")).toBe(false);
  });
  it("필요할 때만 표 형식을 만든다", () => {
    expect(excelHtmlForRows([["김민수", "1,200"]])).toBeUndefined();
    const html = excelHtmlForRows([["사번"], ["00123"]]);
    expect(html).toContain("mso-number-format");
    expect(html).toContain("<td>사번</td>");
    expect(excelHtmlForRows([["1월\n2월"]])).toContain("<br");
  });
  it("탭·줄바꿈 결과 글자에서도", () => {
    expect(excelHtmlForText("010\t2345\n00123\t9")).toContain("mso-number-format");
    expect(excelHtmlForText("A-10234, A-10235")).toBeUndefined();
    expect(excelHtmlForText("")).toBeUndefined();
  });
});

describe("bookmarkHint", () => {
  it("두 번째 복사에서 한 번만", () => {
    expect(nextBookmarkHint(null)).toEqual({ show: false, next: "1" });
    expect(nextBookmarkHint("1")).toEqual({ show: true, next: "done" });
    expect(nextBookmarkHint("done")).toEqual({ show: false, next: "done" });
  });
  it("맥은 ⌘+D, 긴 안내는 오래 보여 준다", () => {
    expect(bookmarkMessage(true)).toContain("⌘+D");
    expect(bookmarkMessage(false)).toContain("Ctrl+D");
    expect(toastDuration(bookmarkMessage(false))).toBeGreaterThan(toastDuration("복사되었습니다."));
  });
});

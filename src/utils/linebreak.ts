/** 줄바꿈·공백 제거 — PDF·웹에서 복사해 줄마다 끊긴 글을 이어 붙인다. */

/**
 * space = 줄바꿈을 띄어쓰기 하나로 / join = 줄바꿈을 그냥 지움(띄어쓰기 없이)
 * paragraph = 빈 줄로 나뉜 문단은 남기고 문단 안의 줄바꿈만 띄어쓰기로
 * emptyLines = 줄바꿈은 그대로 두고 빈 줄만 지움
 */
export type LinebreakMode = "space" | "join" | "paragraph" | "emptyLines";

export interface LinebreakOptions {
  mode: LinebreakMode;
  /** 연속된 띄어쓰기·탭을 하나로 */
  collapseSpaces: boolean;
  /** 줄마다 앞뒤 공백 지우기 */
  trimLines: boolean;
  /** 영문 줄 끝 하이픈으로 잘린 낱말 이어 붙이기 (infor-\nmation → information) */
  joinHyphen: boolean;
}

export interface LinebreakResult {
  output: string;
  removedBreaks: number;
  linesBefore: number;
  linesAfter: number;
}

const lineCount = (s: string) => (s === "" ? 0 : s.split("\n").length);
const breaks = (s: string) => (s.match(/\n/g) ?? []).length;

function joinLines(lines: string[], sep: string, joinHyphen: boolean): string {
  let out = "";
  lines.forEach((line, i) => {
    if (i === 0) {
      out = line;
      return;
    }
    if (joinHyphen && /[A-Za-z]-$/.test(out) && /^[a-z]/.test(line)) {
      out = out.slice(0, -1) + line;
      return;
    }
    out += (out === "" || line === "" ? "" : sep) + line;
  });
  return out;
}

export function removeLinebreaks(raw: string, o: LinebreakOptions): LinebreakResult {
  const text = raw.replace(/\r\n?/g, "\n");
  let lines = text.split("\n");
  if (o.trimLines) lines = lines.map((l) => l.trim());

  let output: string;
  switch (o.mode) {
    case "space":
      output = joinLines(
        lines.filter((l) => l.trim() !== ""),
        " ",
        o.joinHyphen,
      );
      break;
    case "join":
      output = joinLines(
        lines.filter((l) => l.trim() !== ""),
        "",
        o.joinHyphen,
      );
      break;
    case "paragraph": {
      const paragraphs: string[][] = [[]];
      for (const l of lines) {
        if (l.trim() === "") {
          if (paragraphs[paragraphs.length - 1].length > 0) paragraphs.push([]);
        } else paragraphs[paragraphs.length - 1].push(l);
      }
      output = paragraphs
        .filter((p) => p.length > 0)
        .map((p) => joinLines(p, " ", o.joinHyphen))
        .join("\n\n");
      break;
    }
    case "emptyLines":
      output = lines.filter((l) => l.trim() !== "").join("\n");
      break;
  }

  if (o.collapseSpaces) output = output.replace(/[ \t 　]{2,}/g, " ");
  if (o.trimLines || o.collapseSpaces) output = output.trim();

  return {
    output,
    removedBreaks: Math.max(0, breaks(text) - breaks(output)),
    linesBefore: lineCount(text),
    linesAfter: lineCount(output),
  };
}

export const DEFAULT_LINEBREAK_OPTIONS: LinebreakOptions = {
  mode: "space",
  collapseSpaces: true,
  trimLines: true,
  joinHyphen: true,
};

export const LINEBREAK_SAMPLE = `2026년 3분기 매출은 전 분기보다
12% 늘어난 1,350억 원을 기록했다. 온라인
채널 비중이 처음으로 40%를 넘었고,
재고 회전율도 개선되었다.

4분기에는 신규 물류센터 가동으로 배송
기간을 하루 줄이는 것이 목표다.`;

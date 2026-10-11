/** 글자수 세기 — 자기소개서·보고서 제출용 글자수와 바이트를 센다. */

export interface CountOptions {
  /** 줄바꿈도 '공백 포함' 글자수에 넣을지 (워드·한글 프로그램은 넣지 않는다) */
  newlineAsChar: boolean;
  /** 목표 글자수(0이면 없음)와 기준 */
  limit: number;
  limitBasis: "with" | "without" | "bytes2";
}

export interface CountStats {
  /** 공백 포함 */
  withSpaces: number;
  /** 공백 제외(띄어쓰기·탭·줄바꿈 모두 뺌) */
  withoutSpaces: number;
  /** 한글 2바이트 기준 (EUC-KR·완성형 방식, 영문·숫자·기호 1바이트) */
  bytes2: number;
  /** UTF-8 기준 (한글 3바이트) */
  bytesUtf8: number;
  words: number;
  lines: number;
  paragraphs: number;
  /** 줄바꿈 수 */
  newlines: number;
}

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("ko", { granularity: "grapheme" }) : null;

/** 사람 눈에 보이는 글자 단위로 나눈다 — 이모지·조합 문자도 한 글자 */
export function graphemes(text: string): string[] {
  if (segmenter) return Array.from(segmenter.segment(text), (s) => s.segment);
  return Array.from(text);
}

const WS = /^\s+$/u;

export function countText(raw: string, o: Pick<CountOptions, "newlineAsChar">): CountStats {
  const text = raw.replace(/\r\n?/g, "\n");
  const chars = graphemes(text);
  let newlines = 0;
  let spaces = 0;
  let bytes2 = 0;
  for (const g of chars) {
    if (g === "\n") newlines++;
    else if (WS.test(g)) spaces++;
    for (const ch of g) bytes2 += ch.codePointAt(0)! <= 0x7f ? 1 : 2;
  }
  const withSpaces = chars.length - (o.newlineAsChar ? 0 : newlines);
  const withoutSpaces = chars.length - newlines - spaces;
  const trimmed = text.trim();
  return {
    withSpaces,
    withoutSpaces,
    bytes2,
    bytesUtf8: new TextEncoder().encode(text).length,
    words: trimmed === "" ? 0 : trimmed.split(/\s+/u).length,
    lines: text === "" ? 0 : text.split("\n").length,
    paragraphs: trimmed === "" ? 0 : trimmed.split(/\n\s*\n/).filter((p) => p.trim() !== "").length,
    newlines,
  };
}

export function limitValue(stats: CountStats, basis: CountOptions["limitBasis"]): number {
  return basis === "with" ? stats.withSpaces : basis === "without" ? stats.withoutSpaces : stats.bytes2;
}

export const DEFAULT_COUNT_OPTIONS: CountOptions = { newlineAsChar: false, limit: 0, limitBasis: "with" };

export const COUNT_SAMPLE = `지원 동기
고객 데이터를 다루는 일을 4년 동안 해 왔습니다. 매달 1,200건이 넘는 주문 데이터를 엑셀로 정리하면서 반복 작업을 줄이는 방법을 찾는 데 관심을 갖게 되었습니다.

입사 후 포부
정리된 데이터로 더 빠르게 판단할 수 있는 환경을 만드는 데 기여하겠습니다.`;

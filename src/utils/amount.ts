/**
 * 숫자 → 한글·한자 금액 표기.
 * 엑셀에서 복사한 한 열(줄마다 숫자 하나)을 줄 수 그대로 바꾼다 — 결과를 다시 엑셀 옆 열에 붙여넣으면 줄이 맞는다.
 * 큰 수도 정확하게 다루려고 숫자를 문자열(자릿수) 그대로 처리한다(Number로 바꾸지 않음).
 */

export type AmountStyle = "formal" | "plain" | "mixed" | "hanja";

export interface AmountOptions {
  style: AmountStyle;
  /** 일금 ○○원정 / ○○원 / 金 ○○원整 */
  wrap: boolean;
  /** 뒤에 (₩1,234,000) 병기 */
  withNumber: boolean;
  /** 읽기 표기에서 만 단위로 띄어 쓰기(한글 맞춤법 제44항) */
  spacing: boolean;
}

export const DEFAULT_AMOUNT_OPTIONS: AmountOptions = {
  style: "formal",
  wrap: true,
  withNumber: false,
  spacing: true,
};

export const AMOUNT_SAMPLE = "1200000\n35,000,000\n₩4,500\n123456789\n10000\n1,010,000원";

const BIG_HANGUL = ["", "만", "억", "조", "경", "해"];
const BIG_HANJA = ["", "萬", "億", "兆", "京", "垓"];
const SMALL_HANGUL = ["천", "백", "십", ""];
const SMALL_HANJA = ["仟", "佰", "拾", ""];
const DIGIT_HANGUL = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
const DIGIT_HANJA = ["", "壹", "貳", "參", "肆", "伍", "陸", "柒", "捌", "玖"];

/** 지원하는 최대 자릿수(해 단위까지) */
export const MAX_DIGITS = 24;

export type ParsedAmount =
  | { ok: true; negative: boolean; digits: string }
  | { ok: false; reason: "empty" | "invalid" | "decimal" | "tooBig" };

/** '₩1,234,000원', ' 1234 ', '-5,000' 같은 셀 값을 자릿수 문자열로 */
export function parseAmount(raw: string): ParsedAmount {
  const s = raw.replace(/[\s,₩￦]|원|KRW/gi, "");
  if (s === "") return { ok: false, reason: "empty" };
  const m = /^([+-])?(\d+)(?:\.(\d+))?$/.exec(s);
  if (!m) return { ok: false, reason: "invalid" };
  if (m[3] && /[1-9]/.test(m[3])) return { ok: false, reason: "decimal" };
  const digits = m[2].replace(/^0+(?=\d)/, "");
  if (digits.length > MAX_DIGITS) return { ok: false, reason: "tooBig" };
  return { ok: true, negative: m[1] === "-" && digits !== "0", digits };
}

/** 오른쪽부터 네 자리씩 — '12345000' → ['1234', '5000'] (앞쪽 그룹은 네 자리보다 짧을 수 있음) */
function groupsOf(digits: string): string[] {
  const out: string[] = [];
  for (let end = digits.length; end > 0; end -= 4) out.unshift(digits.slice(Math.max(0, end - 4), end));
  return out;
}

export function withCommas(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function groupText(group: string, names: string[], small: string[], omitOne: boolean): string {
  const g = group.padStart(4, "0");
  let s = "";
  for (let i = 0; i < 4; i++) {
    const d = Number(g[i]);
    if (d === 0) continue;
    // 읽기 표기는 십·백·천 앞의 '일'을 뺀다(백이십), 금액 표기는 붙인다(일백이십)
    const name = omitOne && d === 1 && small[i] !== "" ? "" : names[d];
    s += name + small[i];
  }
  return s;
}

/** 자릿수 문자열 → 표기 (단위·괄호 없이 숫자 부분만) */
export function amountWords(digits: string, style: AmountStyle, spacing = true): string {
  if (/^0+$/.test(digits)) return style === "hanja" ? "零" : style === "mixed" ? "0" : "영";
  const groups = groupsOf(digits);
  const parts: string[] = [];
  groups.forEach((g, i) => {
    const level = groups.length - 1 - i;
    if (/^0+$/.test(g)) return;
    if (style === "mixed") {
      parts.push(withCommas(String(Number(g))) + BIG_HANGUL[level]);
    } else if (style === "hanja") {
      parts.push(groupText(g, DIGIT_HANJA, SMALL_HANJA, false) + BIG_HANJA[level]);
    } else {
      const plain = style === "plain";
      let text = groupText(g, DIGIT_HANGUL, SMALL_HANGUL, plain);
      // 읽기 표기: 맨 앞이 '일만'이면 '만'으로 (10,000 → 만, 15,000 → 만 오천)
      if (plain && level === 1 && parts.length === 0 && Number(g) === 1) text = "";
      parts.push(text + BIG_HANGUL[level]);
    }
  });
  const sep = style === "mixed" || (style === "plain" && spacing) ? " " : "";
  return parts.join(sep);
}

/** 한 줄(셀) 변환. 숫자가 아니면 null */
export function formatAmount(raw: string, o: AmountOptions): string | null {
  const p = parseAmount(raw);
  if (!p.ok) return null;
  let words = amountWords(p.digits, o.style, o.spacing);
  if (p.negative) words = o.style === "mixed" ? `-${words}` : `마이너스 ${words}`;
  let out = words;
  if (o.wrap) {
    if (o.style === "formal") out = `일금 ${words}원정`;
    else if (o.style === "hanja") out = `金 ${words}원整`;
    else out = `${words}원`;
  }
  if (o.withNumber) out += ` (₩${p.negative ? "-" : ""}${withCommas(p.digits)})`;
  return out;
}

export interface AmountResult {
  output: string;
  /** 바꾼 줄 수 */
  converted: number;
  /** 숫자가 아니어서 비운 줄 번호(1부터) */
  invalidLines: number[];
}

/** 여러 줄 — 줄 수를 그대로 유지(빈 줄·숫자가 아닌 줄은 빈 줄로) */
export function convertAmounts(text: string, o: AmountOptions): AmountResult {
  if (text.trim() === "") return { output: "", converted: 0, invalidLines: [] };
  const lines = text.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");
  const invalidLines: number[] = [];
  let converted = 0;
  const out = lines.map((line, i) => {
    if (line.trim() === "") return "";
    const r = formatAmount(line, o);
    if (r === null) {
      invalidLines.push(i + 1);
      return "";
    }
    converted++;
    return r;
  });
  return { output: out.join("\n"), converted, invalidLines };
}

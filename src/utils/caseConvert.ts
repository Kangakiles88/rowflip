/** 대소문자 변환 — 영문 글자만 바꾸고 한글·숫자·기호는 그대로 둔다. */

export type CaseMode =
  | "upper"
  | "lower"
  | "sentence"
  | "title"
  | "toggle"
  | "camel"
  | "pascal"
  | "snake"
  | "constant"
  | "kebab";

/** camelCase·snake_case 같은 이름 형식용 낱말 나누기 — 기호·공백·대소문자 경계에서 자른다 */
export function splitWords(line: string): string[] {
  return line
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w !== "");
}

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

function convertLine(line: string, mode: CaseMode): string {
  switch (mode) {
    case "upper":
      return line.toUpperCase();
    case "lower":
      return line.toLowerCase();
    case "toggle":
      return Array.from(line, (c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join("");
    case "title":
      return line.toLowerCase().replace(/(^|[\s\-_/("'])(\p{L})/gu, (_, p: string, c: string) => p + c.toUpperCase());
    case "sentence":
      return line.toLowerCase().replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_, p: string, c: string) => p + c.toUpperCase());
    case "camel": {
      const w = splitWords(line);
      return w.map((x, i) => (i === 0 ? x.toLowerCase() : cap(x))).join("");
    }
    case "pascal":
      return splitWords(line).map(cap).join("");
    case "snake":
      return splitWords(line)
        .map((x) => x.toLowerCase())
        .join("_");
    case "constant":
      return splitWords(line)
        .map((x) => x.toUpperCase())
        .join("_");
    case "kebab":
      return splitWords(line)
        .map((x) => x.toLowerCase())
        .join("-");
  }
}

/** 줄마다 따로 바꾼다 — 여러 줄 목록도 줄 수가 그대로 유지된다 */
export function convertCase(text: string, mode: CaseMode): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => convertLine(l, mode))
    .join("\n");
}

export const CASE_SAMPLE = `monthly sales report
customer id
ORDER_STATUS
shippingAddress`;

/**
 * 원본 나누기 — 엑셀 칸(탭·줄바꿈)으로 나뉜 셀을 다시 쉼표·띄어쓰기 같은 구분자로 쪼갠다.
 * 메모장·메신저·웹페이지에서 복사한 "A, B, C" 같은 목록을 항목으로 만들 때 쓴다.
 */
export type InputSplit = "cells" | "comma" | "semicolon" | "space" | "slash" | "pipe" | "custom";

export const INPUT_SPLITS: { value: InputSplit; label: string; short: string }[] = [
  { value: "cells", label: "탭·줄바꿈만 (엑셀 칸)", short: "엑셀 칸" },
  { value: "comma", label: "쉼표  a, b", short: "쉼표" },
  { value: "semicolon", label: "세미콜론  a; b", short: "세미콜론" },
  { value: "space", label: "띄어쓰기  a b", short: "띄어쓰기" },
  { value: "slash", label: "슬래시  a / b", short: "슬래시" },
  { value: "pipe", label: "파이프  a | b", short: "파이프" },
  { value: "custom", label: "직접 입력", short: "직접 입력" },
];

/** 큰따옴표로 감싼 칸 안의 구분자는 무시하고 나눈다 — "서울, 강남", 부산 → [서울, 강남] [부산] */
function splitQuoted(text: string, isDelim: (ch: string) => boolean): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuote && text[i + 1] === '"') {
        cur += '"';
        i++;
        continue;
      }
      // 칸 맨 앞(공백 뒤 포함)의 따옴표만 묶음 시작으로 본다
      if (!inQuote && cur.trim() === "") {
        inQuote = true;
        cur = "";
        continue;
      }
      if (inQuote) {
        inQuote = false;
        continue;
      }
    }
    if (!inQuote && isDelim(ch)) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

const DELIMS: Record<Exclude<InputSplit, "cells" | "space" | "custom">, (ch: string) => boolean> = {
  comma: (ch) => ch === "," || ch === "，" || ch === "、",
  semicolon: (ch) => ch === ";" || ch === "；",
  slash: (ch) => ch === "/",
  pipe: (ch) => ch === "|",
};

export function splitCell(cell: string, mode: InputSplit, custom = ""): string[] {
  switch (mode) {
    case "cells":
      return [cell];
    case "space":
      return cell.split(/[  　]+/);
    case "custom": {
      const d = custom.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
      return d === "" ? [cell] : cell.split(d);
    }
    default:
      return splitQuoted(cell, DELIMS[mode]);
  }
}

export function splitCells(cells: string[], mode: InputSplit, custom = ""): string[] {
  if (mode === "cells") return cells;
  return cells.flatMap((c) => splitCell(c, mode, custom));
}

/** ('A','B') · ["A", "B"] · [A, B] 처럼 감싼 괄호를 벗긴다 */
export function unwrapBrackets(cell: string): string {
  const t = cell.trim();
  const pairs: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
  const close = pairs[t[0]];
  return close && t.endsWith(close) ? t.slice(1, -1) : cell;
}

/** 'A' · "A" · `A` 처럼 양끝이 같은 따옴표면 벗긴다 */
export function unquote(item: string): string {
  const t = item.trim();
  const q = t[0];
  if (t.length >= 2 && (q === "'" || q === '"' || q === "`") && t.endsWith(q)) {
    const inner = t.slice(1, -1);
    return q === "'" ? inner.replace(/''/g, "'") : inner;
  }
  return item;
}

const nonEmpty = (cells: string[]) => cells.map((c) => c.trim()).filter((c) => c !== "");
const HAS_COMMA = /[,，、]/;
const HAS_SEMICOLON = /[;；]/;
const HAS_SPACE = /[ \u00a0\u3000]/;
/** 코드·숫자처럼 보이는 낱말(영문·숫자·기호만) — '12345', 'A-10234', 'kim@a.com' */
const CODE_TOKEN = /^[\x21-\x7e]+$/;

/**
 * 붙여넣은 목록이 엑셀 칸이 아니라 쉼표·세미콜론·띄어쓰기로 이어진 것 같으면 그 구분자를 돌려준다.
 * 칸이 적은데(3개 이하) 모든 칸에 같은 구분자가 들어 있을 때만 추측한다.
 * 띄어쓰기는 '제목이 아닙니다'처럼 값 안에 들어가는 경우가 많아, 낱말이 모두 코드·숫자일 때만 추측한다.
 */
export function suggestInputSplit(cells: string[]): InputSplit | null {
  const values = nonEmpty(cells);
  if (values.length === 0 || values.length > 3) return null;
  if (values.every((v) => HAS_COMMA.test(v))) return "comma";
  if (values.every((v) => HAS_SEMICOLON.test(v))) return "semicolon";
  if (values.every((v) => HAS_SPACE.test(v) && v.split(/[ \u00a0\u3000]+/).every((t) => CODE_TOKEN.test(t)))) {
    return "space";
  }
  return null;
}

/**
 * 값이 한 칸뿐이면 가로·세로로 돌릴 것이 없다 — 그 칸을 나눌 구분자를 고른다(쉼표 > 세미콜론 > 띄어쓰기).
 * '세로로'·'가로로'를 눌렀을 때만 쓴다.
 */
export function splitForSingleCell(cells: string[]): InputSplit | null {
  const values = nonEmpty(cells);
  if (values.length !== 1) return null;
  const v = values[0];
  if (HAS_COMMA.test(v)) return "comma";
  if (HAS_SEMICOLON.test(v)) return "semicolon";
  if (HAS_SPACE.test(v)) return "space";
  return null;
}

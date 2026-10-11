/**
 * 한영 타자 변환 — 두벌식 자판 기준.
 * 영타로 잘못 친 글(dkssud → 안녕)을 한글로, 한글을 자판 키(안녕 → dkssud)로 바꾼다.
 */

const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
const JONG = ["", ..."ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ"];

/** 자판 키 → 자모 (Shift는 쌍자음·ㅒ·ㅖ만 다르고 나머지는 소문자와 같다) */
const KEY_TO_JAMO: Record<string, string> = {
  q: "ㅂ", w: "ㅈ", e: "ㄷ", r: "ㄱ", t: "ㅅ", y: "ㅛ", u: "ㅕ", i: "ㅑ", o: "ㅐ", p: "ㅔ",
  a: "ㅁ", s: "ㄴ", d: "ㅇ", f: "ㄹ", g: "ㅎ", h: "ㅗ", j: "ㅓ", k: "ㅏ", l: "ㅣ",
  z: "ㅋ", x: "ㅌ", c: "ㅊ", v: "ㅍ", b: "ㅠ", n: "ㅜ", m: "ㅡ",
  Q: "ㅃ", W: "ㅉ", E: "ㄸ", R: "ㄲ", T: "ㅆ", O: "ㅒ", P: "ㅖ",
};

const JAMO_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_TO_JAMO).map(([k, j]) => [j, k]),
);

const VOWEL_PAIRS: Record<string, string> = {
  ㅗㅏ: "ㅘ", ㅗㅐ: "ㅙ", ㅗㅣ: "ㅚ", ㅜㅓ: "ㅝ", ㅜㅔ: "ㅞ", ㅜㅣ: "ㅟ", ㅡㅣ: "ㅢ",
};
const FINAL_PAIRS: Record<string, string> = {
  ㄱㅅ: "ㄳ", ㄴㅈ: "ㄵ", ㄴㅎ: "ㄶ", ㄹㄱ: "ㄺ", ㄹㅁ: "ㄻ", ㄹㅂ: "ㄼ", ㄹㅅ: "ㄽ", ㄹㅌ: "ㄾ", ㄹㅍ: "ㄿ", ㄹㅎ: "ㅀ", ㅂㅅ: "ㅄ",
};
const SPLIT: Record<string, string> = Object.fromEntries(
  [...Object.entries(VOWEL_PAIRS), ...Object.entries(FINAL_PAIRS)].map(([pair, j]) => [j, pair]),
);

const isVowel = (j: string) => JUNG.includes(j);
const canBeFinal = (j: string) => JONG.includes(j);

function compose(cho: string, jung: string, jong: string): string {
  return String.fromCharCode(0xac00 + (CHO.indexOf(cho) * 21 + JUNG.indexOf(jung)) * 28 + JONG.indexOf(jong));
}

/** 영타 → 한글. 자판에 없는 글자(숫자·기호·띄어쓰기)는 그대로 둔다. */
export function engToKor(text: string): string {
  let out = "";
  let cho = "";
  let jung = "";
  let jong = "";

  const flush = () => {
    if (cho && jung) out += compose(cho, jung, jong);
    else out += cho + jung + jong;
    cho = jung = jong = "";
  };

  for (const ch of text) {
    const key = KEY_TO_JAMO[ch] ? ch : ch.toLowerCase();
    const j = /[A-Za-z]/.test(ch) ? KEY_TO_JAMO[key] : undefined;
    if (!j) {
      flush();
      out += ch;
      continue;
    }

    if (isVowel(j)) {
      if (jong) {
        // 받침이 다음 글자 첫소리로 넘어간다 (겹받침은 뒤쪽 자음만)
        const pair = SPLIT[jong];
        const moved = pair ? pair[1] : jong;
        jong = pair ? pair[0] : "";
        flush();
        cho = moved;
        jung = j;
      } else if (jung) {
        const combined = VOWEL_PAIRS[jung + j];
        if (combined) jung = combined;
        else {
          flush();
          jung = j;
        }
      } else {
        jung = j;
      }
      continue;
    }

    // 자음
    if (cho && jung && !jong && canBeFinal(j)) jong = j;
    else if (cho && jung && jong && FINAL_PAIRS[jong + j]) jong = FINAL_PAIRS[jong + j];
    else {
      flush();
      cho = j;
    }
  }
  flush();
  return out;
}

/** 한글 → 자판 키. 한글이 아닌 글자는 그대로 둔다. */
export function korToEng(text: string): string {
  const keyOf = (jamo: string) => {
    if (!jamo) return "";
    const pair = SPLIT[jamo];
    return pair ? JAMO_TO_KEY[pair[0]] + JAMO_TO_KEY[pair[1]] : (JAMO_TO_KEY[jamo] ?? jamo);
  };
  let out = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const i = code - 0xac00;
      out += keyOf(CHO[Math.floor(i / 588)]) + keyOf(JUNG[Math.floor((i % 588) / 28)]) + keyOf(JONG[i % 28]);
    } else if (CHO.includes(ch) || JUNG.includes(ch) || JONG.includes(ch)) {
      out += keyOf(ch);
    } else out += ch;
  }
  return out;
}

export type HanyangMode = "eng-to-kor" | "kor-to-eng";

/** 입력에 한글이 많으면 한→영, 영문이 많으면 영→한으로 추측 */
export function guessHanyangMode(text: string): HanyangMode {
  const kor = (text.match(/[가-힣ㄱ-ㅣ]/g) ?? []).length;
  const eng = (text.match(/[A-Za-z]/g) ?? []).length;
  return kor > eng ? "kor-to-eng" : "eng-to-kor";
}

export const HANYANG_SAMPLE = "dkssudgktpdy. 2026sus 3qnsrl aocnf qhrhtj qhsoemflqslek.";

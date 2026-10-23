import { parseAnyTable } from "./parser";

/**
 * 엑셀 명단 → 상장·수료증 일괄 만들기.
 * 명단은 첫 행을 머리글로 보고, 양식의 칸(성명·소속 등)에 어느 열을 넣을지 연결한다.
 * 모든 처리는 브라우저 안에서만 한다(명단은 저장·전송하지 않음).
 */

export type FieldKey = "number" | "name" | "group" | "award" | "birth" | "course" | "period" | "role";
export type TemplateId = "award" | "completion" | "appointment" | "thanks";
export type DateStyle = "dot" | "korean";

export interface FieldDef {
  key: FieldKey;
  label: string;
  /** 머리글 자동 연결에 쓰는 이름들(공백·대소문자 무시) */
  aliases: readonly string[];
  /** title = 큰 제목으로, row = 성명·소속 줄로, number = 발급 번호로 */
  place: "title" | "row" | "number";
  /** 날짜로 보고 발급일과 같은 형식으로 바꾼다 */
  date?: boolean;
}

export interface CertificateTemplate {
  id: TemplateId;
  label: string;
  /** 제목 칸에 연결된 열이 없을 때 쓰는 제목 */
  title: string;
  fields: readonly FieldDef[];
  body: string;
  sample: string;
  /** 샘플 넣기 때 비어 있으면 채우는 발급 기관·대표자 */
  sampleIssuer: string;
  sampleSigner: string;
}

const F = {
  number: { key: "number", label: "번호", aliases: ["번호", "상장번호", "발급번호", "증서번호", "일련번호", "no"], place: "number" },
  name: { key: "name", label: "성명", aliases: ["성명", "이름", "성함", "학생명", "수상자", "수료자", "name"], place: "row" },
  group: {
    key: "group",
    label: "소속",
    aliases: ["소속", "학년반", "학년", "반", "학과", "부서", "학교", "기관", "회사"],
    place: "row",
  },
  birth: { key: "birth", label: "생년월일", aliases: ["생년월일", "생일", "출생일"], place: "row", date: true },
} as const satisfies Record<string, FieldDef>;

export const TEMPLATES: readonly CertificateTemplate[] = [
  {
    id: "award",
    label: "상장",
    title: "상장",
    fields: [
      F.number,
      { key: "award", label: "수상명", aliases: ["수상명", "상명", "상", "수상", "부문", "등급"], place: "title" },
      F.group,
      F.name,
    ],
    body: "위 사람은 평소 맡은 일에 성실하며 남다른 노력으로 위와 같이 우수한 성적을 거두었으므로 이 상장을 수여합니다.",
    sampleIssuer: "한빛초등학교장",
    sampleSigner: "이서준",
    sample: "성명\t소속\t수상명\n김민준\t2학년 3반\t우수상\n이서연\t2학년 1반\t최우수상\n박지훈\t3학년 2반\t장려상\n최유진\t1학년 4반\t우수상",
  },
  {
    id: "completion",
    label: "수료증",
    title: "수료증",
    fields: [
      F.number,
      F.name,
      F.birth,
      F.group,
      { key: "course", label: "과정명", aliases: ["과정명", "교육과정", "과정", "강좌", "강좌명", "교육명", "프로그램"], place: "row" },
      { key: "period", label: "교육기간", aliases: ["교육기간", "기간", "수료기간", "일정"], place: "row" },
    ],
    body: "위 사람은 {과정명} 과정을 성실히 이수하였으므로 이 증서를 수여합니다.",
    sampleIssuer: "한빛교육센터장",
    sampleSigner: "정하늘",
    sample:
      "성명\t생년월일\t소속\t과정명\t교육기간\n김민준\t1990-03-14\t영업1팀\t엑셀 실무 기초\t2026. 9. 1. ~ 2026. 9. 26.\n이서연\t1993-11-02\t인사팀\t엑셀 실무 기초\t2026. 9. 1. ~ 2026. 9. 26.\n박지훈\t1988-07-21\t재무팀\t엑셀 실무 기초\t2026. 9. 1. ~ 2026. 9. 26.",
  },
  {
    id: "appointment",
    label: "위촉장",
    title: "위촉장",
    fields: [
      F.number,
      F.group,
      F.name,
      { key: "role", label: "위촉직", aliases: ["위촉직", "직위", "직책", "역할", "위원", "직함"], place: "row" },
      { key: "period", label: "위촉기간", aliases: ["위촉기간", "임기", "기간"], place: "row" },
    ],
    body: "귀하를 {위촉직}으로 위촉합니다.",
    sampleIssuer: "한빛시장",
    sampleSigner: "오세진",
    sample:
      "성명\t소속\t위촉직\t위촉기간\n김민준\t한빛대학교 교수\t운영위원회 위원\t2026. 11. 1. ~ 2028. 10. 31.\n이서연\t한빛세무회계 대표\t운영위원회 위원\t2026. 11. 1. ~ 2028. 10. 31.\n박지훈\t시민 대표\t운영위원회 부위원장\t2026. 11. 1. ~ 2028. 10. 31.",
  },
  {
    id: "thanks",
    label: "감사장",
    title: "감사장",
    fields: [F.number, F.group, F.name],
    body: "귀하께서는 평소 남다른 열정과 헌신으로 우리 기관의 발전에 크게 이바지하였기에 그 고마운 뜻을 담아 이 감사장을 드립니다.",
    sampleIssuer: "한빛초등학교장",
    sampleSigner: "이서준",
    sample: "성명\t소속\n김민준\t학부모회\n이서연\t한빛봉사단\n박지훈\t한빛마을 주민자치회",
  },
];

export function getTemplate(id: TemplateId): CertificateTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export interface Roster {
  headers: string[];
  rows: string[][];
  /** 탭 없이 띄어쓰기로 칸을 나눠 읽었는지(휴대폰에서 직접 친 명단) */
  spaced?: boolean;
}

/**
 * 띄어쓰기로 친 한 줄을 머리글 칸 수에 맞춰 나눈다.
 * 두 칸 이상 띄운 곳이 있으면 그곳으로, 아니면 낱말로 나누고
 * 낱말이 남으면 첫 칸(성명)과 끝 칸(수상명 등)은 한 낱말씩, 둘째 칸(소속)이 나머지를 갖는다 — '2학년 3반'
 */
export function splitSpacedLine(line: string, width: number): string[] {
  const t = line.trim();
  const wide = t.split(/\s{2,}/);
  if (wide.length === width) return wide;
  const w = t.split(/\s+/);
  if (w.length <= width || width < 2) return w;
  if (width === 2) return [w[0], w.slice(1).join(" ")];
  const tail = w.slice(w.length - (width - 2));
  return [w[0], w.slice(1, w.length - (width - 2)).join(" "), ...tail];
}

/** 엑셀에서 복사한 명단 — 첫 행은 머리글, 완전히 빈 행은 뺀다 */
export function parseRoster(raw: string): Roster {
  const table = parseAnyTable(raw);
  let rows = table.rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ""));
  if (rows.length === 0) return { headers: [], rows: [] };
  let spaced = false;
  // 탭이 없고 한 칸뿐인데 머리글이 띄어쓰기로 여러 낱말이면 띄어쓰기를 칸 구분으로 본다
  if (rows.every((r) => r.length === 1) && rows.length >= 2) {
    const head = rows[0][0].split(/\s+/);
    if (head.length >= 2) {
      rows = [head, ...rows.slice(1).map((r) => splitSpacedLine(r[0], head.length))];
      spaced = true;
    }
  }
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const headers = Array.from({ length: width }, (_, i) => rows[0][i] || `${i + 1}열`);
  return { headers, rows: rows.slice(1), ...(spaced ? { spaced } : {}) };
}

const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

/** 칸 → 열 번호(-1 = 연결 안 함). 머리글이 별칭과 같으면 먼저, 별칭을 포함하면 다음으로 연결 */
export type FieldMapping = Partial<Record<FieldKey, number>>;

export function autoMap(template: CertificateTemplate, headers: readonly string[]): FieldMapping {
  const h = headers.map(norm);
  const used = new Set<number>();
  const out: FieldMapping = {};
  const pick = (test: (header: string, alias: string) => boolean, f: FieldDef) => {
    for (const a of f.aliases.map(norm)) {
      const i = h.findIndex((x, idx) => !used.has(idx) && x !== "" && test(x, a));
      if (i !== -1) return i;
    }
    return -1;
  };
  // 정확히 같은 이름을 먼저 모든 칸에 연결하고, 남은 칸만 '포함' 규칙으로 찾는다
  for (const f of template.fields) {
    const i = pick((x, a) => x === a, f);
    if (i !== -1) {
      out[f.key] = i;
      used.add(i);
    }
  }
  for (const f of template.fields) {
    if (out[f.key] !== undefined) continue;
    // 한 글자 별칭(상·반)은 포함 규칙에 쓰지 않는다 — '상품코드'가 '상'에 걸리지 않게
    const i = pick((x, a) => a.length >= 2 && x.includes(a), f);
    out[f.key] = i;
    if (i !== -1) used.add(i);
  }
  return out;
}

/** 2026-10-11, 2026.10.11, 2026/10/11, 20261011 → 날짜. 알아볼 수 없으면 null */
export function parseDate(s: string): { y: number; m: number; d: number } | null {
  const t = s.trim();
  const m = /^(\d{4})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})\s*[.일]?$/.exec(t) ?? /^(\d{4})(\d{2})(\d{2})$/.exec(t);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

/** 날짜를 '2026. 10. 11.' 또는 '2026년 10월 11일'로. 날짜가 아니면 그대로 */
export function formatDate(s: string, style: DateStyle): string {
  const p = parseDate(s);
  if (!p) return s.trim();
  return style === "dot" ? `${p.y}. ${p.m}. ${p.d}.` : `${p.y}년 ${p.m}월 ${p.d}일`;
}

/** 짧은 제목은 글자 사이를 띄운다 — '우수상' → '우 수 상' */
export function spaceTitle(s: string): string {
  const t = s.trim().replace(/\s+/g, "");
  if (t.length < 2 || t.length > 5 || !/^[가-힣]+$/.test(t)) return s.trim();
  return [...t].join(" ");
}

/** 마지막 글자에 받침이 있는지 — 한글이 아니면 숫자 읽기로 대강 판단 */
function hasBatchim(word: string): { batchim: boolean; rieul: boolean } {
  const ch = word.trim().slice(-1);
  const code = ch.charCodeAt(0) - 0xac00;
  if (code >= 0 && code <= 11171) {
    const jong = code % 28;
    return { batchim: jong !== 0, rieul: jong === 8 };
  }
  // 숫자: 0 영, 1 일, 3 삼, 6 육, 7 칠, 8 팔 은 받침 있음(1·7·8은 ㄹ)
  if (/[0-9]/.test(ch)) return { batchim: "013678".includes(ch), rieul: "178".includes(ch) };
  return { batchim: false, rieul: false };
}

const JOSA: [string, string][] = [
  ["으로", "로"],
  ["은", "는"],
  ["이", "가"],
  ["을", "를"],
  ["과", "와"],
];

/** 받침에 맞게 조사를 고른다 — '위원' + 으로 → '위원으로', '위원장' + 으로 → '위원장으로', '교사' + 으로 → '교사로' */
export function pickJosa(word: string, written: string): string {
  const pair = JOSA.find(([a, b]) => written === a || written === b);
  if (!pair) return written;
  const { batchim, rieul } = hasBatchim(word);
  if (pair[0] === "으로") return batchim && !rieul ? "으로" : "로";
  return batchim ? pair[0] : pair[1];
}

/**
 * 본문의 {칸 이름}을 값으로 바꾼다. 칸 이름은 양식의 칸(성명·소속 …) 또는 명단의 머리글.
 * 바로 뒤에 붙은 조사(은/는, 이/가, 을/를, 과/와, 으로/로)는 값의 받침에 맞게 고친다.
 * 값을 찾을 수 없는 {칸}은 그대로 남기고 missing에 담는다.
 */
export function fillTokens(text: string, values: Record<string, string>): { text: string; missing: string[] } {
  const missing: string[] = [];
  const out = text.replace(/\{([^{}\n]{1,30})\}(으로|로|은|는|이|가|을|를|과|와)?/g, (all, rawKey: string, josa?: string) => {
    const key = rawKey.trim();
    const v = values[key] ?? values[norm(key)];
    if (v === undefined) {
      if (!missing.includes(key)) missing.push(key);
      return all;
    }
    return josa ? v + pickJosa(v, josa) : v;
  });
  return { text: out, missing };
}

export interface CommonValues {
  /** 발급일 (YYYY-MM-DD) */
  date: string;
  dateStyle: DateStyle;
  /** 발급 기관·직함 — 예: 한빛초등학교장 */
  issuer: string;
  /** 대표자 이름 */
  signer: string;
  /** 번호 칸에 연결된 열이 없을 때 자동 번호를 붙일지 */
  autoNumber: boolean;
  /** 자동 번호 앞부분 — 예: 2026- → 제 2026-001 호 */
  numberPrefix: string;
  body: string;
}

export interface Certificate {
  number: string;
  title: string;
  rows: { label: string; value: string }[];
  body: string;
  date: string;
  issuer: string;
  signer: string;
}

function numberText(v: string): string {
  const t = v.trim();
  if (t === "") return "";
  return /^제/.test(t) ? t : `제 ${t} 호`;
}

export function buildCertificates(
  roster: Roster,
  template: CertificateTemplate,
  mapping: FieldMapping,
  common: CommonValues,
  limit = Infinity,
): { items: Certificate[]; total: number; missing: string[] } {
  const missing = new Set<string>();
  const items: Certificate[] = [];
  const cell = (row: string[], key: FieldKey) => {
    const i = mapping[key];
    return i === undefined || i < 0 ? undefined : (row[i] ?? "");
  };
  const total = roster.rows.length;
  const width = String(Math.max(total, 1)).length;
  const digits = Math.max(3, width);

  for (let r = 0; r < Math.min(total, limit); r++) {
    const row = roster.rows[r];
    const values: Record<string, string> = {};
    roster.headers.forEach((h, i) => {
      values[h] = row[i] ?? "";
      values[norm(h)] = row[i] ?? "";
    });

    let title = template.title;
    let number = "";
    const rows: Certificate["rows"] = [];
    for (const f of template.fields) {
      const raw = cell(row, f.key);
      if (raw === undefined) continue;
      const v = f.date ? formatDate(raw, common.dateStyle) : raw;
      values[f.label] = v;
      if (f.place === "title") {
        if (v) title = v;
      } else if (f.place === "number") {
        number = numberText(v);
      } else if (v) {
        rows.push({ label: f.label, value: v });
      }
    }
    if (!number && (mapping.number === undefined || mapping.number < 0) && common.autoNumber) {
      number = numberText(`${common.numberPrefix}${String(r + 1).padStart(digits, "0")}`);
    }

    const filled = fillTokens(common.body, values);
    filled.missing.forEach((m) => missing.add(m));

    items.push({
      number,
      title: spaceTitle(title),
      rows,
      body: filled.text,
      date: common.date ? formatDate(common.date, common.dateStyle) : "",
      issuer: common.issuer.trim(),
      signer: common.signer.trim(),
    });
  }
  return { items, total, missing: [...missing] };
}

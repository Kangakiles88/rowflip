import { parseNumber, won } from "./estimate";
import { parseAnyTable, parseTable } from "./parser";

/**
 * 기부금영수증 — 헌금·후원 내역(엑셀)을 읽어 기부자별로 합계를 내고,
 * 「소득세법 시행규칙」 별지 제45호의2서식(기부금 영수증) 한 장씩에 들어갈 값을 만든다.
 * 모든 처리는 브라우저 안에서만 한다(명단·주민등록번호·금액은 저장·전송하지 않음).
 */

/** 기부금 구분 코드 — 영수증 ④ 기부내용의 '코드' 칸 */
export type DonationCode = "41" | "40" | "10" | "42" | "50";

export const DONATION_CODES: { value: DonationCode; label: string; law: string }[] = [
  { value: "41", label: "41 일반기부금(종교단체)", law: "소득세법 제34조제3항제1호" },
  { value: "40", label: "40 일반기부금(종교단체 외)", law: "소득세법 제34조제3항제1호" },
  { value: "10", label: "10 특례기부금", law: "소득세법 제34조제2항제1호" },
  { value: "42", label: "42 우리사주조합기부금", law: "조세특례제한법 제88조의4" },
  { value: "50", label: "50 공제 대상 아닌 기부금", law: "" },
];

/** 기부내용을 몇 줄로 적을지 — 연간 한 줄 / 월별 / 날짜별 그대로 */
export type DetailMode = "year" | "month" | "each";

export interface SimpleDate {
  y: number;
  m: number;
  /** 날짜 없이 월만 있으면 null('2026.03', '3월') */
  d: number | null;
}

export interface DonorRecord {
  date: SimpleDate | null;
  amount: number;
}

export interface Donor {
  name: string;
  /** 주민등록번호(사업자등록번호) — 입력 그대로, 하이픈만 맞춘다 */
  id: string;
  address: string;
  total: number;
  /** 기부 횟수(금액이 있는 줄 수) */
  count: number;
  /** 1~12월 합계(날짜·월을 알 수 없는 금액은 들어가지 않음) */
  months: number[];
  /** 날짜를 알 수 없는 금액 합계 */
  undated: number;
  records: DonorRecord[];
}

export interface Ledger {
  donors: Donor[];
  /** 금액을 읽지 못한 줄(엑셀 행 번호, 1부터) */
  invalidLines: number[];
  /** 다른 연도라서 뺀 줄 수 */
  otherYear: number;
  hasHeader: boolean;
  /** 1월~12월 열로 된 표(가로형) */
  wide: boolean;
  /** 탭 없이 띄어쓰기로 친 내역 */
  spaced: boolean;
  /** 날짜(또는 월)를 읽은 금액이 하나라도 있는지 */
  hasDates: boolean;
  /** 내역에서 가장 많이 나온 연도(없으면 null) */
  mainYear: number | null;
}

export const DONATION_SAMPLE = [
  "날짜\t성명\t주민등록번호\t주소\t금액",
  "2026-01-04\t김민준\t800101-1000001\t서울특별시 중구 세종대로 110\t100,000",
  "2026-01-04\t이서연\t850505-2000002\t서울특별시 마포구 월드컵로 25\t50,000",
  "2026-01-11\t박지훈\t790322-1000003\t경기도 성남시 분당구 판교역로 166\t30,000",
  "2026-02-01\t김민준\t800101-1000001\t서울특별시 중구 세종대로 110\t100,000",
  "2026-02-08\t이서연\t850505-2000002\t서울특별시 마포구 월드컵로 25\t50,000",
  "2026-03-01\t김민준\t800101-1000001\t서울특별시 중구 세종대로 110\t150,000",
  "2026-03-15\t박지훈\t790322-1000003\t경기도 성남시 분당구 판교역로 166\t30,000",
  "2026-04-05\t이서연\t850505-2000002\t서울특별시 마포구 월드컵로 25\t70,000",
  "2026-05-03\t김민준\t800101-1000001\t서울특별시 중구 세종대로 110\t100,000",
  "2026-06-07\t박지훈\t790322-1000003\t경기도 성남시 분당구 판교역로 166\t30,000",
].join("\n");

type Col = "name" | "id" | "address" | "date" | "amount";

const ALIASES: Record<Col, string[]> = {
  name: ["성명", "이름", "기부자", "기부자명", "헌금자", "후원자", "후원자명", "교인명", "성도명", "회원명", "성명(법인명)"],
  id: ["주민등록번호", "주민번호", "주민등록번호(사업자등록번호)", "사업자등록번호", "등록번호", "생년월일"],
  address: ["주소", "주소(소재지)", "거주지", "소재지"],
  date: ["날짜", "일자", "연월일", "기부일", "기부일자", "헌금일", "헌금일자", "입금일", "입금일자", "납부일", "후원일", "월일"],
  amount: ["금액", "기부금", "기부금액", "헌금", "헌금액", "후원금", "후원금액", "입금액", "금액(원)", "납부액"],
};

/** 가로형 표에서 무시할 합계 열 */
const TOTAL_HEADERS = ["합계", "계", "총액", "총계", "연간합계", "합계금액"];

const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

/** 1월~12월 열 머리글 → 월 번호 */
function monthHeader(h: string): number | null {
  const m = norm(h).match(/^(\d{1,2})월$/);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 12 ? n : null;
}

const validMd = (m: number, d: number | null) => m >= 1 && m <= 12 && (d === null || (d >= 1 && d <= 31));

/**
 * 날짜 읽기 — 2026-01-05, 2026.1.5., 2026년 1월 5일, 20260105, 1/5, 1월 5일, 2026-01, 2026.01, 3월,
 * 엑셀 날짜 일련번호(46027). 연도가 없으면 year를 쓴다. 알아볼 수 없으면 null
 */
export function parseLooseDate(raw: string, year: number): SimpleDate | null {
  const t = raw.trim().replace(/\s+/g, " ");
  if (t === "") return null;
  let m = t.match(/^(\d{4})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})\s*[.일]?$/);
  if (m) return validMd(+m[2], +m[3]) ? { y: +m[1], m: +m[2], d: +m[3] } : null;
  m = t.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return validMd(+m[2], +m[3]) ? { y: +m[1], m: +m[2], d: +m[3] } : null;
  m = t.match(/^(\d{4})\s*[-./년]\s*(\d{1,2})\s*[.월]?$/);
  if (m) return validMd(+m[2], null) ? { y: +m[1], m: +m[2], d: null } : null;
  m = t.match(/^(\d{1,2})\s*[-./월]\s*(\d{1,2})\s*[.일]?$/);
  if (m) return validMd(+m[1], +m[2]) ? { y: year, m: +m[1], d: +m[2] } : null;
  m = t.match(/^(\d{1,2})\s*월$/);
  if (m) return validMd(+m[1], null) ? { y: year, m: +m[1], d: null } : null;
  // 엑셀 날짜 일련번호(1900 날짜 체계) — 2000~2064년 범위만
  m = t.match(/^(\d{5})$/);
  if (m) {
    const serial = +m[1];
    if (serial >= 36526 && serial <= 60000) {
      const dt = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
      return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
    }
  }
  return null;
}

/** 날짜 낱말인지 — 숫자만 있으면 금액으로 보되 20260105처럼 8자리 날짜는 날짜로 */
const looksDateWord = (t: string, year: number) =>
  parseLooseDate(t, year) !== null && (!/^\d+$/.test(t.trim()) || /^20\d{6}$/.test(t.trim()));

/** 날짜 글자에 연도가 들어 있는지 — 2026-01-04, 2026년 1월, 20260104, 엑셀 일련번호 */
const hasYear = (t: string) => /^\s*(\d{4}\s*[-./년]|\d{8}\s*$|\d{5}\s*$)/.test(t);

/** 주민등록번호처럼 보이는지(가린 번호 포함) — 900101-1234567, 9001011234567, 900101-1****** */
const looksId = (t: string) => /^\d{6}-?[\d*]{7}$/.test(t.trim()) || /^\d{3}-\d{2}-\d{5}$/.test(t.trim());

/** 9001011234567 → 900101-1234567. 다른 모양은 그대로 */
export function formatId(raw: string): string {
  const t = raw.trim();
  const m = t.match(/^(\d{6})-?([\d*]{7})$/);
  return m ? `${m[1]}-${m[2]}` : t;
}

/** 주민등록번호 뒷자리 가리기 — 900101-1234567 → 900101-1****** */
export function maskId(raw: string): string {
  const t = formatId(raw);
  const m = t.match(/^(\d{6})-([\d*])[\d*]{6}$/);
  return m ? `${m[1]}-${m[2]}******` : t;
}

const isAmount = (t: string) => {
  const n = parseNumber(t);
  return n !== null && !/^\d{4}[-./]/.test(t.trim());
};

function headerMap(row: string[]): { map: Partial<Record<Col, number>>; months: Map<number, number> } | null {
  const h = row.map(norm);
  const map: Partial<Record<Col, number>> = {};
  (Object.keys(ALIASES) as Col[]).forEach((col) => {
    const i = h.findIndex((x, idx) => ALIASES[col].some((a) => x === norm(a)) && !Object.values(map).includes(idx));
    if (i !== -1) map[col] = i;
  });
  const months = new Map<number, number>();
  const seen = new Set<number>();
  row.forEach((c, i) => {
    const mo = monthHeader(c);
    if (mo !== null && !seen.has(mo)) {
      months.set(i, mo);
      seen.add(mo);
    }
  });
  // 가로형이 아닌데 금액 열이 없으면 '합계' 같은 열을 금액으로
  if (map.amount === undefined && months.size === 0) {
    const i = h.findIndex((x) => TOTAL_HEADERS.includes(x));
    if (i !== -1) map.amount = i;
  }
  const known = Object.keys(map).length + months.size;
  if (map.name === undefined || known < 2) return null;
  if (map.amount === undefined && months.size === 0) return null;
  return { map, months };
}

/** 머리글이 없을 때 열 종류를 짐작한다 — 날짜 열, 주민번호 열, 금액 열(오른쪽), 이름 열(첫 글자 열) */
function guessMap(rows: string[][], year: number): Partial<Record<Col, number>> {
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const share = (i: number, test: (t: string) => boolean) => {
    const cells = rows.map((r) => r[i] ?? "").filter((c) => c.trim() !== "");
    return cells.length === 0 ? 0 : cells.filter(test).length / cells.length;
  };
  const map: Partial<Record<Col, number>> = {};
  const used = new Set<number>();
  for (let i = 0; i < width; i++) {
    if (map.id === undefined && share(i, looksId) > 0.6) {
      map.id = i;
      used.add(i);
    }
  }
  for (let i = 0; i < width; i++) {
    if (used.has(i)) continue;
    if (map.date === undefined && share(i, (t) => looksDateWord(t, year)) > 0.6) {
      map.date = i;
      used.add(i);
    }
  }
  for (let i = width - 1; i >= 0; i--) {
    if (used.has(i)) continue;
    if (share(i, isAmount) > 0.6) {
      map.amount = i;
      used.add(i);
      break;
    }
  }
  for (let i = 0; i < width; i++) {
    if (used.has(i)) continue;
    if (share(i, (t) => !isAmount(t) && parseLooseDate(t, year) === null) > 0.6) {
      if (map.name === undefined) map.name = i;
      else if (map.address === undefined && share(i, (t) => /\s/.test(t.trim())) > 0.5) map.address = i;
      used.add(i);
    }
  }
  return map;
}

/** 띄어쓰기로 친 한 줄 — 낱말마다 종류를 보고 이름·주민번호·날짜·금액으로 나눈다 */
function splitSpacedRecord(line: string, year: number): Record<Col, string> {
  const out: Record<Col, string> = { name: "", id: "", address: "", date: "", amount: "" };
  const rest: string[] = [];
  const toks = line.trim().split(/\s+/);
  // '2026년 1월 5일'처럼 띄운 날짜를 먼저 붙여 본다
  const joined: string[] = [];
  for (let i = 0; i < toks.length; i++) {
    const three = toks.slice(i, i + 3).join(" ");
    const two = toks.slice(i, i + 2).join(" ");
    if (/^\d{4}년 \d{1,2}월 \d{1,2}일$/.test(three)) {
      joined.push(three);
      i += 2;
    } else if (/^(\d{4}년 \d{1,2}월|\d{1,2}월 \d{1,2}일)$/.test(two)) {
      joined.push(two);
      i += 1;
    } else joined.push(toks[i]);
  }
  for (const t of joined) {
    if (!out.id && looksId(t)) out.id = t;
    else if (!out.date && looksDateWord(t, year)) out.date = t;
    else rest.push(t);
  }
  // 금액은 숫자로 된 마지막 낱말
  for (let i = rest.length - 1; i >= 0; i--) {
    if (isAmount(rest[i])) {
      out.amount = rest[i];
      rest.splice(i, 1);
      break;
    }
  }
  out.name = rest.join(" ");
  return out;
}

/** 이름(+주민번호)이 같으면 같은 사람 */
const donorKey = (name: string, id: string) => `${norm(name)}\u0000${id.replace(/[^\d*]/g, "")}`;

/**
 * 헌금·후원 내역 읽기 — 세로형(날짜·성명·금액이 한 줄에 한 건)과 가로형(성명 | 1월 … 12월) 모두.
 * year: 기부 연도. 연도가 적힌 날짜 중 다른 해 것은 뺀다(otherYear).
 */
export function parseLedger(raw: string, year: number): Ledger {
  const empty: Ledger = {
    donors: [],
    invalidLines: [],
    otherYear: 0,
    hasHeader: false,
    wide: false,
    spaced: false,
    hasDates: false,
    mainYear: null,
  };
  // 탭 없이 쓴 '김민준 1/4 100,000' 줄들은 천 단위 쉼표 때문에 CSV로 잘못 읽힐 수 있다 —
  // CSV인데 첫 줄이 머리글이 아니면 쉼표로 나누지 않고 한 칸으로 읽는다
  const any = parseAnyTable(raw);
  const table = any.source === "csv" && !headerMap(any.rows[0].map((c) => c.trim())) ? parseTable(raw) : any;
  const rows = table.rows.map((r) => r.map((c) => c.trim()));
  const lineNo = rows.map((_, i) => i + 1);
  const nonEmpty = rows.map((r, i) => ({ r, n: lineNo[i] })).filter(({ r }) => r.some((c) => c !== ""));
  if (nonEmpty.length === 0) return empty;

  const head = headerMap(nonEmpty[0].r);
  const body = head ? nonEmpty.slice(1) : nonEmpty;
  let map: Partial<Record<Col, number>> = head?.map ?? {};
  const months = head?.months ?? new Map<number, number>();
  const wide = months.size > 0 && map.date === undefined;

  // 탭 없이 한 칸뿐이면 띄어쓰기로 나눈다(휴대폰에서 직접 친 내역)
  const spaced = !head && table.colCount === 1 && body.some(({ r }) => /\s/.test(r[0]));
  let spacedRecs: Record<Col, string>[] | null = null;
  if (spaced) {
    spacedRecs = body.map(({ r }) => splitSpacedRecord(r[0], year));
  } else if (!head) {
    map = guessMap(
      body.map(({ r }) => r),
      year,
    );
    if (map.name === undefined || map.amount === undefined) return { ...empty, invalidLines: body.map(({ n }) => n) };
  }

  const byKey = new Map<string, Donor>();
  const invalidLines: number[] = [];
  let otherYear = 0;
  const yearCount = new Map<number, number>();

  const add = (name: string, id: string, address: string, amount: number, date: SimpleDate | null) => {
    const key = donorKey(name, id);
    let d = byKey.get(key);
    if (!d) {
      d = { name, id: formatId(id), address, total: 0, count: 0, months: Array(12).fill(0), undated: 0, records: [] };
      byKey.set(key, d);
    }
    if (!d.address && address) d.address = address;
    d.total += amount;
    d.count += 1;
    if (date) d.months[date.m - 1] += amount;
    else d.undated += amount;
    d.records.push({ date, amount });
  };

  body.forEach(({ r, n }, idx) => {
    const get = (c: Col) => (spacedRecs ? spacedRecs[idx][c] : map[c] === undefined ? "" : (r[map[c]!] ?? ""));
    const name = get("name").trim();
    if (!name) {
      if (r.some((c) => c !== "")) invalidLines.push(n);
      return;
    }
    if (TOTAL_HEADERS.includes(norm(name))) return; // 맨 아래 합계 줄
    const id = get("id");
    const address = get("address");

    if (wide) {
      let any = false;
      months.forEach((mo, col) => {
        const v = parseNumber(r[col] ?? "");
        if (v === null || v === 0) return;
        any = true;
        add(name, id, address, v, { y: year, m: mo, d: null });
      });
      if (!any && r.some((c, i) => months.has(i) && c !== "")) invalidLines.push(n);
      return;
    }

    const amount = parseNumber(get("amount"));
    if (amount === null) {
      invalidLines.push(n);
      return;
    }
    if (amount === 0) return;
    const rawDate = get("date");
    const date = rawDate ? parseLooseDate(rawDate, year) : null;
    // 연도가 적힌 날짜만 연도 판단에 쓴다('1/4'처럼 연도가 없으면 기부 연도로 본다)
    if (date && hasYear(rawDate)) {
      yearCount.set(date.y, (yearCount.get(date.y) ?? 0) + 1);
      if (date.y !== year) {
        otherYear += 1;
        return;
      }
    }
    add(name, id, address, amount, date);
  });

  let mainYear: number | null = null;
  let best = 0;
  yearCount.forEach((c, y) => {
    if (c > best) {
      best = c;
      mainYear = y;
    }
  });

  const donors = [...byKey.values()];
  return {
    donors,
    invalidLines,
    otherYear,
    hasHeader: head !== null,
    wide,
    spaced,
    hasDates: wide || donors.some((d) => d.records.some((x) => x.date !== null)),
    mainYear,
  };
}

/** 내역만 훑어 가장 많이 나온 연도를 찾는다(연도 칸 기본값용) */
export function detectYear(raw: string): number | null {
  return parseLedger(raw, 0).mainYear;
}

export type SortMode = "name" | "input";

export function sortDonors(donors: Donor[], mode: SortMode): Donor[] {
  if (mode === "input") return donors;
  return [...donors].sort((a, b) => a.name.localeCompare(b.name, "ko") || a.id.localeCompare(b.id));
}

export interface ReceiptLine {
  code: string;
  kind: string;
  date: string;
  amount: number;
}

const p2 = (n: number) => String(n).padStart(2, "0");
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** 영수증 ④ 기부내용 줄 — 연간 한 줄 / 월별 / 날짜별(같은 날은 합침) */
export function receiptLines(donor: Donor, mode: DetailMode, year: number, code: string): ReceiptLine[] {
  const line = (date: string, amount: number): ReceiptLine => ({ code, kind: "금전", date, amount });
  const yearLine = () => [line(`${year}.01.01 ~ ${year}.12.31`, donor.total)];
  const dated = donor.records.some((r) => r.date !== null);
  if (mode === "year" || !dated) return yearLine();

  if (mode === "month" || donor.records.every((r) => r.date?.d == null)) {
    const out: ReceiptLine[] = [];
    donor.months.forEach((amt, i) => {
      if (amt) out.push(line(`${year}.${p2(i + 1)}.01 ~ ${year}.${p2(i + 1)}.${p2(lastDay(year, i + 1))}`, amt));
    });
    if (donor.undated) out.push(line(`${year}년 중`, donor.undated));
    return out;
  }

  // 날짜별 — 같은 날짜는 한 줄로 합치고 날짜 순으로
  const byDay = new Map<string, number>();
  let undated = 0;
  for (const r of donor.records) {
    if (!r.date) {
      undated += r.amount;
      continue;
    }
    const k = r.date.d == null ? `${r.date.y}.${p2(r.date.m)}` : `${r.date.y}.${p2(r.date.m)}.${p2(r.date.d)}`;
    byDay.set(k, (byDay.get(k) ?? 0) + r.amount);
  }
  const out = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => line(k, v));
  if (undated) out.push(line(`${year}년 중`, undated));
  return out;
}

/** 일련번호 — 접두어 + 3자리 순번('2026-' → 2026-001) */
export function serialNo(prefix: string, i: number): string {
  return `${prefix}${String(i + 1).padStart(3, "0")}`;
}

/** 이름별 합계 표(엑셀 붙여넣기용) — 월 열은 날짜를 알 때만 */
export function summaryTable(donors: Donor[], withMonths: boolean, mask: boolean): string[][] {
  const hasId = donors.some((d) => d.id);
  const head = ["성명", ...(hasId ? ["주민등록번호"] : []), "건수", ...(withMonths ? Array.from({ length: 12 }, (_, i) => `${i + 1}월`) : []), "합계"];
  const rows = donors.map((d) => [
    d.name,
    ...(hasId ? [mask ? maskId(d.id) : d.id] : []),
    String(d.count),
    ...(withMonths ? d.months.map((v) => (v ? won(v) : "")) : []),
    won(d.total),
  ]);
  const sum = (f: (d: Donor) => number) => donors.reduce((s, d) => s + f(d), 0);
  const total = [
    "합계",
    ...(hasId ? [""] : []),
    String(sum((d) => d.count)),
    ...(withMonths ? Array.from({ length: 12 }, (_, i) => sum((d) => d.months[i])).map((v) => (v ? won(v) : "")) : []),
    won(sum((d) => d.total)),
  ];
  return [head, ...rows, total];
}

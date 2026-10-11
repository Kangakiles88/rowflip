/** 텍스트 비교 — 줄 단위로 같은 줄·삭제된 줄·추가된 줄을 찾고, 바뀐 줄은 글자 단위로 다른 곳을 표시한다. */

type Op = { type: "equal" | "del" | "ins"; a: number; b: number };

/**
 * Myers 차이 알고리즘(diff 프로그램들이 쓰는 방식). 두 목록을 최소한으로 지우고 더해서 같게 만드는 방법을 찾는다.
 * 차이가 maxD보다 많으면 계산을 멈추고 null을 돌려준다(메모리 보호).
 */
export function diffSequence<T>(a: T[], b: T[], eq: (x: T, y: T) => boolean, maxD: number): Op[] | null {
  // 앞뒤의 같은 부분은 먼저 떼어 내면 계산량이 크게 준다
  let start = 0;
  while (start < a.length && start < b.length && eq(a[start], b[start])) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && eq(a[endA - 1], b[endB - 1])) {
    endA--;
    endB--;
  }

  const n = endA - start;
  const m = endB - start;
  const max = n + m;
  const off = max + 1;
  const v = new Int32Array(2 * max + 3);
  const trace: Int32Array[] = [];
  let found = -1;

  for (let d = 0; d <= Math.min(max, maxD); d++) {
    trace.push(v.slice(off - d, off + d + 1));
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && eq(a[start + x], b[start + y])) {
        x++;
        y++;
      }
      v[off + k] = x;
      if (x >= n && y >= m) {
        found = d;
        break;
      }
    }
    if (found >= 0) break;
  }
  if (found < 0) return null;

  const middle: Op[] = [];
  let x = n;
  let y = m;
  for (let d = found; d >= 0; d--) {
    const t = trace[d];
    const get = (k: number) => t[k + d];
    const k = x - y;
    let prevX = 0;
    let prevY = 0;
    if (d > 0) {
      const prevK = k === -d || (k !== d && get(k - 1) < get(k + 1)) ? k + 1 : k - 1;
      prevX = get(prevK);
      prevY = prevX - prevK;
    }
    while (x > prevX && y > prevY) {
      middle.push({ type: "equal", a: start + x - 1, b: start + y - 1 });
      x--;
      y--;
    }
    if (d > 0) {
      if (x === prevX) middle.push({ type: "ins", a: start + x, b: start + y - 1 });
      else middle.push({ type: "del", a: start + x - 1, b: start + y });
    }
    x = prevX;
    y = prevY;
  }

  const ops: Op[] = [];
  for (let i = 0; i < start; i++) ops.push({ type: "equal", a: i, b: i });
  ops.push(...middle.reverse());
  for (let i = 0; i < a.length - endA; i++) ops.push({ type: "equal", a: endA + i, b: endB + i });
  return ops;
}

export interface Part {
  text: string;
  changed: boolean;
}

export type DiffRow =
  | { type: "equal"; aNo: number; bNo: number; text: string }
  | { type: "del"; aNo: number; text: string; parts?: Part[] }
  | { type: "ins"; bNo: number; text: string; parts?: Part[] };

export interface DiffOptions {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
}

export interface DiffResult {
  rows: DiffRow[];
  added: number;
  removed: number;
  same: number;
  /** 차이가 너무 많아 줄 단위 최소 비교를 포기했는지 */
  tooDifferent: boolean;
}

const MAX_LINE_D = 2000;
const MAX_CHAR_LEN = 2000;

function pushPart(parts: Part[], text: string, changed: boolean) {
  const last = parts[parts.length - 1];
  if (last && last.changed === changed) last.text += text;
  else parts.push({ text, changed });
}

/** 낱말 단위로 나누기 — 띄어쓰기도 하나의 조각으로 남겨 원문을 그대로 이어 붙일 수 있게 한다 */
const tokens = (s: string) => s.split(/(\s+)/).filter((t) => t !== "");

/**
 * 바뀐 두 줄에서 다른 낱말. 한글은 글자 하나하나를 표시하면 오히려 읽기 어려워
 * 띄어쓰기로 나뉜 낱말 단위로 표시한다.
 */
export function charParts(a: string, b: string): { a: Part[]; b: Part[] } | null {
  const ca = tokens(a);
  const cb = tokens(b);
  if (ca.length > MAX_CHAR_LEN || cb.length > MAX_CHAR_LEN) return null;
  const ops = diffSequence(ca, cb, (x, y) => x === y, 400);
  if (!ops) return null;
  const pa: Part[] = [];
  const pb: Part[] = [];
  for (const op of ops) {
    if (op.type === "equal") {
      pushPart(pa, ca[op.a], false);
      pushPart(pb, cb[op.b], false);
    } else if (op.type === "del") pushPart(pa, ca[op.a], true);
    else pushPart(pb, cb[op.b], true);
  }
  // 거의 다 바뀐 줄은 낱말 표시가 오히려 어지럽다 — 줄 전체 표시로 둔다
  const same = pa.filter((p) => !p.changed).reduce((s, p) => s + p.text.length, 0);
  if (same < Math.min(a.length, b.length) * 0.3) return null;
  return { a: pa, b: pb };
}

const splitLines = (s: string) => (s === "" ? [] : s.replace(/\r\n?/g, "\n").split("\n"));

export function diffText(before: string, after: string, o: DiffOptions): DiffResult {
  const a = splitLines(before);
  const b = splitLines(after);
  const norm = (s: string) => {
    let t = o.ignoreWhitespace ? s.trim().replace(/\s+/g, " ") : s;
    if (o.ignoreCase) t = t.toLowerCase();
    return t;
  };
  const na = a.map(norm);
  const nb = b.map(norm);

  let ops = diffSequence(na, nb, (x, y) => x === y, MAX_LINE_D);
  const tooDifferent = ops === null;
  if (!ops) {
    ops = [
      ...a.map((_, i): Op => ({ type: "del", a: i, b: 0 })),
      ...b.map((_, i): Op => ({ type: "ins", a: 0, b: i })),
    ];
  }

  const rows: DiffRow[] = [];
  let added = 0;
  let removed = 0;
  let same = 0;
  let i = 0;
  while (i < ops.length) {
    const op = ops[i];
    if (op.type === "equal") {
      rows.push({ type: "equal", aNo: op.a + 1, bNo: op.b + 1, text: b[op.b] });
      same++;
      i++;
      continue;
    }
    // 이어진 삭제·추가 묶음 — 같은 자리의 줄끼리 글자 비교
    const dels: number[] = [];
    const ins: number[] = [];
    while (i < ops.length && ops[i].type !== "equal") {
      if (ops[i].type === "del") dels.push(ops[i].a);
      else ins.push(ops[i].b);
      i++;
    }
    const pairs = Math.min(dels.length, ins.length);
    const partsA: (Part[] | undefined)[] = [];
    const partsB: (Part[] | undefined)[] = [];
    for (let p = 0; p < pairs; p++) {
      const cp = charParts(a[dels[p]], b[ins[p]]);
      partsA[p] = cp?.a;
      partsB[p] = cp?.b;
    }
    dels.forEach((ai, p) => rows.push({ type: "del", aNo: ai + 1, text: a[ai], parts: partsA[p] }));
    ins.forEach((bi, p) => rows.push({ type: "ins", bNo: bi + 1, text: b[bi], parts: partsB[p] }));
    removed += dels.length;
    added += ins.length;
  }
  return { rows, added, removed, same, tooDifferent };
}

/** 복사용 텍스트 — 같은 줄은 두 칸 띄우고, 삭제는 '- ', 추가는 '+ ' */
export function diffToText(rows: DiffRow[]): string {
  return rows.map((r) => (r.type === "equal" ? "  " : r.type === "del" ? "- " : "+ ") + r.text).join("\n");
}

export const DEFAULT_DIFF_OPTIONS: DiffOptions = { ignoreWhitespace: false, ignoreCase: false };

export const DIFF_SAMPLE_A = `제1조 (목적) 이 계약은 물품 공급에 관한 사항을 정한다.
제2조 (공급 기간) 2026년 1월 1일부터 12월 31일까지로 한다.
제3조 (대금) 월 1,200만 원을 다음 달 10일에 지급한다.
제4조 (해지) 30일 전에 서면으로 알린다.`;

export const DIFF_SAMPLE_B = `제1조 (목적) 이 계약은 물품 공급에 관한 사항을 정한다.
제2조 (공급 기간) 2026년 1월 1일부터 2027년 6월 30일까지로 한다.
제3조 (대금) 월 1,350만 원을 다음 달 10일에 지급한다.
제4조 (해지) 30일 전에 서면으로 알린다.
제5조 (분쟁) 분쟁은 서울중앙지방법원에서 해결한다.`;

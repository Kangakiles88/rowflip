/**
 * 엑셀 수식 계산기 — 함수 연습장에서 쓰는 작은 엑셀 수식 엔진.
 * 외부 수식 엔진(라이선스 문제)을 쓰지 않고, 연습에 필요한 함수만 엑셀과 같은 규칙으로 직접 구현한다.
 *
 * 시트는 string[][] (rows[0] = 엑셀 1행, rows[r][0] = A열). 칸 값은 엑셀이 입력값을 읽듯
 * 숫자(1,200 같은 천 단위 쉼표 포함)·TRUE/FALSE·빈칸·글자로 해석한다.
 */

export type ErrorCode = "#N/A" | "#VALUE!" | "#REF!" | "#DIV/0!" | "#NAME?" | "#NUM!" | "수식 오류";

/** 빈칸은 null */
export type Scalar = number | string | boolean | null;

export interface FxError {
  kind: "error";
  code: ErrorCode;
  detail: string;
}

/** 0부터 세는 칸 범위(양 끝 포함) */
export interface CellRange {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
}

interface RangeVal {
  kind: "range";
  ref: CellRange;
  cells: Scalar[][];
}

type Value = Scalar | FxError | RangeVal;

export type FormulaResult =
  | { ok: true; value: Scalar; display: string; refs: CellRange[]; functions: string[] }
  | { ok: false; code: ErrorCode; message: string; refs: CellRange[]; functions: string[] };

/* ───────── 칸 값 ───────── */

const NUMBER_RE = /^[-+]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$|^[-+]?\.\d+$/;

/** 문자열이 숫자처럼 보이면 숫자로(천 단위 쉼표 허용), 아니면 null */
export function parseNumber(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  if (NUMBER_RE.test(t)) return Number(t.replace(/,/g, ""));
  if (/^[-+]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?%$/.test(t)) return Number(t.slice(0, -1).replace(/,/g, "")) / 100;
  return null;
}

/** 엑셀이 칸에 입력된 글자를 읽는 방식: 빈칸 / 숫자 / TRUE·FALSE / 글자 */
export function parseCellValue(raw: string | undefined): Scalar {
  if (raw === undefined) return null;
  if (raw.trim() === "") return null;
  const n = parseNumber(raw);
  if (n !== null) return n;
  const up = raw.trim().toUpperCase();
  if (up === "TRUE") return true;
  if (up === "FALSE") return false;
  return raw;
}

/** 엑셀 '일반' 서식처럼 숫자를 보여 준다(유효숫자 15자리) */
export function formatNumber(n: number): string {
  if (Object.is(n, -0)) return "0";
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
  const s = Number(n.toPrecision(15)).toString();
  return s;
}

export function formatScalar(v: Scalar): string {
  if (v === null) return "";
  if (typeof v === "number") return formatNumber(v);
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return v;
}

/** 0 → A, 26 → AA */
export function columnName(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function columnIndex(letters: string): number {
  let n = 0;
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export function rangeLabel(r: CellRange): string {
  const a = `${columnName(r.c1)}${r.r1 + 1}`;
  if (r.r1 === r.r2 && r.c1 === r.c2) return a;
  return `${a}:${columnName(r.c2)}${r.r2 + 1}`;
}

/* ───────── 토큰 ───────── */

type Token =
  | { t: "num"; v: number; pos: number }
  | { t: "str"; v: string; pos: number }
  | { t: "ref"; v: CellRange; text: string; pos: number }
  | { t: "func"; v: string; pos: number }
  | { t: "name"; v: string; pos: number }
  | { t: "op"; v: string; pos: number }
  | { t: "("; pos: number }
  | { t: ")"; pos: number }
  | { t: ","; pos: number };

class FormulaSyntaxError extends Error {}

const MAX_ROW = 1048576;

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    const rest = src.slice(i);
    if (ch === '"') {
      let j = i + 1;
      let s = "";
      for (;;) {
        if (j >= src.length) throw new FormulaSyntaxError("큰따옴표(\")가 닫히지 않았습니다.");
        if (src[j] === '"') {
          if (src[j + 1] === '"') {
            s += '"';
            j += 2;
            continue;
          }
          break;
        }
        s += src[j];
        j++;
      }
      out.push({ t: "str", v: s, pos: i });
      i = j + 1;
      continue;
    }
    const num = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?/.exec(rest);
    // 숫자 바로 뒤에 ':'가 오면 행 범위(1:3)이므로 숫자로 읽지 않는다 — 행 범위는 지원하지 않음
    if (num && !/^[A-Za-z]/.test(rest.slice(num[0].length))) {
      if (rest[num[0].length] === ":") throw new FormulaSyntaxError("행 전체 범위(1:3)는 이 연습장에서 쓸 수 없습니다. A1:C3처럼 칸 범위로 적어 주세요.");
      out.push({ t: "num", v: Number(num[0]), pos: i });
      i += num[0].length;
      continue;
    }
    const sheetRef = /^(?:'[^']+'|[^\s!(),:"'=<>&+\-*/^%]+)!/.exec(rest);
    if (sheetRef) throw new FormulaSyntaxError("다른 시트 참조(시트1!A1)는 이 연습장에서 쓸 수 없습니다. 같은 시트의 칸만 적어 주세요.");
    const func = /^([A-Za-z_][A-Za-z0-9_.]*)\s*\(/.exec(rest);
    if (func) {
      out.push({ t: "func", v: func[1].toUpperCase(), pos: i });
      i += func[1].length;
      continue;
    }
    const colRange = /^\$?([A-Za-z]{1,3}):\$?([A-Za-z]{1,3})(?![A-Za-z0-9_])/.exec(rest);
    if (colRange) {
      const c1 = columnIndex(colRange[1]);
      const c2 = columnIndex(colRange[2]);
      out.push({
        t: "ref",
        v: { r1: 0, c1: Math.min(c1, c2), r2: MAX_ROW - 1, c2: Math.max(c1, c2) },
        text: colRange[0],
        pos: i,
      });
      i += colRange[0].length;
      continue;
    }
    const cell = /^\$?([A-Za-z]{1,3})\$?(\d+)(?::\$?([A-Za-z]{1,3})\$?(\d+))?(?![A-Za-z0-9_])/.exec(rest);
    if (cell) {
      const ra = Number(cell[2]) - 1;
      const ca = columnIndex(cell[1]);
      const rb = cell[4] ? Number(cell[4]) - 1 : ra;
      const cb = cell[3] ? columnIndex(cell[3]) : ca;
      if (ra < 0 || rb < 0 || ra >= MAX_ROW || rb >= MAX_ROW) throw new FormulaSyntaxError(`${cell[0]}은(는) 없는 칸입니다.`);
      out.push({
        t: "ref",
        v: { r1: Math.min(ra, rb), c1: Math.min(ca, cb), r2: Math.max(ra, rb), c2: Math.max(ca, cb) },
        text: cell[0],
        pos: i,
      });
      i += cell[0].length;
      continue;
    }
    const name = /^[\p{L}_][\p{L}\p{N}_.]*/u.exec(rest);
    if (name) {
      out.push({ t: "name", v: name[0], pos: i });
      i += name[0].length;
      continue;
    }
    const op = /^(<>|<=|>=|[-+*/^&=<>%])/.exec(rest);
    if (op) {
      out.push({ t: "op", v: op[1], pos: i });
      i += op[1].length;
      continue;
    }
    if (ch === "(" || ch === ")" || ch === ",") {
      out.push({ t: ch, pos: i } as Token);
      i++;
      continue;
    }
    if (ch === ";") throw new FormulaSyntaxError("인수는 세미콜론(;)이 아니라 쉼표(,)로 나눕니다.");
    throw new FormulaSyntaxError(`‘${ch}’ 기호는 수식에 쓸 수 없습니다.`);
  }
  return out;
}

/* ───────── 구문 트리 ───────── */

type Node =
  | { k: "num"; v: number }
  | { k: "str"; v: string }
  | { k: "bool"; v: boolean }
  | { k: "ref"; v: CellRange }
  | { k: "name"; v: string }
  | { k: "missing" }
  | { k: "call"; name: string; args: Node[] }
  | { k: "unary"; op: string; x: Node }
  | { k: "percent"; x: Node }
  | { k: "bin"; op: string; a: Node; b: Node };

class Parser {
  private i = 0;
  readonly refs: CellRange[] = [];
  readonly functions = new Set<string>();
  constructor(private readonly toks: Token[]) {}

  private peek(): Token | undefined {
    return this.toks[this.i];
  }

  private isOp(...ops: string[]): string | null {
    const t = this.peek();
    return t && t.t === "op" && ops.includes(t.v) ? t.v : null;
  }

  parseAll(): Node {
    if (this.toks.length === 0) throw new FormulaSyntaxError("= 뒤에 수식을 입력하세요.");
    const n = this.compare();
    const t = this.peek();
    if (t) {
      if (t.t === ")") throw new FormulaSyntaxError("닫는 괄호 ‘)’가 여는 괄호보다 많습니다.");
      if (t.t === ",") throw new FormulaSyntaxError("쉼표(,)는 함수 괄호 안에서만 씁니다.");
      throw new FormulaSyntaxError("수식 중간에 연산자(+, -, &, = 등)가 빠진 것 같습니다.");
    }
    return n;
  }

  private compare(): Node {
    let a = this.concat();
    for (let op = this.isOp("=", "<>", "<", ">", "<=", ">="); op; op = this.isOp("=", "<>", "<", ">", "<=", ">=")) {
      this.i++;
      a = { k: "bin", op, a, b: this.concat() };
    }
    return a;
  }

  private concat(): Node {
    let a = this.add();
    while (this.isOp("&")) {
      this.i++;
      a = { k: "bin", op: "&", a, b: this.add() };
    }
    return a;
  }

  private add(): Node {
    let a = this.mul();
    for (let op = this.isOp("+", "-"); op; op = this.isOp("+", "-")) {
      this.i++;
      a = { k: "bin", op, a, b: this.mul() };
    }
    return a;
  }

  private mul(): Node {
    let a = this.pow();
    for (let op = this.isOp("*", "/"); op; op = this.isOp("*", "/")) {
      this.i++;
      a = { k: "bin", op, a, b: this.pow() };
    }
    return a;
  }

  private pow(): Node {
    let a = this.unary();
    while (this.isOp("^")) {
      this.i++;
      a = { k: "bin", op: "^", a, b: this.unary() };
    }
    return a;
  }

  private unary(): Node {
    const op = this.isOp("-", "+");
    if (op) {
      this.i++;
      return { k: "unary", op, x: this.unary() };
    }
    let x = this.primary();
    while (this.isOp("%")) {
      this.i++;
      x = { k: "percent", x };
    }
    return x;
  }

  private primary(): Node {
    const t = this.peek();
    if (!t) throw new FormulaSyntaxError("수식이 중간에 끝났습니다. 빠진 값이나 닫는 괄호가 있는지 보세요.");
    this.i++;
    switch (t.t) {
      case "num":
        return { k: "num", v: t.v };
      case "str":
        return { k: "str", v: t.v };
      case "ref":
        this.refs.push(t.v);
        return { k: "ref", v: t.v };
      case "name": {
        const up = t.v.toUpperCase();
        if (up === "TRUE") return { k: "bool", v: true };
        if (up === "FALSE") return { k: "bool", v: false };
        return { k: "name", v: t.v };
      }
      case "func": {
        this.functions.add(t.v);
        this.i++; // '('
        const args: Node[] = [];
        if (this.peek()?.t === ")") {
          this.i++;
          return { k: "call", name: t.v, args };
        }
        for (;;) {
          const nt = this.peek();
          if (nt && (nt.t === "," || nt.t === ")")) args.push({ k: "missing" });
          else args.push(this.compare());
          const sep = this.peek();
          if (!sep) throw new FormulaSyntaxError(`${t.v} 함수의 닫는 괄호 ‘)’가 없습니다.`);
          this.i++;
          if (sep.t === ")") break;
          if (sep.t !== ",") throw new FormulaSyntaxError(`${t.v} 함수의 인수 사이에는 쉼표(,)가 필요합니다.`);
        }
        return { k: "call", name: t.v, args };
      }
      case "(": {
        const n = this.compare();
        if (this.peek()?.t !== ")") throw new FormulaSyntaxError("여는 괄호 ‘(’에 맞는 닫는 괄호 ‘)’가 없습니다.");
        this.i++;
        return n;
      }
      case ")":
        throw new FormulaSyntaxError("닫는 괄호 ‘)’ 앞에 값이 빠졌습니다.");
      case ",":
        throw new FormulaSyntaxError("쉼표(,) 앞에 값이 빠졌습니다.");
      case "op": {
        const prev = this.toks[this.i - 2];
        if (["<", ">", "<=", ">=", "<>", "="].includes(t.v) && (prev?.t === "," || prev?.t === "("))
          throw new FormulaSyntaxError(`조건에 쓰는 비교 연산자는 큰따옴표로 감싸야 합니다. 예: "${t.v}1000"`);
        throw new FormulaSyntaxError(`‘${t.v}’ 앞에 값이 빠졌습니다.`);
      }
    }
  }
}

/* ───────── 계산 ───────── */

const err = (code: ErrorCode, detail: string): FxError => ({ kind: "error", code, detail });
const isErr = (v: unknown): v is FxError => typeof v === "object" && v !== null && (v as FxError).kind === "error";
const isRange = (v: unknown): v is RangeVal => typeof v === "object" && v !== null && (v as RangeVal).kind === "range";

/** 큰 범위(A:A)는 데이터가 있는 곳까지만 읽는다 */
const MAX_SCAN_ROWS = 20000;

function quote(v: Scalar): string {
  if (typeof v === "string") return `‘${v}’`;
  return formatScalar(v) || "빈칸";
}

class Evaluator {
  private readonly height: number;
  constructor(private readonly rows: string[][]) {
    this.height = rows.length;
  }

  private range(ref: CellRange): RangeVal {
    let r2 = ref.r2;
    if (r2 - ref.r1 + 1 > MAX_SCAN_ROWS) r2 = Math.max(ref.r1, Math.min(r2, this.height - 1));
    const cells: Scalar[][] = [];
    for (let r = ref.r1; r <= r2; r++) {
      const row: Scalar[] = [];
      for (let c = ref.c1; c <= ref.c2; c++) row.push(parseCellValue(this.rows[r]?.[c]));
      cells.push(row);
    }
    return { kind: "range", ref: { ...ref, r2 }, cells };
  }

  eval(n: Node): Value {
    switch (n.k) {
      case "num":
        return n.v;
      case "str":
        return n.v;
      case "bool":
        return n.v;
      case "missing":
        return null;
      case "ref":
        return this.range(n.v);
      case "name":
        return err(
          "#NAME?",
          /^[A-Za-z]+$/.test(n.v)
            ? `${n.v}은(는) 알 수 없는 이름입니다. 칸 주소라면 A1처럼 열과 행을 함께, 글자라면 "${n.v}"처럼 큰따옴표로 감싸세요.`
            : `글자는 큰따옴표로 감싸야 합니다: "${n.v}"`,
        );
      case "unary": {
        const x = this.num(this.scalar(this.eval(n.x)));
        if (isErr(x)) return x;
        return n.op === "-" ? -x : x;
      }
      case "percent": {
        const x = this.num(this.scalar(this.eval(n.x)));
        return isErr(x) ? x : x / 100;
      }
      case "bin":
        return this.binary(n.op, this.scalar(this.eval(n.a)), this.scalar(this.eval(n.b)));
      case "call":
        return this.call(n.name, n.args);
    }
  }

  /** 범위를 한 칸 값처럼 쓸 때 — 한 칸짜리 범위만 허용 */
  scalar(v: Value): Scalar | FxError {
    if (isRange(v)) {
      if (v.cells.length === 1 && v.cells[0].length === 1) return v.cells[0][0];
      return err("#VALUE!", `범위 ${rangeLabel(v.ref)}를 한 칸 값처럼 썼습니다. 여러 칸은 SUM·COUNTIF 같은 함수 안에 넣으세요.`);
    }
    return v;
  }

  num(v: Scalar | FxError): number | FxError {
    if (isErr(v)) return v;
    if (v === null) return 0;
    if (typeof v === "number") return v;
    if (typeof v === "boolean") return v ? 1 : 0;
    const n = parseNumber(v);
    if (n === null) return err("#VALUE!", `숫자가 필요한 곳에 글자 ${quote(v)}가 들어갔습니다.`);
    return n;
  }

  text(v: Scalar | FxError): string | FxError {
    if (isErr(v)) return v;
    return formatScalar(v);
  }

  bool(v: Scalar | FxError): boolean | FxError {
    if (isErr(v)) return v;
    if (v === null) return false;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    const up = v.trim().toUpperCase();
    if (up === "TRUE") return true;
    if (up === "FALSE") return false;
    return err("#VALUE!", `참/거짓이 필요한 곳에 글자 ${quote(v)}가 들어갔습니다. 조건은 A2>=100처럼 비교식으로 적으세요.`);
  }

  private binary(op: string, a: Scalar | FxError, b: Scalar | FxError): Value {
    if (isErr(a)) return a;
    if (isErr(b)) return b;
    if (op === "&") return formatScalar(a) + formatScalar(b);
    if (["=", "<>", "<", ">", "<=", ">="].includes(op)) {
      const c = compareScalars(a, b);
      switch (op) {
        case "=":
          return c === 0;
        case "<>":
          return c !== 0;
        case "<":
          return c < 0;
        case ">":
          return c > 0;
        case "<=":
          return c <= 0;
        default:
          return c >= 0;
      }
    }
    const x = this.num(a);
    if (isErr(x)) return x;
    const y = this.num(b);
    if (isErr(y)) return y;
    switch (op) {
      case "+":
        return x + y;
      case "-":
        return x - y;
      case "*":
        return x * y;
      case "/":
        return y === 0 ? err("#DIV/0!", "0으로 나눌 수 없습니다. 나누는 칸이 비어 있거나 0인지 보세요.") : x / y;
      default: {
        const p = Math.pow(x, y);
        return Number.isFinite(p) ? p : err("#NUM!", "계산 결과가 너무 크거나 숫자가 아닙니다.");
      }
    }
  }

  /** 인수를 하나씩 계산해 범위면 칸들을, 아니면 그 값을 넘긴다 */
  private *flat(args: Node[]): Generator<{ v: Scalar | FxError; fromRange: boolean }> {
    for (const a of args) {
      const v = this.eval(a);
      if (isRange(v)) {
        for (const row of v.cells) for (const c of row) yield { v: c, fromRange: true };
      } else yield { v, fromRange: false };
    }
  }

  private rangeArg(name: string, v: Value, which: string): RangeVal | FxError {
    if (isErr(v)) return v;
    if (!isRange(v)) return err("#VALUE!", `${name} 함수의 ${which}에는 A2:A9 같은 범위를 넣어야 합니다.`);
    return v;
  }

  private arity(name: string, args: Node[], min: number, max: number): FxError | null {
    if (args.length < min || args.length > max) {
      const want = min === max ? `${min}개` : max === Infinity ? `${min}개 이상` : `${min}~${max}개`;
      return err("수식 오류", `${name} 함수는 인수가 ${want} 필요합니다. 지금은 ${args.length}개입니다.`);
    }
    return null;
  }

  private call(name: string, args: Node[]): Value {
    const spec = FUNCTIONS[name];
    if (!spec) return err("#NAME?", `${name}은(는) 이 연습장에서 지원하지 않는 함수이거나 이름 철자가 틀렸습니다.`);
    const bad = this.arity(name, args, spec[0], spec[1]);
    if (bad) return bad;
    switch (name) {
      case "SUM":
      case "AVERAGE":
      case "MIN":
      case "MAX":
      case "COUNT": {
        const nums: number[] = [];
        for (const { v, fromRange } of this.flat(args)) {
          if (isErr(v)) {
            if (name === "COUNT") continue;
            return v;
          }
          if (fromRange) {
            if (typeof v === "number") nums.push(v);
            continue;
          }
          if (v === null && name !== "COUNT") {
            nums.push(0);
            continue;
          }
          const n = this.num(v);
          if (isErr(n)) {
            if (name === "COUNT") continue;
            return n;
          }
          if (name !== "COUNT" || typeof v === "number" || typeof v === "boolean" || parseNumber(String(v)) !== null) nums.push(n);
        }
        if (name === "COUNT") return nums.length;
        if (name === "SUM") return nums.reduce((s, x) => s + x, 0);
        if (nums.length === 0) return name === "AVERAGE" ? err("#DIV/0!", "평균을 낼 숫자가 하나도 없습니다.") : 0;
        if (name === "AVERAGE") return nums.reduce((s, x) => s + x, 0) / nums.length;
        return name === "MIN" ? Math.min(...nums) : Math.max(...nums);
      }
      case "COUNTA": {
        let n = 0;
        for (const { v, fromRange } of this.flat(args)) if (!(fromRange && (v === null || v === ""))) n++;
        return n;
      }
      case "COUNTBLANK": {
        const r = this.rangeArg(name, this.eval(args[0]), "인수");
        if (isErr(r)) return r;
        let n = 0;
        for (const row of r.cells) for (const c of row) if (c === null || c === "") n++;
        return n;
      }
      case "COUNTIF":
      case "SUMIF":
      case "AVERAGEIF": {
        const r = this.rangeArg(name, this.eval(args[0]), "첫 인수(조건을 볼 범위)");
        if (isErr(r)) return r;
        const crit = this.scalar(this.eval(args[1]));
        if (isErr(crit)) return crit;
        const test = criteria(crit);
        let target = r;
        if (name !== "COUNTIF" && args.length > 2 && args[2].k !== "missing") {
          const s = this.rangeArg(name, this.eval(args[2]), "셋째 인수(더할 범위)");
          if (isErr(s)) return s;
          // 엑셀처럼 더할 범위는 왼쪽 위 칸을 기준으로 조건 범위와 같은 크기로 맞춘다
          target = this.range({
            r1: s.ref.r1,
            c1: s.ref.c1,
            r2: s.ref.r1 + (r.ref.r2 - r.ref.r1),
            c2: s.ref.c1 + (r.ref.c2 - r.ref.c1),
          });
        }
        let count = 0;
        let sum = 0;
        let nums = 0;
        r.cells.forEach((row, i) =>
          row.forEach((c, j) => {
            if (!test(c)) return;
            count++;
            const t = target.cells[i]?.[j];
            if (typeof t === "number") {
              sum += t;
              nums++;
            }
          }),
        );
        if (name === "COUNTIF") return count;
        if (name === "SUMIF") return sum;
        return nums === 0 ? err("#DIV/0!", "조건에 맞는 숫자가 하나도 없어 평균을 낼 수 없습니다.") : sum / nums;
      }
      case "SUMIFS":
      case "COUNTIFS":
      case "AVERAGEIFS": {
        const first = name === "COUNTIFS" ? 0 : 1;
        if ((args.length - first) % 2 !== 0)
          return err("수식 오류", `${name} 함수는 ‘조건 범위, 조건’을 짝으로 적어야 합니다.`);
        let target: RangeVal | null = null;
        if (first === 1) {
          const t = this.rangeArg(name, this.eval(args[0]), "첫 인수(더할 범위)");
          if (isErr(t)) return t;
          target = t;
        }
        const pairs: { r: RangeVal; test: (v: Scalar) => boolean }[] = [];
        for (let i = first; i < args.length; i += 2) {
          const r = this.rangeArg(name, this.eval(args[i]), "조건 범위");
          if (isErr(r)) return r;
          const c = this.scalar(this.eval(args[i + 1]));
          if (isErr(c)) return c;
          pairs.push({ r, test: criteria(c) });
        }
        const shape = target ?? pairs[0].r;
        const h = shape.cells.length;
        const w = shape.cells[0]?.length ?? 0;
        for (const p of pairs)
          if (p.r.cells.length !== h || (p.r.cells[0]?.length ?? 0) !== w)
            return err("#VALUE!", `${name} 함수의 범위들은 크기가 같아야 합니다. ${rangeLabel(shape.ref)}와 ${rangeLabel(p.r.ref)}의 크기가 다릅니다.`);
        let count = 0;
        let sum = 0;
        let nums = 0;
        for (let i = 0; i < h; i++)
          for (let j = 0; j < w; j++) {
            if (!pairs.every((p) => p.test(p.r.cells[i][j]))) continue;
            count++;
            const t = target?.cells[i][j];
            if (typeof t === "number") {
              sum += t;
              nums++;
            }
          }
        if (name === "COUNTIFS") return count;
        if (name === "SUMIFS") return sum;
        return nums === 0 ? err("#DIV/0!", "조건에 맞는 숫자가 하나도 없어 평균을 낼 수 없습니다.") : sum / nums;
      }
      case "IF": {
        const c = this.bool(this.scalar(this.eval(args[0])));
        if (isErr(c)) return c;
        if (c) return args.length > 1 ? this.eval(args[1]) : true;
        return args.length > 2 ? this.eval(args[2]) : false;
      }
      case "IFS": {
        if (args.length % 2 !== 0) return err("수식 오류", "IFS 함수는 ‘조건, 값’을 짝으로 적어야 합니다.");
        for (let i = 0; i < args.length; i += 2) {
          const c = this.bool(this.scalar(this.eval(args[i])));
          if (isErr(c)) return c;
          if (c) return this.eval(args[i + 1]);
        }
        return err("#N/A", "IFS의 조건이 하나도 맞지 않았습니다. 마지막 조건에 TRUE를 넣으면 ‘그 밖의 경우’가 됩니다.");
      }
      case "AND":
      case "OR": {
        const vals: boolean[] = [];
        for (const { v, fromRange } of this.flat(args)) {
          if (isErr(v)) return v;
          if (fromRange) {
            if (typeof v === "boolean") vals.push(v);
            else if (typeof v === "number") vals.push(v !== 0);
            continue;
          }
          const b = this.bool(v);
          if (isErr(b)) return b;
          vals.push(b);
        }
        if (vals.length === 0) return err("#VALUE!", `${name}에 참/거짓으로 볼 값이 없습니다.`);
        return name === "AND" ? vals.every(Boolean) : vals.some(Boolean);
      }
      case "NOT": {
        const b = this.bool(this.scalar(this.eval(args[0])));
        return isErr(b) ? b : !b;
      }
      case "IFERROR":
      case "IFNA": {
        const v = this.scalar(this.eval(args[0]));
        if (isErr(v) && (name === "IFERROR" || v.code === "#N/A") && v.code !== "수식 오류") return this.eval(args[1]);
        return v;
      }
      case "VLOOKUP":
      case "HLOOKUP":
        return this.lookup(name, args);
      case "MATCH": {
        const look = this.scalar(this.eval(args[0]));
        if (isErr(look)) return look;
        const r = this.rangeArg(name, this.eval(args[1]), "둘째 인수(찾을 범위)");
        if (isErr(r)) return r;
        if (r.cells.length > 1 && r.cells[0].length > 1) return err("#N/A", "MATCH의 찾을 범위는 한 열이나 한 행이어야 합니다.");
        const list = r.cells.length > 1 ? r.cells.map((row) => row[0]) : r.cells[0];
        const type = args.length > 2 ? this.num(this.scalar(this.eval(args[2]))) : 1;
        if (isErr(type)) return type;
        const idx = type === 0 ? exactIndex(list, look) : type > 0 ? approxIndex(list, look) : approxIndexDesc(list, look);
        if (idx < 0) return err("#N/A", `찾는 값 ${quote(look)}을(를) 범위 ${rangeLabel(r.ref)}에서 찾지 못했습니다.`);
        return idx + 1;
      }
      case "INDEX": {
        const r = this.rangeArg(name, this.eval(args[0]), "첫 인수(범위)");
        if (isErr(r)) return r;
        const a = this.num(this.scalar(this.eval(args[1])));
        if (isErr(a)) return a;
        const b = args.length > 2 && args[2].k !== "missing" ? this.num(this.scalar(this.eval(args[2]))) : null;
        if (isErr(b)) return b;
        const h = r.cells.length;
        const w = r.cells[0]?.length ?? 0;
        let row = Math.trunc(a);
        let col = b === null ? 1 : Math.trunc(b);
        // 한 행짜리 범위에 번호 하나만 주면 그 번호는 열 번호
        if (b === null && h === 1 && w > 1) {
          col = row;
          row = 1;
        }
        if (row < 1 || col < 1) return err("#VALUE!", "INDEX의 행·열 번호는 1 이상이어야 합니다(0으로 행 전체를 가져오는 방법은 이 연습장에서 지원하지 않음).");
        if (row > h || col > w) return err("#REF!", `범위 ${rangeLabel(r.ref)}는 ${h}행 ${w}열인데 ${row}행 ${col}열을 찾았습니다.`);
        return r.cells[row - 1][col - 1];
      }
      case "XLOOKUP": {
        const look = this.scalar(this.eval(args[0]));
        if (isErr(look)) return look;
        const lr = this.rangeArg(name, this.eval(args[1]), "둘째 인수(찾을 범위)");
        if (isErr(lr)) return lr;
        const rr = this.rangeArg(name, this.eval(args[2]), "셋째 인수(가져올 범위)");
        if (isErr(rr)) return rr;
        const vertical = lr.cells.length > 1 || lr.cells[0].length === 1;
        const list = vertical ? lr.cells.map((row) => row[0]) : lr.cells[0];
        const mode = args.length > 4 && args[4].k !== "missing" ? this.num(this.scalar(this.eval(args[4]))) : 0;
        if (isErr(mode)) return mode;
        let idx = exactIndex(list, look, mode === 2);
        if (idx < 0 && mode === -1) idx = approxIndexUnsorted(list, look, -1);
        if (idx < 0 && mode === 1) idx = approxIndexUnsorted(list, look, 1);
        if (idx < 0) {
          if (args.length > 3 && args[3].k !== "missing") return this.eval(args[3]);
          return err("#N/A", `찾는 값 ${quote(look)}을(를) 범위 ${rangeLabel(lr.ref)}에서 찾지 못했습니다.`);
        }
        const out = vertical ? rr.cells[idx] : rr.cells.map((row) => row[idx]);
        if (!out || out.length !== 1) return err("#VALUE!", "가져올 범위는 한 열(또는 한 행)로 적어 주세요. 여러 열을 한꺼번에 가져오는 방법은 이 연습장에서 지원하지 않습니다.");
        return out[0];
      }
      case "ROUND":
      case "ROUNDUP":
      case "ROUNDDOWN": {
        const x = this.num(this.scalar(this.eval(args[0])));
        if (isErr(x)) return x;
        const d = this.num(this.scalar(this.eval(args[1])));
        if (isErr(d)) return d;
        return roundTo(x, Math.trunc(d), name);
      }
      case "ABS":
      case "INT": {
        const x = this.num(this.scalar(this.eval(args[0])));
        if (isErr(x)) return x;
        return name === "ABS" ? Math.abs(x) : Math.floor(x);
      }
      case "MOD": {
        const x = this.num(this.scalar(this.eval(args[0])));
        if (isErr(x)) return x;
        const y = this.num(this.scalar(this.eval(args[1])));
        if (isErr(y)) return y;
        if (y === 0) return err("#DIV/0!", "0으로 나눈 나머지는 구할 수 없습니다.");
        return x - y * Math.floor(x / y);
      }
      case "LEN":
      case "TRIM":
      case "UPPER":
      case "LOWER": {
        const s = this.text(this.scalar(this.eval(args[0])));
        if (isErr(s)) return s;
        if (name === "LEN") return [...s].length;
        if (name === "TRIM") return s.trim().replace(/ +/g, " ");
        return name === "UPPER" ? s.toUpperCase() : s.toLowerCase();
      }
      case "LEFT":
      case "RIGHT": {
        const s = this.text(this.scalar(this.eval(args[0])));
        if (isErr(s)) return s;
        const n = args.length > 1 ? this.num(this.scalar(this.eval(args[1]))) : 1;
        if (isErr(n)) return n;
        if (n < 0) return err("#VALUE!", "가져올 글자 수는 0 이상이어야 합니다.");
        const chars = [...s];
        const k = Math.trunc(n);
        return name === "LEFT" ? chars.slice(0, k).join("") : chars.slice(Math.max(0, chars.length - k)).join("");
      }
      case "MID": {
        const s = this.text(this.scalar(this.eval(args[0])));
        if (isErr(s)) return s;
        const a = this.num(this.scalar(this.eval(args[1])));
        if (isErr(a)) return a;
        const n = this.num(this.scalar(this.eval(args[2])));
        if (isErr(n)) return n;
        if (a < 1 || n < 0) return err("#VALUE!", "MID의 시작 위치는 1 이상, 글자 수는 0 이상이어야 합니다.");
        return [...s].slice(Math.trunc(a) - 1, Math.trunc(a) - 1 + Math.trunc(n)).join("");
      }
      case "CONCAT":
      case "CONCATENATE": {
        let s = "";
        for (const { v } of this.flat(args)) {
          if (isErr(v)) return v;
          s += formatScalar(v);
        }
        return s;
      }
      default:
        return err("#NAME?", `${name}은(는) 이 연습장에서 지원하지 않는 함수입니다.`);
    }
  }

  private lookup(name: "VLOOKUP" | "HLOOKUP", args: Node[]): Value {
    const look = this.scalar(this.eval(args[0]));
    if (isErr(look)) return look;
    const table = this.rangeArg(name, this.eval(args[1]), "둘째 인수(표 범위)");
    if (isErr(table)) return table;
    const idx = this.num(this.scalar(this.eval(args[2])));
    if (isErr(idx)) return idx;
    let approx = true;
    if (args.length > 3) {
      const b = this.bool(this.scalar(this.eval(args[3])));
      if (isErr(b)) return b;
      approx = b;
    }
    const vertical = name === "VLOOKUP";
    const h = table.cells.length;
    const w = table.cells[0]?.length ?? 0;
    const n = Math.trunc(idx);
    const span = vertical ? w : h;
    if (n < 1) return err("#VALUE!", `${vertical ? "열" : "행"} 번호는 1 이상이어야 합니다.`);
    if (n > span)
      return err(
        "#REF!",
        `${vertical ? "열" : "행"} 번호 ${n}이(가) 표 범위 ${rangeLabel(table.ref)}의 ${vertical ? "열" : "행"} 수(${span})보다 큽니다. 범위를 가져올 ${vertical ? "열" : "행"}까지 넓히세요.`,
      );
    const keys = vertical ? table.cells.map((row) => row[0]) : table.cells[0];
    const pos = approx ? approxIndex(keys, look) : exactIndex(keys, look, true);
    if (pos < 0) {
      const where = `${vertical ? "첫 열" : "첫 행"}(${rangeLabel(vertical ? { ...table.ref, c2: table.ref.c1 } : { ...table.ref, r2: table.ref.r1 })})`;
      const textNumber =
        typeof look === "number" && keys.some((k) => typeof k === "string" && parseNumber(k) === look)
          ? " 표에는 같은 숫자가 글자 형식으로 들어 있습니다(숫자와 글자는 다른 값)."
          : typeof look === "string" && parseNumber(look) !== null && keys.some((k) => k === parseNumber(look))
            ? ` 찾는 값이 글자 형식("${look}")이고 표에는 숫자로 들어 있습니다. 따옴표를 빼거나 형식을 맞추세요.`
            : "";
      return err(
        "#N/A",
        approx
          ? `찾는 값 ${quote(look)}보다 작거나 같은 값이 ${where}에 없습니다. 정확히 같은 값을 찾으려면 마지막 인수를 FALSE로 적으세요.`
          : `찾는 값 ${quote(look)}이(가) ${where}에 없습니다. 철자·띄어쓰기, 찾는 값이 표의 첫 열에 있는지 확인하세요.${textNumber}`,
      );
    }
    return vertical ? table.cells[pos][n - 1] : table.cells[n - 1][pos];
  }
}

/** 함수별 인수 개수 [최소, 최대] */
const FUNCTIONS: Record<string, [number, number]> = {
  SUM: [1, 255],
  AVERAGE: [1, 255],
  MIN: [1, 255],
  MAX: [1, 255],
  COUNT: [1, 255],
  COUNTA: [1, 255],
  COUNTBLANK: [1, 1],
  COUNTIF: [2, 2],
  SUMIF: [2, 3],
  AVERAGEIF: [2, 3],
  COUNTIFS: [2, 254],
  SUMIFS: [3, 255],
  AVERAGEIFS: [3, 255],
  IF: [2, 3],
  IFS: [2, 254],
  AND: [1, 255],
  OR: [1, 255],
  NOT: [1, 1],
  IFERROR: [2, 2],
  IFNA: [2, 2],
  VLOOKUP: [3, 4],
  HLOOKUP: [3, 4],
  MATCH: [2, 3],
  INDEX: [2, 3],
  XLOOKUP: [3, 5],
  ROUND: [2, 2],
  ROUNDUP: [2, 2],
  ROUNDDOWN: [2, 2],
  ABS: [1, 1],
  INT: [1, 1],
  MOD: [2, 2],
  LEN: [1, 1],
  TRIM: [1, 1],
  UPPER: [1, 1],
  LOWER: [1, 1],
  LEFT: [1, 2],
  RIGHT: [1, 2],
  MID: [3, 3],
  CONCAT: [1, 255],
  CONCATENATE: [1, 255],
};

/** 이 연습장에서 쓸 수 있는 함수 이름 */
export const SUPPORTED_FUNCTIONS = Object.keys(FUNCTIONS);

function roundTo(x: number, d: number, mode: string): number {
  const f = Math.pow(10, d);
  const v = Math.abs(x) * f;
  // 부동소수점 오차(1.005*100 = 100.49999…) 보정
  const fixed = Number(v.toPrecision(15));
  let r: number;
  if (mode === "ROUNDUP") r = Math.ceil(fixed);
  else if (mode === "ROUNDDOWN") r = Math.floor(fixed);
  else r = Math.floor(fixed + 0.5);
  return (Math.sign(x) * r) / f;
}

/** 엑셀 비교 규칙: 숫자 < 글자 < TRUE/FALSE, 글자는 대소문자 구분 없음. 빈칸은 상대 형식의 빈 값 */
export function compareScalars(a: Scalar, b: Scalar): number {
  if (a === null) a = typeof b === "string" ? "" : typeof b === "boolean" ? false : 0;
  if (b === null) b = typeof a === "string" ? "" : typeof a === "boolean" ? false : 0;
  const rank = (v: Scalar) => (typeof v === "number" ? 0 : typeof v === "string" ? 1 : 2);
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;
  if (typeof a === "number" && typeof b === "number") return a === b ? 0 : a < b ? -1 : 1;
  if (typeof a === "boolean" && typeof b === "boolean") return a === b ? 0 : a ? 1 : -1;
  const x = String(a).toLowerCase();
  const y = String(b).toLowerCase();
  return x === y ? 0 : x < y ? -1 : 1;
}

function wildcardRegex(pattern: string): RegExp {
  let re = "";
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === "~" && i + 1 < pattern.length && "*?~".includes(pattern[i + 1])) {
      re += "\\" + pattern[++i];
    } else if (ch === "*") re += "[\\s\\S]*";
    else if (ch === "?") re += "[\\s\\S]";
    else re += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`, "iu");
}

/** 정확히 같은 값의 위치(글자는 대소문자 무시, wildcard면 * ? 허용) */
function exactIndex(list: Scalar[], look: Scalar, wildcard = false): number {
  if (typeof look === "string" && wildcard && /[*?]/.test(look)) {
    const re = wildcardRegex(look);
    return list.findIndex((v) => typeof v === "string" && re.test(v));
  }
  if (look === null) return list.findIndex((v) => v === null || v === "");
  return list.findIndex((v) => v !== null && typeof v === typeof look && compareScalars(v, look) === 0);
}

/** 오름차순 목록에서 찾는 값보다 작거나 같은 마지막 값의 위치(VLOOKUP TRUE, MATCH 1) */
function approxIndex(list: Scalar[], look: Scalar): number {
  let found = -1;
  for (let i = 0; i < list.length; i++) {
    const v = list[i];
    if (v === null || typeof v !== typeof look) continue;
    if (compareScalars(v, look) <= 0) found = i;
    else break;
  }
  return found;
}

/** 내림차순 목록에서 찾는 값보다 크거나 같은 마지막 값(MATCH -1) */
function approxIndexDesc(list: Scalar[], look: Scalar): number {
  let found = -1;
  for (let i = 0; i < list.length; i++) {
    const v = list[i];
    if (v === null || typeof v !== typeof look) continue;
    if (compareScalars(v, look) >= 0) found = i;
    else break;
  }
  return found;
}

/** XLOOKUP 일치 모드 -1(바로 작은 값)·1(바로 큰 값) — 정렬과 상관없이 */
function approxIndexUnsorted(list: Scalar[], look: Scalar, dir: -1 | 1): number {
  let best = -1;
  for (let i = 0; i < list.length; i++) {
    const v = list[i];
    if (v === null || typeof v !== typeof look) continue;
    const c = compareScalars(v, look);
    if (dir === -1 ? c > 0 : c < 0) continue;
    if (best < 0 || (dir === -1 ? compareScalars(v, list[best]) > 0 : compareScalars(v, list[best]) < 0)) best = i;
  }
  return best;
}

/** COUNTIF·SUMIF 조건(">=100", "영업*", "<>", 100 …)을 칸 검사 함수로 */
export function criteria(c: Scalar): (v: Scalar) => boolean {
  if (typeof c === "number") return (v) => v === c || (typeof v === "string" && parseNumber(v) === c);
  if (typeof c === "boolean") return (v) => v === c;
  const s = c ?? "";
  const m = /^(<>|<=|>=|=|<|>)?([\s\S]*)$/.exec(s)!;
  const op = m[1] ?? "";
  const rest = m[2];
  const n = parseNumber(rest);
  const isEmpty = (v: Scalar) => v === null || v === "";

  if (n !== null) {
    const eq = (v: Scalar) => v === n || (typeof v === "string" && parseNumber(v) === n);
    switch (op) {
      case "":
      case "=":
        return eq;
      case "<>":
        return (v) => !eq(v);
      default:
        return (v) => typeof v === "number" && cmpOp(compareScalars(v, n), op);
    }
  }
  const up = rest.toUpperCase();
  if (up === "TRUE" || up === "FALSE") {
    const b = up === "TRUE";
    if (op === "" || op === "=") return (v) => v === b;
    if (op === "<>") return (v) => v !== b;
    return (v) => typeof v === "boolean" && cmpOp(compareScalars(v, b), op);
  }
  if (rest === "") {
    if (op === "<>") return (v) => !isEmpty(v);
    if (op === "" || op === "=") return isEmpty;
    return () => false;
  }
  const re = wildcardRegex(rest);
  const match = (v: Scalar) => typeof v === "string" && re.test(v);
  switch (op) {
    case "":
    case "=":
      return match;
    case "<>":
      return (v) => !match(v);
    default:
      return (v) => typeof v === "string" && cmpOp(compareScalars(v, rest), op);
  }
}

function cmpOp(c: number, op: string): boolean {
  switch (op) {
    case "<":
      return c < 0;
    case ">":
      return c > 0;
    case "<=":
      return c <= 0;
    default:
      return c >= 0;
  }
}

/** 붙여넣은 수식에 섞인 둥근 따옴표·전각 기호를 엑셀에서 쓰는 기호로 */
export function normalizeFormula(src: string): string {
  return src
    .replace(/[“”„‟″〃＂]/g, '"')
    .replace(/[＝]/g, "=")
    .replace(/[，]/g, ",")
    .replace(/[（]/g, "(")
    .replace(/[）]/g, ")")
    .replace(/[＜]/g, "<")
    .replace(/[＞]/g, ">")
    .replace(/[：]/g, ":");
}

/**
 * 수식(=로 시작)을 시트에서 계산한다. =가 없으면 입력값 그대로(엑셀이 글자로 받아들이듯).
 * refs: 수식이 가리키는 범위(화면에서 칸 강조용), functions: 쓴 함수 이름(대문자)
 */
export function evaluateFormula(input: string, rows: string[][]): FormulaResult {
  const src = normalizeFormula(input).trim();
  if (!src.startsWith("=")) {
    const v = parseCellValue(src);
    return { ok: true, value: v, display: formatScalar(v), refs: [], functions: [] };
  }
  let tree: Node;
  let parser: Parser;
  try {
    parser = new Parser(tokenize(src.slice(1)));
    tree = parser.parseAll();
  } catch (e) {
    if (e instanceof FormulaSyntaxError) return { ok: false, code: "수식 오류", message: e.message, refs: [], functions: [] };
    throw e;
  }
  const refs = parser.refs;
  const functions = [...parser.functions];
  const ev = new Evaluator(rows);
  const raw = ev.scalar(ev.eval(tree));
  if (isErr(raw)) return { ok: false, code: raw.code, message: raw.detail, refs, functions };
  // 엑셀은 빈칸을 가리키는 수식(=A10, 빈칸을 찾은 VLOOKUP)을 0으로 보여 준다
  const v = raw === null ? 0 : raw;
  return { ok: true, value: v, display: formatScalar(v), refs, functions };
}

/** 연습 문제 채점용 — 두 결과가 같은 값인지(숫자는 작은 오차 허용, 글자는 대소문자·앞뒤 공백 무시) */
export function sameResult(a: FormulaResult, b: FormulaResult): boolean {
  if (!a.ok || !b.ok) return !a.ok && !b.ok && a.code === b.code;
  const x = a.value;
  const y = b.value;
  if (typeof x === "number" && typeof y === "number") return Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(x), Math.abs(y));
  if (x === null || y === null) return (x ?? "") === (y ?? "") || formatScalar(x) === formatScalar(y);
  if (typeof x === "string" && typeof y === "string") return x.trim().toLowerCase() === y.trim().toLowerCase();
  return x === y;
}

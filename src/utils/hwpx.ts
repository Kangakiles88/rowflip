/**
 * 한글 HWPX 양식 채우기 — 사용자가 올린 양식 안의 품목 표를 찾아 머리글(품목·규격·수량·단가…)에 맞춰
 * 아래 줄을 채우고, 본문의 {{자리 표시}}를 값으로 바꾼다. 모두 브라우저 안에서 처리한다.
 *
 * HWPX = XML 파일 여러 개를 zip으로 묶은 한글 문서 형식(OWPML). 본문은 Contents/section0.xml …에 있고
 * 표는 hp:tbl > hp:tr > hp:tc(칸) > hp:subList > hp:p(문단) > hp:run > hp:t(글자) 구조다.
 * 칸 위치는 hp:cellAddr(colAddr·rowAddr), 병합은 hp:cellSpan(colSpan·rowSpan)으로 적혀 있다.
 */
import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from "fflate";

export const HP = "http://www.hancom.co.kr/hwpml/2011/paragraph";

/** 표 칸에 넣을 수 있는 값 */
export type ItemField = "" | "no" | "name" | "spec" | "nameSpec" | "qty" | "price" | "supply" | "tax" | "total" | "note";

export const ITEM_FIELDS: { value: ItemField; label: string }[] = [
  { value: "", label: "비움" },
  { value: "no", label: "번호" },
  { value: "name", label: "품목" },
  { value: "spec", label: "규격" },
  { value: "nameSpec", label: "품목 + 규격" },
  { value: "qty", label: "수량" },
  { value: "price", label: "단가" },
  { value: "supply", label: "공급가액" },
  { value: "tax", label: "세액" },
  { value: "total", label: "합계(공급가액+세액)" },
  { value: "note", label: "비고" },
];

const squash = (s: string) => s.replace(/[\s·.()[\]/]/g, "");

/** 머리글 글자 → 칸 값. 모르는 머리글은 '' */
export function guessField(header: string): ItemField {
  const h = squash(header).toLowerCase();
  if (!h) return "";
  if (/^(no|번호|순번|연번)$/.test(h)) return "no";
  if (/(품목|품명|내역|항목|제품명?|상품명?)/.test(h) && /규격/.test(h)) return "nameSpec";
  if (/(품목|품명|내역|항목|제품명?|상품명?|명칭)/.test(h)) return "name";
  if (/(규격|사양)/.test(h)) return "spec";
  if (/(수량|qty)/.test(h)) return "qty";
  if (/단가/.test(h)) return "price";
  if (/(세액|부가세)/.test(h)) return "tax";
  if (/(합계|총액|합계금액)/.test(h)) return "total";
  if (/(공급가액|공급가|금액)/.test(h)) return "supply";
  if (/(비고|참고|메모)/.test(h)) return "note";
  return "";
}

/** 표 아래쪽 '합계' 줄인지 */
const TOTAL_ROW = /^(합계|총계|계|소계|합계금액|총합계)$/;

/* ---------- XML 다루기 ---------- */

function kids(el: Element, local: string): Element[] {
  return Array.from(el.children).filter((c) => c.namespaceURI === HP && c.localName === local);
}
function kid(el: Element, local: string): Element | undefined {
  return kids(el, local)[0];
}

/** 칸 안 글자(중첩 표는 빼고) */
export function cellText(tc: Element): string {
  const sub = kid(tc, "subList");
  if (!sub) return "";
  return kids(sub, "p")
    .map((p) =>
      kids(p, "run")
        .map((r) => kids(r, "t").map((t) => t.textContent ?? "").join(""))
        .join(""),
    )
    .join("\n")
    .trim();
}

function addr(tc: Element): { col: number; row: number; colSpan: number; rowSpan: number } {
  const a = kid(tc, "cellAddr");
  const s = kid(tc, "cellSpan");
  return {
    col: Number(a?.getAttribute("colAddr") ?? 0),
    row: Number(a?.getAttribute("rowAddr") ?? 0),
    colSpan: Number(s?.getAttribute("colSpan") ?? 1),
    rowSpan: Number(s?.getAttribute("rowSpan") ?? 1),
  };
}

/** 칸 글자를 바꾼다. 첫 문단·첫 run의 글자 모양을 살리고 나머지 문단은 지운다 */
export function setCellText(tc: Element, text: string): void {
  const doc = tc.ownerDocument;
  const sub = kid(tc, "subList");
  if (!sub) return;
  const paras = kids(sub, "p");
  let p = paras[0];
  if (!p) {
    p = doc.createElementNS(HP, "hp:p");
    p.setAttribute("paraPrIDRef", "0");
    p.setAttribute("styleIDRef", "0");
    sub.appendChild(p);
  }
  for (const extra of paras.slice(1)) sub.removeChild(extra);
  // 줄 배치 정보는 글자가 바뀌면 맞지 않으므로 지운다(한글이 열 때 다시 계산)
  for (const ls of kids(p, "linesegarray")) p.removeChild(ls);
  const runs = kids(p, "run");
  let run = runs.find((r) => kid(r, "t")) ?? runs[0];
  if (!run) {
    run = doc.createElementNS(HP, "hp:run");
    run.setAttribute("charPrIDRef", "0");
    p.appendChild(run);
  }
  for (const r of runs) if (r !== run) p.removeChild(r);
  for (const t of kids(run, "t")) run.removeChild(t);
  if (text) {
    const t = doc.createElementNS(HP, "hp:t");
    t.textContent = text;
    run.appendChild(t);
  }
}

/* ---------- 품목 표 찾기 ---------- */

export interface TableColumn {
  col: number;
  colSpan: number;
  header: string;
  field: ItemField;
}

export interface ItemTable {
  /** 문서 안 표 번호(0부터, 본문 순서) */
  index: number;
  section: string;
  table: Element;
  headerRow: number;
  columns: TableColumn[];
  /** 채울 줄(머리글 아래 ~ 합계 줄 앞) */
  dataRows: Element[];
  totalRow: Element | null;
}

function rowsOf(tbl: Element): Element[] {
  return kids(tbl, "tr");
}

/** 표 하나에서 품목 머리글 줄을 찾는다. 못 찾으면 null */
export function analyzeTable(tbl: Element, index = 0, section = ""): ItemTable | null {
  const rows = rowsOf(tbl);
  let best: { row: number; columns: TableColumn[]; score: number } | null = null;
  // 견적서 전체가 표 하나인 양식은 머리글이 한참 아래에 있으므로 모든 줄을 본다
  for (const [ri, tr] of rows.entries()) {
    const columns: TableColumn[] = kids(tr, "tc").map((tc) => {
      const a = addr(tc);
      const header = cellText(tc);
      return { col: a.col, colSpan: a.colSpan, header, field: guessField(header) };
    });
    const fields = new Set(columns.map((c) => c.field).filter(Boolean));
    const hasItem = fields.has("name") || fields.has("nameSpec");
    // 품목 칸 + 수량·단가·금액 중 하나 이상이 있어야 품목 표로 본다
    const numeric = (["qty", "price", "supply", "tax", "total"] as const).some((f) => fields.has(f));
    const score = fields.size + (hasItem ? 1 : 0);
    if (hasItem && numeric && (!best || score > best.score)) best = { row: ri, columns, score };
  }
  if (!best) return null;
  const { row: headerRow, columns } = best;
  // 같은 값이 두 칸에 잡히면 뒤쪽은 비운다(예: '금액' 두 개)
  const seen = new Set<ItemField>();
  for (const c of columns) {
    if (!c.field) continue;
    if (seen.has(c.field)) c.field = "";
    else seen.add(c.field);
  }
  const dataRows: Element[] = [];
  let totalRow: Element | null = null;
  // 품목 줄은 머리글과 칸 나눔이 같다(연결된 칸의 시작 위치가 절반 이상 그대로).
  // 다른 모양 줄(특기사항·계좌 안내 등)이 나오면 거기서 멈춘다
  const starts = columns.filter((c) => c.field).map((c) => c.col);
  const sameShape = (tr: Element) => {
    const own = new Set(kids(tr, "tc").map((tc) => addr(tc).col));
    return starts.filter((c) => own.has(c)).length * 2 >= starts.length;
  };
  for (const tr of rows.slice(headerRow + 1)) {
    const texts = kids(tr, "tc").map((tc) => squash(cellText(tc)));
    if (texts.some((t) => TOTAL_ROW.test(t))) {
      totalRow = tr;
      break;
    }
    if (!sameShape(tr)) break;
    dataRows.push(tr);
  }
  return { index, section, table: tbl, headerRow, columns, dataRows, totalRow };
}

/* ---------- 값 만들기 ---------- */

export interface FillLine {
  name: string;
  spec: string;
  qty: string;
  price: string;
  supply: string;
  tax: string;
  total: string;
  note: string;
}

function valueFor(field: ItemField, line: FillLine, i: number): string {
  switch (field) {
    case "no":
      return String(i + 1);
    case "nameSpec":
      return [line.name, line.spec].filter(Boolean).join(" ");
    case "":
      return "";
    default:
      return line[field];
  }
}

function cellAt(tr: Element, col: number): Element | undefined {
  return kids(tr, "tc").find((tc) => {
    const a = addr(tc);
    return col >= a.col && col < a.col + a.colSpan;
  });
}

/** 줄을 복제해 바로 아래에 넣고, 아래 줄들의 rowAddr를 하나씩 민다 */
function cloneRowAfter(tbl: Element, tr: Element): Element {
  const copy = tr.cloneNode(true) as Element;
  tr.parentNode!.insertBefore(copy, tr.nextSibling);
  const rows = rowsOf(tbl);
  const at = rows.indexOf(copy);
  for (const r of rows.slice(at)) {
    for (const tc of kids(r, "tc")) {
      const a = kid(tc, "cellAddr");
      if (a) a.setAttribute("rowAddr", String(Number(a.getAttribute("rowAddr") ?? 0) + 1));
    }
  }
  tbl.setAttribute("rowCnt", String(Number(tbl.getAttribute("rowCnt") ?? rows.length - 1) + 1));
  return copy;
}

export interface FillResult {
  filled: number;
  addedRows: number;
}

/**
 * 품목을 표에 채운다. 빈 줄이 모자라면 마지막 줄을 복제해 늘리고,
 * 남는 줄은 연결된 칸만 비운다. 합계 줄이 있으면 금액 칸에 합계를 넣는다.
 */
export function fillItemTable(t: ItemTable, lines: FillLine[], totals?: Partial<FillLine>): FillResult {
  const rows = [...t.dataRows];
  let addedRows = 0;
  if (rows.length === 0 && lines.length > 0) {
    // 머리글 바로 아래 줄이 없으면 머리글을 복제해 첫 줄로 쓴다
    const header = rowsOf(t.table)[t.headerRow];
    rows.push(cloneRowAfter(t.table, header));
    addedRows++;
  }
  while (rows.length < lines.length) {
    rows.push(cloneRowAfter(t.table, rows[rows.length - 1]));
    addedRows++;
  }
  rows.forEach((tr, i) => {
    const line = lines[i];
    for (const c of t.columns) {
      if (!c.field) continue;
      const tc = cellAt(tr, c.col);
      if (tc) setCellText(tc, line ? valueFor(c.field, line, i) : "");
    }
  });
  if (t.totalRow && totals) {
    for (const c of t.columns) {
      if (c.field !== "supply" && c.field !== "tax" && c.field !== "total") continue;
      const v = totals[c.field];
      const tc = cellAt(t.totalRow, c.col);
      // 합계 글자가 들어 있는 칸은 건드리지 않는다
      if (v !== undefined && tc && !TOTAL_ROW.test(squash(cellText(tc)))) setCellText(tc, v);
    }
  }
  return { filled: Math.min(lines.length, rows.length), addedRows };
}

/* ---------- {{자리 표시}} ---------- */

const TOKEN = /\{\{\s*([^{}]+?)\s*\}\}/g;

/** 문서의 {{이름}}을 값으로 바꾼다. 바꾼 이름과 값이 없는 이름을 돌려준다 */
export function replaceTokens(doc: Document, values: Record<string, string>): { used: string[]; unknown: string[] } {
  const used = new Set<string>();
  const unknown = new Set<string>();
  for (const t of Array.from(doc.getElementsByTagNameNS(HP, "t"))) {
    const s = t.textContent ?? "";
    if (!s.includes("{{")) continue;
    const next = s.replace(TOKEN, (all, name: string) => {
      const key = name.replace(/\s/g, "");
      if (key in values) {
        used.add(key);
        return values[key];
      }
      unknown.add(key);
      return all;
    });
    if (next !== s) {
      t.textContent = next;
      const p = t.parentElement?.parentElement;
      if (p) for (const ls of kids(p, "linesegarray")) p.removeChild(ls);
    }
  }
  return { used: [...used], unknown: [...unknown] };
}

/** 문서에 들어 있는 {{이름}} 목록(한 hp:t 안에 온전히 있는 것만) */
export function listTokens(doc: Document): string[] {
  const out = new Set<string>();
  for (const t of Array.from(doc.getElementsByTagNameNS(HP, "t"))) {
    for (const m of (t.textContent ?? "").matchAll(TOKEN)) out.add(m[1].replace(/\s/g, ""));
  }
  return [...out];
}

/* ---------- 파일 열기·저장 ---------- */

export interface HwpxFile {
  entries: Record<string, Uint8Array>;
  /** 본문 파일 이름(Contents/section0.xml …) */
  sections: string[];
}

export class HwpxError extends Error {}

export function openHwpx(bytes: Uint8Array): HwpxFile {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(bytes);
  } catch {
    // 예전 HWP(바이너리)는 zip이 아니다
    throw new HwpxError("HWPX 파일이 아닙니다. 한글에서 ‘다른 이름으로 저장 → HWPX’로 저장한 파일을 올려 주세요.");
  }
  const sections = Object.keys(entries)
    .filter((n) => /^Contents\/section\d+\.xml$/i.test(n))
    .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));
  if (sections.length === 0) throw new HwpxError("한글 문서 본문을 찾지 못했습니다. HWPX 파일인지 확인해 주세요.");
  return { entries, sections };
}

export function parseXml(xml: string): Document {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new HwpxError("문서 내용을 읽지 못했습니다.");
  return doc;
}

export function serializeXml(doc: Document, original: string): string {
  let out = new XMLSerializer().serializeToString(doc);
  const decl = original.match(/^\s*<\?xml[^>]*\?>/)?.[0];
  if (decl && !out.startsWith("<?xml")) out = decl.trim() + out;
  return out;
}

export function readSections(file: HwpxFile): { name: string; xml: string; doc: Document }[] {
  return file.sections.map((name) => {
    const xml = strFromU8(file.entries[name]);
    return { name, xml, doc: parseXml(xml) };
  });
}

/** 본문 순서대로 품목 표 후보를 모은다(중첩 표 포함) */
export function findItemTables(sections: { name: string; doc: Document }[]): ItemTable[] {
  const out: ItemTable[] = [];
  let index = 0;
  for (const s of sections) {
    for (const tbl of Array.from(s.doc.getElementsByTagNameNS(HP, "tbl"))) {
      const t = analyzeTable(tbl, index, s.name);
      if (t) out.push(t);
      index++;
    }
  }
  return out;
}

/** 바꾼 본문을 넣어 다시 묶는다. mimetype은 맨 앞·무압축(한글이 형식을 알아보는 표시) */
export function packHwpx(file: HwpxFile, changed: Record<string, string>): Uint8Array {
  const z: Zippable = {};
  const names = Object.keys(file.entries);
  const ordered = names.includes("mimetype") ? ["mimetype", ...names.filter((n) => n !== "mimetype")] : names;
  for (const n of ordered) {
    const data = n in changed ? strToU8(changed[n]) : file.entries[n];
    z[n] = n === "mimetype" ? [data, { level: 0 }] : data;
  }
  return zipSync(z, { level: 6 });
}

/* ---------- 양식 살펴보기·채우기(화면에서 쓰는 묶음) ---------- */

export interface TemplateInfo {
  tables: { index: number; columns: { col: number; header: string; field: ItemField }[]; rows: number; hasTotal: boolean }[];
  tokens: string[];
}

/** 올린 양식에서 품목 표 후보와 {{자리 표시}}를 찾는다 */
export function inspectTemplate(bytes: Uint8Array): TemplateInfo {
  const sections = readSections(openHwpx(bytes));
  const tables = findItemTables(sections).map((t) => ({
    index: t.index,
    columns: t.columns.map(({ col, header, field }) => ({ col, header, field })),
    rows: t.dataRows.length,
    hasTotal: !!t.totalRow,
  }));
  const tokens = [...new Set(sections.flatMap((s) => listTokens(s.doc)))];
  return { tables, tokens };
}

export interface FillOptions {
  /** 채울 표(inspectTemplate의 index). 없으면 표는 채우지 않음 */
  tableIndex: number | null;
  /** 열 위치(col) → 넣을 값. 화면에서 고친 연결 */
  fields: Record<number, ItemField>;
  lines: FillLine[];
  totals?: Partial<FillLine>;
  tokens: Record<string, string>;
}

export interface FillReport extends FillResult {
  usedTokens: string[];
  unknownTokens: string[];
}

/** 양식을 채운 새 HWPX 파일을 만든다. 원본 바이트는 바꾸지 않는다 */
export function fillTemplate(bytes: Uint8Array, opt: FillOptions): { bytes: Uint8Array; report: FillReport } {
  const file = openHwpx(bytes);
  const sections = readSections(file);
  let result: FillResult = { filled: 0, addedRows: 0 };
  if (opt.tableIndex !== null) {
    const t = findItemTables(sections).find((x) => x.index === opt.tableIndex);
    if (t) {
      for (const c of t.columns) if (c.col in opt.fields) c.field = opt.fields[c.col];
      result = fillItemTable(t, opt.lines, opt.totals);
    }
  }
  const used = new Set<string>();
  const unknown = new Set<string>();
  const changed: Record<string, string> = {};
  for (const s of sections) {
    const r = replaceTokens(s.doc, opt.tokens);
    r.used.forEach((x) => used.add(x));
    r.unknown.forEach((x) => unknown.add(x));
    changed[s.name] = serializeXml(s.doc, s.xml);
  }
  return {
    bytes: packHwpx(file, changed),
    report: { ...result, usedTokens: [...used], unknownTokens: [...unknown] },
  };
}

/** 양식 표의 칸 순서대로 견적서 입력 칸 첫 줄(머리글, 탭 구분)을 만든다. 계산에 필요한 단가는 없으면 붙인다 */
export function inputHeaderFor(columns: { field: ItemField }[]): string {
  const label: Partial<Record<ItemField, string[]>> = {
    name: ["품목"],
    spec: ["규격"],
    nameSpec: ["품목", "규격"],
    qty: ["수량"],
    price: ["단가"],
    note: ["비고"],
  };
  const out: string[] = [];
  for (const c of columns) for (const l of label[c.field] ?? []) if (!out.includes(l)) out.push(l);
  if (!out.includes("품목")) out.unshift("품목");
  if (!out.includes("단가")) {
    const at = out.indexOf("비고");
    out.splice(at === -1 ? out.length : at, 0, "단가");
  }
  return out.join("\t");
}

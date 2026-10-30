// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import {
  cellText,
  fillTemplate,
  guessField,
  HP,
  HwpxError,
  inputHeaderFor,
  inspectTemplate,
  openHwpx,
  parseXml,
  type FillLine,
} from "./hwpx";

const fixture = (name: string) => new Uint8Array(readFileSync(join(__dirname, "fixtures", name)));

const LINES: FillLine[] = [
  { name: "사무용 의자", spec: "T-ZERO", qty: "4", price: "189,000", supply: "756,000", tax: "75,600", total: "831,600", note: "" },
  { name: "A4 복사용지", spec: "80g 2,500매", qty: "10", price: "27,500", supply: "275,000", tax: "27,500", total: "302,500", note: "" },
  { name: "모니터암", spec: "듀얼", qty: "2", price: "64,000", supply: "128,000", tax: "12,800", total: "140,800", note: "설치 포함" },
];

/** 결과 파일의 첫 표를 [줄][칸] 글자로 */
function tableGrid(bytes: Uint8Array): string[][] {
  const xml = strFromU8(unzipSync(bytes)["Contents/section0.xml"]);
  const doc = parseXml(xml);
  const tbl = doc.getElementsByTagNameNS(HP, "tbl")[0];
  return Array.from(tbl.children)
    .filter((e) => e.localName === "tr")
    .map((tr) => Array.from(tr.children).filter((e) => e.localName === "tc").map(cellText));
}

describe("guessField", () => {
  it("흔한 머리글", () => {
    expect(guessField("No.")).toBe("no");
    expect(guessField("품 명")).toBe("name");
    expect(guessField("품목 및 규격")).toBe("nameSpec");
    expect(guessField("규격")).toBe("spec");
    expect(guessField("수 량")).toBe("qty");
    expect(guessField("단가")).toBe("price");
    expect(guessField("금액")).toBe("supply");
    expect(guessField("공급가액")).toBe("supply");
    expect(guessField("세액")).toBe("tax");
    expect(guessField("합계금액")).toBe("total");
    expect(guessField("비고")).toBe("note");
    expect(guessField("담당")).toBe("");
  });
});

describe("inputHeaderFor", () => {
  it("양식 칸 순서대로, 금액·번호는 빼고", () => {
    const f = (...xs: string[]) => xs.map((field) => ({ field: field as never }));
    expect(inputHeaderFor(f("no", "name", "spec", "qty", "price", "supply", "note"))).toBe("품목\t규격\t수량\t단가\t비고");
    expect(inputHeaderFor(f("no", "nameSpec", "qty", "supply", "tax", "note"))).toBe("품목\t규격\t수량\t단가\t비고");
  });
});

describe("inspectTemplate", () => {
  it("품목 표와 자리 표시를 찾는다", () => {
    const info = inspectTemplate(fixture("estimate-basic.hwpx"));
    expect(info.tables).toHaveLength(1);
    const t = info.tables[0];
    expect(t.columns.map((c) => c.field)).toEqual(["no", "name", "spec", "qty", "price", "supply", "note"]);
    expect(t.rows).toBe(6);
    expect(t.hasTotal).toBe(true);
    expect(info.tokens.sort()).toEqual(["견적일", "받는곳", "합계", "합계금액"].sort());
  });

  it("병합된 머리글 칸도 열 위치로 맞춘다", () => {
    const t = inspectTemplate(fixture("estimate-merged.hwpx")).tables[0];
    expect(t.columns.map((c) => [c.col, c.field])).toEqual([
      [0, "no"],
      [1, "nameSpec"],
      [3, "qty"],
      [4, "price"],
      [5, "supply"],
      [6, "tax"],
      [7, "note"],
    ]);
    expect(t.rows).toBe(4);
  });

  it("견적서 전체가 표 하나: 아래쪽 머리글을 찾고 특기사항 줄 앞에서 멈춘다", () => {
    const t = inspectTemplate(fixture("estimate-onetable.hwpx")).tables[0];
    expect(t.columns.filter((c) => c.field).map((c) => c.field)).toEqual(["name", "spec", "qty", "price", "supply", "tax", "note"]);
    expect(t.rows).toBe(8);
    expect(t.hasTotal).toBe(false);
  });

  it("HWPX가 아니면 알림", () => {
    expect(() => openHwpx(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0]))).toThrow(HwpxError);
  });
});

describe("fillTemplate", () => {
  it("품목을 채우고 합계 줄·자리 표시를 바꾼다", () => {
    const { bytes, report } = fillTemplate(fixture("estimate-basic.hwpx"), {
      tableIndex: 0,
      fields: {},
      lines: LINES,
      totals: { supply: "1,159,000" },
      tokens: { 받는곳: "가온디자인", 견적일: "2026. 10. 30.", 합계금액: "일금 일백이십칠만사천구백원정", 합계: "1,274,900" },
    });
    expect(report.filled).toBe(3);
    expect(report.addedRows).toBe(0);
    expect(report.unknownTokens).toEqual([]);
    const g = tableGrid(bytes);
    expect(g[1]).toEqual(["1", "사무용 의자", "T-ZERO", "4", "189,000", "756,000", ""]);
    expect(g[3]).toEqual(["3", "모니터암", "듀얼", "2", "64,000", "128,000", "설치 포함"]);
    expect(g[4]).toEqual(["", "", "", "", "", "", ""]);
    expect(g[7][0]).toBe("합 계");
    expect(g[7][5]).toBe("1,159,000");
    const body = strFromU8(unzipSync(bytes)["Contents/section0.xml"]);
    expect(body).toContain("수신: 가온디자인 귀하");
    expect(body).not.toContain("{{");
    expect(body.startsWith("<?xml")).toBe(true);
  });

  it("줄이 모자라면 늘리고 rowAddr·rowCnt를 맞춘다", () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ ...LINES[0], name: `품목 ${i + 1}` }));
    const { bytes, report } = fillTemplate(fixture("estimate-basic.hwpx"), {
      tableIndex: 0,
      fields: {},
      lines: many,
      tokens: {},
    });
    expect(report.addedRows).toBe(3);
    const g = tableGrid(bytes);
    expect(g).toHaveLength(11);
    expect(g[9][1]).toBe("품목 9");
    expect(g[10][0]).toBe("합 계");
    const doc = parseXml(strFromU8(unzipSync(bytes)["Contents/section0.xml"]));
    const tbl = doc.getElementsByTagNameNS(HP, "tbl")[0];
    expect(tbl.getAttribute("rowCnt")).toBe("11");
    const rowAddrs = Array.from(doc.getElementsByTagNameNS(HP, "cellAddr")).map((a) => Number(a.getAttribute("rowAddr")));
    expect(Math.max(...rowAddrs)).toBe(10);
  });

  it("병합 칸 양식: 품목+규격을 한 칸에", () => {
    const { bytes } = fillTemplate(fixture("estimate-merged.hwpx"), { tableIndex: 0, fields: {}, lines: LINES, tokens: {} });
    const g = tableGrid(bytes);
    expect(g[1]).toEqual(["1", "사무용 의자 T-ZERO", "4", "189,000", "756,000", "75,600", ""]);
  });

  it("표 하나 양식: 품목을 머리글 아래에 채운다", () => {
    const { bytes } = fillTemplate(fixture("estimate-onetable.hwpx"), { tableIndex: 0, fields: {}, lines: LINES, tokens: {} });
    const g = tableGrid(bytes);
    expect(g[12]).toEqual(["사무용 의자", "T-ZERO", "4", "189,000", "756,000", "75,600", ""]);
    expect(g[20][0]).toBe("특기사항");
  });

  it("화면에서 고친 연결을 따른다", () => {
    const { bytes } = fillTemplate(fixture("estimate-basic.hwpx"), {
      tableIndex: 0,
      fields: { 5: "total", 6: "" },
      lines: LINES,
      tokens: {},
    });
    expect(tableGrid(bytes)[3]).toEqual(["3", "모니터암", "듀얼", "2", "64,000", "140,800", ""]);
  });

  it("mimetype은 맨 앞에 무압축", () => {
    const { bytes } = fillTemplate(fixture("estimate-basic.hwpx"), { tableIndex: null, fields: {}, lines: [], tokens: {} });
    // zip 첫 항목의 이름과 압축 방식(0 = 저장)
    const view = new DataView(bytes.buffer, bytes.byteOffset);
    expect(view.getUint16(8, true)).toBe(0);
    const nameLen = view.getUint16(26, true);
    expect(new TextDecoder().decode(bytes.slice(30, 30 + nameLen))).toBe("mimetype");
  });
});

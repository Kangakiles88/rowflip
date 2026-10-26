import { describe, expect, it } from "vitest";
import {
  DONATION_SAMPLE,
  detectYear,
  formatId,
  maskId,
  parseLedger,
  parseLooseDate,
  receiptLines,
  serialNo,
  sortDonors,
  summaryTable,
} from "./donation";

describe("parseLooseDate", () => {
  it("여러 날짜 모양을 읽는다", () => {
    expect(parseLooseDate("2026-01-05", 2026)).toEqual({ y: 2026, m: 1, d: 5 });
    expect(parseLooseDate("2026.1.5.", 2026)).toEqual({ y: 2026, m: 1, d: 5 });
    expect(parseLooseDate("2026년 3월 1일", 2026)).toEqual({ y: 2026, m: 3, d: 1 });
    expect(parseLooseDate("20261225", 2026)).toEqual({ y: 2026, m: 12, d: 25 });
    expect(parseLooseDate("3/15", 2025)).toEqual({ y: 2025, m: 3, d: 15 });
    expect(parseLooseDate("2026.03", 2026)).toEqual({ y: 2026, m: 3, d: null });
    expect(parseLooseDate("7월", 2026)).toEqual({ y: 2026, m: 7, d: null });
    expect(parseLooseDate("46027", 2026)).toEqual({ y: 2026, m: 1, d: 5 });
  });
  it("날짜가 아니면 null", () => {
    expect(parseLooseDate("김민준", 2026)).toBeNull();
    expect(parseLooseDate("2026-13-01", 2026)).toBeNull();
    expect(parseLooseDate("", 2026)).toBeNull();
  });
});

describe("주민등록번호", () => {
  it("하이픈을 맞추고 뒷자리를 가린다", () => {
    expect(formatId("8001011000001")).toBe("800101-1000001");
    expect(maskId("800101-1000001")).toBe("800101-1******");
    expect(maskId("123-45-67890")).toBe("123-45-67890");
  });
});

describe("parseLedger", () => {
  it("세로형 내역을 기부자별로 합친다", () => {
    const l = parseLedger(DONATION_SAMPLE, 2026);
    expect(l.hasHeader).toBe(true);
    expect(l.donors).toHaveLength(3);
    const kim = l.donors.find((d) => d.name === "김민준")!;
    expect(kim.total).toBe(450000);
    expect(kim.count).toBe(4);
    expect(kim.months.slice(0, 5)).toEqual([100000, 100000, 150000, 0, 100000]);
    expect(kim.id).toBe("800101-1000001");
    expect(kim.address).toBe("서울특별시 중구 세종대로 110");
    expect(l.mainYear).toBe(2026);
  });

  it("다른 연도 내역은 빼고 개수를 알려 준다", () => {
    const l = parseLedger("날짜\t성명\t금액\n2025-12-28\t김민준\t10,000\n2026-01-04\t김민준\t20,000", 2026);
    expect(l.otherYear).toBe(1);
    expect(l.donors[0].total).toBe(20000);
  });

  it("머리글이 달라도 별칭으로 연결한다", () => {
    const l = parseLedger("헌금일\t교인명\t헌금액\n1/4\t이서연\t50,000원\n1/11\t이서연\t30,000원", 2026);
    expect(l.donors[0]).toMatchObject({ name: "이서연", total: 80000 });
    expect(l.donors[0].months[0]).toBe(80000);
  });

  it("금액을 읽지 못한 줄을 알려 준다", () => {
    const l = parseLedger("성명\t금액\n김민준\t10,000\n이서연\t미정", 2026);
    expect(l.invalidLines).toEqual([3]);
    expect(l.donors).toHaveLength(1);
  });

  it("가로형(1월~12월 열) 표를 읽고 합계 열은 무시한다", () => {
    const raw = "성명\t1월\t2월\t3월\t합계\n김민준\t100,000\t\t50,000\t150,000\n이서연\t30,000\t30,000\t\t60,000\n합계\t130,000\t30,000\t50,000\t210,000";
    const l = parseLedger(raw, 2026);
    expect(l.wide).toBe(true);
    expect(l.donors).toHaveLength(2);
    expect(l.donors[0].total).toBe(150000);
    expect(l.donors[0].months.slice(0, 3)).toEqual([100000, 0, 50000]);
  });

  it("이름별 합계만 있는 표(날짜 없음)도 읽는다", () => {
    const l = parseLedger("성명\t주민등록번호\t합계\n김민준\t8001011000001\t1,200,000", 2026);
    expect(l.donors[0]).toMatchObject({ name: "김민준", id: "800101-1000001", total: 1200000, undated: 1200000 });
    expect(l.hasDates).toBe(false);
  });

  it("같은 이름이라도 주민번호가 다르면 다른 사람", () => {
    const l = parseLedger("성명\t주민번호\t금액\n김민준\t800101-1000001\t10\n김민준\t900101-1000009\t20", 2026);
    expect(l.donors).toHaveLength(2);
  });

  it("머리글 없는 표는 열 종류를 짐작한다", () => {
    const l = parseLedger("2026-01-04\t김민준\t100,000\n2026-02-01\t김민준\t50,000\n2026-02-01\t이서연\t30,000", 2026);
    expect(l.hasHeader).toBe(false);
    expect(l.donors.map((d) => [d.name, d.total])).toEqual([
      ["김민준", 150000],
      ["이서연", 30000],
    ]);
  });

  it("휴대폰에서 띄어쓰기로 친 내역", () => {
    const l = parseLedger("1/4 김민준 100,000\n2026-02-01 이서연 30000\n박지훈 50,000", 2026);
    expect(l.spaced).toBe(true);
    expect(l.donors.map((d) => [d.name, d.total])).toEqual([
      ["김민준", 100000],
      ["이서연", 30000],
      ["박지훈", 50000],
    ]);
    expect(l.donors[0].months[0]).toBe(100000);
  });

  it("천 단위 쉼표가 든 띄어쓰기 내역을 CSV로 읽지 않는다", () => {
    const l = parseLedger("김민준 1/4 100,000\n이서연 1/11 50,000\n김민준 2/1 100,000", 2026);
    expect(l.donors.map((d) => [d.name, d.total])).toEqual([
      ["김민준", 200000],
      ["이서연", 50000],
    ]);
  });

  it("머리글이 있는 CSV는 그대로 읽는다", () => {
    const l = parseLedger('성명,날짜,금액\n김민준,2026-01-04,"100,000"\n이서연,2026-01-04,50000', 2026);
    expect(l.donors.map((d) => d.total)).toEqual([100000, 50000]);
  });

  it("detectYear는 가장 많이 나온 연도", () => {
    expect(detectYear("날짜\t성명\t금액\n2025-12-28\t김\t1\n2026-01-04\t김\t1\n2026-01-11\t이\t1")).toBe(2026);
    expect(detectYear("성명\t금액\n김\t1")).toBeNull();
    expect(detectYear("날짜\t성명\t금액\n1/4\t김\t1")).toBeNull();
  });
});

describe("receiptLines", () => {
  const kim = parseLedger(DONATION_SAMPLE, 2026).donors.find((d) => d.name === "김민준")!;
  it("연간 한 줄", () => {
    expect(receiptLines(kim, "year", 2026, "41")).toEqual([
      { code: "41", kind: "금전", date: "2026.01.01 ~ 2026.12.31", amount: 450000 },
    ]);
  });
  it("월별 — 기부한 달만", () => {
    const l = receiptLines(kim, "month", 2026, "41");
    expect(l.map((x) => x.date)).toEqual([
      "2026.01.01 ~ 2026.01.31",
      "2026.02.01 ~ 2026.02.28",
      "2026.03.01 ~ 2026.03.31",
      "2026.05.01 ~ 2026.05.31",
    ]);
    expect(l.reduce((s, x) => s + x.amount, 0)).toBe(450000);
  });
  it("날짜별 — 같은 날은 합친다", () => {
    const d = parseLedger("날짜\t성명\t금액\n2026-01-04\t김\t10\n2026-01-04\t김\t5\n2026-01-11\t김\t7", 2026).donors[0];
    expect(receiptLines(d, "each", 2026, "41").map((x) => [x.date, x.amount])).toEqual([
      ["2026.01.04", 15],
      ["2026.01.11", 7],
    ]);
  });
  it("날짜를 모르면 어떤 방식이든 연간 한 줄", () => {
    const d = parseLedger("성명\t금액\n김\t100", 2026).donors[0];
    expect(receiptLines(d, "each", 2026, "41")).toHaveLength(1);
  });
});

describe("기타", () => {
  it("일련번호", () => {
    expect(serialNo("2026-", 0)).toBe("2026-001");
    expect(serialNo("", 41)).toBe("042");
  });
  it("이름순 정렬", () => {
    const l = parseLedger(DONATION_SAMPLE, 2026);
    expect(sortDonors(l.donors, "name").map((d) => d.name)).toEqual(["김민준", "박지훈", "이서연"]);
    expect(sortDonors(l.donors, "input").map((d) => d.name)).toEqual(["김민준", "이서연", "박지훈"]);
  });
  it("이름별 합계 표", () => {
    const l = parseLedger(DONATION_SAMPLE, 2026);
    const t = summaryTable(sortDonors(l.donors, "name"), false, true);
    expect(t[0]).toEqual(["성명", "주민등록번호", "건수", "합계"]);
    expect(t[1]).toEqual(["김민준", "800101-1******", "4", "450,000"]);
    expect(t[t.length - 1]).toEqual(["합계", "", "10", "710,000"]);
    expect(summaryTable(l.donors, true, false)[0]).toHaveLength(16);
  });
});

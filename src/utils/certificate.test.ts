import { describe, expect, it } from "vitest";
import {
  autoMap,
  buildCertificates,
  fillTokens,
  formatDate,
  getTemplate,
  parseRoster,
  pickJosa,
  spaceTitle,
  type CommonValues,
} from "./certificate";

const common: CommonValues = {
  date: "2026-10-11",
  dateStyle: "dot",
  issuer: "한빛초등학교장",
  signer: "이서준",
  autoNumber: true,
  numberPrefix: "2026-",
  body: getTemplate("award").body,
};

describe("parseRoster", () => {
  it("첫 행은 머리글, 빈 행은 뺀다", () => {
    const r = parseRoster("성명\t소속\n김민준\t2학년 3반\n\t\n이서연\t2학년 1반\n");
    expect(r.headers).toEqual(["성명", "소속"]);
    expect(r.rows).toEqual([
      ["김민준", "2학년 3반"],
      ["이서연", "2학년 1반"],
    ]);
  });
  it("탭 없이 띄어쓰기로 친 명단은 머리글 칸 수에 맞춰 나눈다", () => {
    const r = parseRoster("성명 소속 수상명\n강신만 2학년 3반 대상\n이서연  2학년 1반  최우수상");
    expect(r.spaced).toBe(true);
    expect(r.headers).toEqual(["성명", "소속", "수상명"]);
    expect(r.rows).toEqual([
      ["강신만", "2학년 3반", "대상"],
      ["이서연", "2학년 1반", "최우수상"],
    ]);
    expect(parseRoster("성명 소속\n김민준 한빛 봉사단").rows).toEqual([["김민준", "한빛 봉사단"]]);
  });
  it("머리글이 한 낱말이면 띄어쓰기로 나누지 않는다", () => {
    const r = parseRoster("성명\n김 민준");
    expect(r.spaced).toBeUndefined();
    expect(r.rows).toEqual([["김 민준"]]);
  });
  it("빈 머리글은 'n열'로", () => {
    expect(parseRoster("성명\t\n김민준\t우수상").headers).toEqual(["성명", "2열"]);
  });
});

describe("autoMap", () => {
  it("머리글 이름으로 칸을 연결한다", () => {
    const m = autoMap(getTemplate("award"), ["이름", "학년반", "수상명"]);
    expect(m).toEqual({ number: -1, award: 2, group: 1, name: 0 });
  });
  it("포함 규칙은 두 글자 이상 별칭만 — '상품코드'를 수상명으로 잡지 않는다", () => {
    const m = autoMap(getTemplate("award"), ["성명", "상품코드"]);
    expect(m.award).toBe(-1);
  });
  it("'교육 과정명'처럼 공백이 있어도 연결", () => {
    const m = autoMap(getTemplate("completion"), ["성명", "교육 과정명"]);
    expect(m.course).toBe(1);
  });
});

describe("formatDate", () => {
  it("여러 표기를 같은 형식으로", () => {
    expect(formatDate("2026-10-11", "dot")).toBe("2026. 10. 11.");
    expect(formatDate("2026.1.5", "korean")).toBe("2026년 1월 5일");
    expect(formatDate("20261011", "dot")).toBe("2026. 10. 11.");
    expect(formatDate("2026. 10. 11.", "korean")).toBe("2026년 10월 11일");
  });
  it("날짜가 아니면 그대로", () => {
    expect(formatDate("상시", "dot")).toBe("상시");
  });
});

describe("spaceTitle", () => {
  it("짧은 한글 제목은 글자 사이를 띄운다", () => {
    expect(spaceTitle("우수상")).toBe("우 수 상");
    expect(spaceTitle("상장")).toBe("상 장");
  });
  it("긴 제목·영문은 그대로", () => {
    expect(spaceTitle("교내 글쓰기 대회 최우수상")).toBe("교내 글쓰기 대회 최우수상");
    expect(spaceTitle("MVP")).toBe("MVP");
  });
});

describe("pickJosa / fillTokens", () => {
  it("받침에 맞춰 조사를 고른다", () => {
    expect(pickJosa("위원", "으로")).toBe("으로");
    expect(pickJosa("교사", "으로")).toBe("로");
    expect(pickJosa("위원장", "로")).toBe("으로");
    expect(pickJosa("회장 직무대리", "을")).toBe("를");
    expect(pickJosa("1", "으로")).toBe("로");
  });
  it("{칸}을 값으로 바꾸고 조사를 고친다", () => {
    const r = fillTokens("귀하를 {위촉직}으로 위촉합니다.", { 위촉직: "운영위원회 위원" });
    expect(r.text).toBe("귀하를 운영위원회 위원으로 위촉합니다.");
    expect(fillTokens("{위촉직}으로", { 위촉직: "자문위원회 간사" }).text).toBe("자문위원회 간사로");
  });
  it("없는 칸은 그대로 두고 알려 준다", () => {
    const r = fillTokens("위 사람은 {과정명} 과정을", {});
    expect(r.text).toBe("위 사람은 {과정명} 과정을");
    expect(r.missing).toEqual(["과정명"]);
  });
});

describe("buildCertificates", () => {
  const t = getTemplate("award");
  const roster = parseRoster(t.sample);
  const mapping = autoMap(t, roster.headers);

  it("한 사람당 한 장, 수상명은 제목으로, 자동 번호", () => {
    const { items, total } = buildCertificates(roster, t, mapping, common);
    expect(total).toBe(4);
    expect(items[0]).toEqual({
      number: "제 2026-001 호",
      title: "우 수 상",
      rows: [
        { label: "소속", value: "2학년 3반" },
        { label: "성명", value: "김민준" },
      ],
      body: t.body,
      date: "2026. 10. 11.",
      issuer: "한빛초등학교장",
      signer: "이서준",
    });
  });

  it("limit만큼만 만들되 total은 전체", () => {
    const { items, total } = buildCertificates(roster, t, mapping, common, 2);
    expect(items).toHaveLength(2);
    expect(total).toBe(4);
  });

  it("수료증: 생년월일은 날짜 형식으로, 본문에 과정명", () => {
    const c = getTemplate("completion");
    const r = parseRoster(c.sample);
    const { items, missing } = buildCertificates(r, c, autoMap(c, r.headers), { ...common, body: c.body });
    expect(items[0].rows.find((x) => x.label === "생년월일")?.value).toBe("1990. 3. 14.");
    expect(items[0].body).toBe("위 사람은 엑셀 실무 기초 과정을 성실히 이수하였으므로 이 증서를 수여합니다.");
    expect(missing).toEqual([]);
  });

  it("번호 열이 있으면 그 값을 쓴다", () => {
    const r = parseRoster("번호\t성명\n15\t김민준\n제 2026-7 호\t이서연");
    const { items } = buildCertificates(r, t, autoMap(t, r.headers), common);
    expect(items.map((i) => i.number)).toEqual(["제 15 호", "제 2026-7 호"]);
  });

  it("자동 번호를 끄면 번호 없음", () => {
    const { items } = buildCertificates(roster, t, mapping, { ...common, autoNumber: false });
    expect(items[0].number).toBe("");
  });
});

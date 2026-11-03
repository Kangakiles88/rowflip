import { describe, expect, it } from "vitest";
import { criteria, evaluateFormula, formatNumber, parseCellValue, sameResult } from "./formula";

// A: 부서, B: 이름, C: 매출, D: 날짜(글자)
const SHEET = [
  ["부서", "이름", "매출", "지역"],
  ["영업1팀", "김민준", "1,200", "서울"],
  ["영업2팀", "이서연", "980", "부산"],
  ["영업1팀", "박지호", "1,050", "서울"],
  ["마케팅팀", "최유나", "760", "대구"],
  ["영업2팀", "정우진", "1,430", "서울"],
  ["영업1팀", "한소희", "", "부산"],
];

const val = (f: string, rows = SHEET) => {
  const r = evaluateFormula(f, rows);
  return r.ok ? r.value : r.code;
};

describe("parseCellValue", () => {
  it("천 단위 쉼표 숫자·퍼센트·TRUE·빈칸·글자", () => {
    expect(parseCellValue("1,200")).toBe(1200);
    expect(parseCellValue("12%")).toBeCloseTo(0.12);
    expect(parseCellValue("true")).toBe(true);
    expect(parseCellValue("  ")).toBeNull();
    expect(parseCellValue("A-10234")).toBe("A-10234");
    expect(parseCellValue("1,20")).toBe("1,20");
    expect(parseCellValue("010-1234")).toBe("010-1234");
  });
});

describe("기본 연산", () => {
  it("사칙연산·우선순위·거듭제곱·퍼센트·연결", () => {
    expect(val("=1+2*3")).toBe(7);
    expect(val("=(1+2)*3")).toBe(9);
    expect(val("=-2^2")).toBe(4); // 엑셀은 부호가 거듭제곱보다 먼저
    expect(val("=50%*C2")).toBe(600);
    expect(val('=B2&"님"')).toBe("김민준님");
    expect(val("=C2/0")).toBe("#DIV/0!");
    expect(val("=C7+1")).toBe(1);
  });
  it("=가 없으면 입력값 그대로", () => {
    expect(val("1,500")).toBe(1500);
    expect(val("SUM(C2:C7)")).toBe("SUM(C2:C7)");
  });
  it("비교는 대소문자를 무시하고 숫자 < 글자", () => {
    expect(val('=A2="영업1팀"')).toBe(true);
    expect(val('="abc"="ABC"')).toBe(true);
    expect(val('=1<"a"')).toBe(true);
  });
  it("빈칸을 가리키면 0", () => {
    expect(val("=C7")).toBe(0);
  });
  it("숫자 표시는 엑셀 일반 서식처럼", () => {
    expect(formatNumber(0.1 + 0.2)).toBe("0.3");
    expect(formatNumber(1200)).toBe("1200");
  });
});

describe("오류 안내", () => {
  it("문법 오류", () => {
    const r = evaluateFormula("=SUM(C2:C7", SHEET);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("수식 오류");
      expect(r.message).toContain("닫는 괄호");
    }
    expect(val("=SUM(C2:C7;C3)")).toBe("수식 오류");
    expect(val("=Sheet1!A1")).toBe("수식 오류");
    const r2 = evaluateFormula("=SUMIF(C2:C7,<1000)", SHEET);
    expect(!r2.ok && r2.message).toContain('"<1000"');
  });
  it("따옴표 없는 글자는 #NAME?", () => {
    const r = evaluateFormula("=COUNTIF(A2:A7,영업1팀)", SHEET);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("#NAME?");
      expect(r.message).toContain('"영업1팀"');
    }
  });
  it("모르는 함수·인수 개수", () => {
    expect(val("=SUMM(C2:C7)")).toBe("#NAME?");
    expect(val("=COUNTIF(A2:A7)")).toBe("수식 오류");
  });
  it("글자 + 숫자는 #VALUE!", () => {
    expect(val("=A2+1")).toBe("#VALUE!");
  });
  it("범위를 한 칸처럼 쓰면 #VALUE!", () => {
    expect(val("=C2:C7")).toBe("#VALUE!");
  });
  it("둥근 따옴표는 곧은 따옴표로 바꿔 읽는다", () => {
    expect(val("=COUNTIF(A2:A7,“영업1팀”)")).toBe(3);
  });
  it("쓴 함수와 참조 범위를 알려 준다", () => {
    const r = evaluateFormula('=IFERROR(VLOOKUP("박지호",B2:C7,2,FALSE),0)', SHEET);
    expect(r.functions.sort()).toEqual(["IFERROR", "VLOOKUP"]);
    expect(r.refs).toEqual([{ r1: 1, c1: 1, r2: 6, c2: 2 }]);
  });
});

describe("SUM·AVERAGE·COUNT", () => {
  it("범위의 글자·빈칸은 건너뜀", () => {
    expect(val("=SUM(C2:C7)")).toBe(5420);
    expect(val("=SUM(C:C)")).toBe(5420);
    expect(val("=AVERAGE(C2:C7)")).toBe(1084);
    expect(val("=COUNT(C1:C7)")).toBe(5);
    expect(val("=COUNTA(C1:C7)")).toBe(6);
    expect(val("=COUNTBLANK(C2:C7)")).toBe(1);
    expect(val("=MAX(C2:C7)")).toBe(1430);
    expect(val("=MIN(C2:C7,500)")).toBe(500);
  });
});

describe("COUNTIF", () => {
  it("같은 값·비교·와일드카드·빈칸·아닌 것", () => {
    expect(val('=COUNTIF(A2:A7,"영업1팀")')).toBe(3);
    expect(val("=COUNTIF(A2:A7,A2)")).toBe(3);
    expect(val('=COUNTIF(C2:C7,">=1000")')).toBe(3);
    expect(val('=COUNTIF(C2:C7,">"&C3)')).toBe(3);
    expect(val('=COUNTIF(A2:A7,"영업*")')).toBe(5);
    expect(val('=COUNTIF(A2:A7,"*팀")')).toBe(6);
    expect(val('=COUNTIF(A2:A7,"영업?팀")')).toBe(5);
    expect(val('=COUNTIF(C2:C7,"")')).toBe(1);
    expect(val('=COUNTIF(C2:C7,"<>")')).toBe(5);
    expect(val('=COUNTIF(A2:A7,"<>영업1팀")')).toBe(3);
    expect(val("=COUNTIF(C2:C7,980)")).toBe(1);
  });
  it("조건 함수", () => {
    const t = criteria("<>서울");
    expect(t("부산")).toBe(true);
    expect(t(null)).toBe(true);
    expect(criteria("~*")("*")).toBe(true);
    expect(criteria("~*")("a")).toBe(false);
  });
  it("COUNTIFS 여러 조건", () => {
    expect(val('=COUNTIFS(A2:A7,"영업1팀",D2:D7,"서울")')).toBe(2);
    expect(val('=COUNTIFS(A2:A7,"영업1팀",D2:D6,"서울")')).toBe("#VALUE!");
  });
});

describe("SUMIF·SUMIFS·AVERAGEIF", () => {
  it("조건에 맞는 합계", () => {
    expect(val('=SUMIF(A2:A7,"영업1팀",C2:C7)')).toBe(2250);
    expect(val('=SUMIF(C2:C7,">=1000")')).toBe(3680);
    expect(val('=SUMIF(A:A,"영업2팀",C:C)')).toBe(2410);
    // 더할 범위는 왼쪽 위 칸 기준으로 같은 크기로 맞춤
    expect(val('=SUMIF(A2:A7,"영업1팀",C2)')).toBe(2250);
    expect(val('=SUMIFS(C2:C7,A2:A7,"영업1팀",D2:D7,"서울")')).toBe(2250);
    expect(val('=SUMIFS(C2:C7,A2:A7,"영업*",C2:C7,">1000")')).toBe(3680);
    expect(val('=AVERAGEIF(A2:A7,"영업2팀",C2:C7)')).toBe(1205);
    expect(val('=AVERAGEIF(A2:A7,"없음",C2:C7)')).toBe("#DIV/0!");
  });
  it("범위 대신 값을 넣으면 #VALUE!", () => {
    expect(val('=SUMIF("영업1팀","영업1팀",C2:C7)')).toBe("#VALUE!");
  });
});

describe("IF·AND·OR·IFS", () => {
  it("조건에 따라 값", () => {
    expect(val('=IF(C2>=1000,"달성","미달")')).toBe("달성");
    expect(val('=IF(C3>=1000,"달성","미달")')).toBe("미달");
    expect(val('=IF(C3>=1000,"달성")')).toBe(false);
    expect(val('=IF(AND(A2="영업1팀",C2>=1000),"O","X")')).toBe("O");
    expect(val('=IF(OR(D3="서울",C3>=1000),"O","X")')).toBe("X");
    expect(val('=IF(C2>=1200,"A",IF(C2>=1000,"B","C"))')).toBe("A");
    expect(val('=IF(C4>=1200,"A",IF(C4>=1000,"B","C"))')).toBe("B");
    expect(val('=IFS(C5>=1200,"A",C5>=1000,"B",TRUE,"C")')).toBe("C");
    expect(val('=IFS(C5>=1200,"A")')).toBe("#N/A");
    expect(val('=IF(A2,"a","b")')).toBe("#VALUE!");
    expect(val('=IF(C7="","미입력",C7)')).toBe("미입력");
    expect(val("=NOT(C2>1000)")).toBe(false);
  });
  it("고르지 않은 쪽의 오류는 계산하지 않는다", () => {
    expect(val('=IF(TRUE,1,1/0)')).toBe(1);
  });
});

describe("VLOOKUP·HLOOKUP·INDEX·MATCH·XLOOKUP", () => {
  const PRICE = [
    ["상품코드", "상품명", "단가"],
    ["A-10234", "A4용지", "4,500"],
    ["A-10235", "볼펜", "800"],
    ["B-20011", "스테이플러", "6,200"],
  ];
  const GRADE = [
    ["점수", "등급"],
    ["0", "F"],
    ["60", "D"],
    ["70", "C"],
    ["80", "B"],
    ["90", "A"],
  ];
  it("정확히 일치(FALSE)", () => {
    expect(val('=VLOOKUP("A-10235",A2:C4,3,FALSE)', PRICE)).toBe(800);
    expect(val('=VLOOKUP("a-10235",A2:C4,2,0)', PRICE)).toBe("볼펜");
    expect(val('=VLOOKUP("B*",A2:C4,2,FALSE)', PRICE)).toBe("스테이플러");
    expect(val('=VLOOKUP("C-1",A2:C4,2,FALSE)', PRICE)).toBe("#N/A");
    expect(val('=VLOOKUP("A-10235",A2:C4,4,FALSE)', PRICE)).toBe("#REF!");
    expect(val('=VLOOKUP("A-10235",A2:C4,0,FALSE)', PRICE)).toBe("#VALUE!");
    expect(val('=IFERROR(VLOOKUP("C-1",A2:C4,2,FALSE),"없음")', PRICE)).toBe("없음");
    expect(val('=IFNA(VLOOKUP("C-1",A2:C4,2,FALSE),"없음")', PRICE)).toBe("없음");
  });
  it("마지막 인수를 빼면 근사치(구간) 찾기", () => {
    expect(val("=VLOOKUP(85,A2:B6,2)", GRADE)).toBe("B");
    expect(val("=VLOOKUP(90,A2:B6,2,TRUE)", GRADE)).toBe("A");
    expect(val("=VLOOKUP(59,A1:B6,2)", GRADE)).toBe("F");
    expect(val("=VLOOKUP(-1,A2:B6,2)", GRADE)).toBe("#N/A");
  });
  it("숫자와 글자 숫자는 다른 값 — 엑셀처럼 #N/A와 안내", () => {
    const rows = [
      ["코드", "이름"],
      ["100", "x"],
    ];
    expect(val("=VLOOKUP(100,A2:B2,2,FALSE)", rows)).toBe("x");
    const r = evaluateFormula('=VLOOKUP("100",A2:B2,2,FALSE)', rows);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("형식");
  });
  it("HLOOKUP·INDEX·MATCH·XLOOKUP", () => {
    const H = [
      ["구분", "1월", "2월"],
      ["매출", "1,200", "980"],
    ];
    expect(val('=HLOOKUP("2월",A1:C2,2,FALSE)', H)).toBe(980);
    expect(val('=INDEX(C2:C4,MATCH("볼펜",B2:B4,0))', PRICE)).toBe(800);
    expect(val("=INDEX(A2:C4,3,2)", PRICE)).toBe("스테이플러");
    expect(val("=INDEX(A2:C4,4,2)", PRICE)).toBe("#REF!");
    expect(val("=MATCH(75,A2:A6,1)", GRADE)).toBe(3);
    expect(val('=XLOOKUP("볼펜",B2:B4,C2:C4)', PRICE)).toBe(800);
    expect(val('=XLOOKUP("연필",B2:B4,C2:C4,"없음")', PRICE)).toBe("없음");
    expect(val('=XLOOKUP("연필",B2:B4,C2:C4)', PRICE)).toBe("#N/A");
    expect(val("=XLOOKUP(85,A2:A6,B2:B6,,-1)", GRADE)).toBe("B");
  });
});

describe("수학·글자 함수", () => {
  it("반올림·나머지·글자", () => {
    expect(val("=ROUND(1.005,2)")).toBe(1.01);
    expect(val("=ROUND(1234.5,-2)")).toBe(1200);
    expect(val("=ROUNDDOWN(-1.25,1)")).toBe(-1.2);
    expect(val("=ROUNDUP(1.21,1)")).toBe(1.3);
    expect(val("=INT(-1.5)")).toBe(-2);
    expect(val("=MOD(-3,2)")).toBe(1);
    expect(val('=LEFT("A-10234",1)')).toBe("A");
    expect(val('=RIGHT("A-10234",5)')).toBe("10234");
    expect(val('=MID("A-10234",3,2)')).toBe("10");
    expect(val('=LEN("영업 1팀")')).toBe(5);
    expect(val('=TRIM("  a   b ")')).toBe("a b");
    expect(val('=CONCAT(B2," ",A2)')).toBe("김민준 영업1팀");
  });
});

describe("sameResult", () => {
  it("값이 같으면 정답", () => {
    const a = evaluateFormula('=SUMIF(A2:A7,"영업1팀",C2:C7)', SHEET);
    const b = evaluateFormula("=C2+C4", SHEET);
    expect(sameResult(a, b)).toBe(true);
    expect(sameResult(evaluateFormula('="달성"', SHEET), evaluateFormula('=" 달성 "', SHEET))).toBe(true);
    expect(sameResult(evaluateFormula("=1", SHEET), evaluateFormula("=2", SHEET))).toBe(false);
  });
});

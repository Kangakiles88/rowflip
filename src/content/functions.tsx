import Link from "next/link";
import type { ReactNode } from "react";
import type { LabData } from "@/components/FormulaLab";
import type { ToolMeta } from "@/components/ToolPageLayout";
import type { ToolPageId } from "@/config/nav";
import type { FaqItem, Guide } from "./seo";

/**
 * 엑셀 함수 페이지(/functions/, /functions/<함수>/) 내용.
 * 안내(guides)의 수식 예시와 연습 문제 정답은 functions.test.ts가 예제 표에서 실제로 계산해 대조한다.
 */
export interface FunctionLesson {
  id: ToolPageId;
  meta: ToolMeta;
  ogImage: string;
  ogAlt: string;
  lede: string;
  guideTitle: string;
  guides: Guide[];
  faq: FaqItem[];
  related: ReactNode;
  lab: LabData;
}

const faq = (q: string, a: string): FaqItem => ({ q, a, plain: a });

/** 매출 예제 — 함수 정리·SUMIF 페이지 */
const SALES: string[][] = [
  ["부서", "담당자", "지역", "매출"],
  ["영업1팀", "김민준", "서울", "1,200"],
  ["영업2팀", "이서연", "부산", "980"],
  ["영업1팀", "박지호", "서울", "1,050"],
  ["마케팅팀", "최유나", "대구", "760"],
  ["영업2팀", "정우진", "서울", "1,430"],
  ["영업1팀", "한소희", "부산", "1,310"],
  ["마케팅팀", "강도윤", "서울", "1,120"],
  ["영업2팀", "윤하린", "대구", "640"],
];

/** 교육 출석 예제 — COUNTIF 페이지(E-1006은 일부러 두 번 입력) */
const ATTEND: string[][] = [
  ["사번", "이름", "부서", "출석", "점수"],
  ["E-1001", "김민준", "영업팀", "O", "92"],
  ["E-1002", "이서연", "인사팀", "O", "78"],
  ["E-1003", "박지호", "영업팀", "X", ""],
  ["E-1004", "최유나", "개발팀", "O", "85"],
  ["E-1005", "정우진", "개발팀", "O", "64"],
  ["E-1006", "한소희", "영업팀", "O", "88"],
  ["E-1007", "강도윤", "인사팀", "X", ""],
  ["E-1008", "윤하린", "개발팀", "O", "71"],
  ["E-1006", "한소희", "영업팀", "O", "88"],
];

/** 상품 단가표 + 할인율 구간표 — VLOOKUP 페이지 */
const PRICE: string[][] = [
  ["상품코드", "상품명", "규격", "단가", "재고", "", "구매액 이상", "할인율(%)"],
  ["A-10234", "A4용지", "500매", "4,500", "120", "", "0", "0"],
  ["A-10235", "볼펜", "0.5mm", "800", "340", "", "100,000", "3"],
  ["B-20011", "스테이플러", "중형", "6,200", "45", "", "300,000", "5"],
  ["B-20012", "스테이플러 심", "1,000개", "1,100", "210", "", "500,000", "8"],
  ["C-30101", "클립", "대형", "1,500", "80"],
  ["C-30102", "포스트잇", "76x76", "2,300", "150"],
  ["D-40007", "계산기", "12자리", "15,800", "22"],
];

/** 분기 실적 예제 — IF 페이지 */
const PERF: string[][] = [
  ["사번", "이름", "1분기", "2분기", "목표"],
  ["E-1001", "김민준", "1,200", "1,350", "1,300"],
  ["E-1002", "이서연", "980", "1,020", "1,000"],
  ["E-1003", "박지호", "1,050", "940", "1,000"],
  ["E-1004", "최유나", "760", "", "800"],
  ["E-1005", "정우진", "1,430", "1,510", "1,400"],
];

/* ───────── 엑셀 함수 정리 (/functions/) ───────── */

export const FUNCTIONS_INDEX: FunctionLesson = {
  id: "functions",
  meta: {
    path: "/functions/",
    h1: "엑셀 함수 정리",
    title: "엑셀 함수 정리 - 자주 쓰는 함수 사용법과 바로 해 보는 연습장",
    description:
      "SUM, COUNTIF, SUMIF, IF, VLOOKUP, INDEX·MATCH 등 실무에서 자주 쓰는 엑셀 함수를 형식과 예시로 정리했습니다. 예제 표에 수식을 직접 입력하면 엑셀처럼 바로 계산하고, 오류가 나면 이유를 알려 줍니다.",
    keywords: [
      "엑셀 함수",
      "엑셀 함수 정리",
      "엑셀 함수 모음",
      "엑셀 수식",
      "엑셀 함수 사용법",
      "엑셀 자주 쓰는 함수",
      "엑셀 함수 연습",
      "엑셀 실무 함수",
    ],
    features: [
      "자주 쓰는 엑셀 함수 형식과 예시",
      "예제 표에 수식을 입력하면 바로 계산",
      "#N/A·#VALUE!·#NAME? 오류 이유 설명",
      "표의 칸을 누르면 수식에 주소 넣기",
      "내 표를 붙여넣어 수식 시험해 보기",
      "연습 문제와 채점",
    ],
  },
  ogImage: "/og-functions.png",
  ogAlt: "엑셀 함수 정리와 연습장 화면",
  lede: "실무에서 자주 쓰는 엑셀 함수를 모았습니다. 아래 예제 표에 수식을 직접 입력하면 엑셀처럼 바로 계산하고, 오류가 나면 무엇이 틀렸는지 알려 줍니다.",
  guideTitle: "자주 쓰는 엑셀 함수",
  guides: [
    {
      id: "sum",
      title: "SUM — 합계",
      body: "범위의 숫자를 모두 더합니다. 범위 안의 글자와 빈칸은 건너뜁니다. =SUM(D2:D9,F2)처럼 쉼표로 범위나 칸을 여러 개 넣을 수 있습니다.",
      input: "=SUM(D2:D9)",
      output: "8,490",
    },
    {
      id: "average",
      title: "AVERAGE — 평균",
      body: "숫자의 평균입니다. 빈칸은 개수에 넣지 않지만 0은 넣습니다. 소수점이 길면 ROUND로 감싸 자릿수를 정합니다.",
      input: "=AVERAGE(D2:D9)",
      output: "1,061.25",
    },
    {
      id: "max-min",
      title: "MAX·MIN — 가장 큰 값·작은 값",
      body: "범위에서 가장 큰 숫자(MAX)와 가장 작은 숫자(MIN)를 구합니다. 조건이 있으면 MAXIFS·MINIFS를 씁니다.",
      input: "=MAX(D2:D9)",
      output: "1,430",
    },
    {
      id: "counta",
      title: "COUNT·COUNTA — 개수",
      body: "COUNT는 숫자가 든 칸만, COUNTA는 비어 있지 않은 칸을 모두 셉니다. 명단 인원은 이름 열을 COUNTA로 셉니다. 빈칸 수는 COUNTBLANK입니다.",
      input: "=COUNTA(B2:B9)",
      output: "8",
    },
    {
      id: "countif",
      title: "COUNTIF — 조건에 맞는 개수",
      body: "범위에서 조건에 맞는 칸의 개수를 셉니다. 조건은 \"영업1팀\"처럼 같은 값, \">=1000\"처럼 비교, \"영업*\"처럼 와일드카드로 적습니다.",
      input: '=COUNTIF(A2:A9,"영업1팀")',
      output: "3",
    },
    {
      id: "sumif",
      title: "SUMIF — 조건에 맞는 합계",
      body: "조건 범위에서 조건에 맞는 행을 찾아 같은 행의 값을 더합니다. 부서별·거래처별·품목별 합계에 씁니다.",
      input: '=SUMIF(A2:A9,"영업1팀",D2:D9)',
      output: "3,560",
    },
    {
      id: "sumifs",
      title: "SUMIFS — 조건 여러 개 합계",
      body: "조건이 둘 이상이면 SUMIFS를 씁니다. SUMIF와 달리 더할 범위가 맨 앞에 오고, 그 뒤에 조건 범위와 조건을 짝지어 적습니다.",
      input: '=SUMIFS(D2:D9,A2:A9,"영업1팀",C2:C9,"서울")',
      output: "2,250",
    },
    {
      id: "averageif",
      title: "AVERAGEIF — 조건에 맞는 평균",
      body: "조건에 맞는 값의 평균입니다. 결과 소수점이 길게 나오면 ROUND로 감쌉니다.",
      input: '=ROUND(AVERAGEIF(A2:A9,"영업2팀",D2:D9),0)',
      output: "1,017",
    },
    {
      id: "if",
      title: "IF — 조건에 따라 다른 값",
      body: "조건이 참이면 둘째 값, 거짓이면 셋째 값을 돌려줍니다. 결과로 글자를 넣을 때는 큰따옴표로 감쌉니다.",
      input: '=IF(D2>=1000,"달성","미달")',
      output: "달성",
    },
    {
      id: "and-or",
      title: "AND·OR — 조건 여러 개",
      body: "AND는 조건이 모두 맞을 때, OR은 하나라도 맞을 때 TRUE입니다. 보통 IF의 첫 인수 안에 넣어 씁니다.",
      input: '=IF(AND(A2="영업1팀",D2>=1000),"O","X")',
      output: "O",
    },
    {
      id: "vlookup",
      title: "VLOOKUP — 표에서 값 찾아오기",
      body: "표의 첫 열에서 찾는 값을 찾아, 같은 행의 몇 번째 열 값을 가져옵니다. 정확히 같은 값을 찾을 때는 마지막 인수를 FALSE로 적습니다.",
      input: '=VLOOKUP("정우진",B2:D9,3,FALSE)',
      output: "1,430",
    },
    {
      id: "iferror",
      title: "IFERROR — 오류 대신 다른 값",
      body: "수식 결과가 #N/A 같은 오류면 둘째 인수의 값을 보여 줍니다. VLOOKUP으로 못 찾은 칸을 ‘없음’이나 빈칸으로 바꿀 때 씁니다.",
      input: '=IFERROR(VLOOKUP("홍길동",B2:D9,3,FALSE),"없음")',
      output: "없음",
    },
    {
      id: "index-match",
      title: "INDEX·MATCH — 왼쪽 열도 찾기",
      body: "MATCH로 찾는 값이 몇 번째 행인지 구하고, INDEX로 그 행의 값을 가져옵니다. VLOOKUP과 달리 찾는 열이 가져올 열의 오른쪽에 있어도 됩니다.",
      input: "=INDEX(B2:B9,MATCH(1430,D2:D9,0))",
      output: "정우진",
    },
    {
      id: "xlookup",
      title: "XLOOKUP — 새 찾기 함수",
      body: "엑셀 2021·365에 있는 함수입니다. 찾을 범위와 가져올 범위를 따로 적고, 기본이 정확히 일치라 FALSE를 적지 않아도 됩니다. 넷째 인수로 못 찾았을 때 보일 값을 정합니다.",
      input: '=XLOOKUP("윤하린",B2:B9,D2:D9)',
      output: "640",
    },
    {
      id: "round",
      title: "ROUND — 반올림",
      body: "둘째 인수는 남길 소수 자릿수입니다. 0이면 정수, -1이면 일의 자리, -3이면 백의 자리에서 반올림합니다. 올림은 ROUNDUP, 내림은 ROUNDDOWN입니다.",
      input: "=ROUND(AVERAGE(D2:D9),0)",
      output: "1,061",
    },
    {
      id: "left-mid",
      title: "LEFT·RIGHT·MID·LEN — 글자 자르기",
      body: "LEFT는 앞에서, RIGHT는 뒤에서, MID는 가운데에서 정한 글자 수만큼 가져옵니다. LEN은 글자 수입니다. 코드 앞자리로 분류하거나 전화번호를 나눌 때 씁니다.",
      input: "=LEFT(A2,2)",
      output: "영업",
    },
    {
      id: "concat",
      title: "& — 글자 잇기",
      body: "& 기호로 칸과 글자를 이어 붙입니다. 사이에 넣을 글자는 큰따옴표로 감쌉니다. CONCAT 함수로 여러 칸을 한 번에 이을 수도 있습니다.",
      input: '=B2&"("&A2&")"',
      output: "김민준(영업1팀)",
    },
  ],
  faq: [
    faq(
      "엑셀 함수는 무엇부터 익히면 되나요?",
      "SUM·AVERAGE·COUNT로 합계와 개수를 구하는 법을 먼저 익히고, 조건이 붙는 SUMIF·COUNTIF, 조건에 따라 값을 바꾸는 IF, 다른 표에서 값을 가져오는 VLOOKUP 순서로 익히면 실무 대부분을 처리할 수 있습니다.",
    ),
    faq(
      "수식을 넣었는데 결과 대신 수식이 그대로 보여요.",
      "칸 서식이 텍스트로 되어 있거나 수식 앞에 공백이나 작은따옴표가 있으면 엑셀이 수식을 글자로 받아들입니다. 칸 서식을 일반으로 바꾸고 수식을 다시 입력하세요. 수식은 반드시 =로 시작해야 합니다.",
    ),
    faq(
      "#NAME? 오류는 왜 나나요?",
      "함수 이름 철자가 틀렸거나, 글자를 큰따옴표 없이 적었을 때 납니다. 예를 들어 =COUNTIF(A2:A9,영업1팀)은 #NAME?이 나고, =COUNTIF(A2:A9,\"영업1팀\")처럼 따옴표로 감싸야 합니다.",
    ),
    faq(
      "이 연습장 계산이 엑셀과 같나요?",
      "엑셀과 같은 규칙으로 계산하도록 만들었지만 자주 쓰는 함수만 지원합니다. 날짜 함수, 배열 수식, 다른 시트 참조는 지원하지 않습니다. 결과를 확인한 뒤 ‘수식 복사’로 엑셀 칸에 붙여넣어 쓰세요.",
    ),
    faq(
      "붙여넣은 표가 서버에 저장되나요?",
      "아니요. 붙여넣은 표와 입력한 수식은 브라우저 안에서만 계산하고 어디에도 보내거나 저장하지 않습니다. 페이지를 닫으면 사라집니다.",
    ),
  ],
  related: (
    <>
      함수별로 자세히 보려면{" "}
      <Link className="inlineLink" href="/functions/sumif/">
        SUMIF
      </Link>
      ,{" "}
      <Link className="inlineLink" href="/functions/countif/">
        COUNTIF
      </Link>
      ,{" "}
      <Link className="inlineLink" href="/functions/vlookup/">
        VLOOKUP
      </Link>
      ,{" "}
      <Link className="inlineLink" href="/functions/if/">
        IF
      </Link>{" "}
      함수 사용법을, 수식 없이 중복값을 정리하려면{" "}
      <Link className="inlineLink" href="/dedupe/">
        엑셀 중복 제거
      </Link>
      를 쓰세요.
    </>
  ),
  lab: {
    sheetTitle: "예제 표 (1월 매출)",
    sheet: SALES,
    syntax: "=함수이름(인수1, 인수2, …)",
    defaultFormula: '=SUMIF(A2:A9,"영업1팀",D2:D9)',
    examples: [
      { label: "SUM", formula: "=SUM(D2:D9)", note: "D2부터 D9까지 매출을 모두 더합니다." },
      { label: "AVERAGE", formula: "=AVERAGE(D2:D9)", note: "매출 8건의 평균입니다." },
      { label: "COUNTIF", formula: '=COUNTIF(A2:A9,"영업1팀")', note: "부서가 영업1팀인 행의 개수입니다." },
      { label: "SUMIF", formula: '=SUMIF(A2:A9,"영업1팀",D2:D9)', note: "부서가 영업1팀인 행의 매출만 더합니다." },
      { label: "IF", formula: '=IF(D2>=1000,"달성","미달")', note: "D2가 1,000 이상이면 ‘달성’, 아니면 ‘미달’입니다." },
      { label: "VLOOKUP", formula: '=VLOOKUP("정우진",B2:D9,3,FALSE)', note: "B열에서 정우진을 찾아 B~D 중 셋째 열(매출)을 가져옵니다." },
    ],
    tasks: [
      { q: "전체 매출 합계를 구하세요.", answer: "=SUM(D2:D9)", mustUse: ["SUM"], hint: "매출이 든 D2:D9를 모두 더해 보세요." },
      { q: "가장 큰 매출을 구하세요.", answer: "=MAX(D2:D9)", mustUse: ["MAX"], hint: "가장 큰 값은 MAX 함수입니다." },
      {
        q: "마케팅팀이 몇 행인지 세세요.",
        answer: '=COUNTIF(A2:A9,"마케팅팀")',
        mustUse: ["COUNTIF"],
        hint: "부서 열(A2:A9)에서 \"마케팅팀\"을 세어 보세요.",
      },
    ],
  },
};

/* ───────── SUMIF ───────── */

export const SUMIF_LESSON: FunctionLesson = {
  id: "fn-sumif",
  meta: {
    path: "/functions/sumif/",
    h1: "SUMIF 함수 사용법",
    title: "SUMIF 함수 사용법 - 조건에 맞는 값만 더하기 (SUMIFS 포함)",
    description:
      "엑셀 SUMIF 함수로 부서별·거래처별·품목별 합계를 구하는 방법입니다. 같은 값, 이상·이하, 와일드카드 조건과 조건이 여러 개인 SUMIFS까지 예제 표에 직접 입력해 보며 익힐 수 있습니다.",
    keywords: [
      "SUMIF",
      "SUMIF 함수",
      "엑셀 SUMIF",
      "SUMIF 사용법",
      "SUMIFS",
      "SUMIFS 함수",
      "엑셀 조건 합계",
      "엑셀 부서별 합계",
      "SUMIF 0 나옴",
    ],
    features: [
      "SUMIF 형식과 인수 설명",
      "같은 값·비교·와일드카드 조건",
      "SUMIFS로 조건 여러 개",
      "예제 표에 수식을 입력하면 바로 계산",
      "결과가 0일 때 확인할 것",
      "연습 문제와 채점",
    ],
  },
  ogImage: "/og-sumif.png",
  ogAlt: "SUMIF 함수 연습장 화면",
  lede: "SUMIF는 조건에 맞는 행의 값만 더하는 함수입니다. 아래 예제 표에 수식을 입력하면 바로 계산하고, 수식이 가리키는 칸을 표에 표시합니다.",
  guideTitle: "SUMIF 함수 사용법",
  guides: [
    {
      id: "syntax",
      title: "SUMIF 함수 형식",
      body: "=SUMIF(조건 범위, 조건, 더할 범위). 조건 범위에서 조건에 맞는 행을 찾아 같은 행의 더할 범위 값을 더합니다. 조건 범위와 더할 범위는 행 수가 같아야 합니다.",
      input: '=SUMIF(A2:A9,"영업1팀",D2:D9)',
      output: "3,560",
    },
    {
      id: "compare",
      title: "이상·이하 조건",
      body: "비교 연산자(>=, <=, >, <, <>)는 큰따옴표 안에 숫자와 함께 적습니다. 조건 범위와 더할 범위가 같으면 더할 범위를 생략할 수 있습니다.",
      input: '=SUMIF(D2:D9,">=1000")',
      output: "6,110",
    },
    {
      id: "cell-criteria",
      title: "조건을 다른 칸에서 가져오기",
      body: "조건 값을 칸에 적어 두고 참조하면 칸만 바꿔 다른 합계를 볼 수 있습니다. 비교 연산자는 따옴표로 쓰고 &로 칸과 잇습니다.",
      input: '=SUMIF(D2:D9,">="&D3)',
      output: "7,090",
    },
    {
      id: "wildcard",
      title: "‘포함’ 조건: 와일드카드",
      body: "*는 글자 여러 개, ?는 글자 한 개를 뜻합니다. \"영업*\"은 영업으로 시작하는 값, \"*팀\"은 팀으로 끝나는 값, \"*서울*\"은 서울이 들어간 값입니다.",
      input: '=SUMIF(A2:A9,"영업*",D2:D9)',
      output: "6,610",
    },
    {
      id: "sumifs",
      title: "조건이 여러 개면 SUMIFS",
      body: "SUMIFS는 더할 범위가 맨 앞에 오고, 조건 범위와 조건을 짝지어 계속 적습니다. 모든 조건을 동시에 만족하는 행만 더합니다.",
      input: '=SUMIFS(D2:D9,A2:A9,"영업1팀",C2:C9,"서울")',
      output: "2,250",
    },
    {
      id: "zero",
      title: "결과가 0으로 나올 때",
      body: "조건 글자에 공백이 섞여 있거나(\"영업1팀 \"), 표의 숫자가 텍스트 형식으로 저장돼 있거나(칸 왼쪽 위 초록 삼각형), 조건 범위와 더할 범위가 어긋나 있으면 0이 나옵니다.",
      input: '=SUMIF(A2:A9,"영업1팀 ",D2:D9)',
      output: "0",
    },
  ],
  faq: [
    faq(
      "SUMIF와 SUMIFS는 무엇이 다른가요?",
      "SUMIF는 조건 하나, SUMIFS는 조건 여러 개를 씁니다. 인수 순서도 달라서 SUMIF는 더할 범위가 맨 뒤, SUMIFS는 맨 앞에 옵니다. 조건이 하나여도 SUMIFS를 쓸 수 있어서 SUMIFS만 익혀 두는 사람도 많습니다.",
    ),
    faq(
      "SUMIF 결과가 0이 나와요.",
      "조건 글자와 표의 값이 정확히 같은지(앞뒤 공백, 띄어쓰기), 더할 칸의 숫자가 텍스트 형식이 아닌지, 조건 범위와 더할 범위가 같은 행에서 시작하는지 확인하세요. 텍스트 숫자는 칸을 선택한 뒤 경고 아이콘에서 ‘숫자로 변환’을 누르면 됩니다.",
    ),
    faq(
      "조건 중 하나라도 맞으면 더하려면(또는 조건)?",
      "SUMIF를 조건마다 하나씩 쓰고 더합니다. 예: =SUMIF(A2:A9,\"영업1팀\",D2:D9)+SUMIF(A2:A9,\"영업2팀\",D2:D9). SUMIFS는 모든 조건을 동시에 만족하는 행만 더하므로 ‘또는’에는 맞지 않습니다.",
    ),
    faq(
      "날짜 기간으로 합계를 구하려면?",
      "SUMIFS에 시작일과 종료일 조건을 둘 다 넣습니다. 예: =SUMIFS(D:D,A:A,\">=\"&F1,A:A,\"<=\"&G1). 날짜를 수식에 직접 적을 때는 \">=2026-01-01\"처럼 따옴표 안에 씁니다. 이 연습장은 날짜 계산을 지원하지 않으니 엑셀에서 확인하세요.",
    ),
    faq(
      "다른 시트의 데이터로 합계를 내려면?",
      "범위 앞에 시트 이름과 느낌표를 붙입니다. 예: =SUMIF(매출!A:A,\"영업1팀\",매출!D:D). 시트 이름에 공백이 있으면 '1월 매출'!A:A처럼 작은따옴표로 감쌉니다.",
    ),
  ],
  related: (
    <>
      조건에 맞는 개수를 세려면{" "}
      <Link className="inlineLink" href="/functions/countif/">
        COUNTIF 함수 사용법
      </Link>
      을, 이름별 합계를 피벗 테이블로 한 번에 내는 방법은{" "}
      <Link className="inlineLink" href="/blog/excel-sum-by-name/">
        엑셀 이름별 합계 구하기
      </Link>
      를, 다른 함수는{" "}
      <Link className="inlineLink" href="/functions/">
        엑셀 함수 정리
      </Link>
      를 보세요.
    </>
  ),
  lab: {
    sheetTitle: "예제 표 (1월 매출)",
    sheet: SALES,
    syntax: "=SUMIF(조건 범위, 조건, [더할 범위])",
    defaultFormula: '=SUMIF(A2:A9,"영업1팀",D2:D9)',
    examples: [
      { label: "부서별 합계", formula: '=SUMIF(A2:A9,"영업1팀",D2:D9)', note: "A열이 영업1팀인 행(2·4·7행)의 D열 매출을 더합니다." },
      { label: "1,000 이상만", formula: '=SUMIF(D2:D9,">=1000")', note: "조건 범위와 더할 범위가 같아 셋째 인수를 생략했습니다." },
      { label: "영업으로 시작", formula: '=SUMIF(A2:A9,"영업*",D2:D9)', note: "*는 아무 글자나 여러 개를 뜻합니다. 영업1팀과 영업2팀을 함께 더합니다." },
      { label: "조건 칸 참조", formula: '=SUMIF(C2:C9,C2,D2:D9)', note: "조건에 C2 칸(서울)을 넣었습니다. C2 값을 바꾸면 다른 지역 합계가 됩니다." },
      { label: "SUMIFS 두 조건", formula: '=SUMIFS(D2:D9,A2:A9,"영업1팀",C2:C9,"서울")', note: "영업1팀이면서 서울인 행만 더합니다. 더할 범위가 맨 앞입니다." },
    ],
    tasks: [
      { q: "영업2팀의 매출 합계를 구하세요.", answer: '=SUMIF(A2:A9,"영업2팀",D2:D9)', mustUse: ["SUMIF"], hint: "조건 범위는 부서(A2:A9), 더할 범위는 매출(D2:D9)입니다." },
      { q: "서울 지역의 매출 합계를 구하세요.", answer: '=SUMIF(C2:C9,"서울",D2:D9)', mustUse: ["SUMIF"], hint: "지역은 C열입니다." },
      { q: "매출이 1,000 미만인 값만 더하세요.", answer: '=SUMIF(D2:D9,"<1000")', mustUse: ["SUMIF"], hint: "조건은 \"<1000\"처럼 따옴표 안에 적습니다." },
      { q: "마케팅팀이 아닌 부서의 매출 합계를 구하세요.", answer: '=SUMIF(A2:A9,"<>마케팅팀",D2:D9)', mustUse: ["SUMIF"], hint: "‘같지 않음’은 <> 입니다." },
    ],
  },
};

/* ───────── COUNTIF ───────── */

export const COUNTIF_LESSON: FunctionLesson = {
  id: "fn-countif",
  meta: {
    path: "/functions/countif/",
    h1: "COUNTIF 함수 사용법",
    title: "COUNTIF 함수 사용법 - 조건에 맞는 개수 세기, 중복 확인",
    description:
      "엑셀 COUNTIF 함수로 조건에 맞는 칸의 개수를 세는 방법입니다. 같은 값, 이상·이하, 빈칸·빈칸 아님, 와일드카드 조건과 중복값 찾기, 조건 여러 개인 COUNTIFS까지 예제 표에 직접 입력해 보며 익힐 수 있습니다.",
    keywords: [
      "COUNTIF",
      "COUNTIF 함수",
      "엑셀 COUNTIF",
      "COUNTIF 사용법",
      "COUNTIFS",
      "엑셀 개수 세기",
      "엑셀 조건 개수",
      "COUNTIF 중복",
      "엑셀 빈칸 개수",
    ],
    features: [
      "COUNTIF 형식과 인수 설명",
      "같은 값·비교·빈칸·와일드카드 조건",
      "COUNTIF로 중복값 찾기",
      "COUNTIFS로 조건 여러 개",
      "예제 표에 수식을 입력하면 바로 계산",
      "연습 문제와 채점",
    ],
  },
  ogImage: "/og-countif.png",
  ogAlt: "COUNTIF 함수 연습장 화면",
  lede: "COUNTIF는 범위에서 조건에 맞는 칸이 몇 개인지 세는 함수입니다. 아래 예제 표에 수식을 입력하면 바로 계산하고, 수식이 가리키는 칸을 표에 표시합니다.",
  guideTitle: "COUNTIF 함수 사용법",
  guides: [
    {
      id: "syntax",
      title: "COUNTIF 함수 형식",
      body: "=COUNTIF(범위, 조건). 범위에서 조건에 맞는 칸의 개수를 돌려줍니다. 글자 조건은 큰따옴표로 감싸고, 대소문자는 구분하지 않습니다.",
      input: '=COUNTIF(C2:C10,"영업팀")',
      output: "4",
    },
    {
      id: "compare",
      title: "이상·미만 조건",
      body: "\">=80\"처럼 비교 연산자를 숫자와 함께 따옴표 안에 적습니다. 빈칸과 글자는 숫자 조건에 세지 않습니다.",
      input: '=COUNTIF(E2:E10,">=80")',
      output: "4",
    },
    {
      id: "blank",
      title: "빈칸·빈칸 아닌 칸 세기",
      body: "\"\"는 빈칸, \"<>\"는 비어 있지 않은 칸입니다. 점수를 아직 넣지 않은 사람 수처럼 빠진 값을 찾을 때 씁니다.",
      input: '=COUNTIF(E2:E10,"")',
      output: "2",
    },
    {
      id: "duplicate",
      title: "중복값 찾기",
      body: "범위에서 지금 칸의 값을 세면 그 값이 몇 번 나오는지 알 수 있습니다. 2 이상이면 중복입니다. 옆 열에 =COUNTIF($A$2:$A$10,A2)>1을 넣고 채우면 중복 행에 TRUE가 표시됩니다.",
      input: "=COUNTIF(A2:A10,A7)",
      output: "2",
    },
    {
      id: "wildcard",
      title: "‘포함’ 조건: 와일드카드",
      body: "*는 글자 여러 개, ?는 글자 한 개입니다. \"*팀\"은 팀으로 끝나는 값, \"E-100?\"은 E-100 뒤에 한 글자가 붙은 값입니다.",
      input: '=COUNTIF(A2:A10,"E-100?")',
      output: "9",
    },
    {
      id: "countifs",
      title: "조건이 여러 개면 COUNTIFS",
      body: "범위와 조건을 짝지어 계속 적습니다. 모든 조건을 동시에 만족하는 행만 셉니다.",
      input: '=COUNTIFS(C2:C10,"영업팀",D2:D10,"O")',
      output: "3",
    },
  ],
  faq: [
    faq(
      "COUNT, COUNTA, COUNTIF는 무엇이 다른가요?",
      "COUNT는 숫자가 든 칸, COUNTA는 비어 있지 않은 모든 칸, COUNTIF는 조건에 맞는 칸을 셉니다. 명단 인원은 COUNTA, 특정 부서 인원은 COUNTIF로 셉니다.",
    ),
    faq(
      "COUNTIF 결과가 0이 나와요.",
      "조건 글자와 표의 값이 정확히 같은지(앞뒤 공백, 띄어쓰기) 확인하세요. 숫자 조건인데 표의 숫자가 텍스트 형식이면 세지 않을 수 있습니다. 일부만 같아도 세려면 \"*영업*\"처럼 와일드카드를 쓰세요.",
    ),
    faq(
      "중복된 값만 표시하려면?",
      "옆 열에 =COUNTIF($A$2:$A$10,A2)>1을 넣고 아래로 채우면 중복 행에 TRUE가 나옵니다. 범위에 $를 붙여야 아래로 채워도 범위가 움직이지 않습니다. 수식 없이 중복을 지우거나 셀 수도 있습니다.",
    ),
    faq(
      "‘또는’ 조건으로 세려면?",
      "COUNTIF를 조건마다 하나씩 쓰고 더합니다. 예: =COUNTIF(C2:C10,\"영업팀\")+COUNTIF(C2:C10,\"개발팀\"). COUNTIFS는 모든 조건을 동시에 만족하는 행만 셉니다.",
    ),
    faq(
      "물음표나 별표 글자 자체를 세려면?",
      "와일드카드로 읽히지 않게 앞에 물결표를 붙입니다. 예: \"~*\"는 별표 글자 그대로, \"~?\"는 물음표 글자 그대로를 찾습니다.",
    ),
  ],
  related: (
    <>
      조건에 맞는 값을 더하려면{" "}
      <Link className="inlineLink" href="/functions/sumif/">
        SUMIF 함수 사용법
      </Link>
      을, 수식 없이 중복값을 지우거나 값마다 개수를 세려면{" "}
      <Link className="inlineLink" href="/dedupe/">
        엑셀 중복 제거
      </Link>
      를, 다른 함수는{" "}
      <Link className="inlineLink" href="/functions/">
        엑셀 함수 정리
      </Link>
      를 보세요.
    </>
  ),
  lab: {
    sheetTitle: "예제 표 (교육 출석)",
    sheet: ATTEND,
    syntax: "=COUNTIF(범위, 조건)",
    defaultFormula: '=COUNTIF(C2:C10,"영업팀")',
    examples: [
      { label: "부서 인원", formula: '=COUNTIF(C2:C10,"영업팀")', note: "C열에서 영업팀인 칸을 셉니다." },
      { label: "80점 이상", formula: '=COUNTIF(E2:E10,">=80")', note: "빈칸은 숫자 조건에 세지 않습니다." },
      { label: "빈칸 세기", formula: '=COUNTIF(E2:E10,"")', note: "점수가 비어 있는 사람(결석자) 수입니다." },
      { label: "중복 확인", formula: "=COUNTIF(A2:A10,A7)", note: "A7의 사번 E-1006이 몇 번 나오는지 셉니다. 2 이상이면 중복 입력입니다." },
      { label: "COUNTIFS", formula: '=COUNTIFS(C2:C10,"영업팀",D2:D10,"O")', note: "영업팀이면서 출석이 O인 사람만 셉니다." },
    ],
    tasks: [
      { q: "출석(O)한 사람은 몇 명인가요?", answer: '=COUNTIF(D2:D10,"O")', mustUse: ["COUNTIF"], hint: "출석 열은 D열입니다." },
      { q: "개발팀은 몇 명인가요?", answer: '=COUNTIF(C2:C10,"개발팀")', mustUse: ["COUNTIF"], hint: "부서 열(C2:C10)에서 \"개발팀\"을 세어 보세요." },
      { q: "점수가 70점 미만인 사람은 몇 명인가요?", answer: '=COUNTIF(E2:E10,"<70")', mustUse: ["COUNTIF"], hint: "조건은 \"<70\"처럼 따옴표 안에 적습니다." },
      { q: "인사팀이 아닌 사람은 몇 명인가요?", answer: '=COUNTIF(C2:C10,"<>인사팀")', mustUse: ["COUNTIF"], hint: "‘같지 않음’은 <> 입니다." },
    ],
  },
};

/* ───────── VLOOKUP ───────── */

export const VLOOKUP_LESSON: FunctionLesson = {
  id: "fn-vlookup",
  meta: {
    path: "/functions/vlookup/",
    h1: "VLOOKUP 함수 사용법",
    title: "VLOOKUP 함수 사용법 - 코드로 값 찾아오기, #N/A 해결",
    description:
      "엑셀 VLOOKUP 함수로 상품코드·사번으로 단가와 이름을 찾아오는 방법입니다. 정확히 일치(FALSE)와 구간 찾기(TRUE), #N/A·#REF! 오류 해결, IFERROR, INDEX·MATCH와 XLOOKUP까지 예제 표에 직접 입력해 보며 익힐 수 있습니다.",
    keywords: [
      "VLOOKUP",
      "VLOOKUP 함수",
      "엑셀 VLOOKUP",
      "VLOOKUP 사용법",
      "브이룩업",
      "VLOOKUP #N/A",
      "VLOOKUP 오류",
      "VLOOKUP FALSE",
      "엑셀 값 찾기",
    ],
    features: [
      "VLOOKUP 형식과 인수 설명",
      "정확히 일치(FALSE)와 구간 찾기(TRUE)",
      "#N/A·#REF! 오류 이유 설명",
      "IFERROR로 못 찾은 값 처리",
      "INDEX·MATCH, XLOOKUP 비교",
      "연습 문제와 채점",
    ],
  },
  ogImage: "/og-vlookup.png",
  ogAlt: "VLOOKUP 함수 연습장 화면",
  lede: "VLOOKUP은 표의 첫 열에서 값을 찾아 같은 행의 다른 열 값을 가져오는 함수입니다. 아래 예제 표에 수식을 입력하면 바로 계산하고, #N/A가 나면 이유를 알려 줍니다.",
  guideTitle: "VLOOKUP 함수 사용법",
  guides: [
    {
      id: "syntax",
      title: "VLOOKUP 함수 형식",
      body: "=VLOOKUP(찾을 값, 표 범위, 열 번호, FALSE). 표 범위의 첫 열에서 찾을 값을 찾고, 그 행에서 표 범위 기준 열 번호째 값을 가져옵니다. 열 번호는 시트의 열이 아니라 표 범위 안에서 셉니다.",
      input: '=VLOOKUP("B-20011",A2:E8,4,FALSE)',
      output: "6,200",
    },
    {
      id: "false",
      title: "마지막 인수는 FALSE",
      body: "코드·이름처럼 정확히 같은 값을 찾을 때는 마지막 인수에 FALSE(또는 0)를 적습니다. 생략하면 TRUE로 계산해 정렬되지 않은 표에서 엉뚱한 값을 가져올 수 있습니다.",
      input: '=VLOOKUP("C-30102",A2:E8,2,FALSE)',
      output: "포스트잇",
    },
    {
      id: "true",
      title: "구간 찾기는 TRUE",
      body: "할인율·등급표처럼 구간의 시작값이 오름차순으로 정렬된 표에서는 TRUE를 씁니다. 찾을 값보다 작거나 같은 값 중 가장 큰 행을 가져옵니다.",
      input: "=VLOOKUP(350000,G2:H5,2,TRUE)",
      output: "5",
    },
    {
      id: "na",
      title: "#N/A가 나올 때",
      body: "찾을 값이 표의 첫 열에 없을 때 납니다. 앞뒤 공백, 숫자와 텍스트 형식 차이(1001과 \"1001\"), 찾는 열이 표 범위의 첫 열이 아닌 경우를 확인하세요. 없을 수 있는 값이면 IFERROR로 감쌉니다.",
      input: '=IFERROR(VLOOKUP("Z-99999",A2:E8,2,FALSE),"없는 코드")',
      output: "없는 코드",
    },
    {
      id: "ref",
      title: "#REF!가 나올 때",
      body: "열 번호가 표 범위의 열 수보다 크면 납니다. A2:C8은 3열이라 열 번호 4를 쓸 수 없습니다. 표 범위를 가져올 열까지 넓히세요.",
      input: '=VLOOKUP("A-10234",A2:C8,4,FALSE)',
      output: "#REF!",
    },
    {
      id: "index-match",
      title: "왼쪽 열을 가져오려면 INDEX·MATCH",
      body: "VLOOKUP은 찾는 열의 오른쪽만 가져옵니다. 상품명으로 코드를 찾는 것처럼 왼쪽 값이 필요하면 INDEX·MATCH나 XLOOKUP을 씁니다.",
      input: '=INDEX(A2:A8,MATCH("계산기",B2:B8,0))',
      output: "D-40007",
    },
  ],
  faq: [
    faq(
      "VLOOKUP 결과가 #N/A예요.",
      "찾을 값이 표 범위의 첫 열에 정확히 같은 모양으로 있어야 합니다. 앞뒤 공백(TRIM으로 제거), 숫자가 텍스트로 저장된 경우(칸 왼쪽 위 초록 삼각형), 찾는 열이 표 범위 첫 열이 아닌 경우가 대부분입니다. 마지막 인수가 FALSE인지도 확인하세요.",
    ),
    faq(
      "마지막 인수 TRUE와 FALSE는 무엇이 다른가요?",
      "FALSE(또는 0)는 정확히 같은 값만 찾고, TRUE(또는 생략)는 찾을 값보다 작거나 같은 값 중 가장 가까운 값을 찾습니다. 코드·이름은 FALSE, 점수 구간·할인율 구간처럼 정렬된 구간표는 TRUE를 씁니다.",
    ),
    faq(
      "수식을 아래로 채우니 결과가 이상해요.",
      "표 범위에 $를 붙여 고정하세요. A2:E8은 아래로 채우면 A3:E9, A4:E10으로 움직입니다. $A$2:$E$8로 쓰거나 범위를 선택한 뒤 F4를 누르면 고정됩니다.",
    ),
    faq(
      "VLOOKUP 대신 XLOOKUP을 써도 되나요?",
      "엑셀 2021·Microsoft 365라면 XLOOKUP이 더 편합니다. 찾을 범위와 가져올 범위를 따로 적어 왼쪽 열도 가져오고, 기본이 정확히 일치이며, 못 찾았을 때 보일 값을 넷째 인수로 정할 수 있습니다. 엑셀 2016 이하와 파일을 주고받는다면 VLOOKUP이나 INDEX·MATCH를 쓰세요.",
    ),
    faq(
      "다른 시트의 표에서 찾으려면?",
      "표 범위 앞에 시트 이름과 느낌표를 붙입니다. 예: =VLOOKUP(A2,단가표!$A$2:$E$100,4,FALSE). 다른 파일이면 그 파일을 연 상태에서 범위를 마우스로 선택하면 경로가 자동으로 들어갑니다.",
    ),
  ],
  related: (
    <>
      조건에 맞는 값을 더하려면{" "}
      <Link className="inlineLink" href="/functions/sumif/">
        SUMIF 함수 사용법
      </Link>
      을, 두 목록에서 같은 값과 다른 값을 수식 없이 찾는 방법은{" "}
      <Link className="inlineLink" href="/blog/excel-compare-lists/">
        엑셀 두 목록 비교
      </Link>
      를, 다른 함수는{" "}
      <Link className="inlineLink" href="/functions/">
        엑셀 함수 정리
      </Link>
      를 보세요.
    </>
  ),
  lab: {
    sheetTitle: "예제 표 (상품 단가표)",
    sheet: PRICE,
    syntax: "=VLOOKUP(찾을 값, 표 범위, 열 번호, [FALSE=정확히 일치])",
    defaultFormula: '=VLOOKUP("B-20011",A2:E8,4,FALSE)',
    examples: [
      { label: "단가 찾기", formula: '=VLOOKUP("B-20011",A2:E8,4,FALSE)', note: "A열에서 B-20011을 찾아 A~E 중 넷째 열(단가)을 가져옵니다." },
      { label: "상품명 찾기", formula: "=VLOOKUP(A7,A2:E8,2,FALSE)", note: "찾을 값에 A7 칸을 넣었습니다. 칸 값을 바꾸면 결과도 바뀝니다." },
      { label: "구간 찾기(TRUE)", formula: "=VLOOKUP(350000,G2:H5,2,TRUE)", note: "350,000원은 300,000 이상 500,000 미만 구간이라 할인율 5를 가져옵니다." },
      { label: "#N/A 처리", formula: '=IFERROR(VLOOKUP("Z-99999",A2:E8,2,FALSE),"없는 코드")', note: "없는 코드를 찾으면 #N/A 대신 ‘없는 코드’를 보여 줍니다." },
      { label: "XLOOKUP", formula: '=XLOOKUP("볼펜",B2:B8,A2:A8)', note: "상품명(B열)으로 왼쪽의 상품코드(A열)를 가져옵니다. VLOOKUP으로는 안 되는 방향입니다." },
    ],
    tasks: [
      { q: "상품코드 D-40007의 단가를 찾으세요.", answer: '=VLOOKUP("D-40007",A2:E8,4,FALSE)', mustUse: ["VLOOKUP"], hint: "단가는 표 범위 A2:E8의 넷째 열입니다." },
      { q: "상품코드 A-10235의 재고를 찾으세요.", answer: '=VLOOKUP("A-10235",A2:E8,5,FALSE)', mustUse: ["VLOOKUP"], hint: "재고는 다섯째 열입니다." },
      { q: "구매액이 120,000원일 때 할인율(%)을 할인율 표(G2:H5)에서 찾으세요.", answer: "=VLOOKUP(120000,G2:H5,2,TRUE)", mustUse: ["VLOOKUP"], hint: "구간 찾기는 마지막 인수를 TRUE로 적습니다." },
      {
        q: "상품코드 X-10001의 상품명을 찾고, 없으면 ‘확인 필요’를 보여 주세요.",
        answer: '=IFERROR(VLOOKUP("X-10001",A2:E8,2,FALSE),"확인 필요")',
        mustUse: ["VLOOKUP", "IFERROR"],
        hint: "VLOOKUP을 IFERROR로 감싸 보세요.",
      },
    ],
  },
};

/* ───────── IF ───────── */

export const IF_LESSON: FunctionLesson = {
  id: "fn-if",
  meta: {
    path: "/functions/if/",
    h1: "IF 함수 사용법",
    title: "IF 함수 사용법 - 조건에 따라 다른 값, 중첩 IF·AND·OR",
    description:
      "엑셀 IF 함수로 목표 달성·미달, 합격·불합격처럼 조건에 따라 다른 값을 넣는 방법입니다. 비교 연산자, 중첩 IF와 IFS, AND·OR로 조건 여러 개, 빈칸 처리까지 예제 표에 직접 입력해 보며 익힐 수 있습니다.",
    keywords: [
      "IF 함수",
      "엑셀 IF",
      "엑셀 IF 함수",
      "IF 함수 사용법",
      "중첩 IF",
      "IF AND",
      "IF OR",
      "IFS 함수",
      "엑셀 조건문",
    ],
    features: [
      "IF 형식과 비교 연산자",
      "중첩 IF와 IFS로 등급 나누기",
      "AND·OR로 조건 여러 개",
      "빈칸일 때 다른 값 넣기",
      "예제 표에 수식을 입력하면 바로 계산",
      "연습 문제와 채점",
    ],
  },
  ogImage: "/og-if.png",
  ogAlt: "IF 함수 연습장 화면",
  lede: "IF는 조건이 맞으면 한 값, 아니면 다른 값을 넣는 함수입니다. 아래 예제 표에 수식을 입력하면 바로 계산하고, 수식이 가리키는 칸을 표에 표시합니다.",
  guideTitle: "IF 함수 사용법",
  guides: [
    {
      id: "syntax",
      title: "IF 함수 형식",
      body: "=IF(조건, 참일 때 값, 거짓일 때 값). 조건에는 D2>=E2처럼 비교식을 적습니다. 결과로 글자를 넣을 때는 큰따옴표로 감쌉니다.",
      input: '=IF(D2>=E2,"달성","미달")',
      output: "달성",
    },
    {
      id: "operators",
      title: "비교 연산자",
      body: "= 같음, <> 같지 않음, > 큼, < 작음, >= 이상, <= 이하입니다. 글자 비교는 B2=\"김민준\"처럼 따옴표로 감싸고, 대소문자는 구분하지 않습니다.",
      input: '=IF(D4>=E4,"달성","미달")',
      output: "미달",
    },
    {
      id: "calc",
      title: "결과로 계산식 넣기",
      body: "참·거짓일 때 값에 글자 대신 계산식을 넣을 수 있습니다. 목표를 넘긴 만큼만 보여 주고 못 넘기면 0을 넣는 식입니다.",
      input: "=IF(D2>E2,D2-E2,0)",
      output: "50",
    },
    {
      id: "nested",
      title: "등급 나누기: 중첩 IF·IFS",
      body: "IF의 거짓일 때 값에 IF를 또 넣으면 세 가지 이상으로 나눌 수 있습니다. 큰 기준부터 차례로 적습니다. 엑셀 2019 이후에는 IFS로 더 짧게 씁니다.",
      input: '=IF(D6>=1500,"S",IF(D6>=1300,"A","B"))',
      output: "S",
    },
    {
      id: "and-or",
      title: "조건 여러 개: AND·OR",
      body: "AND(조건1, 조건2)는 모두 맞을 때, OR(조건1, 조건2)는 하나라도 맞을 때 참입니다. IF의 첫 인수 자리에 넣습니다.",
      input: '=IF(AND(C6>=E6,D6>=E6),"연속 달성","-")',
      output: "연속 달성",
    },
    {
      id: "blank",
      title: "빈칸이면 다른 값",
      body: "칸이 비었는지는 D5=\"\"로 확인합니다. 아직 입력하지 않은 칸 때문에 계산 결과가 이상하게 나오는 것을 막을 때 씁니다.",
      input: '=IF(D5="","미입력",D5-C5)',
      output: "미입력",
    },
  ],
  faq: [
    faq(
      "IF 결과가 FALSE로 나와요.",
      "거짓일 때 값을 적지 않으면 조건이 맞지 않을 때 FALSE가 나옵니다. 셋째 인수에 \"\"(빈 글자)나 0, 원하는 글자를 적으세요.",
    ),
    faq(
      "IF 안에 글자를 넣었더니 #NAME?이 나와요.",
      "결과나 비교에 쓰는 글자는 반드시 큰따옴표로 감싸야 합니다. =IF(D2>=E2,달성,미달)은 #NAME?이 나고 =IF(D2>=E2,\"달성\",\"미달\")처럼 적어야 합니다.",
    ),
    faq(
      "IF는 몇 개까지 중첩할 수 있나요?",
      "엑셀은 64개까지 중첩할 수 있지만 3~4개를 넘으면 읽기 어렵습니다. 등급처럼 구간이 많으면 IFS를 쓰거나, 구간표를 만들어 VLOOKUP의 TRUE(구간 찾기)로 가져오는 편이 고치기 쉽습니다.",
    ),
    faq(
      "‘포함하면’ 조건은 어떻게 쓰나요?",
      "IF는 와일드카드(*)를 바로 쓰지 못합니다. =IF(COUNTIF(B2,\"*서울*\")>0,\"서울\",\"기타\")처럼 COUNTIF로 포함 여부를 확인하거나, ISNUMBER(SEARCH(\"서울\",B2))를 조건에 넣습니다.",
    ),
    faq(
      "오류가 날 때만 다른 값을 넣으려면?",
      "IF 대신 IFERROR를 씁니다. =IFERROR(D2/C2,0)은 C2가 0이거나 비어 #DIV/0!이 나면 0을 보여 줍니다.",
    ),
  ],
  related: (
    <>
      조건에 맞는 값만 더하려면{" "}
      <Link className="inlineLink" href="/functions/sumif/">
        SUMIF 함수 사용법
      </Link>
      을, 구간표에서 등급을 가져오려면{" "}
      <Link className="inlineLink" href="/functions/vlookup/">
        VLOOKUP 함수 사용법
      </Link>
      을, 다른 함수는{" "}
      <Link className="inlineLink" href="/functions/">
        엑셀 함수 정리
      </Link>
      를 보세요.
    </>
  ),
  lab: {
    sheetTitle: "예제 표 (분기 실적)",
    sheet: PERF,
    syntax: "=IF(조건, 참일 때 값, 거짓일 때 값)",
    defaultFormula: '=IF(D2>=E2,"달성","미달")',
    examples: [
      { label: "달성·미달", formula: '=IF(D2>=E2,"달성","미달")', note: "김민준의 2분기 1,350이 목표 1,300 이상이라 ‘달성’입니다." },
      { label: "초과분 계산", formula: "=IF(D2>E2,D2-E2,0)", note: "목표를 넘긴 만큼을, 못 넘기면 0을 넣습니다." },
      { label: "중첩 IF 등급", formula: '=IF(D6>=1500,"S",IF(D6>=1300,"A","B"))', note: "1,500 이상 S, 1,300 이상 A, 나머지 B입니다. 큰 기준부터 적습니다." },
      { label: "IFS 등급", formula: '=IFS(D6>=1500,"S",D6>=1300,"A",TRUE,"B")', note: "마지막 조건에 TRUE를 넣으면 ‘그 밖의 경우’가 됩니다." },
      { label: "AND 두 조건", formula: '=IF(AND(C6>=E6,D6>=E6),"연속 달성","-")', note: "1분기와 2분기 모두 목표 이상일 때만 ‘연속 달성’입니다." },
      { label: "빈칸 처리", formula: '=IF(D5="","미입력",D5-C5)', note: "최유나의 2분기 칸이 비어 있어 ‘미입력’이 나옵니다." },
    ],
    tasks: [
      {
        q: "이서연(3행)의 2분기 실적이 목표 이상이면 ‘달성’, 아니면 ‘미달’을 표시하세요.",
        answer: '=IF(D3>=E3,"달성","미달")',
        mustUse: ["IF"],
        hint: "2분기는 D열, 목표는 E열입니다.",
      },
      {
        q: "박지호(4행)의 2분기 실적이 1분기보다 작으면 ‘감소’, 아니면 ‘유지’를 표시하세요.",
        answer: '=IF(D4<C4,"감소","유지")',
        mustUse: ["IF"],
        hint: "D4<C4를 조건으로 적어 보세요.",
      },
      {
        q: "김민준(2행)이 1분기·2분기 중 한 번이라도 목표 이상이면 ‘O’, 아니면 ‘X’를 표시하세요.",
        answer: '=IF(OR(C2>=E2,D2>=E2),"O","X")',
        mustUse: ["IF", "OR"],
        hint: "‘하나라도’는 OR입니다.",
      },
      {
        q: "정우진(6행)의 2분기 실적을 1,500 이상 ‘S’, 1,300 이상 ‘A’, 나머지 ‘B’로 나누세요.",
        answer: '=IF(D6>=1500,"S",IF(D6>=1300,"A","B"))',
        mustUse: ["IF|IFS"],
        hint: "IF 안에 IF를 하나 더 넣으세요(또는 IFS).",
      },
    ],
  },
};

export const FUNCTION_LESSONS: FunctionLesson[] = [SUMIF_LESSON, COUNTIF_LESSON, VLOOKUP_LESSON, IF_LESSON];

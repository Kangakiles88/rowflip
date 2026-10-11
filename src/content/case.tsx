import Link from "next/link";
import type { FaqItem, Guide } from "./seo";

export const CASE_META = {
  path: "/case/",
  h1: "대소문자 변환",
  title: "대소문자 변환 - 영어 대문자·소문자, camelCase·snake_case",
  description:
    "영문을 붙여넣으면 대문자, 소문자, 문장 첫 글자 대문자, 단어 첫 글자 대문자로 바로 바꿔 줍니다. 변수 이름용 camelCase, snake_case, kebab-case 변환도 됩니다. 설치 없이 브라우저에서 무료로 처리됩니다.",
  keywords: [
    "대소문자 변환",
    "영어 대문자 변환",
    "소문자 변환",
    "첫 글자 대문자",
    "camelCase 변환",
    "snake_case 변환",
    "영문 대소문자 바꾸기",
  ],
  features: [
    "대문자·소문자 변환",
    "문장 첫 글자·단어 첫 글자 대문자",
    "대소문자 반전",
    "camelCase·PascalCase·snake_case·kebab-case",
    "여러 줄을 줄마다 변환",
  ],
} as const;

export const CASE_GUIDES: Guide[] = [
  {
    id: "how-to-convert",
    title: "이 도구로 대소문자 바꾸기",
    body: "영문을 붙여넣고 아래에서 원하는 형식을 누르면 오른쪽 결과가 바로 바뀝니다. 한글·숫자·기호는 그대로 두고 영문 글자만 바꾸므로 한글과 영어가 섞인 글도 그대로 쓸 수 있습니다.",
    input: "monthly sales report",
    output: "MONTHLY SALES REPORT",
  },
  {
    id: "title-sentence",
    title: "제목·문장 첫 글자만 대문자로",
    body: "‘단어 첫 글자’는 낱말마다 첫 글자를 대문자로 바꿔 보고서 제목이나 메뉴 이름에 씁니다. ‘문장 첫 글자’는 마침표·물음표·느낌표 뒤의 첫 글자만 대문자로 바꿔, 전부 대문자로 쓰인 글을 보통 문장으로 되돌릴 때 씁니다.",
    input: "THE ORDER SHIPPED. PLEASE CHECK.",
    output: "The order shipped. Please check.",
  },
  {
    id: "code-names",
    title: "변수·파일 이름 형식으로 바꾸기",
    body: "엑셀 머리글이나 문장을 프로그램 변수·데이터베이스 열 이름으로 쓸 때는 아래쪽 형식을 고르세요. 띄어쓰기와 기호, 대소문자 경계를 기준으로 낱말을 나눈 뒤 각 형식의 규칙대로 이어 붙입니다.",
    input: "customer id\nORDER_STATUS",
    output: "customerId\norderStatus",
  },
  {
    id: "excel-functions",
    title: "엑셀 함수로 바꾸기",
    body: "엑셀 안에서는 =UPPER(A1)이 대문자, =LOWER(A1)이 소문자, =PROPER(A1)이 단어 첫 글자 대문자입니다. camelCase 같은 이름 형식은 함수로 만들기 번거로우니 이 도구에서 바꾼 뒤 붙여넣으세요.",
    input: "=PROPER(A1)",
    output: "Monthly Sales Report",
  },
];

export const CASE_FAQ: FaqItem[] = [
  {
    q: "여러 줄을 한꺼번에 바꿀 수 있나요?",
    plain:
      "네. 줄마다 따로 바꾸므로 엑셀에서 한 열을 복사해 붙여넣으면 결과도 같은 줄 수로 나옵니다. 그대로 복사해 엑셀에 다시 붙여넣으면 됩니다.",
    a: "네. 줄마다 따로 바꾸므로 엑셀에서 한 열을 복사해 붙여넣으면 결과도 같은 줄 수로 나옵니다. 그대로 복사해 엑셀에 다시 붙여넣으면 됩니다.",
  },
  {
    q: "약어(ID, URL)도 소문자가 되나요?",
    plain:
      "‘단어 첫 글자’와 ‘문장 첫 글자’는 나머지 글자를 소문자로 바꾸기 때문에 URL이 Url로 바뀝니다. 약어는 결과에서 직접 고쳐 주세요.",
    a: "‘단어 첫 글자’와 ‘문장 첫 글자’는 나머지 글자를 소문자로 바꾸기 때문에 URL이 Url로 바뀝니다. 약어는 결과에서 직접 고쳐 주세요.",
  },
  {
    q: "camelCase와 PascalCase는 무엇이 다른가요?",
    plain:
      "camelCase는 첫 낱말은 소문자로 시작하고(customerId), PascalCase는 첫 낱말도 대문자로 시작합니다(CustomerId). 보통 변수는 camelCase, 클래스 이름은 PascalCase를 씁니다.",
    a: "camelCase는 첫 낱말은 소문자로 시작하고(customerId), PascalCase는 첫 낱말도 대문자로 시작합니다(CustomerId). 보통 변수는 camelCase, 클래스 이름은 PascalCase를 씁니다.",
  },
  {
    q: "한글 자판으로 잘못 친 영어도 고칠 수 있나요?",
    plain: "한글로 쳐진 영어는 한영 타자 변환에서 ‘한글 → 영타’로 먼저 되돌린 뒤 여기서 대소문자를 바꾸세요.",
    a: (
      <>
        한글로 쳐진 영어는{" "}
        <Link className="inlineLink" href="/hanyang/">
          한영 타자 변환
        </Link>
        에서 ‘한글 → 영타’로 먼저 되돌린 뒤 여기서 대소문자를 바꾸세요.
      </>
    ),
  },
  {
    q: "입력한 글이 어딘가에 저장되나요?",
    plain:
      "아니요. 변환은 지금 열려 있는 브라우저 안에서만 처리되고, 입력한 글은 서버로 전송되거나 저장되지 않습니다. 마지막으로 고른 형식만 이 브라우저에 기억됩니다.",
    a: "아니요. 변환은 지금 열려 있는 브라우저 안에서만 처리되고, 입력한 글은 서버로 전송되거나 저장되지 않습니다. 마지막으로 고른 형식만 이 브라우저에 기억됩니다.",
  },
];

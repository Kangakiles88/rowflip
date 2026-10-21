/** 기능 묶음 — 헤더는 묶음별 펼침 메뉴(short), '다른 도구' 목록은 묶음별 제목(label) */
export const TOOL_GROUPS = [
  { id: "list", label: "엑셀·목록 도구", short: "엑셀·목록" },
  { id: "text", label: "텍스트 도구", short: "텍스트" },
  { id: "doc", label: "문서 만들기", short: "문서 만들기" },
] as const;

/** 사이트 안의 기능 페이지 목록 — 헤더 메뉴, 푸터, sitemap, '다른 도구' 목록이 모두 이 목록을 쓴다. */
export const TOOL_PAGES = [
  {
    id: "garosero",
    group: "list",
    href: "/",
    label: "가로세로 변환",
    title: "엑셀 가로세로 변환기",
    desc: "한 열 목록을 가로로, 줄바꿈을 쉼표로. SQL IN·JSON 배열 변환",
    priority: 1,
  },
  {
    id: "transpose",
    group: "list",
    href: "/transpose/",
    label: "행열 바꾸기",
    title: "엑셀 행열 바꾸기",
    desc: "표 전체의 행과 열을 바꿔 엑셀·CSV·마크다운 표로",
    priority: 0.9,
  },
  {
    id: "dedupe",
    group: "list",
    href: "/dedupe/",
    label: "중복 제거",
    title: "엑셀 중복 제거",
    desc: "중복값 지우기, 중복된 값 찾기, 값마다 개수 세기",
    priority: 0.9,
  },
  {
    id: "split",
    group: "list",
    href: "/split/",
    label: "쉼표 → 줄바꿈",
    title: "쉼표를 줄바꿈으로 변환",
    desc: "쉼표·띄어쓰기로 이어진 목록을 한 줄에 하나씩, 엑셀 칸으로",
    priority: 0.9,
  },
  {
    id: "cellsplit",
    group: "list",
    href: "/cell-split/",
    label: "셀 나누기",
    title: "엑셀 셀 나누기",
    desc: "한 칸의 주소·전화번호·이름을 여러 칸이나 여러 행으로",
    priority: 0.9,
  },
  {
    id: "count",
    group: "text",
    href: "/count/",
    label: "글자수 세기",
    title: "글자수 세기",
    desc: "공백 포함·제외 글자수, 바이트, 단어·줄 수, 목표 글자수",
    priority: 0.9,
  },
  {
    id: "linebreak",
    group: "text",
    href: "/linebreak/",
    label: "줄바꿈 제거",
    title: "줄바꿈 제거",
    desc: "PDF·웹에서 복사해 줄마다 끊긴 글을 한 문단으로",
    priority: 0.9,
  },
  {
    id: "diff",
    group: "text",
    href: "/diff/",
    label: "텍스트 비교",
    title: "텍스트 비교",
    desc: "두 글에서 바뀐 줄과 낱말을 색으로 표시",
    priority: 0.9,
  },
  {
    id: "hanyang",
    group: "text",
    href: "/hanyang/",
    label: "한영 변환",
    title: "한영 타자 변환",
    desc: "영타로 잘못 친 글을 한글로, 한글을 영문 자판으로",
    priority: 0.8,
  },
  {
    id: "case",
    group: "text",
    href: "/case/",
    label: "대소문자",
    title: "대소문자 변환",
    desc: "대문자·소문자·첫 글자 대문자, camelCase·snake_case",
    priority: 0.8,
  },
  {
    id: "estimate",
    group: "doc",
    href: "/estimate/",
    label: "견적서",
    title: "견적서 양식 작성",
    desc: "품목을 붙여넣으면 부가세·합계 계산, 인쇄·PDF 저장",
    priority: 0.9,
  },
  {
    id: "statement",
    group: "doc",
    href: "/statement/",
    label: "거래명세서",
    title: "거래명세서 양식 작성",
    desc: "납품 품목·잔액 계산, A4 한 장에 두 부 인쇄·PDF 저장",
    priority: 0.9,
  },
  {
    id: "certificate",
    group: "doc",
    href: "/certificate/",
    label: "상장 만들기",
    title: "엑셀로 상장·수료증 일괄 만들기",
    desc: "명단을 붙여넣어 상장·수료증·위촉장·감사장을 한 번에 인쇄",
    priority: 0.9,
  },
  {
    id: "amount",
    group: "doc",
    href: "/amount/",
    label: "금액 한글",
    title: "숫자 한글 변환",
    desc: "금액을 일금 ○○원정, 읽기 표기, 한자 갖은자로",
    priority: 0.9,
  },
] as const;

/** 헤더 메뉴 맨 오른쪽 링크 — 모든 페이지에서 블로그 목록으로 이어지게(검색 로봇도 따라감) */
export const BLOG_NAV = { href: "/blog/", label: "Blog" } as const;

/** 기능이 아닌 안내 페이지 — 푸터와 sitemap에만 들어간다 */
export const INFO_PAGES = [
  { id: "blog", href: "/blog/", label: "엑셀 작업 팁", priority: 0.6 },
  { id: "privacy", href: "/privacy/", label: "개인정보처리방침", priority: 0.3 },
] as const;

export type ToolPageId = (typeof TOOL_PAGES)[number]["id"];
export type ToolGroupId = (typeof TOOL_GROUPS)[number]["id"];
/** 헤더에서 현재 위치로 표시할 곳 — 기능 페이지 id 또는 블로그 */
export type NavCurrent = ToolPageId | "blog";

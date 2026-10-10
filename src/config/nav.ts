/** 사이트 안의 기능 페이지 목록 — 헤더 메뉴, 푸터, sitemap, '다른 도구' 목록이 모두 이 목록을 쓴다. */
export const TOOL_PAGES = [
  {
    id: "garosero",
    href: "/",
    label: "가로세로 변환",
    title: "엑셀 가로세로 변환기",
    desc: "한 열 목록을 가로로, 줄바꿈을 쉼표로. SQL IN·JSON 배열 변환",
    priority: 1,
  },
  {
    id: "transpose",
    href: "/transpose/",
    label: "행열 바꾸기",
    title: "엑셀 행열 바꾸기",
    desc: "표 전체의 행과 열을 바꿔 엑셀·CSV·마크다운 표로",
    priority: 0.9,
  },
  {
    id: "dedupe",
    href: "/dedupe/",
    label: "중복 제거",
    title: "엑셀 중복 제거",
    desc: "중복값 지우기, 중복된 값 찾기, 값마다 개수 세기",
    priority: 0.9,
  },
] as const;

/** 기능이 아닌 안내 페이지 — 푸터와 sitemap에만 들어간다 */
export const INFO_PAGES = [{ id: "privacy", href: "/privacy/", label: "개인정보처리방침", priority: 0.3 }] as const;

export type ToolPageId = (typeof TOOL_PAGES)[number]["id"];

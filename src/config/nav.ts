/** 사이트 안의 기능 페이지 목록 — 헤더 메뉴, 푸터, sitemap이 모두 이 목록을 쓴다. */
export const TOOL_PAGES = [
  { id: "garosero", href: "/", label: "가로세로 변환", priority: 1 },
  { id: "transpose", href: "/transpose/", label: "행열 바꾸기", priority: 0.9 },
] as const;

export type ToolPageId = (typeof TOOL_PAGES)[number]["id"];

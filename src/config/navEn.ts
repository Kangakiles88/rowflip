/**
 * 영어 페이지(/en/) 목록 — 영어 헤더·푸터·sitemap이 이 목록을 쓴다.
 * koHref는 같은 도구의 한국어 페이지(hreflang으로 서로 연결).
 */
export const EN_TOOL_PAGES = [
  {
    id: "column-to-comma",
    href: "/en/",
    koHref: "/",
    label: "Column to comma list",
    priority: 0.8,
  },
] as const;

export type EnPageId = (typeof EN_TOOL_PAGES)[number]["id"];

/** 한국어 주소 → 영어 주소 (영어판이 있는 페이지만) */
export const enHrefFor = (koHref: string): string | undefined =>
  EN_TOOL_PAGES.find((p) => p.koHref === koHref)?.href;

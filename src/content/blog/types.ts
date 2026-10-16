import type { ComponentType } from "react";
import type { ToolPageId } from "@/config/nav";

/** 블로그 글 하나의 정보 — 목록·글 페이지·sitemap·구조화 데이터가 모두 이 값을 쓴다 */
export interface PostMeta {
  /** 주소 /blog/<slug>/ — 영문 소문자·숫자·하이픈 */
  slug: string;
  /** 검색 결과 제목(뒤에 | RowFlip 이 붙음) */
  title: string;
  /** 화면 H1 — 대표 검색어를 앞쪽에 */
  h1: string;
  /** 검색 결과 설명 — 80~160자 */
  description: string;
  keywords: readonly string[];
  /** YYYY-MM-DD */
  published: string;
  /** YYYY-MM-DD, 내용을 크게 고쳤을 때만 */
  updated?: string;
  /** 글이 이어지는 기능 페이지 — 글 끝 안내와 기능 페이지 '관련 글'에 쓰임 */
  tool: ToolPageId;
  /** 목록에 보이는 한두 문장 */
  excerpt: string;
  /** 목차 — 본문 h2의 id와 같아야 함 */
  toc: readonly { id: string; title: string }[];
}

export interface Post {
  meta: PostMeta;
  Body: ComponentType;
}

import type { ComponentType } from "react";
import type { EnPageId } from "@/config/navEn";
import { excelTextjoin } from "./posts/excel-textjoin";

/** 영어 블로그 글 하나의 정보 — 한국어 블로그(PostMeta)와 같은 모양, 이어지는 도구만 영어 페이지 id */
export interface EnPostMeta {
  /** 주소 /en/blog/<slug>/ */
  slug: string;
  /** 검색 결과 제목(뒤에 | RowFlip 이 붙음) */
  title: string;
  h1: string;
  /** 검색 결과 설명 — 80~170자 */
  description: string;
  keywords: readonly string[];
  /** YYYY-MM-DD */
  published: string;
  updated?: string;
  tool: EnPageId;
  excerpt: string;
  toc: readonly { id: string; title: string }[];
}

export interface EnPost {
  meta: EnPostMeta;
  Body: ComponentType;
}

export const EN_BLOG_META = {
  path: "/en/blog/",
  h1: "Spreadsheet List Tips",
  title: "Spreadsheet List Tips - Excel and Google Sheets How-tos",
  description:
    "Short, tested how-tos for joining, splitting and cleaning lists in Excel and Google Sheets, with formulas and a free browser tool.",
} as const;

/** 영어 블로그 글 목록 — 새 글은 posts/<slug>.tsx를 만들고 여기에 추가 */
const POSTS: EnPost[] = [excelTextjoin];

export function getEnPosts(): EnPost[] {
  return [...POSTS].sort((a, b) => b.meta.published.localeCompare(a.meta.published));
}

export function getEnPost(slug: string): EnPost | undefined {
  return POSTS.find((p) => p.meta.slug === slug);
}

export function getEnPostsForTool(tool: EnPageId): EnPost[] {
  return getEnPosts().filter((p) => p.meta.tool === tool);
}

export function enPostPath(slug: string): string {
  return `${EN_BLOG_META.path}${slug}/`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** 2026-10-31 → October 31, 2026 */
export function formatEnDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

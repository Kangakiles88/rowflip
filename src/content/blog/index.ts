import type { ToolPageId } from "@/config/nav";
import { excelAddQuotes } from "./posts/excel-add-quotes";
import { excelAddressSplit } from "./posts/excel-address-split";
import { excelAmountKorean } from "./posts/excel-amount-korean";
import { excelCaseSensitive } from "./posts/excel-case-sensitive";
import { excelCommaValues } from "./posts/excel-comma-values";
import { excelCompareLists } from "./posts/excel-compare-lists";
import { excelDateKorean } from "./posts/excel-date-korean";
import { excelHanyoungAutocorrect } from "./posts/excel-hanyoung-autocorrect";
import { excelLenCount } from "./posts/excel-len-count";
import { excelLinebreakFormula } from "./posts/excel-linebreak-formula";
import { excelPhoneNumber } from "./posts/excel-phone-number";
import { excelReceivableBalance } from "./posts/excel-receivable-balance";
import { excelSumByName } from "./posts/excel-sum-by-name";
import { excelUnpivot } from "./posts/excel-unpivot";
import { excelVatFormula } from "./posts/excel-vat-formula";
import { hwpxEstimateFill } from "./posts/hwpx-estimate-fill";
import type { Post } from "./types";

export type { Post, PostMeta } from "./types";

export const BLOG_META = {
  path: "/blog/",
  h1: "엑셀 작업 팁",
  title: "엑셀 작업 팁 - 데이터 정리·변환 방법 모음",
  description:
    "엑셀에서 자주 막히는 데이터 정리 작업을 엑셀 기능, 수식, RowFlip 도구로 하는 방법을 사례별로 정리한 글 모음입니다.",
} as const;

/**
 * 블로그 글 목록 — 새 글은 posts/<slug>.tsx를 만들고 여기에 추가한다.
 * 목록·sitemap·기능 페이지 '관련 글'이 모두 이 배열을 쓴다.
 */
const POSTS: Post[] = [excelAddressSplit, excelAmountKorean, excelVatFormula, excelLenCount, excelPhoneNumber, excelAddQuotes, excelUnpivot, excelCompareLists, excelCommaValues, excelSumByName, excelCaseSensitive, excelLinebreakFormula, excelReceivableBalance, excelDateKorean, hwpxEstimateFill, excelHanyoungAutocorrect];

/** 최신 글이 먼저 오도록 정렬한 목록 */
export function getPosts(): Post[] {
  return [...POSTS].sort((a, b) => b.meta.published.localeCompare(a.meta.published));
}

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.meta.slug === slug);
}

/** 기능 페이지 아래 '관련 글'에 보일 글 */
export function getPostsForTool(tool: ToolPageId): Post[] {
  return getPosts().filter((p) => p.meta.tool === tool);
}

export function postPath(slug: string): string {
  return `${BLOG_META.path}${slug}/`;
}

/** 2026-10-17 → 2026년 10월 17일 */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

import Link from "next/link";
import type { ToolPageId } from "@/config/nav";
import { getPostsForTool, postPath } from "@/content/blog";

/** 기능 페이지 안내 아래 '관련 글' — 그 도구로 이어지는 블로그 글이 있을 때만 */
export function RelatedPosts({ tool }: { tool: ToolPageId }) {
  const posts = getPostsForTool(tool);
  if (posts.length === 0) return null;
  return (
    <ul className="relatedPosts" aria-label="관련 글">
      {posts.map((p) => (
        <li key={p.meta.slug}>
          <Link href={postPath(p.meta.slug)}>{p.meta.h1}</Link>
        </li>
      ))}
    </ul>
  );
}

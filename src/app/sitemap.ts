import type { MetadataRoute } from "next";
import { INFO_PAGES, TOOL_PAGES } from "@/config/nav";
import { siteConfig } from "@/config/site";
import { getPosts, postPath } from "@/content/blog";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const pages: MetadataRoute.Sitemap = [...TOOL_PAGES, ...INFO_PAGES].map((p) => ({
    url: `${siteConfig.url}${p.href}`,
    lastModified,
    changeFrequency: "monthly",
    priority: p.priority,
  }));
  // 블로그 글은 실제 게시·수정일을 넣는다(빌드 날짜로 매번 바뀌면 검색엔진이 lastmod를 믿지 않음)
  const posts: MetadataRoute.Sitemap = getPosts().map(({ meta }) => ({
    url: `${siteConfig.url}${postPath(meta.slug)}`,
    lastModified: new Date(meta.updated ?? meta.published),
    changeFrequency: "yearly",
    priority: 0.6,
  }));
  return [...pages, ...posts];
}

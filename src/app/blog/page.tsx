import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { PromotionArea } from "@/components/ads/PromotionArea";
import { siteConfig } from "@/config/site";
import { BLOG_META as M, formatDate, getPosts, postPath } from "@/content/blog";

export const metadata: Metadata = {
  title: M.title,
  description: M.description,
  alternates: { canonical: M.path },
  openGraph: {
    type: "website",
    url: M.path,
    siteName: siteConfig.name,
    title: `${M.title} | ${siteConfig.name}`,
    description: M.description,
    locale: siteConfig.locale,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: siteConfig.name }],
  },
};

export default function BlogIndexPage() {
  const posts = getPosts();
  return (
    <>
      <Header />
      <main className="container page">
        <PromotionArea position="header" />
        <div className="intro">
          <h1>{M.h1}</h1>
          <p className="lede">엑셀에서 자주 막히는 데이터 정리 작업을 엑셀 기능, 수식, 도구로 하는 방법을 사례별로 정리합니다.</p>
        </div>

        <ul className="postList">
          {posts.map(({ meta }) => (
            <li key={meta.slug}>
              <Link href={postPath(meta.slug)}>
                <strong>{meta.h1}</strong>
                <span>{meta.excerpt}</span>
              </Link>
              <time dateTime={meta.published}>{formatDate(meta.published)}</time>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}

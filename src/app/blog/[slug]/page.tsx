import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogJsonLd } from "@/components/BlogJsonLd";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolDirectory } from "@/components/ToolDirectory";
import { PromotionArea } from "@/components/ads/PromotionArea";
import { TOOL_PAGES } from "@/config/nav";
import { siteConfig } from "@/config/site";
import { BLOG_META, formatDate, getPost, getPosts, postPath } from "@/content/blog";

/** 목록에 있는 글만 정적 HTML로 만든다(정적 내보내기라 그 밖의 주소는 404) */
export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.meta.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const { meta } = post;
  const path = postPath(meta.slug);
  return {
    title: meta.title,
    description: meta.description,
    keywords: [...meta.keywords],
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      siteName: siteConfig.name,
      title: `${meta.title} | ${siteConfig.name}`,
      description: meta.description,
      locale: siteConfig.locale,
      publishedTime: meta.published,
      modifiedTime: meta.updated ?? meta.published,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: meta.h1 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${meta.title} | ${siteConfig.name}`,
      description: meta.description,
      images: ["/og.png"],
    },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const { meta, Body } = post;
  const tool = TOOL_PAGES.find((t) => t.id === meta.tool);
  const others = getPosts().filter((p) => p.meta.slug !== meta.slug).slice(0, 5);

  return (
    <>
      <BlogJsonLd meta={meta} />
      <Header />
      <main className="container page">
        <PromotionArea position="header" />
        <nav className="crumbs" aria-label="현재 위치">
          <Link href="/">{siteConfig.name}</Link>
          <span aria-hidden="true">/</span>
          <Link href={BLOG_META.path}>{BLOG_META.h1}</Link>
        </nav>

        <article className="post">
          <header className="postHead">
            <h1>{meta.h1}</h1>
            <p className="postDate">
              <time dateTime={meta.published}>{formatDate(meta.published)}</time>
              {meta.updated && (
                <>
                  {" · 수정 "}
                  <time dateTime={meta.updated}>{formatDate(meta.updated)}</time>
                </>
              )}
            </p>
          </header>

          <nav className="postToc" aria-labelledby="toc-title">
            <p id="toc-title">목차</p>
            <ol>
              {meta.toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`}>{t.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="postBody">
            <Body />
          </div>

          {tool && (
            <aside className="postTool" aria-label="이 글에 쓰인 도구">
              <p>
                <strong>{tool.title}</strong>
                <span>{tool.desc}</span>
              </p>
              <Link href={tool.href}>도구 열기</Link>
            </aside>
          )}
        </article>

        <PromotionArea position="bottom" />

        {others.length > 0 && (
          <section className="section" aria-labelledby="more-posts">
            <h2 id="more-posts">다른 글</h2>
            <ul className="postList">
              {others.map((p) => (
                <li key={p.meta.slug}>
                  <Link href={postPath(p.meta.slug)}>
                    <strong>{p.meta.h1}</strong>
                    <span>{p.meta.excerpt}</span>
                  </Link>
                  <time dateTime={p.meta.published}>{formatDate(p.meta.published)}</time>
                </li>
              ))}
            </ul>
          </section>
        )}

        <ToolDirectory current={meta.tool} />
      </main>
      <SiteFooter />
    </>
  );
}

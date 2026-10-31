import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnFooter } from "@/components/en/EnFooter";
import { EnHeader } from "@/components/en/EnHeader";
import { EN_TOOL_PAGES } from "@/config/navEn";
import { siteConfig } from "@/config/site";
import { EN_BLOG_META, type EnPostMeta, enPostPath, formatEnDate, getEnPost, getEnPosts } from "@/content/en/blog";

/** 목록에 있는 글만 정적 HTML로 만든다 */
export const dynamicParams = false;

export function generateStaticParams() {
  return getEnPosts().map((p) => ({ slug: p.meta.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getEnPost(slug);
  if (!post) return {};
  const { meta } = post;
  const path = enPostPath(meta.slug);
  const title = `${meta.title} | RowFlip`;
  return {
    title: { absolute: title },
    description: meta.description,
    keywords: [...meta.keywords],
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      siteName: "RowFlip",
      title,
      description: meta.description,
      locale: "en_US",
      publishedTime: meta.published,
      modifiedTime: meta.updated ?? meta.published,
      images: [{ url: "/og-en.png", width: 1200, height: 630, alt: meta.h1 }],
    },
    twitter: { card: "summary_large_image", title, description: meta.description, images: ["/og-en.png"] },
  };
}

/** BlogPosting + BreadcrumbList(RowFlip > Spreadsheet List Tips > 글) */
function EnBlogJsonLd({ meta }: { meta: EnPostMeta }) {
  const url = `${siteConfig.url}${enPostPath(meta.slug)}`;
  const org = { "@type": "Organization", name: siteConfig.name, url: `${siteConfig.url}/en/` };
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#post`,
        headline: meta.h1,
        description: meta.description,
        url,
        mainEntityOfPage: url,
        inLanguage: "en",
        datePublished: meta.published,
        dateModified: meta.updated ?? meta.published,
        keywords: meta.keywords.join(", "),
        image: `${siteConfig.url}/og-en.png`,
        author: org,
        publisher: org,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: siteConfig.name, item: `${siteConfig.url}/en/` },
          { "@type": "ListItem", position: 2, name: EN_BLOG_META.h1, item: `${siteConfig.url}${EN_BLOG_META.path}` },
          { "@type": "ListItem", position: 3, name: meta.h1, item: url },
        ],
      },
    ],
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
  );
}

export default async function EnBlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = getEnPost(slug);
  if (!post) notFound();
  const { meta, Body } = post;
  const tool = EN_TOOL_PAGES.find((t) => t.id === meta.tool);
  const others = getEnPosts().filter((p) => p.meta.slug !== meta.slug).slice(0, 5);

  return (
    <>
      <EnBlogJsonLd meta={meta} />
      <EnHeader current="blog" />
      <main className="container page">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/en/">{siteConfig.name}</Link>
          <span aria-hidden="true">/</span>
          <Link href={EN_BLOG_META.path}>{EN_BLOG_META.h1}</Link>
        </nav>

        <article className="post">
          <header className="postHead">
            <h1>{meta.h1}</h1>
            <p className="postDate">
              <time dateTime={meta.published}>{formatEnDate(meta.published)}</time>
              {meta.updated && (
                <>
                  {" · Updated "}
                  <time dateTime={meta.updated}>{formatEnDate(meta.updated)}</time>
                </>
              )}
            </p>
          </header>

          <nav className="postToc" aria-labelledby="toc-title">
            <p id="toc-title">Contents</p>
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
            <aside className="postTool" aria-label="Tool used in this article">
              <p>
                <strong>{tool.label}</strong>
                <span>Free, runs in your browser, nothing is uploaded.</span>
              </p>
              <Link href={tool.href}>Open tool</Link>
            </aside>
          )}
        </article>

        {others.length > 0 && (
          <section className="section" aria-labelledby="more-posts">
            <h2 id="more-posts">More articles</h2>
            <ul className="postList">
              {others.map((p) => (
                <li key={p.meta.slug}>
                  <Link href={enPostPath(p.meta.slug)}>
                    <strong>{p.meta.h1}</strong>
                    <span>{p.meta.excerpt}</span>
                  </Link>
                  <time dateTime={p.meta.published}>{formatEnDate(p.meta.published)}</time>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <EnFooter />
    </>
  );
}

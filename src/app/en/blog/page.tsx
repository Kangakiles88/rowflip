import type { Metadata } from "next";
import Link from "next/link";
import { EnFooter } from "@/components/en/EnFooter";
import { EnHeader } from "@/components/en/EnHeader";
import { EN_BLOG_META as M, enPostPath, formatEnDate, getEnPosts } from "@/content/en/blog";

export const metadata: Metadata = {
  title: { absolute: `${M.title} | RowFlip` },
  description: M.description,
  alternates: { canonical: M.path },
  openGraph: {
    type: "website",
    url: M.path,
    siteName: "RowFlip",
    title: `${M.title} | RowFlip`,
    description: M.description,
    locale: "en_US",
    images: [{ url: "/og-en.png", width: 1200, height: 630, alt: "RowFlip" }],
  },
};

export default function EnBlogIndexPage() {
  const posts = getEnPosts();
  return (
    <>
      <EnHeader current="blog" />
      <main className="container page">
        <div className="intro">
          <h1>{M.h1}</h1>
          <p className="lede">Tested formulas and quick fixes for joining, splitting and cleaning lists in Excel and Google Sheets.</p>
        </div>
        <ul className="postList">
          {posts.map(({ meta }) => (
            <li key={meta.slug}>
              <Link href={enPostPath(meta.slug)}>
                <strong>{meta.h1}</strong>
                <span>{meta.excerpt}</span>
              </Link>
              <time dateTime={meta.published}>{formatEnDate(meta.published)}</time>
            </li>
          ))}
        </ul>
      </main>
      <EnFooter />
    </>
  );
}

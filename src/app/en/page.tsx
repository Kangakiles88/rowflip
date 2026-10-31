import type { Metadata } from "next";
import { Converter } from "@/components/Converter";
import { JsonLd } from "@/components/JsonLd";
import { PageIntro } from "@/components/PageIntro";
import { EnFooter } from "@/components/en/EnFooter";
import { EnHeader } from "@/components/en/EnHeader";
import { PromotionArea } from "@/components/ads/PromotionArea";
import { EN_FAQ, EN_GUIDES, EN_HOME as M } from "@/content/en/columnToComma";
import { LocaleProvider } from "@/i18n/locale";
import Link from "next/link";
import { enPostPath, getEnPostsForTool } from "@/content/en/blog";

export const metadata: Metadata = {
  // 레이아웃 template을 거치지 않고 제목 전체를 그대로 쓴다
  title: { absolute: M.title },
  description: M.description,
  keywords: [...M.keywords],
  alternates: {
    canonical: M.path,
    languages: { ko: M.koPath, en: M.path, "x-default": M.koPath },
  },
  openGraph: {
    type: "website",
    url: M.path,
    siteName: "RowFlip",
    title: M.title,
    description: M.description,
    locale: "en_US",
    images: [{ url: M.ogImage, width: 1200, height: 630, alt: "Column to comma separated list converter" }],
  },
  twitter: { card: "summary_large_image", title: M.title, description: M.description, images: [M.ogImage] },
};

export default function EnHome() {
  return (
    <>
      <JsonLd path={M.path} name={M.h1} description={M.description} features={[...M.features]} faq={EN_FAQ} locale="en" />
      <EnHeader current="column-to-comma" />
      <main className="container page">
        <PageIntro title={M.h1} locale="en">
          Paste a column from Excel, Google Sheets or a text file and get a comma separated list, a single row, an SQL IN
          clause or a JSON array. Paste a comma list to split it back into a column.
        </PageIntro>

        <PromotionArea position="top" showBrandConnect={false} />

        <LocaleProvider locale="en">
          <Converter />
        </LocaleProvider>

        <section className="section usage" aria-labelledby="usage-title">
          <h2 id="usage-title">How to use</h2>
          <ol className="steps">
            <li>
              <span>
                <strong>Paste</strong> Copy cells in Excel and press <code>Ctrl+V</code> in the source box
              </span>
            </li>
            <li>
              <span>
                <strong>Choose</strong> Press a quick convert button or change the options; the result updates as you go
              </span>
            </li>
            <li>
              <span>
                <strong>Copy</strong> Press Copy or <code>Ctrl+Enter</code> to put the result on the clipboard
              </span>
            </li>
          </ol>
        </section>

        <section className="section" aria-labelledby="guide-title">
          <h2 id="guide-title">Common conversions</h2>
          <div className="guides">
            {EN_GUIDES.map((g) => (
              <article key={g.id} id={g.id} className="guide">
                <h3>{g.title}</h3>
                <p>{g.body}</p>
                <div className="sample" aria-label="Example">
                  <code>{g.input}</code>
                  <span className="sampleArrow" aria-hidden="true">
                    →
                  </span>
                  <code>{g.output}</code>
                </div>
              </article>
            ))}
          </div>
        </section>

        {getEnPostsForTool("column-to-comma").length > 0 && (
          <ul className="relatedPosts" aria-label="Related articles">
            {getEnPostsForTool("column-to-comma").map((p) => (
              <li key={p.meta.slug}>
                <Link href={enPostPath(p.meta.slug)}>{p.meta.h1}</Link>
              </li>
            ))}
          </ul>
        )}

        <PromotionArea position="bottom" showBrandConnect={false} />

        <section className="section faq" aria-labelledby="faq-title">
          <h2 id="faq-title">FAQ</h2>
          {EN_FAQ.map((f) => (
            <details key={f.q}>
              <summary>
                <h3>{f.q}</h3>
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>
      </main>
      <EnFooter />
    </>
  );
}

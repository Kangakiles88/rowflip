import type { Metadata } from "next";
import type { ReactNode } from "react";
import type { ToolPageId } from "@/config/nav";
import { siteConfig } from "@/config/site";
import type { FaqItem, Guide } from "@/content/seo";
import { Header } from "./Header";
import { JsonLd } from "./JsonLd";
import { PageIntro } from "./PageIntro";
import { SiteFooter } from "./SiteFooter";
import { ToolDirectory } from "./ToolDirectory";
import { PromotionArea } from "./ads/PromotionArea";

export interface ToolMeta {
  path: string;
  h1: string;
  title: string;
  description: string;
  keywords: readonly string[];
  features: readonly string[];
}

/** 기능 페이지 공통 메타데이터 — 제목·설명·canonical·공유 이미지 */
export function toolMetadata(m: ToolMeta, ogImage: string, ogAlt: string): Metadata {
  return {
    title: m.title,
    description: m.description,
    keywords: [...m.keywords],
    alternates: { canonical: m.path },
    openGraph: {
      type: "website",
      url: m.path,
      siteName: siteConfig.name,
      title: `${m.title} | ${siteConfig.name}`,
      description: m.description,
      locale: siteConfig.locale,
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${m.title} | ${siteConfig.name}`,
      description: m.description,
      images: [ogImage],
    },
  };
}

interface Props {
  id: ToolPageId;
  meta: ToolMeta;
  lede: ReactNode;
  tool: ReactNode;
  guideTitle: string;
  guides: Guide[];
  related: ReactNode;
  faq: FaqItem[];
}

/** 기능 페이지 공통 틀 — 광고 띠 · 제목 · 도구 · 다른 도구 · 사용 안내 · FAQ */
export function ToolPageLayout({ id, meta, lede, tool, guideTitle, guides, related, faq }: Props) {
  return (
    <>
      <JsonLd path={meta.path} name={meta.h1} description={meta.description} features={[...meta.features]} faq={faq} />
      <Header current={id} />
      <main className="container page">
        <PromotionArea position="header" />
        <PageIntro title={meta.h1}>{lede}</PageIntro>
        <PromotionArea position="top" />
        {tool}
        <PromotionArea position="middle" />
        <ToolDirectory current={id} />

        <section className="section" aria-labelledby="guide-title">
          <h2 id="guide-title">{guideTitle}</h2>
          <div className="guides">
            {guides.map((g) => (
              <article key={g.id} id={g.id} className="guide">
                <h3>{g.title}</h3>
                <p>{g.body}</p>
                <div className="sample" aria-label="예시">
                  <code>{g.input}</code>
                  <span className="sampleArrow" aria-hidden="true">
                    →
                  </span>
                  <code>{g.output}</code>
                </div>
              </article>
            ))}
          </div>
          <p className="related">{related}</p>
        </section>

        <PromotionArea position="bottom" />

        <section className="section faq" aria-labelledby="faq-title">
          <h2 id="faq-title">자주 묻는 질문</h2>
          {faq.map((f) => (
            <details key={f.q}>
              <summary>
                <h3>{f.q}</h3>
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

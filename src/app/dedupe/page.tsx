import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolDirectory } from "@/components/ToolDirectory";
import { DedupeTool } from "@/components/DedupeTool";
import { PromotionArea } from "@/components/ads/PromotionArea";
import { siteConfig } from "@/config/site";
import { DEDUPE_FAQ, DEDUPE_GUIDES, DEDUPE_META as M } from "@/content/dedupe";

export const metadata: Metadata = {
  title: M.title,
  description: M.description,
  keywords: [...M.keywords],
  alternates: { canonical: M.path },
  openGraph: {
    type: "website",
    url: M.path,
    siteName: siteConfig.name,
    title: `${M.title} | ${siteConfig.name}`,
    description: M.description,
    locale: siteConfig.locale,
    images: [{ url: "/og-dedupe.png", width: 1200, height: 630, alt: "엑셀 중복 제거 화면" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${M.title} | ${siteConfig.name}`,
    description: M.description,
    images: ["/og-dedupe.png"],
  },
};

export default function DedupePage() {
  return (
    <>
      <JsonLd
        path={M.path}
        name={M.h1}
        description={M.description}
        features={[...M.features]}
        faq={DEDUPE_FAQ}
      />
      <Header current="dedupe" />
      <main className="container page">
        <div className="intro">
          <h1>{M.h1}</h1>
          <p className="lede">
            엑셀이나 구글 시트에서 목록이나 표를 복사해 붙여넣으면 중복값을 지운 결과를 바로 보여 줍니다. 중복된 값만 골라
            보거나 값마다 몇 번 나왔는지 셀 수도 있습니다.
          </p>
        </div>

        <PromotionArea position="top" />

        <DedupeTool />

        <ToolDirectory current="dedupe" />

        <PromotionArea position="middle" />

        <section className="section" aria-labelledby="guide-title">
          <h2 id="guide-title">엑셀 중복값 제거하는 방법</h2>
          <div className="guides">
            {DEDUPE_GUIDES.map((g) => (
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
          <p className="related">
            정리한 목록을 쉼표로 잇거나 SQL IN 조건으로 바꾸려면{" "}
            <Link className="inlineLink" href="/">
              엑셀 가로세로 변환기
            </Link>
            를, 표의 행과 열을 바꾸려면{" "}
            <Link className="inlineLink" href="/transpose/">
              엑셀 행열 바꾸기
            </Link>
            를 쓰세요.
          </p>
        </section>

        <PromotionArea position="bottom" />

        <section className="section faq" aria-labelledby="faq-title">
          <h2 id="faq-title">자주 묻는 질문</h2>
          {DEDUPE_FAQ.map((f) => (
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

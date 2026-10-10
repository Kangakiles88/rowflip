import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { TransposeTool } from "@/components/TransposeTool";
import { PromotionArea } from "@/components/ads/PromotionArea";
import { siteConfig } from "@/config/site";
import { TRANSPOSE_FAQ, TRANSPOSE_GUIDES, TRANSPOSE_META as M } from "@/content/transpose";

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
    images: [{ url: "/og-transpose.png", width: 1200, height: 630, alt: "엑셀 행열 바꾸기 화면" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${M.title} | ${siteConfig.name}`,
    description: M.description,
    images: ["/og-transpose.png"],
  },
};

export default function TransposePage() {
  return (
    <>
      <JsonLd
        path={M.path}
        name={M.h1}
        description={M.description}
        features={[...M.features]}
        faq={TRANSPOSE_FAQ}
      />
      <Header current="transpose" />
      <main className="container page">
        <div className="intro">
          <h1>{M.h1}</h1>
          <p className="lede">
            엑셀이나 구글 시트에서 표를 복사해 붙여넣으면 행과 열을 바꾼 표를 바로 보여 줍니다. 결과를 복사해 엑셀에 그대로
            붙여넣거나 CSV, 마크다운 표로 받을 수 있습니다.
          </p>
        </div>

        <PromotionArea position="top" />

        <TransposeTool />

        <PromotionArea position="middle" />

        <section className="section" aria-labelledby="guide-title">
          <h2 id="guide-title">엑셀 행열 바꾸는 방법</h2>
          <div className="guides">
            {TRANSPOSE_GUIDES.map((g) => (
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
            한 열짜리 목록을 쉼표로 잇거나 중복을 지우려면{" "}
            <Link className="inlineLink" href="/">
              엑셀 가로세로 변환기
            </Link>
            를 쓰세요.
          </p>
        </section>

        <PromotionArea position="bottom" />

        <section className="section faq" aria-labelledby="faq-title">
          <h2 id="faq-title">자주 묻는 질문</h2>
          {TRANSPOSE_FAQ.map((f) => (
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

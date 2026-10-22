import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { PageIntro } from "@/components/PageIntro";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolDirectory } from "@/components/ToolDirectory";
import { SplitTool } from "@/components/SplitTool";
import { PromotionArea } from "@/components/ads/PromotionArea";
import { siteConfig } from "@/config/site";
import { SPLIT_FAQ, SPLIT_GUIDES, SPLIT_META as M } from "@/content/split";
import { RelatedPosts } from "@/components/RelatedPosts";

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
    images: [{ url: "/og-split.png", width: 1200, height: 630, alt: "쉼표를 줄바꿈으로 변환 화면" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${M.title} | ${siteConfig.name}`,
    description: M.description,
    images: ["/og-split.png"],
  },
};

export default function SplitPage() {
  return (
    <>
      <JsonLd
        path={M.path}
        name={M.h1}
        description={M.description}
        features={[...M.features]}
        faq={SPLIT_FAQ}
      />
      <Header current="split" />
      <main className="container page">
        <PromotionArea position="header" />

        <PageIntro title={M.h1}>
            쉼표, 세미콜론, 띄어쓰기로 이어진 목록을 붙여넣으면 한 줄에 하나씩 나눠 줍니다. 결과를 복사해 엑셀에 붙여넣으면
            한 칸에 하나씩 들어갑니다.
          </PageIntro>

        <PromotionArea position="top" />

        <SplitTool />

        <PromotionArea position="middle" />

        <ToolDirectory current="split" />

        <section className="section" aria-labelledby="guide-title">
          <h2 id="guide-title">쉼표를 줄바꿈으로 바꾸는 방법</h2>
          <div className="guides">
            {SPLIT_GUIDES.map((g) => (
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
            반대로 줄바꿈을 쉼표로 이으려면{" "}
            <Link className="inlineLink" href="/">
              엑셀 가로세로 변환기
            </Link>
            를, 나눈 목록에서 중복값을 세려면{" "}
            <Link className="inlineLink" href="/dedupe/">
              엑셀 중복 제거
            </Link>
            를, 엑셀 표의 한 열을 여러 칸으로 나누려면{" "}
            <Link className="inlineLink" href="/cell-split/">
              엑셀 셀 나누기
            </Link>
            를 쓰세요.
          </p>
          <RelatedPosts tool="split" />
        </section>

        <PromotionArea position="bottom" />

        <section className="section faq" aria-labelledby="faq-title">
          <h2 id="faq-title">자주 묻는 질문</h2>
          {SPLIT_FAQ.map((f) => (
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

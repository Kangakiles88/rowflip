import { Converter } from "@/components/Converter";
import { Header } from "@/components/Header";
import { PromotionArea } from "@/components/ads/PromotionArea";
import { siteConfig } from "@/config/site";
import { FAQ, GUIDES } from "@/content/seo";

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${siteConfig.url}/#app`,
        name: siteConfig.h1,
        alternateName: siteConfig.name,
        url: `${siteConfig.url}/`,
        description: siteConfig.description,
        inLanguage: "ko-KR",
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Windows, macOS, Android, iOS",
        browserRequirements: "JavaScript가 켜진 최신 브라우저",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
        featureList: [
          "엑셀 세로 데이터를 가로로 변환",
          "가로 데이터를 세로로 변환",
          "줄바꿈을 쉼표로 변환",
          "중복 제거",
          "정렬",
          "접두사·접미사 추가",
          "SQL IN 절 생성",
          "JSON 배열 생성",
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${siteConfig.url}/#faq`,
        mainEntity: FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.plain },
        })),
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export default function Home() {
  return (
    <>
      <JsonLd />
      <Header />
      <main className="container page">
        <div className="intro">
          <h1>{siteConfig.h1}</h1>
          <p className="lede">
            엑셀이나 구글 시트에서 복사한 데이터를 붙여넣으면 세로를 가로로, 가로를 세로로 바로 바꿔 줍니다. 줄바꿈을 쉼표로
            잇기, 중복 제거, SQL IN, JSON 배열 변환도 함께 됩니다.
          </p>
        </div>

        <PromotionArea position="top" />

        <Converter />

        <PromotionArea position="middle" />

        <section className="section usage" aria-labelledby="usage-title">
          <h2 id="usage-title">사용 방법</h2>
          <ol className="steps">
            <li>
              <span>
                <strong>붙여넣기</strong> 엑셀에서 셀을 복사해 원본 데이터 칸에 <code>Ctrl+V</code>
              </span>
            </li>
            <li>
              <span>
                <strong>변환 고르기</strong> 빠른 변환 버튼을 누르거나 아래 옵션을 조정하면 결과가 바로 바뀝니다
              </span>
            </li>
            <li>
              <span>
                <strong>복사</strong> 복사 버튼이나 <code>Ctrl+Enter</code>로 결과를 클립보드에 담습니다
              </span>
            </li>
          </ol>
        </section>

        <section className="section" aria-labelledby="guide-title">
          <h2 id="guide-title">자주 쓰는 변환</h2>
          <div className="guides">
            {GUIDES.map((g) => (
              <article key={g.id} id={g.id} className="guide">
                <h3>{g.title}</h3>
                <p>{g.body}</p>
                <div className="sample" aria-label="변환 예시">
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

        <PromotionArea position="bottom" />

        <section className="section faq" aria-labelledby="faq-title">
          <h2 id="faq-title">자주 묻는 질문</h2>
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>
                <h3>{f.q}</h3>
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <span>
            {siteConfig.name} · {siteConfig.h1}
          </span>
          <span>모든 데이터 변환은 현재 브라우저에서만 처리됩니다. 입력한 내용은 서버로 전송되거나 저장되지 않습니다.</span>
        </div>
      </footer>
    </>
  );
}

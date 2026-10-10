import Link from "next/link";
import { Converter } from "@/components/Converter";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolDirectory } from "@/components/ToolDirectory";
import { PromotionArea } from "@/components/ads/PromotionArea";
import { siteConfig } from "@/config/site";
import { FAQ, GUIDES } from "@/content/seo";

export default function Home() {
  return (
    <>
      <JsonLd
        path="/"
        name={siteConfig.h1}
        description={siteConfig.description}
        features={[
          "엑셀 세로 데이터를 가로로 변환",
          "가로 데이터를 세로로 변환",
          "줄바꿈을 쉼표로 변환",
          "중복 제거",
          "정렬",
          "접두사·접미사 추가",
          "SQL IN 절 생성",
          "JSON 배열 생성",
        ]}
        faq={FAQ}
      />
      <Header current="garosero" />
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

        <ToolDirectory current="garosero" />

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
          <p className="related">
            여러 행과 열로 된 표 전체를 돌리려면{" "}
            <Link className="inlineLink" href="/transpose/">
              엑셀 행열 바꾸기
            </Link>
            를, 표에서 특정 열 기준으로 중복 행을 지우거나 중복값 개수를 세려면{" "}
            <Link className="inlineLink" href="/dedupe/">
              엑셀 중복 제거
            </Link>
            를, 쉼표로 이어진 목록을 한 줄에 하나씩 나누려면{" "}
            <Link className="inlineLink" href="/split/">
              쉼표를 줄바꿈으로 변환
            </Link>
            을 쓰세요.
          </p>
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

      <SiteFooter />
    </>
  );
}

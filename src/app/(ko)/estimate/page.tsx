import Link from "next/link";
import { EstimateTool } from "@/components/EstimateTool";
import { ToolPageLayout, toolMetadata } from "@/components/ToolPageLayout";
import { ESTIMATE_FAQ, ESTIMATE_GUIDES, ESTIMATE_META as M } from "@/content/estimate";

export const metadata = toolMetadata(M, "/og-estimate.png", "견적서 양식 작성 화면");

export default function EstimatePage() {
  return (
    <ToolPageLayout
      id="estimate"
      meta={M}
      lede="엑셀에서 품목을 복사해 붙여넣으면 공급가액·부가세·합계를 계산해 견적서를 만들어 줍니다. 인쇄하거나 PDF로 저장하세요."
      tool={<EstimateTool />}
      guideTitle="견적서 작성 방법"
      guides={ESTIMATE_GUIDES}
      faq={ESTIMATE_FAQ}
      related={
        <>
          물건을 넘긴 뒤 내역을 적으려면{" "}
          <Link className="inlineLink" href="/statement/">
            거래명세서 양식 작성
          </Link>
          을, 합계 금액만 ‘일금 ○○원정’으로 바꾸려면{" "}
          <Link className="inlineLink" href="/amount/">
            숫자 한글 변환
          </Link>
          을, 명단으로 상장·수료증을 만들려면{" "}
          <Link className="inlineLink" href="/certificate/">
            엑셀로 상장·수료증 일괄 만들기
          </Link>
          를 쓰세요.
        </>
      }
    />
  );
}

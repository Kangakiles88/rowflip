import Link from "next/link";
import { StatementTool } from "@/components/StatementTool";
import { ToolPageLayout, toolMetadata } from "@/components/ToolPageLayout";
import { STATEMENT_FAQ, STATEMENT_GUIDES, STATEMENT_META as M } from "@/content/statement";

export const metadata = toolMetadata(M, "/og-statement.png", "거래명세서 양식 작성 화면");

export default function StatementPage() {
  return (
    <ToolPageLayout
      id="statement"
      meta={M}
      lede="엑셀에서 납품 품목을 복사해 붙여넣으면 공급가액·세액·합계와 잔액을 계산해 거래명세서를 만들어 줍니다. A4 한 장에 두 부를 찍거나 PDF로 저장하세요."
      tool={<StatementTool />}
      guideTitle="거래명세서 작성 방법"
      guides={STATEMENT_GUIDES}
      faq={STATEMENT_FAQ}
      related={
        <>
          거래 전에 가격을 알려 주려면{" "}
          <Link className="inlineLink" href="/estimate/">
            견적서 양식 작성
          </Link>
          을, 합계 금액만 ‘일금 ○○원정’으로 바꾸려면{" "}
          <Link className="inlineLink" href="/amount/">
            숫자 한글 변환
          </Link>
          을, 같은 품목을 여러 번 적었다면{" "}
          <Link className="inlineLink" href="/dedupe/">
            엑셀 중복 제거
          </Link>
          에서 품목별로 정리하세요.
        </>
      }
    />
  );
}

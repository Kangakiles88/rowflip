import Link from "next/link";
import { AmountTool } from "@/components/AmountTool";
import { ToolPageLayout, toolMetadata } from "@/components/ToolPageLayout";
import { AMOUNT_FAQ, AMOUNT_GUIDES, AMOUNT_META as M } from "@/content/amount";

export const metadata = toolMetadata(M, "/og-amount.png", "숫자 한글 변환 화면");

export default function AmountPage() {
  return (
    <ToolPageLayout
      id="amount"
      meta={M}
      lede="숫자를 붙여넣으면 계약서·견적서에 쓰는 금액 한글 표기(일금 ○○원정), 읽기 표기, 숫자+단위, 한자 갖은자로 바꿔 줍니다."
      tool={<AmountTool />}
      guideTitle="금액을 한글로 쓰는 방법"
      guides={AMOUNT_GUIDES}
      faq={AMOUNT_FAQ}
      related={
        <>
          명단으로 상장·수료증을 만들려면{" "}
          <Link className="inlineLink" href="/certificate/">
            엑셀로 상장·수료증 일괄 만들기
          </Link>
          를, 금액 목록을 쉼표로 이으려면{" "}
          <Link className="inlineLink" href="/">
            엑셀 가로세로 변환기
          </Link>
          를 쓰세요.
        </>
      }
    />
  );
}

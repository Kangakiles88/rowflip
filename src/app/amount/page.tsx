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
          견적서를 통째로 만들려면{" "}
          <Link className="inlineLink" href="/estimate/">
            견적서 양식 작성
          </Link>
          을, 명단으로 상장·수료증을 만들려면{" "}
          <Link className="inlineLink" href="/certificate/">
            상장 양식 만들기
          </Link>
          를, 헌금 내역으로 기부금영수증을 한꺼번에 찍으려면{" "}
          <Link className="inlineLink" href="/donation-receipt/">
            기부금영수증 양식
          </Link>
          을, 금액 목록을 쉼표로 이으려면{" "}
          <Link className="inlineLink" href="/">
            엑셀 가로세로 변환기
          </Link>
          를 쓰세요.
        </>
      }
    />
  );
}

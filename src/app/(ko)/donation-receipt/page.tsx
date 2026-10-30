import Link from "next/link";
import { DonationTool } from "@/components/DonationTool";
import { ToolPageLayout, toolMetadata } from "@/components/ToolPageLayout";
import { DONATION_FAQ, DONATION_GUIDES, DONATION_META as M } from "@/content/donation";

export const metadata = toolMetadata(M, "/og-donation.png", "기부금영수증 양식 일괄 발급 화면");

export default function DonationReceiptPage() {
  return (
    <ToolPageLayout
      id="donation"
      meta={M}
      lede="엑셀 헌금·후원 내역을 붙여넣으면 기부자별 1년 합계를 내고, 소득세법 시행규칙 별지 제45호의2서식 기부금영수증을 한 사람에 한 장씩 만들어 한 번에 인쇄하거나 PDF로 저장합니다. 교회·성당·사찰과 비영리단체에서 쓸 수 있고, 단체 직인 이미지도 넣을 수 있습니다."
      tool={<DonationTool />}
      guideTitle="기부금영수증 작성·발급 방법"
      guides={DONATION_GUIDES}
      faq={DONATION_FAQ}
      related={
        <>
          내역에 같은 줄이 두 번 들어갔다면{" "}
          <Link className="inlineLink" href="/dedupe/">
            엑셀 중복 제거
          </Link>
          로 먼저 정리하고, 합계를 ‘일금 ○○원정’으로 적으려면{" "}
          <Link className="inlineLink" href="/amount/">
            숫자 한글 변환
          </Link>
          을, 감사장·수료증을 명단으로 한꺼번에 찍으려면{" "}
          <Link className="inlineLink" href="/certificate/">
            상장 양식 만들기
          </Link>
          를 쓰세요.
        </>
      }
    />
  );
}

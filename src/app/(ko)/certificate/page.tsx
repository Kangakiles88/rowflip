import Link from "next/link";
import { CertificateTool } from "@/components/CertificateTool";
import { ToolPageLayout, toolMetadata } from "@/components/ToolPageLayout";
import { CERTIFICATE_FAQ, CERTIFICATE_GUIDES, CERTIFICATE_META as M } from "@/content/certificate";

export const metadata = toolMetadata(M, "/og-certificate.png", "엑셀로 상장·수료증 일괄 만들기 화면");

export default function CertificatePageRoute() {
  return (
    <ToolPageLayout
      id="certificate"
      meta={M}
      lede="엑셀 명단을 붙여넣으면 상장·수료증·위촉장·감사장을 한 사람에 한 장씩 만들어 한 번에 인쇄하거나 PDF로 저장합니다. 테두리가 인쇄된 상장 용지에는 글자만 찍고, 기관 직인 이미지를 넣어 함께 인쇄할 수 있습니다."
      tool={<CertificateTool />}
      guideTitle="상장·수료증 일괄 만드는 방법"
      guides={CERTIFICATE_GUIDES}
      faq={CERTIFICATE_FAQ}
      related={
        <>
          명단에서 같은 사람을 지우려면{" "}
          <Link className="inlineLink" href="/dedupe/">
            엑셀 중복 제거
          </Link>
          를, 가로로 늘어선 명단을 세로로 바꾸려면{" "}
          <Link className="inlineLink" href="/">
            엑셀 가로세로 변환기
          </Link>
          를 쓰세요. 상금이나 수강료를 ‘일금 ○○원정’으로 적으려면{" "}
          <Link className="inlineLink" href="/amount/">
            숫자 한글 변환
          </Link>
          을 쓰면 됩니다. 교회·단체에서 연말에 헌금 내역으로 영수증을 찍으려면{" "}
          <Link className="inlineLink" href="/donation-receipt/">
            기부금영수증 양식
          </Link>
          에서 한 사람에 한 장씩 만들 수 있습니다.
        </>
      }
    />
  );
}

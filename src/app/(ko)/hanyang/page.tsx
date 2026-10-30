import Link from "next/link";
import { HanyangTool } from "@/components/HanyangTool";
import { ToolPageLayout, toolMetadata } from "@/components/ToolPageLayout";
import { HANYANG_FAQ, HANYANG_GUIDES, HANYANG_META as M } from "@/content/hanyang";

export const metadata = toolMetadata(M, "/og-hanyang.png", "한영 타자 변환 화면");

export default function HanyangPage() {
  return (
    <ToolPageLayout
      id="hanyang"
      meta={M}
      lede="한/영 키를 잘못 놓고 영문으로 쳐 버린 글을 붙여넣으면 한글로 바꿔 줍니다. 한글을 영문 자판 글자로 되돌릴 수도 있습니다."
      tool={<HanyangTool />}
      guideTitle="한영 타자 변환하는 방법"
      guides={HANYANG_GUIDES}
      faq={HANYANG_FAQ}
      related={
        <>
          영문의 대소문자를 바꾸려면{" "}
          <Link className="inlineLink" href="/case/">
            대소문자 변환
          </Link>
          을, 글자수를 세려면{" "}
          <Link className="inlineLink" href="/count/">
            글자수 세기
          </Link>
          를 쓰세요.
        </>
      }
    />
  );
}

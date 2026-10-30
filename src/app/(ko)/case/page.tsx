import Link from "next/link";
import { CaseTool } from "@/components/CaseTool";
import { ToolPageLayout, toolMetadata } from "@/components/ToolPageLayout";
import { CASE_FAQ, CASE_GUIDES, CASE_META as M } from "@/content/case";

export const metadata = toolMetadata(M, "/og-case.png", "대소문자 변환 화면");

export default function CasePage() {
  return (
    <ToolPageLayout
      id="case"
      meta={M}
      lede="영문을 붙여넣으면 대문자, 소문자, 첫 글자만 대문자로 바로 바꿔 줍니다. 변수 이름용 camelCase, snake_case, kebab-case도 됩니다."
      tool={<CaseTool />}
      guideTitle="대소문자 바꾸는 방법"
      guides={CASE_GUIDES}
      faq={CASE_FAQ}
      related={
        <>
          한/영 키를 잘못 놓고 친 글은{" "}
          <Link className="inlineLink" href="/hanyang/">
            한영 타자 변환
          </Link>
          으로, 목록을 SQL IN이나 JSON 배열로 바꾸려면{" "}
          <Link className="inlineLink" href="/">
            엑셀 가로세로 변환기
          </Link>
          로 바꾸세요.
        </>
      }
    />
  );
}

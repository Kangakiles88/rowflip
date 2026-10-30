import Link from "next/link";
import { LinebreakTool } from "@/components/LinebreakTool";
import { ToolPageLayout, toolMetadata } from "@/components/ToolPageLayout";
import { LINEBREAK_FAQ, LINEBREAK_GUIDES, LINEBREAK_META as M } from "@/content/linebreak";

export const metadata = toolMetadata(M, "/og-linebreak.png", "줄바꿈 제거 화면");

export default function LinebreakPage() {
  return (
    <ToolPageLayout
      id="linebreak"
      meta={M}
      lede="PDF나 웹페이지에서 복사해 줄마다 끊긴 글을 붙여넣으면 줄바꿈을 지우고 한 문단으로 이어 줍니다. 문단은 남기거나 빈 줄만 지울 수도 있습니다."
      tool={<LinebreakTool />}
      guideTitle="줄바꿈 제거하는 방법"
      guides={LINEBREAK_GUIDES}
      faq={LINEBREAK_FAQ}
      related={
        <>
          정리한 글의 길이를 보려면{" "}
          <Link className="inlineLink" href="/count/">
            글자수 세기
          </Link>
          를, 쉼표로 이어진 목록을 줄마다 나누려면{" "}
          <Link className="inlineLink" href="/split/">
            쉼표를 줄바꿈으로 변환
          </Link>
          을 쓰세요.
        </>
      }
    />
  );
}

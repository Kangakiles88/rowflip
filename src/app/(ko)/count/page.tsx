import Link from "next/link";
import { CountTool } from "@/components/CountTool";
import { ToolPageLayout, toolMetadata } from "@/components/ToolPageLayout";
import { COUNT_FAQ, COUNT_GUIDES, COUNT_META as M } from "@/content/count";

export const metadata = toolMetadata(M, "/og-count.png", "글자수 세기 화면");

export default function CountPage() {
  return (
    <ToolPageLayout
      id="count"
      meta={M}
      lede="글을 붙여넣으면 공백 포함·공백 제외 글자수와 바이트, 단어·줄·문단 수를 바로 세어 줍니다. 목표 글자수를 넣으면 남은 글자수도 보여 줍니다."
      tool={<CountTool />}
      guideTitle="글자수 세는 방법"
      guides={COUNT_GUIDES}
      faq={COUNT_FAQ}
      related={
        <>
          줄마다 끊긴 글을 이으려면{" "}
          <Link className="inlineLink" href="/linebreak/">
            줄바꿈 제거
          </Link>
          를, 고치기 전과 후를 비교하려면{" "}
          <Link className="inlineLink" href="/diff/">
            텍스트 비교
          </Link>
          를 쓰세요.
        </>
      }
    />
  );
}

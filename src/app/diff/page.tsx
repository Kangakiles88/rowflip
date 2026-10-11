import Link from "next/link";
import { DiffTool } from "@/components/DiffTool";
import { ToolPageLayout, toolMetadata } from "@/components/ToolPageLayout";
import { DIFF_FAQ, DIFF_GUIDES, DIFF_META as M } from "@/content/diff";

export const metadata = toolMetadata(M, "/og-diff.png", "텍스트 비교 화면");

export default function DiffPage() {
  return (
    <ToolPageLayout
      id="diff"
      meta={M}
      lede="원본과 수정본을 붙여넣으면 지운 줄, 더한 줄, 줄 안에서 바뀐 낱말을 색으로 표시해 줍니다. 계약서·보고서·원고의 수정 전후를 비교할 때 쓰세요."
      tool={<DiffTool />}
      guideTitle="텍스트 비교하는 방법"
      guides={DIFF_GUIDES}
      faq={DIFF_FAQ}
      related={
        <>
          PDF에서 복사해 줄이 끊긴 글은{" "}
          <Link className="inlineLink" href="/linebreak/">
            줄바꿈 제거
          </Link>
          로 먼저 정리하고, 고친 글의 길이는{" "}
          <Link className="inlineLink" href="/count/">
            글자수 세기
          </Link>
          로 확인하세요.
        </>
      }
    />
  );
}

import Link from "next/link";
import { FillBlanksTool } from "@/components/FillBlanksTool";
import { ToolPageLayout, toolMetadata } from "@/components/ToolPageLayout";
import { FILL_BLANKS_FAQ, FILL_BLANKS_GUIDES, FILL_BLANKS_META as M } from "@/content/fillBlanks";

export const metadata = toolMetadata(M, "/og-fill-blanks.png", "엑셀 빈칸 채우기 화면");

export default function FillBlanksPage() {
  return (
    <ToolPageLayout
      id="fillblanks"
      meta={M}
      lede="병합을 풀어 빈칸이 생긴 표를 붙여넣으면 빈칸을 바로 위 값으로 채워 줍니다. 채울 열을 고를 수 있고, 아래 값이나 0·- 같은 값으로도 채웁니다. 복사해서 엑셀에 붙여넣으면 정렬·필터·피벗을 바로 쓸 수 있습니다."
      tool={<FillBlanksTool />}
      guideTitle="엑셀에서 빈칸 채우는 방법"
      guides={FILL_BLANKS_GUIDES}
      faq={FILL_BLANKS_FAQ}
      related={
        <>
          채운 표에서 같은 행을 지우려면{" "}
          <Link className="inlineLink" href="/dedupe/">
            엑셀 중복 제거
          </Link>
          를, 한 칸에 든 값을 여러 칸으로 나누려면{" "}
          <Link className="inlineLink" href="/cell-split/">
            엑셀 셀 나누기
          </Link>
          를, 행과 열을 바꾸려면{" "}
          <Link className="inlineLink" href="/transpose/">
            엑셀 행열 바꾸기
          </Link>
          를 쓰세요.
        </>
      }
    />
  );
}

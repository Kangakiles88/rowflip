import Link from "next/link";
import { CellSplitTool } from "@/components/CellSplitTool";
import { ToolPageLayout, toolMetadata } from "@/components/ToolPageLayout";
import { CELL_SPLIT_FAQ, CELL_SPLIT_GUIDES, CELL_SPLIT_META as M } from "@/content/cellSplit";

export const metadata = toolMetadata(M, "/og-cell-split.png", "엑셀 셀 나누기 화면");

export default function CellSplitPage() {
  return (
    <ToolPageLayout
      id="cellsplit"
      meta={M}
      lede="한 칸에 들어 있는 주소, 전화번호, 이름, 셀 안 줄바꿈 목록을 붙여넣으면 띄어쓰기·쉼표 기준으로 한 셀을 두 칸, 세 칸으로 나눠 줍니다. 복사해서 엑셀에 붙여넣으면 나눈 칸 그대로 들어갑니다."
      tool={<CellSplitTool />}
      guideTitle="엑셀에서 셀 나누는 방법"
      guides={CELL_SPLIT_GUIDES}
      faq={CELL_SPLIT_FAQ}
      related={
        <>
          쉼표로 이어진 목록 하나를 세로로 바꾸려면{" "}
          <Link className="inlineLink" href="/split/">
            쉼표를 줄바꿈으로 변환
          </Link>
          을, 나눈 값에서 중복을 지우거나 세려면{" "}
          <Link className="inlineLink" href="/dedupe/">
            엑셀 중복 제거
          </Link>
          를, 표의 행과 열을 통째로 바꾸려면{" "}
          <Link className="inlineLink" href="/transpose/">
            엑셀 행열 바꾸기
          </Link>
          를 쓰세요.
        </>
      }
    />
  );
}

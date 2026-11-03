import type { FunctionLesson } from "@/content/functions";
import { FormulaLab } from "./FormulaLab";
import { ToolPageLayout, toolMetadata } from "./ToolPageLayout";

/** 함수 페이지 메타데이터 */
export function lessonMetadata(l: FunctionLesson) {
  return toolMetadata(l.meta, l.ogImage, l.ogAlt);
}

/** 엑셀 함수 페이지 공통 틀 — 연습장 + 안내 + FAQ */
export function FunctionLessonPage({ lesson: l }: { lesson: FunctionLesson }) {
  return (
    <ToolPageLayout
      id={l.id}
      meta={l.meta}
      lede={l.lede}
      tool={<FormulaLab data={l.lab} />}
      guideTitle={l.guideTitle}
      guides={l.guides}
      faq={l.faq}
      related={l.related}
    />
  );
}

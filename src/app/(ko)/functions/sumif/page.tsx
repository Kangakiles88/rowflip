import { FunctionLessonPage, lessonMetadata } from "@/components/FunctionLessonPage";
import { SUMIF_LESSON } from "@/content/functions";

export const metadata = lessonMetadata(SUMIF_LESSON);

export default function SumifPage() {
  return <FunctionLessonPage lesson={SUMIF_LESSON} />;
}

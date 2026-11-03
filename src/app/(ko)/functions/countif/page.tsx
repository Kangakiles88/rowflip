import { FunctionLessonPage, lessonMetadata } from "@/components/FunctionLessonPage";
import { COUNTIF_LESSON } from "@/content/functions";

export const metadata = lessonMetadata(COUNTIF_LESSON);

export default function CountifPage() {
  return <FunctionLessonPage lesson={COUNTIF_LESSON} />;
}

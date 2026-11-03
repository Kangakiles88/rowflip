import { FunctionLessonPage, lessonMetadata } from "@/components/FunctionLessonPage";
import { IF_LESSON } from "@/content/functions";

export const metadata = lessonMetadata(IF_LESSON);

export default function IfPage() {
  return <FunctionLessonPage lesson={IF_LESSON} />;
}

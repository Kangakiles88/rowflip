import { FunctionLessonPage, lessonMetadata } from "@/components/FunctionLessonPage";
import { FUNCTIONS_INDEX } from "@/content/functions";

export const metadata = lessonMetadata(FUNCTIONS_INDEX);

export default function FunctionsPage() {
  return <FunctionLessonPage lesson={FUNCTIONS_INDEX} />;
}

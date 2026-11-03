import { FunctionLessonPage, lessonMetadata } from "@/components/FunctionLessonPage";
import { VLOOKUP_LESSON } from "@/content/functions";

export const metadata = lessonMetadata(VLOOKUP_LESSON);

export default function VlookupPage() {
  return <FunctionLessonPage lesson={VLOOKUP_LESSON} />;
}

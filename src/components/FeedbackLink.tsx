"use client";

import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";

/** 푸터 '의견 보내기' — 메일 제목에 보낸 페이지 경로를 넣어 어느 도구에 대한 의견인지 바로 알 수 있게 한다(경로만, 입력 데이터 없음). */
export function FeedbackLink() {
  const pathname = usePathname() || "/";
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const subject = encodeURIComponent(`[RowFlip 의견] ${path}`);
  return <a href={`mailto:${siteConfig.contactEmail}?subject=${subject}`}>의견 보내기</a>;
}

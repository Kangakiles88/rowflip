/**
 * 사이트 기본 정보 · SEO 설정.
 * 배포 도메인과 검색엔진 인증 코드는 .env 로 넣는다 (.env.example 참고).
 */
const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const siteConfig = {
  name: "엑셀 가로세로",
  url: rawUrl.replace(/\/+$/, ""),
  title: "엑셀 가로세로 변환기 - 세로를 가로로, 줄바꿈을 쉼표로",
  h1: "엑셀 가로세로 변환기",
  description:
    "엑셀·구글 시트에서 복사한 데이터를 붙여넣으면 세로를 가로로, 가로를 세로로 바로 바꿔 줍니다. 줄바꿈 쉼표 변환, 중복 제거, SQL IN, JSON 배열 변환까지 설치 없이 무료로 쓸 수 있습니다.",
  keywords: [
    "엑셀 가로세로",
    "엑셀 가로 세로 변환",
    "엑셀 세로를 가로로",
    "엑셀 가로를 세로로",
    "엑셀 쉼표 변환",
    "줄바꿈 쉼표 변환",
    "엑셀 복붙",
    "텍스트 한 줄 변환",
    "중복 제거",
    "엑셀 데이터 정리",
    "SQL IN 변환",
    "JSON 배열 변환",
    "리스트 변환기",
  ],
  locale: "ko_KR",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    naver: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || "",
  },
} as const;

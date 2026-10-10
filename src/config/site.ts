/**
 * 사이트 기본 정보 · SEO 설정.
 * 배포 도메인과 검색엔진 인증 코드는 .env 로 넣는다 (.env.example 참고).
 */
const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rowflip.com";

export const siteConfig = {
  /** 브랜드 이름 — 상표 문제를 피하려고 "엑셀"은 브랜드가 아니라 페이지 제목·본문에서만 쓴다 */
  name: "RowFlip",
  url: rawUrl.replace(/\/+$/, ""),
  title: "엑셀 가로세로 변환기 - 세로를 가로로, 줄바꿈을 쉼표로 | RowFlip",
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
  /** 문의 메일 — Cloudflare 이메일 라우팅으로 운영자 메일함에 전달된다(공개용 주소라 코드에 둔다, env가 있으면 env 우선) */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@rowflip.com",
  /** 검색엔진 소유 확인 값 — 페이지 HTML에 공개되는 값이라 코드에 둔다(env가 있으면 env 우선) */
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    naver: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || "f0dec20a2cb5e231e3b4bb9d3c370d601c975d41",
  },
} as const;

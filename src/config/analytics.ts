/**
 * Google Analytics 4 — 측정 ID는 페이지 HTML에 공개되는 값이라 코드에 둔다(env가 있으면 env 우선).
 * 끄려면 NEXT_PUBLIC_GA_ID=off 로 빌드한다.
 * 보내는 것은 페이지 조회와 trackShare·trackPromotionClick 이벤트뿐이며, 입력 데이터·결과는 절대 넣지 않는다.
 */
const raw = process.env.NEXT_PUBLIC_GA_ID || "G-N193ST4FX3";

export const analyticsConfig = {
  gaId: raw === "off" ? "" : raw,
} as const;

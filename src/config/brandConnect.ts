import type { BrandConnectBannerConfig } from "@/types";

/**
 * 네이버 브랜드커넥트 배너 설정.
 * 배너를 바꿀 때는 이 파일만 수정하면 된다.
 *
 * - href가 비어 있으면 배너는 렌더링되지 않는다.
 * - desktopImage가 없으면 텍스트형 배너로 표시된다.
 * - mobileImage가 없으면 모바일에서도 desktopImage를 쓴다.
 * - 이미지는 public/ads/ 폴더에 넣고 "/ads/파일명" 으로 지정한다.
 * - position: "top"(헤더 아래) | "middle"(변환기 아래, 기본) | "bottom"(FAQ 위)
 * - .env의 NEXT_PUBLIC_BRAND_CONNECT_ENABLED=false 로 배포 환경에서 끌 수 있다.
 */
const brandConnect: BrandConnectBannerConfig = {
  enabled: true,
  href: "https://example.com/your-brandconnect-link",
  desktopImage: "",
  mobileImage: "",
  imageAlt: "",
  title: "모니터 받침대 겸 키보드 수납 선반",
  description: "책상 위 케이블과 키보드를 한 번에 정리하는 원목 선반입니다.",
  ctaText: "상품 보기",
  disclosureText:
    "이 배너는 네이버 브랜드커넥트 활동의 일환으로, 구매 시 운영자에게 일정액의 수수료가 지급됩니다.",
  position: "middle",
};

const envEnabled = process.env.NEXT_PUBLIC_BRAND_CONNECT_ENABLED;

export const brandConnectConfig: BrandConnectBannerConfig = {
  ...brandConnect,
  enabled:
    (envEnabled === undefined ? brandConnect.enabled : envEnabled === "true") &&
    brandConnect.href.trim() !== "",
};

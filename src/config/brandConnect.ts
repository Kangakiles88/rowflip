import type { BrandConnectConfig } from "@/types";

/**
 * 네이버 브랜드커넥트 상품 설정 — 상품을 바꿀 때는 이 파일만 수정한다.
 *
 * - products: 띠에는 한 번에 하나만 보이고, 새로고침할 때마다 다음 상품으로 바뀐다(첫 방문은 무작위 시작). 링크(href)가 빈 상품은 빠진다. 하나도 없으면 영역 전체가 숨겨진다.
 * - disclosure: 네이버가 아닌 제휴 링크(삼성닷컴 등)는 상품마다 대가성 안내를 따로 적는다
 * - image: public/ads/ 폴더에 정사각형 이미지(360×360 webp 권장)를 넣고 "/ads/파일명"으로 지정
 * - position: "header"(메뉴 바로 아래·제목 위, 한 줄 띠) | "top" | "middle" | "bottom"
 *   띠는 높이가 낮아 첫 화면에서 도구를 밀어내지 않는다.
 * - .env의 NEXT_PUBLIC_BRAND_CONNECT_ENABLED=false 로 배포 환경에서 끌 수 있다.
 */
const brandConnect: BrandConnectConfig = {
  enabled: true,
  title: "추천 상품",
  disclosureText: "네이버 브랜드 커넥트 활동 일환으로 일정 부분 판매 발생시 수수료를 제공 받습니다",
  position: "header",
  products: [
    { name: "듀오백 T-ZERO 사무용 의자", href: "https://naver.me/GcA73bpW", image: "/ads/duoback-t-zero.webp" },
    {
      name: "클라우드백 마이사이즈체어 컴퓨터의자",
      href: "https://naver.me/FIc9UOAo",
      image: "/ads/cloudback-mysize.webp",
    },
    { name: "더블에이 A4용지", href: "https://naver.me/xSBk7jmm", image: "/ads/doublea-a4.webp" },
    {
      name: "가죽 데스크매트 논슬립 데스크패드",
      href: "https://naver.me/IIDG0xv9",
      image: "/ads/leather-desk-mat.webp",
    },
    {
      name: "데스커 컴퓨터 책상 2.0 1600×800mm",
      href: "https://naver.me/xvC5iujR",
      image: "/ads/desker-desk-1600.webp",
    },
    {
      name: "갤럭시 북6 노트북",
      href: "https://www.samsung.com/sec/ace/link/yaM",
      image: "/ads/galaxy-book6.webp",
      disclosure: "삼성닷컴 제휴 링크로 구매 시 일정 수수료를 받을 수 있습니다",
    },
  ],
};

const envEnabled = process.env.NEXT_PUBLIC_BRAND_CONNECT_ENABLED;
const products = brandConnect.products.filter((p) => p.href.trim() !== "");

export const brandConnectConfig: BrandConnectConfig = {
  ...brandConnect,
  products,
  enabled: (envEnabled === undefined ? brandConnect.enabled : envEnabled === "true") && products.length > 0,
};

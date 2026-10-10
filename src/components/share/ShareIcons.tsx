import { siFacebook, siKakaotalk, siNaver, siX, type SimpleIcon } from "simple-icons";

/**
 * 공유 버튼 아이콘.
 * 브랜드 아이콘은 simple-icons(CC0 아이콘 모음) 패키지의 공개 데이터를 그대로 쓴다.
 * 각 브랜드의 상표 사용 규정은 해당 회사 가이드를 따른다.
 */
export type ShareIconName = "kakao" | "naver" | "band" | "facebook" | "x" | "link" | "check" | "share" | "close";

const BRANDS: Partial<Record<ShareIconName, SimpleIcon>> = {
  kakao: siKakaotalk,
  naver: siNaver,
  facebook: siFacebook,
  x: siX,
};

export function ShareIcon({ name, size = 22 }: { name: ShareIconName; size?: number }) {
  const brand = BRANDS[name];
  if (brand) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={brand.path} />
      </svg>
    );
  }

  const line = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    // 밴드는 아이콘 모음에 없어 '모임'을 뜻하는 일반 아이콘으로 표시
    case "band":
      return (
        <svg {...line}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M6 19.5a6 6 0 0 1 12 0" />
          <circle cx="5" cy="10" r="2.2" />
          <path d="M1.8 17.5a3.6 3.6 0 0 1 3.9-3.4" />
          <circle cx="19" cy="10" r="2.2" />
          <path d="M22.2 17.5a3.6 3.6 0 0 0-3.9-3.4" />
        </svg>
      );
    case "link":
      return (
        <svg {...line}>
          <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4l-1.1 1.1" />
          <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.1-1.1" />
        </svg>
      );
    case "check":
      return (
        <svg {...line}>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      );
    case "share":
      return (
        <svg {...line}>
          <path d="M12 15V3.5" />
          <path d="M7.5 8L12 3.5 16.5 8" />
          <path d="M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5" />
        </svg>
      );
    case "close":
      return (
        <svg {...line}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Google AdSense 설정.
 * - 게시자 ID(ca-pub-…)는 브라우저에 공개되는 값이라 코드에 기본값으로 둔다(env가 있으면 env 우선, "off"면 끔).
 * - 게시자 ID가 있으면 AdSense 스크립트·ads.txt·소유 확인 메타 태그가 들어간다 → 심사·자동 광고는 AdSense 화면에서 켜고 끈다.
 * - 직접 배치하는 광고 칸(top·bottom)은 NEXT_PUBLIC_ADSENSE_ENABLED=true + 슬롯 ID가 있어야 나온다(승인 후).
 * NEXT_PUBLIC_ 값은 빌드 시점에 코드에 박히므로, 값을 바꾸면 다시 빌드해야 한다.
 */
const DEFAULT_CLIENT_ID = "ca-pub-1418493009023603";
const envClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const clientId = envClient === "off" ? "" : envClient || DEFAULT_CLIENT_ID;

export const adsConfig = {
  /** AdSense 스크립트를 넣을지(심사·자동 광고용) */
  scriptEnabled: clientId !== "",
  /** 직접 배치한 광고 칸을 보여 줄지 */
  enabled: process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true" && clientId !== "",
  clientId,
  slots: {
    top: process.env.NEXT_PUBLIC_ADSENSE_TOP_SLOT ?? "",
    bottom: process.env.NEXT_PUBLIC_ADSENSE_BOTTOM_SLOT ?? "",
  },
} as const;

export type AdSlotKey = keyof typeof adsConfig.slots;

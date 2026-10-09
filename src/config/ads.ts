/**
 * Google AdSense 설정 — .env 파일(NEXT_PUBLIC_*)로만 제어한다.
 * NEXT_PUBLIC_ 값은 빌드 시점에 코드에 박히므로, 값을 바꾸면 다시 빌드해야 한다.
 */
const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "";

export const adsConfig = {
  enabled: process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true" && clientId !== "",
  clientId,
  slots: {
    top: process.env.NEXT_PUBLIC_ADSENSE_TOP_SLOT ?? "",
    bottom: process.env.NEXT_PUBLIC_ADSENSE_BOTTOM_SLOT ?? "",
  },
} as const;

export type AdSlotKey = keyof typeof adsConfig.slots;

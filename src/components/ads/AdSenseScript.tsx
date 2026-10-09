import Script from "next/script";
import { adsConfig } from "@/config/ads";

/** AdSense가 꺼져 있으면 스크립트 자체를 넣지 않는다. */
export function AdSenseScript() {
  if (!adsConfig.enabled) return null;
  return (
    <Script
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsConfig.clientId}`}
    />
  );
}

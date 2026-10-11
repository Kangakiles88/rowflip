import { adsConfig } from "@/config/ads";

/**
 * AdSense 스크립트 — <head>에 일반 script 태그로 넣어 정적 HTML에 그대로 남게 한다
 * (심사 로봇이 페이지 원본에서 코드를 찾을 수 있도록). 게시자 ID가 없으면 넣지 않는다.
 */
export function AdSenseScript() {
  if (!adsConfig.scriptEnabled) return null;
  return (
    <script
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsConfig.clientId}`}
    />
  );
}

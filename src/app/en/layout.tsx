import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AdSenseScript } from "@/components/ads/AdSenseScript";
import { adsConfig } from "@/config/ads";
import { analyticsConfig } from "@/config/analytics";
import { siteConfig } from "@/config/site";
import "../pretendard.css";
import "../globals.css";

/**
 * 영어 페이지(/en/)의 루트 레이아웃 — <html lang="en">을 정적 HTML에 그대로 남기려고
 * 한국어 페이지((ko) 그룹)와 루트 레이아웃을 나눴다. 두 쪽을 오가면 전체 새로고침된다.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  applicationName: siteConfig.name,
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
  ...(siteConfig.verification.google ? { verification: { google: siteConfig.verification.google } } : {}),
  ...(adsConfig.scriptEnabled ? { other: { "google-adsense-account": adsConfig.clientId } } : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f3f0" },
    { media: "(prefers-color-scheme: dark)", color: "#141413" },
  ],
};

export default function EnLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <AdSenseScript />
      </head>
      <body>{children}</body>
      {analyticsConfig.gaId && <GoogleAnalytics gaId={analyticsConfig.gaId} />}
    </html>
  );
}

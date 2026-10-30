import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AdSenseScript } from "@/components/ads/AdSenseScript";
import { adsConfig } from "@/config/ads";
import { analyticsConfig } from "@/config/analytics";
import { siteConfig } from "@/config/site";
import "../pretendard.css";
import "../globals.css";

const { google, naver } = siteConfig.verification;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  // 하위 페이지 제목 뒤에 " | RowFlip"이 붙는다 (메인 페이지는 default를 그대로 씀)
  title: { default: siteConfig.title, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    locale: siteConfig.locale,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "엑셀 가로세로 변환기 화면" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
  verification: {
    ...(google ? { google } : {}),
    ...(naver ? { other: { "naver-site-verification": naver } } : {}),
  },
  // AdSense 사이트 소유 확인
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <AdSenseScript />
      </head>
      <body>
        {children}
      </body>
      {analyticsConfig.gaId && <GoogleAnalytics gaId={analyticsConfig.gaId} />}
    </html>
  );
}

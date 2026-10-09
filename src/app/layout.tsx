import type { Metadata, Viewport } from "next";
import { AdSenseScript } from "@/components/ads/AdSenseScript";
import { siteConfig } from "@/config/site";
import "./globals.css";

const { google, naver } = siteConfig.verification;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
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
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        {children}
        <AdSenseScript />
      </body>
    </html>
  );
}

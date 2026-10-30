import Link from "next/link";
import { INFO_PAGES, TOOL_PAGES } from "@/config/nav";
import { siteConfig } from "@/config/site";
import { FeedbackLink } from "./FeedbackLink";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <nav className="footerNav" aria-label="사이트 기능">
          <span className="footerName">{siteConfig.name}</span>
          {TOOL_PAGES.map((p) => (
            <Link key={p.id} href={p.href}>
              {p.label}
            </Link>
          ))}
          {INFO_PAGES.map((p) => (
            <Link key={p.id} href={p.href}>
              {p.label}
            </Link>
          ))}
          <Link href="/en/" hrefLang="en" lang="en">
            English
          </Link>
          {siteConfig.contactEmail && (
            <FeedbackLink />
          )}
        </nav>
        <span>모든 데이터 변환은 현재 브라우저에서만 처리됩니다. 입력한 내용은 서버로 전송되거나 저장되지 않습니다.</span>
      </div>
    </footer>
  );
}

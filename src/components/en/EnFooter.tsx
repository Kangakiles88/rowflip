import Link from "next/link";
import { EN_TOOL_PAGES } from "@/config/navEn";
import { siteConfig } from "@/config/site";

export function EnFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <nav className="footerNav" aria-label="Site">
          <span className="footerName">{siteConfig.name}</span>
          {EN_TOOL_PAGES.map((p) => (
            <Link key={p.id} href={p.href}>
              {p.label}
            </Link>
          ))}
          <Link href="/en/blog/">Blog</Link>
          <Link href="/" hrefLang="ko" lang="ko">
            한국어
          </Link>
          <Link href="/privacy/" hrefLang="ko">
            Privacy policy (Korean)
          </Link>
          {siteConfig.contactEmail && (
            <a href={`mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent("[RowFlip feedback] /en/")}`}>
              Feedback
            </a>
          )}
        </nav>
        <span>All conversions run in this browser. The data you enter is not sent to a server or saved.</span>
      </div>
    </footer>
  );
}

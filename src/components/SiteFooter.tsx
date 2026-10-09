import Link from "next/link";
import { TOOL_PAGES } from "@/config/nav";
import { siteConfig } from "@/config/site";

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
        </nav>
        <span>모든 데이터 변환은 현재 브라우저에서만 처리됩니다. 입력한 내용은 서버로 전송되거나 저장되지 않습니다.</span>
      </div>
    </footer>
  );
}

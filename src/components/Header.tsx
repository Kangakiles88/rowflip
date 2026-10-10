import Link from "next/link";
import { ActiveTabScroll } from "./ActiveTabScroll";
import { TOOL_PAGES, type ToolPageId } from "@/config/nav";
import { siteConfig } from "@/config/site";
import styles from "./tool.module.css";

function Mark() {
  return (
    <svg className={styles.mark} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="currentColor" />
      <g fill="var(--panel)">
        <rect x="7" y="7" width="5" height="5" rx="1" />
        <rect x="7" y="13.5" width="5" height="5" rx="1" opacity=".55" />
        <rect x="7" y="20" width="5" height="5" rx="1" opacity=".3" />
        <rect x="13.5" y="7" width="5" height="5" rx="1" opacity=".55" />
        <rect x="20" y="7" width="5" height="5" rx="1" opacity=".3" />
      </g>
    </svg>
  );
}

export function Header({ current }: { current?: ToolPageId }) {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerInner}`}>
        <div className={styles.headerLeft}>
          <Link className={styles.wordmark} href="/" aria-label={`${siteConfig.name} 홈`}>
            <Mark />
            {siteConfig.name}
          </Link>
          <nav id="tool-nav" className={styles.nav} aria-label="기능">
            {TOOL_PAGES.map((p) => (
              <Link
                key={p.id}
                href={p.href}
                className={styles.navLink}
                aria-current={p.id === current ? "page" : undefined}
              >
                {p.label}
              </Link>
            ))}
          </nav>
          <ActiveTabScroll navId="tool-nav" />
        </div>
        <p className={styles.privacy}>
          <span className={styles.privacyDot} aria-hidden="true" />
          입력한 데이터는 서버로 전송되지 않습니다
        </p>
      </div>
    </header>
  );
}

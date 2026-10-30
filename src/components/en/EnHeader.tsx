import Link from "next/link";
import { EN_TOOL_PAGES, type EnPageId } from "@/config/navEn";
import { siteConfig } from "@/config/site";
import { Mark } from "../Header";
import styles from "../tool.module.css";

/** 영어 페이지 헤더 — 영어 도구 링크 + 같은 도구의 한국어 페이지 링크 */
export function EnHeader({ current }: { current: EnPageId }) {
  const ko = EN_TOOL_PAGES.find((p) => p.id === current)?.koHref ?? "/";
  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerInner}`}>
        <div className={styles.headerLeft}>
          <Link className={styles.wordmark} href="/en/" aria-label={`${siteConfig.name} home`}>
            <Mark />
            {siteConfig.name}
          </Link>
          <nav className={styles.nav} aria-label="Tools">
            {EN_TOOL_PAGES.map((p) => (
              <div key={p.id} className={`${styles.navGroup} ${styles.navGroupLink}`}>
                <Link
                  href={p.href}
                  className={styles.navButton}
                  data-current={p.id === current || undefined}
                  aria-current={p.id === current ? "page" : undefined}
                >
                  {p.label}
                </Link>
              </div>
            ))}
            <div className={`${styles.navGroup} ${styles.navGroupLink}`}>
              <Link href={ko} hrefLang="ko" lang="ko" className={styles.navButton}>
                한국어
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

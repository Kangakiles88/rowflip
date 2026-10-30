import Link from "next/link";
import type { NavCurrent } from "@/config/nav";
import { siteConfig } from "@/config/site";
import { NavMenu } from "./NavMenu";
import styles from "./tool.module.css";

export function Mark() {
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

export function Header({ current }: { current?: NavCurrent }) {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerInner}`}>
        <div className={styles.headerLeft}>
          <Link className={styles.wordmark} href="/" aria-label={`${siteConfig.name} 홈`}>
            <Mark />
            {siteConfig.name}
          </Link>
          <NavMenu current={current} />
        </div>
      </div>
    </header>
  );
}

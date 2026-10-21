"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BLOG_NAV, TOOL_GROUPS, TOOL_PAGES, type NavCurrent, type ToolGroupId } from "@/config/nav";
import styles from "./tool.module.css";

/**
 * 헤더 기능 메뉴 — 묶음(엑셀·목록 / 텍스트 / 문서 만들기) 버튼을 누르면 그 묶음의 도구 목록이 펼쳐진다.
 * 링크는 닫혀 있어도 HTML에 남겨 둔다(검색 로봇이 따라갈 수 있게).
 */
export function NavMenu({ current }: { current?: NavCurrent }) {
  const [open, setOpen] = useState<ToolGroupId | null>(null);
  const ref = useRef<HTMLElement>(null);
  const currentGroup = TOOL_PAGES.find((p) => p.id === current)?.group;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <nav ref={ref} className={styles.nav} aria-label="기능">
      {TOOL_GROUPS.map((g) => {
        const pages = TOOL_PAGES.filter((p) => p.group === g.id);
        const isOpen = open === g.id;
        const panelId = `nav-${g.id}`;
        return (
          <div key={g.id} className={styles.navGroup}>
            <button
              type="button"
              className={styles.navButton}
              aria-expanded={isOpen}
              aria-controls={panelId}
              data-current={g.id === currentGroup || undefined}
              onClick={() => setOpen(isOpen ? null : g.id)}
            >
              {g.short}
              <span className={styles.navCaret} aria-hidden="true" />
            </button>
            <div id={panelId} className={styles.navPanel} hidden={!isOpen}>
              <p className={styles.navPanelTitle}>{g.label}</p>
              <ul>
                {pages.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={p.href}
                      className={styles.navItem}
                      aria-current={p.id === current ? "page" : undefined}
                      onClick={() => setOpen(null)}
                    >
                      <strong>{p.title}</strong>
                      <span>{p.desc}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
      <div className={`${styles.navGroup} ${styles.navGroupLink}`}>
        <Link
          href={BLOG_NAV.href}
          className={styles.navButton}
          data-current={current === "blog" || undefined}
          aria-current={current === "blog" ? "page" : undefined}
        >
          {BLOG_NAV.label}
        </Link>
      </div>
    </nav>
  );
}

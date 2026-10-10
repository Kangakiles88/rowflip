"use client";

import { useEffect } from "react";

/** 휴대폰에서 기능 탭이 넘칠 때, 지금 페이지 탭이 화면 안에 보이도록 탭 줄만 옆으로 스크롤한다. */
export function ActiveTabScroll({ navId }: { navId: string }) {
  useEffect(() => {
    const nav = document.getElementById(navId);
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;
    const left = active.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft;
    nav.scrollLeft = left - (nav.clientWidth - active.offsetWidth) / 2;
  }, [navId]);
  return null;
}

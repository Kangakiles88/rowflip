"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * 화면 언어 — 한국어 페이지(기본)와 영어 페이지(/en/)가 같은 도구 컴포넌트를 함께 쓴다.
 * Provider가 없으면 한국어라 기존 페이지는 손대지 않아도 된다.
 */
export type Locale = "ko" | "en";

const LocaleContext = createContext<Locale>("ko");

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export const useLocale = (): Locale => useContext(LocaleContext);

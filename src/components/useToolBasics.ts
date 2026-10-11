"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { copyText } from "@/utils/clipboard";
import { useConvertGate } from "./share/useConvertGate";

/**
 * 기능 페이지 공통 상태 — 옵션(브라우저에 기억), 복사·토스트, 첫 변환 공유 안내, Ctrl/⌘+Enter.
 * 옵션 중 storedKeys에 적은 것만 저장한다. 입력 데이터와 결과는 저장하지 않는다.
 */
export function useToolBasics<T extends object>({
  storageKey,
  defaults,
  storedKeys,
  sanitize = (o) => o,
}: {
  storageKey: string;
  defaults: T;
  storedKeys: readonly (keyof T)[];
  /** 저장값 중 지금 버전에 없는 선택지 등을 걸러 낸다 */
  sanitize?: (saved: Partial<T>) => Partial<T>;
}) {
  const [options, setOptions] = useState<T>(defaults);
  const [toast, setToast] = useState<string | null>(null);
  const [modKey, setModKey] = useState("Ctrl");
  const [shareOpen, setShareOpen] = useState(false);
  const loaded = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const gate = useConvertGate();

  useEffect(() => {
    let saved: Partial<T> = {};
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      for (const k of storedKeys) {
        if (typeof parsed[k as string] === typeof defaults[k]) Object.assign(saved, { [k]: parsed[k as string] });
      }
      saved = sanitize(saved);
    } catch {
      /* 무시 */
    }
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 전용 값을 마운트 후 1회 반영
    setOptions((o) => ({ ...o, ...saved }));
    setModKey(isMac ? "⌘" : "Ctrl");
    loaded.current = true;
    // 처음 한 번만 읽는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      const out: Record<string, unknown> = {};
      for (const k of storedKeys) out[k as string] = options[k];
      window.localStorage.setItem(storageKey, JSON.stringify(out));
    } catch {
      /* 무시 */
    }
  }, [options, storageKey, storedKeys]);

  const update = useCallback((patch: Partial<T>) => setOptions((o) => ({ ...o, ...patch })), []);

  const showToast = useCallback((message: string) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 1500);
  }, []);

  const startConvert = useCallback(() => {
    gate.unlock();
    setShareOpen(true);
  }, [gate]);

  /** 잠겨 있으면 첫 변환(공유 안내)부터, 아니면 복사 */
  const copy = useCallback(
    async (text: string, hasInput: boolean) => {
      if (gate.locked) {
        if (hasInput) startConvert();
        return;
      }
      if (!text) return;
      const ok = await copyText(text);
      showToast(ok ? "복사되었습니다." : "복사하지 못했습니다. 결과를 직접 선택해 주세요.");
    },
    [gate.locked, startConvert, showToast],
  );

  return {
    options,
    setOptions,
    update,
    toast,
    showToast,
    modKey,
    gate,
    shareOpen,
    setShareOpen,
    startConvert,
    copy,
  };
}

/** Ctrl/⌘+Enter로 복사 */
export function useCopyShortcut(handler: () => void) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        ref.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

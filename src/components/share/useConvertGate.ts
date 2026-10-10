"use client";

import { useCallback, useSyncExternalStore } from "react";
import { shareConfig } from "@/config/share";

/** 사이트 전체에서 하나의 상태 — 한 페이지에서 풀면 다른 페이지도 바로 변환된다. */
const KEY = "excel-garosero:convert-gate:v1";
/** 같은 탭 안의 다른 페이지(미리 불러온 페이지 포함)에 풀렸다고 알리는 이벤트 */
const EVENT = "excel-garosero:convert-gate-unlocked";

/** 저장소를 못 쓰는 환경(시크릿 창 제한 등)을 위한 메모리 표시 */
let unlockedInMemory = false;

function storage(): Storage | null {
  try {
    return shareConfig.frequency === "once" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function isLocked(): boolean {
  if (!shareConfig.enabled || unlockedInMemory) return false;
  try {
    return storage()?.getItem(KEY) !== "1";
  } catch {
    return true;
  }
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) onChange();
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * 첫 변환 버튼 상태.
 * locked 가 true 인 동안에는 결과를 보여 주지 않고 [변환하기] 버튼을 띄운다.
 * 서버(정적 HTML)에서는 잠긴 상태로 그리고, 브라우저에서는 저장된 값을 바로 읽는다.
 * 저장하는 값은 "1" 하나뿐이며 입력 데이터와는 무관하다.
 */
export function useConvertGate() {
  const locked = useSyncExternalStore(subscribe, isLocked, () => shareConfig.enabled);

  const unlock = useCallback(() => {
    unlockedInMemory = true;
    try {
      storage()?.setItem(KEY, "1");
    } catch {
      /* 저장 불가 환경에서는 메모리 표시로 이번 방문 동안만 풀린다 */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { locked, unlock };
}

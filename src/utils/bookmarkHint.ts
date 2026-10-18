/**
 * 북마크 안내 — 두 번째로 복사에 성공했을 때 한 번만 "Ctrl+D로 북마크" 안내를 붙인다.
 * 브라우저는 사이트가 북마크를 대신 추가하지 못하게 막아 두어 단축키만 안내한다.
 * 저장값은 복사 횟수("1") 또는 안내를 마친 표시("done")뿐 — 복사한 내용은 저장하지 않는다.
 */
export const BOOKMARK_HINT_KEY = "rowflip:bookmark-hint:v1";

export const COPIED = "복사되었습니다.";

/** 저장값 → 이번에 안내할지와 다음 저장값 */
export function nextBookmarkHint(stored: string | null): { show: boolean; next: string } {
  if (stored === "done") return { show: false, next: "done" };
  const count = Number(stored) || 0;
  if (count >= 1) return { show: true, next: "done" };
  return { show: false, next: String(count + 1) };
}

export function bookmarkMessage(isMac: boolean): string {
  return `${COPIED} 다음에 바로 쓰려면 ${isMac ? "⌘+D" : "Ctrl+D"}로 북마크해 두세요.`;
}

/** 복사 성공 토스트 문구 — 터치 기기(단축키 없음)에서는 안내하지 않는다 */
export function copiedMessage(): string {
  try {
    if (window.matchMedia("(hover: none)").matches) return COPIED;
    const { show, next } = nextBookmarkHint(window.localStorage.getItem(BOOKMARK_HINT_KEY));
    window.localStorage.setItem(BOOKMARK_HINT_KEY, next);
    if (!show) return COPIED;
    return bookmarkMessage(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  } catch {
    return COPIED;
  }
}

/** 긴 안내는 읽을 시간을 더 준다 */
export const toastDuration = (message: string) => (message.length > 20 ? 4500 : 1500);

/**
 * 클립보드에 복사. html을 주면 표 형식도 함께 넣는다.
 * 윈도우 브라우저는 글자 복사 때 줄바꿈을 모두 CR+LF로 바꿔, 엑셀 셀 안 줄바꿈 앞에 보이지 않는 CR(♪)이 붙는다.
 * 엑셀은 표 형식(HTML)이 있으면 그걸 먼저 읽고 셀 안 줄바꿈을 정확히 넣는다.
 */
export async function copyText(text: string, html?: string): Promise<boolean> {
  if (html && typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([text], { type: "text/plain" }),
          "text/html": new Blob([html], { type: "text/html" }),
        }),
      ]);
      return true;
    } catch {
      /* 표 형식이 막힌 환경 — 글자만 복사 */
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 클립보드 API가 막힌 환경용 대체 경로
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

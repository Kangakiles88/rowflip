"use client";

import { useState } from "react";
import { siteConfig } from "@/config/site";
import { copyText } from "@/utils/clipboard";
import { withShareUtm } from "@/utils/shareUrl";
import { trackShare } from "@/utils/tracking";

/**
 * 첫 변환 팝업과 별개로 늘 보이는 '이 도구 링크 복사' 버튼.
 * 원하는 사람만 누르므로 팝업처럼 흐름을 막지 않는다.
 * 복사되는 주소는 대표 주소 + 페이지 경로 + UTM(page_copy)뿐 — 입력 데이터는 들어가지 않는다.
 */
export function PageLinkCopy({ path }: { path: string }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  const url = withShareUtm(`${siteConfig.url}${path}`, "page_copy");

  const copy = async () => {
    trackShare({ channel: "page_copy", page: path });
    const ok = await copyText(url);
    setState(ok ? "done" : "fail");
    if (ok) window.setTimeout(() => setState("idle"), 2400);
  };

  return (
    <span className="pageLinkCopy">
      <button type="button" onClick={copy}>
        이 도구 링크 복사
      </button>
      <span aria-live="polite">
        {state === "done" ? "링크를 복사했습니다. 메신저에 붙여넣으세요." : state === "fail" ? `주소: ${url}` : ""}
      </span>
    </span>
  );
}

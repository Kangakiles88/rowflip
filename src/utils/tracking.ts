import type { PromotionPosition } from "../types";

/**
 * 프로모션 클릭 이벤트.
 * 인자 타입을 고정해 두어 입력 데이터나 결과가 이벤트에 섞여 들어갈 수 없게 한다.
 * 분석 도구(gtag 등)가 페이지에 있으면 그쪽으로 전달하고, 없으면 아무 일도 하지 않는다.
 */
export interface PromotionClickEvent {
  type: "brand-connect" | "adsense";
  position: PromotionPosition;
}

type Gtag = (command: "event", name: string, params: Record<string, string>) => void;

export function trackPromotionClick(event: PromotionClickEvent): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag === "function") {
    gtag("event", "promotion_click", {
      promotion_type: event.type,
      promotion_position: event.position,
    });
  }
}

/**
 * 공유 버튼 클릭 이벤트 — 어떤 채널을 눌렀는지와 페이지만 보낸다.
 * 입력 데이터·결과는 절대 넣지 않는다.
 */
export type ShareChannel = "native" | "kakao" | "naver" | "facebook" | "x" | "band" | "copy" | "page_copy";

export interface ShareEvent {
  channel: ShareChannel;
  page: string;
}

export function trackShare(event: ShareEvent): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag === "function") {
    gtag("event", "share", { method: event.channel, content_type: "tool_page", item_id: event.page });
  }
}

/**
 * 결과 복사 이벤트 — 어느 페이지에서 복사 버튼(또는 단축키)을 눌렀는지만 보낸다.
 * 인자를 받지 않으므로 입력 데이터·결과가 섞여 들어갈 수 없다.
 * 페이지 조회 대비 복사 비율로 사용자가 도구를 끝까지 썼는지 가늠한다.
 */
export function trackCopy(): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag === "function") {
    gtag("event", "result_copy", { page_path: window.location.pathname });
  }
}

/**
 * 인쇄(PDF 저장) 버튼 이벤트 — 상장·수료증 만들기에서 인쇄 창을 연 횟수와 페이지 주소만 보낸다.
 * 명단·문구는 절대 넣지 않는다.
 */
export function trackPrint(): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag === "function") {
    gtag("event", "result_print", { page_path: window.location.pathname });
  }
}

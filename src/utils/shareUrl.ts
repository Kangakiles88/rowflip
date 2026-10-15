/**
 * 공유 링크에 붙이는 UTM 꼬리표 — GA4에서 공유로 들어온 방문을 채널별로 나눠 보기 위한 것.
 * 페이지마다 canonical이 있어서 꼬리표 붙은 주소가 검색에서 따로 잡히지 않는다.
 * 입력 데이터·결과는 절대 넣지 않는다(채널 이름만).
 */
export type ShareSource = "kakao" | "naver" | "band" | "facebook" | "x" | "native" | "copy" | "page_copy";

export function withShareUtm(url: string, source: ShareSource): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}utm_source=${source}&utm_medium=share&utm_campaign=rowflip_share`;
}

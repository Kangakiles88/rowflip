/**
 * 첫 변환 공유 안내 설정.
 *
 * 처음 변환할 때만 원본과 결과 사이에 [변환하기] 버튼이 나오고,
 * 누르면 짧은 로딩 뒤 공유를 부탁하는 팝업이 뜬다. 버튼은 한 번 누르면 사라진다.
 *
 * - enabled: false 로 두면 버튼·팝업 없이 처음부터 바로 변환된다.
 * - frequency
 *   - "session": 방문할 때마다(브라우저 탭을 새로 열 때마다) 한 번
 *   - "once":    이 브라우저에서 처음 한 번만 (이후 방문에는 안 나옴)
 * - 카카오톡 공유 버튼은 .env 에 NEXT_PUBLIC_KAKAO_JS_KEY 가 있을 때만 나온다.
 *   카카오 디벨로퍼스 앱 설정에서 사이트 도메인을 등록해야 동작한다.
 */
export const shareConfig = {
  enabled: true,
  frequency: "session" as "session" | "once",
  /**
   * 로딩(안내) 시간은 전광판 문구가 끝까지 한 번 흘러가는 시간으로 자동 계산된다.
   * 그동안 남은 초가 표시되고, 끝나야 닫기 버튼이 나타난다.
   */
  /** 전광판 속도(px/초). 낮을수록 천천히 흐르고 대기 시간이 길어진다 */
  tickerSpeed: 120,
  /** 움직임 줄이기 설정 사용자의 읽는 시간(글자당 ms) */
  readMsPerChar: 90,
  /** 최소 대기 시간(ms) */
  loadingMs: 3000,
  buttonLabel: "변환하기",
  loadingText: "변환하는 중",
  doneTitle: "변환이 끝났습니다",
  /** 전광판처럼 흘러가는 안내 문구 (문장마다 사이에 구분점이 들어감) */
  message: [
    "저희 서비스가 유용하셨다면 필요한 지인들에게 알려주시면 너무 감사하겠습니다.",
    "유용한 무료 서비스를 함께 사용하면 다함께 편리해지지 않을까요?",
    "널리 알려주시기만 해도 저희에게 너무 큰 힘이 됩니다.",
  ],
  footnote: "다음 변환부터는 버튼 없이 바로 변환이 가능합니다.",
  closeLabel: "결과 보기",
  /** SNS에 함께 올라가는 소개 문구 */
  shareText: "RowFlip - 엑셀 세로↔가로, 행열 바꾸기를 붙여넣기 한 번에 해 주는 무료 도구",
  kakao: {
    jsKey: process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "",
    sdkUrl: "https://t1.kakaocdn.net/kakao_js_sdk/2.8.3/kakao.min.js",
    /** 카카오 다운로드 페이지의 "SRI 해시 복사" 값. 비워 두면 integrity 검사 없이 로드 */
    sdkIntegrity: process.env.NEXT_PUBLIC_KAKAO_SDK_INTEGRITY ?? "",
  },
} as const;

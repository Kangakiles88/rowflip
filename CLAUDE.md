@AGENTS.md

# 엑셀 가로세로 — 프로젝트 지침

## 프로젝트 개요
- 사이트명: **엑셀 가로세로**. 엑셀·구글 시트·메모장에서 복사한 데이터를 붙여넣어 바로 변환하는 무료 웹 도구 사이트.
- 목표: 구글·네이버 검색 유입 → AdSense·네이버 브랜드커넥트 광고 수익.
- 원칙: 붙여넣기 → 옵션 선택 → 결과 확인 → 복사. 회원가입·업로드·서버 저장 없음. 모든 처리는 브라우저 안에서.
- 현재 페이지
  - `/` 엑셀 가로세로 변환기: 한 열·한 행 목록을 가로↔세로, 쉼표 연결, 중복 제거, 정렬, 접두사/접미사, 따옴표, 번호, SQL IN, JSON·JS·Python 배열, HTML 목록으로
  - `/transpose/` 엑셀 행열 바꾸기: 표 전체의 행과 열 전환 → 엑셀 붙여넣기(탭 구분) / CSV / 마크다운 표

## 기술 스택
- Next.js 16 (App Router), React 19, TypeScript strict, CSS Modules + `globals.css` 디자인 토큰. Tailwind·외부 UI 라이브러리 쓰지 않음.
- `output: "export"` 정적 사이트, `trailingSlash: true`. 백엔드·DB·API 라우트·미들웨어 없음. `npm run build` → `out/` 폴더를 정적 호스팅에 올림.
- 정적 내보내기라 PPR·cacheComponents 같은 서버 기능은 못 씀. sitemap·robots·manifest 같은 메타데이터 라우트에는 `export const dynamic = "force-static"`.
- Next 16은 예전 버전과 API가 다를 수 있음. 코드를 쓰기 전에 `node_modules/next/dist/docs/`에서 해당 기능 문서를 확인.
- 테스트 Vitest, 린트 ESLint(eslint-config-next).

## 명령어
- `npm run dev` 개발 서버 / `npm run build` 정적 빌드
- `npm run check` = lint → typecheck → test → build. **코드를 바꾼 뒤에는 이게 통과해야 완료.**

## 폴더 구조
```
src/
├─ app/            layout(공통 메타), page(/), transpose/page, sitemap, robots, manifest, icon
├─ components/     share/(ShareDialog, ConvertGateButton, useConvertGate), Header, SiteFooter, JsonLd, Converter, TransposeTool, InputPanel, OutputPanel,
│  │               PresetButtons, CleanupOptions, OutputOptions, Segmented, Toast, tool.module.css
│  └─ ads/         AdSlot, AdSenseScript, BrandConnectBanner, PromotionArea
├─ config/         site.ts(사이트명·SEO), nav.ts(페이지 목록), share.ts(첫 변환 공유 안내), ads.ts, brandConnect.ts
├─ content/        seo.tsx(/ 안내·FAQ), transpose.tsx(/transpose/ 메타·안내·FAQ)
├─ utils/          parser, transformer, transpose(순수 함수 + 테스트), presets, storage, clipboard, tracking
└─ types/
public/            og.png, og-transpose.png(1200×630 공유 이미지), ads/(배너 이미지)
```

## 코드 작성 원칙
- 변환 로직은 `src/utils/`의 순수 함수로 만들고 UI 컴포넌트에 넣지 않음. 새 로직에는 `*.test.ts` 테스트를 함께 추가.
- 변환 순서(가로세로): 파싱 → 공백 제거 → 빈 줄 제거 → 중복 제거 → 정렬 → 접두사/접미사 → 따옴표 → 번호 → 연결.
- 엑셀 복사 데이터는 탭=열, 줄바꿈=행. 줄바꿈이 든 셀은 큰따옴표로 감싸져 오므로 `parser.ts`의 `parseTable`을 재사용.
- 큰 입력(수만 줄)에서도 끊기지 않게 `useDeferredValue` 패턴 유지, 큰 표 미리보기는 행·열 수 제한.
- 새 UI는 기존 컴포넌트(InputPanel, Segmented, Toast)와 `tool.module.css` 클래스를 재사용.

## 디자인 규칙 (AI가 만든 티가 나지 않게)
- 마케팅 랜딩 페이지가 아니라 데스크톱 유틸리티처럼. 히어로 섹션 없음. H1은 왼쪽 정렬 약 20px, 바로 아래 도구.
- 첫 화면(1366×768)에서 입력창과 결과창이 모두 보여야 함.
- 색은 `globals.css`의 토큰만 사용(`--bg --panel --gutter --hover --line --line-strong --ink --ink-2 --ink-3 --accent(#1e6b47) --accent-soft`). 하드코딩 색 금지. 토큰을 바꾸면 다크 모드 블록(`prefers-color-scheme`, `[data-theme="dark"]`)도 같이 갱신.
- 금지: 보라·인디고, 그라데이션, 그림자, 이모지, 아이콘 3열 카드, 가운데 정렬 대형 문구, 알약 배지.
- border 1px, radius 4~6px. 섹션은 카드로 감싸지 말고 구분선으로 나눔.
- 폰트: UI는 Pretendard 14px 내외, 데이터 영역은 monospace + 줄 번호. 숫자는 `tabular-nums`.
- 옵션은 툴바형 컴팩트 컨트롤(세그먼트 버튼, select, 체크박스). 패널 하단에 상태 표시줄(행 수, 글자 수, 제거된 개수 등).
- 주요 동작에 단축키(Ctrl/⌘+Enter = 복사)와 kbd 힌트. 터치 기기에서는 kbd 숨김.
- 반응형: 860px 이하 1단. 모바일(390px)에서 가로 스크롤 없어야 함.

## 문구 규칙
- 한국어, 기능을 그대로 설명하는 짧고 건조한 문장. "마법처럼", "손쉽게" 같은 마케팅 문구 금지.
- 버튼은 실제 동작 이름("복사", "샘플 넣기", "가로로"). 토스트는 결과("복사되었습니다.").
- 새로 쓰는 예시 데이터는 실무형(`A-10234`, `1월 매출 1,200`, 사번, 상품코드). apple·banana 같은 예시는 새로 만들지 않음.

## 첫 변환 공유 안내 (바이럴)
- 처음 변환할 때만 원본과 결과 사이에 [변환하기] 버튼이 나오고, 누르면 약 1.2초 로딩 뒤 공유 부탁 팝업이 뜸. 버튼은 한 번 누르면 사라지고 이후에는 바로 변환.
- 설정은 `src/config/share.ts`: `enabled`(끄기), `frequency`("session" = 방문마다 한 번, "once" = 이 브라우저에서 처음 한 번), 문구, 로딩 시간.
- 상태는 `useConvertGate` 훅 하나로 두 페이지가 공유. 저장값은 `excel-garosero:convert-gate:v1 = "1"` 뿐.
- 공유 채널: 다른 앱으로 공유(휴대폰 기본 공유창), 카카오톡(`NEXT_PUBLIC_KAKAO_JS_KEY` 있을 때만), 네이버, 밴드, 페이스북, X, 링크 복사. 클릭은 `trackShare`(채널·페이지만)로 기록.
- 팝업은 사용자가 버튼을 눌렀을 때만 뜨게 유지(페이지 열자마자 뜨는 팝업은 검색 순위에 불리).

## 개인정보 (절대 규칙)
- 사용자가 붙여넣은 데이터와 변환 결과는 서버 전송, DB, LocalStorage, 로그, 분석 이벤트, 광고 어디에도 넣지 않음.
- LocalStorage에는 UI 설정만 저장(키 접두사 `excel-garosero:`). 접두사·접미사 입력값도 저장하지 않음.
- `trackPromotionClick`은 광고 종류(type)와 위치(position)만 받음. 인자 타입을 넓히지 말 것.

## 광고
- AdSense: `.env`의 `NEXT_PUBLIC_ADSENSE_*`. 꺼져 있거나 값이 없으면 스크립트·광고 칸을 DOM에 렌더링하지 않음. 슬롯은 top·bottom 2개만.
- 브랜드커넥트: 내용은 `src/config/brandConnect.ts`에서만 수정(컴포넌트에 하드코딩 금지). 링크는 `target="_blank" rel="sponsored noopener noreferrer"`. 대가성 안내 문구(`disclosureText`) 필수.
- 위치는 `PromotionArea`(top / middle / bottom). 광고가 도구보다 먼저 크게 보이면 안 됨.
- `NEXT_PUBLIC_*` 값은 빌드 때 코드에 들어가므로 바꾸면 다시 빌드.

## SEO 규칙
- 페이지 1개 = 검색 의도 1개. 비슷한 기능이라도 검색어가 다르면 별도 페이지로.
- 페이지마다 고유한 title·description·keywords, `alternates.canonical`, openGraph·twitter, 전용 OG 이미지(1200×630).
- H1은 페이지당 1개(대표 키워드), 그 아래 H2 → H3 구조.
- 안내 문구와 FAQ는 `src/content/`에 두고, 화면과 JSON-LD(`<JsonLd>`: WebApplication + FAQPage, 하위 페이지는 BreadcrumbList 추가)가 같은 데이터를 씀. FAQ의 `plain`은 화면 문구와 내용이 같아야 함.
- 본문은 정적 HTML로 렌더링되게 유지(중요 텍스트를 클라이언트 전용으로 만들지 않기).
- 페이지끼리 내부 링크로 연결(헤더 메뉴, 푸터, 본문 related 문단).
- 사이트명·기본 SEO는 `src/config/site.ts`, 도메인·인증값은 env.

## 새 기능 페이지 추가 절차
1. `src/utils/<기능>.ts` 순수 함수 + `<기능>.test.ts`
2. `src/components/<기능>Tool.tsx` (기존 컴포넌트·스타일 재사용)
3. `src/content/<기능>.tsx`에 META(path, h1, title, description, keywords, features), GUIDES, FAQ
4. `src/app/<주소>/page.tsx`: metadata + `<JsonLd>` + `<Header current=…>` + `PromotionArea` + `<SiteFooter>`
5. `src/config/nav.ts`의 `TOOL_PAGES`에 한 줄 추가 → 헤더 메뉴·푸터·sitemap 자동 반영
6. `public/og-<기능>.png` 공유 이미지
7. 관련 페이지 본문에서 새 페이지로 내부 링크 추가
8. `npm run check` 통과, 1366·820·390px 폭에서 확인

## 배포 전 체크리스트
- `.env`에 `NEXT_PUBLIC_SITE_URL` 실제 도메인 (없으면 canonical·sitemap이 localhost로 나감)
- 구글 서치 콘솔·네이버 서치어드바이저 인증값 입력 후 재빌드, 두 곳에 `/sitemap.xml` 제출
- `brandConnect.ts`의 링크·상품 문구·대가성 문구를 실제 값으로 교체 (현재는 예시 값)
- AdSense 승인 후 `NEXT_PUBLIC_ADSENSE_ENABLED=true` + 클라이언트 ID·슬롯 ID
- 카카오톡 공유를 쓰려면 카카오 디벨로퍼스에서 앱을 만들고 JavaScript 키를 `NEXT_PUBLIC_KAKAO_JS_KEY`에, 배포 도메인을 [플랫폼 > Web]과 [제품 링크 관리 > 웹 도메인]에 등록

## 현재 상태와 남은 일
- 완료: 두 기능 페이지, 첫 변환 공유 안내 팝업, 테스트 36개, 광고 컴포넌트(AdSense·브랜드커넥트), 페이지별 SEO, sitemap·robots·manifest, 다크 모드, 반응형
- 남은 일
  - 실제 도메인 연결과 배포
  - 개인정보처리방침 페이지 (광고 쿠키 안내 포함, AdSense 신청 전에 준비)
  - 브랜드커넥트 실제 링크·이미지
  - Pretendard 폰트가 jsDelivr CDN에서 로드됨 → 필요하면 `next/font/local`로 직접 호스팅
  - 기능 페이지 후보: 엑셀 빈 줄 제거, 엑셀 중복 제거, 줄바꿈 제거·쉼표를 줄바꿈으로, 엑셀 열 합치기·나누기

## 답변 방식
- 한국어로 답변. 코드를 바꾸면 바꾼 파일과 이유를 짧게 정리.
- 기술 용어는 처음 나올 때 한 줄로 풀어서 설명.
- 기능 아이디어를 낼 때는 어떤 검색어를 노리는지 함께 제시.

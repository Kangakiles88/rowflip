@AGENTS.md

# RowFlip (엑셀 가로세로 변환기) — 프로젝트 지침

## 프로젝트 개요
- 브랜드: **RowFlip**, 도메인 `https://rowflip.com` (GoDaddy에서 구매). 엑셀·구글 시트·메모장에서 복사한 데이터를 붙여넣어 바로 변환하는 무료 웹 도구 사이트.
- 브랜드·도메인에는 "엑셀/Excel"을 쓰지 않음(Microsoft 상표 가이드라인). "엑셀"은 페이지 제목·H1·본문에서 기능 설명으로만 사용. 제목 형식: `<페이지 제목> | RowFlip`.
- 나중에 영어 페이지를 `/en/` 아래에 추가할 계획(.com 하나로 한국어 `/` + 영어 `/en/`).
- 목표: 구글·네이버 검색 유입 → AdSense·네이버 브랜드커넥트 광고 수익.
- 원칙: 붙여넣기 → 옵션 선택 → 결과 확인 → 복사. 회원가입·업로드·서버 저장 없음. 모든 처리는 브라우저 안에서.
- 현재 페이지
  - `/` 엑셀 가로세로 변환기: 한 열·한 행 목록을 가로↔세로(입력창 상태줄의 '나누기'로 쉼표·띄어쓰기 목록도 나눔, 쉼표·코드 목록이면 '…로 나누기' 안내, 값이 한 칸뿐인데 '세로로'·'가로로'를 누르면 쉼표>세미콜론>띄어쓰기로 자동 나눔), 쉼표 연결, 중복 제거, 정렬, 접두사/접미사, 따옴표, 번호, SQL IN, JSON·JS·Python 배열, HTML 목록으로
  - `/transpose/` 엑셀 행열 바꾸기: 표 전체의 행과 열 전환 → 엑셀 붙여넣기(탭 구분) / CSV / 마크다운 표
  - `/dedupe/` 엑셀 중복 제거: 목록·표의 중복 제거 / 중복된 값만 / 개수 세기, 행 전체 또는 특정 열 기준, 처음·마지막 행 남기기
  - `/split/` 쉼표를 줄바꿈으로 변환: 쉼표·세미콜론·띄어쓰기·슬래시·파이프·직접 입력 구분자로 나눠 세로(줄바꿈)/가로(엑셀 한 행), 괄호·따옴표 벗기기(SQL IN·JSON 배열 → 목록)
  - `/privacy/` 개인정보처리방침(문구는 `src/content/privacy.tsx`, 문의 메일 `contact@rowflip.com` = `site.ts`의 contactEmail, Cloudflare 이메일 라우팅으로 운영자 Gmail에 전달 — 개인 메일 주소는 저장소에 넣지 않음). 안내 페이지는 `nav.ts`의 `INFO_PAGES` → 푸터·sitemap에만 들어감

## 기술 스택
- Next.js 16 (App Router), React 19, TypeScript strict, CSS Modules + `globals.css` 디자인 토큰. Tailwind·외부 UI 라이브러리 쓰지 않음.
- `output: "export"` 정적 사이트, `trailingSlash: true`. 백엔드·DB·API 라우트·미들웨어 없음. `npm run build` → `out/` 폴더를 정적 호스팅에 올림.
- 정적 내보내기라 PPR·cacheComponents 같은 서버 기능은 못 씀. sitemap·robots·manifest 같은 메타데이터 라우트에는 `export const dynamic = "force-static"`.
- Next 16은 예전 버전과 API가 다를 수 있음. 코드를 쓰기 전에 `node_modules/next/dist/docs/`에서 해당 기능 문서를 확인.
- 테스트 Vitest, 린트 ESLint(eslint-config-next).

## 배포
- GitHub `Kangakiles88/rowflip`의 `main`에 푸시하면 Cloudflare Workers(정적 자산 전용)가 자동 빌드·배포. Build command `npm run build`, Deploy command `npx wrangler deploy`, 대상은 `wrangler.jsonc`의 `./out`. Node는 `.node-version`(22), wrangler는 package.json에 버전 고정.
- `wrangler.jsonc`를 지우면 Cloudflare가 OpenNext(서버용)를 자동 적용해 빌드가 깨짐. 배포 전 점검: `npm run build && npx wrangler deploy --dry-run`.
- 커밋 작성자는 `Kangakiles88 <Kangakiles88@users.noreply.github.com>`(공개 저장소라 개인 메일을 넣지 않음).

## 명령어
- `npm run dev` 개발 서버 / `npm run build` 정적 빌드
- `npm run check` = lint → typecheck → test → build. **코드를 바꾼 뒤에는 이게 통과해야 완료.**

## 폴더 구조
```
src/
├─ app/            layout(공통 메타), page(/), transpose/page, sitemap, robots, manifest, icon
├─ components/     share/(ShareDialog, ConvertGateButton, useConvertGate), Header, SiteFooter, ToolDirectory(다른 도구 목록), JsonLd,
│  │               Converter, TransposeTool, DedupeTool, SplitTool, SheetPreview, ActiveTabScroll(엑셀식 표 미리보기), InputPanel, OutputPanel,
│  │               PresetButtons, CleanupOptions, OutputOptions, Segmented, Toast, tool.module.css
│  └─ ads/         AdSlot, AdSenseScript, BrandConnectBanner, PromotionArea
├─ config/         site.ts(브랜드·도메인·SEO), analytics.ts(GA4), nav.ts(페이지 목록), share.ts(첫 변환 공유 안내), ads.ts, brandConnect.ts
├─ content/        seo.tsx(/ 안내·FAQ), transpose.tsx, dedupe.tsx, split.tsx(각 페이지 메타·안내·FAQ), privacy.tsx
├─ utils/          parser, split(원본 나누기), rotation(광고 순번), transformer, transpose, dedupe(순수 함수 + 테스트), presets, storage, clipboard, tracking
└─ types/
public/            og.png, og-transpose.png, og-dedupe.png, og-split.png(1200×630 공유 이미지), ads/(배너 이미지)
```

## 코드 작성 원칙
- 변환 로직은 `src/utils/`의 순수 함수로 만들고 UI 컴포넌트에 넣지 않음. 새 로직에는 `*.test.ts` 테스트를 함께 추가.
- 변환 순서(가로세로): 파싱 → (괄호 벗기기) → 원본 나누기(`split.ts`) → (따옴표 벗기기) → 공백 제거 → 빈 줄 제거 → 중복 제거 → 정렬 → 접두사/접미사 → 따옴표 → 번호 → 연결.
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
- 헤더 기능 메뉴는 탭(현재 페이지 = accent 글자 + 아래 2px 막대). 860px 이하에서는 탭이 로고 아래 한 줄로 내려가고, 넘치면 가로 스크롤(`ActiveTabScroll`이 현재 탭을 화면 안으로). 탭 이름은 짧게(390px에서 4개가 한 줄에 들어가는 길이).
- 표 결과는 `SheetPreview`(열 이름 A·B·C + 행 번호)로 보여 주고 '표 / 텍스트' 전환.
- 반응형: 860px 이하 1단. 모바일(390px)에서 가로 스크롤 없어야 함.

## 문구 규칙
- 한국어, 기능을 그대로 설명하는 짧고 건조한 문장. "마법처럼", "손쉽게" 같은 마케팅 문구 금지.
- 버튼은 실제 동작 이름("복사", "샘플 넣기", "가로로"). 토스트는 결과("복사되었습니다.").
- 새로 쓰는 예시 데이터는 실무형(`A-10234`, `1월 매출 1,200`, 사번, 상품코드). apple·banana 같은 예시는 새로 만들지 않음.

## 첫 변환 공유 안내 (바이럴)
- 처음 변환할 때만 원본과 결과 사이에 [변환하기] 버튼이 나오고, 누르면 약 1.2초 로딩 뒤 공유 부탁 팝업이 뜸. 버튼은 한 번 누르면 사라지고 이후에는 바로 변환.
- 설정은 `src/config/share.ts`: `enabled`(끄기), `frequency`("session" = 방문마다 한 번, "once" = 이 브라우저에서 처음 한 번), 문구, 로딩 시간.
- 상태는 `useConvertGate` 훅 하나로 모든 기능 페이지가 공유. 저장값은 `rowflip:convert-gate:v1 = "1"` 뿐.
- 공유 채널: 링크 복사, 카카오톡(JS 키는 `share.ts`에 기본값, 카카오 디벨로퍼스에 rowflip.com 등록 필요), 네이버, 밴드, 페이스북, X, 다른 앱(휴대폰 기본 공유창). 클릭은 `trackShare`(채널·페이지만)로 기록.
- 팝업 디자인: 위에 전광판처럼 흐르는 안내 문구(`Ticker`) + 진행 막대로 로딩 느낌, 아래에 동그란 아이콘 버튼 + 이름을 한 줄로(휴대폰은 5개 이상이면 두 줄로 고르게). 움직임 줄이기 설정 사용자에게는 멈춘 문단으로 표시.
- 대기 시간: 전광판 문구가 끝까지 한 번 흘러가는 시간(실제 글자 너비 ÷ `tickerSpeed`)을 계산해 남은 초를 표시. 그동안 ✕·결과 보기·Esc·바깥 클릭으로 닫히지 않고, 0초가 되면 닫기 버튼이 나타남. 공유 버튼은 대기 중에도 누를 수 있음.
- 브랜드 아이콘은 직접 그리지 않고 `simple-icons`(CC0 아이콘 모음, 버전 고정) 패키지 데이터를 씀(`ShareIcons.tsx`). 밴드는 모음에 없어 일반 '모임' 아이콘.
- 팝업은 사용자가 버튼을 눌렀을 때만 뜨게 유지(페이지 열자마자 뜨는 팝업은 검색 순위에 불리).

## 개인정보 (절대 규칙)
- 사용자가 붙여넣은 데이터와 변환 결과는 서버 전송, DB, LocalStorage, 로그, 분석 이벤트, 광고 어디에도 넣지 않음.
- LocalStorage에는 UI 설정만 저장(키 접두사 `rowflip:`). 접두사·접미사 입력값도 저장하지 않음.
- 저장 키·외부 서비스·분석 도구를 추가하거나 바꾸면 `src/content/privacy.tsx`(표와 본문)와 `EFFECTIVE_DATE`도 같이 고침.
- `trackPromotionClick`은 광고 종류(type)와 위치(position)만 받음. 인자 타입을 넓히지 말 것.

## 광고
- AdSense: `.env`의 `NEXT_PUBLIC_ADSENSE_*`. 꺼져 있거나 값이 없으면 스크립트·광고 칸을 DOM에 렌더링하지 않음. 슬롯은 top·bottom 2개만.
- 브랜드커넥트: 상품 목록(`products`: name·href·image)은 `src/config/brandConnect.ts`에서만 수정(컴포넌트에 하드코딩 금지). 이미지는 `public/ads/`에 정사각형 96px webp. 링크는 `target="_blank" rel="sponsored noopener noreferrer"`. 대가성 안내 문구(`disclosureText`)는 띠 안에 항상 보이게.
- 브랜드커넥트 표시: 메뉴 바로 아래·H1 위(`position: "header"`)의 띠(높이 약 75px, 띠 전체가 링크, 가운데 정렬: 추천 상품·사진·상품명·상품 보기 버튼 + 아래 줄 대가성 안내)에 상품 **하나**만. 새로고침마다 다음 상품(`utils/rotation.ts`, 순번은 `rowflip:brand-rotation:v1`, 첫 방문은 무작위 시작). 흐르는 전광판·카드형으로 키우지 말 것(첫 화면 도구 가림).
- 위치는 `PromotionArea`(header / top / middle / bottom). AdSense는 top·bottom만. 광고가 도구보다 먼저 크게 보이면 안 됨.
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
5. `src/config/nav.ts`의 `TOOL_PAGES`에 항목 추가(label·title·desc) → 헤더 탭·푸터·sitemap·도구 아래 '다른 도구' 목록 자동 반영. 페이지에는 도구 바로 아래 `<ToolDirectory current=…>`
6. `public/og-<기능>.png` 공유 이미지
7. 관련 페이지 본문에서 새 페이지로 내부 링크 추가
8. `npm run check` 통과, 1366·820·390px 폭에서 확인

## 배포 전 체크리스트
- 도메인 기본값은 `https://rowflip.com`(`site.ts`). 다른 주소로 시험 배포할 때만 `.env`의 `NEXT_PUBLIC_SITE_URL`로 덮어씀
- 구글 서치 콘솔·네이버 서치어드바이저 인증값 입력 후 재빌드, 두 곳에 `/sitemap.xml` 제출
- AdSense 승인 후 `NEXT_PUBLIC_ADSENSE_ENABLED=true` + 클라이언트 ID·슬롯 ID
- 카카오톡 공유: JavaScript 키는 `share.ts`에 들어가 있음. 카카오 디벨로퍼스 앱의 [플랫폼 > Web]과 [제품 링크 관리 > 웹 도메인]에 `https://rowflip.com`이 등록돼 있어야 동작

## 현재 상태와 남은 일
- 완료: `https://rowflip.com` 공개(Cloudflare Workers 정적 자산, 커스텀 도메인 rowflip.com·www 연결), 기능 페이지 4개(가로세로·행열·중복 제거·쉼표→줄바꿈), 첫 변환 공유 안내 팝업(카카오톡 공유 동작 확인, 공유 링크는 항상 https://rowflip.com), 개인정보처리방침, 네이버 서치어드바이저·구글 서치 콘솔 등록(sitemap 제출), 테스트 76개, 광고 컴포넌트(AdSense·브랜드커넥트), 페이지별 SEO, sitemap·robots·manifest, 다크 모드, 반응형
- 남은 일
  - Cloudflare AI 로봇 설정 확인(robots.txt에 검색 로봇이 막히지 않았는지)
  - AdSense 신청
  - 브랜드커넥트 상품 5개 연결 완료(의자 2, A4용지, 데스크매트, 책상) — 상품 추가·교체는 brandConnect.ts
  - Pretendard 폰트가 jsDelivr CDN에서 로드됨 → 필요하면 `next/font/local`로 직접 호스팅
  - GA4(`G-N193ST4FX3`, `src/config/analytics.ts`) 연결 완료 — 이벤트는 페이지 조회·share·promotion_click만
  - 기능 페이지 후보: 엑셀 빈 줄 제거, 줄바꿈 제거, 엑셀 열 합치기·나누기

## 답변 방식
- 한국어로 답변. 코드를 바꾸면 바꾼 파일과 이유를 짧게 정리.
- 기술 용어는 처음 나올 때 한 줄로 풀어서 설명.
- 기능 아이디어를 낼 때는 어떤 검색어를 노리는지 함께 제시.

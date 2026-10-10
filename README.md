# RowFlip — 엑셀 가로세로 변환기

엑셀·구글 시트·메모장에서 복사한 데이터를 붙여넣어 바로 변환하는 도구 사이트입니다.

| 주소 | 페이지 | 하는 일 |
| --- | --- | --- |
| `/` | 엑셀 가로세로 변환기 | 한 열·한 행 목록을 세로↔가로, 쉼표 연결, 중복 제거, SQL IN, JSON 배열로 |
| `/transpose/` | 엑셀 행열 바꾸기 | 표 전체의 행과 열 전환 → 엑셀 붙여넣기용 / CSV / 마크다운 표 |
모든 변환은 브라우저 안에서만 처리되며, 입력 데이터는 서버로 전송·저장되지 않습니다.

- Next.js 16 (App Router, 정적 내보내기) · React 19 · TypeScript · CSS Modules
- 백엔드 없음 — `npm run build` 결과물 `out/` 폴더를 어떤 정적 호스팅에든 올리면 됩니다 (Vercel, Cloudflare Pages, Netlify, S3 등)

## 시작하기

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev                  # http://localhost:3000
```

| 명령 | 내용 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 정적 빌드 → `out/` |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript 검사 |
| `npm test` | 변환 로직 단위 테스트 (Vitest) |
| `npm run check` | 위 네 가지를 순서대로 |

## 배포 (Cloudflare Pages + GitHub)

`main` 브랜치에 커밋이 올라가면 Cloudflare Pages가 자동으로 빌드·배포합니다.

| 항목 | 값 |
| --- | --- |
| Framework preset | Next.js (Static HTML Export) |
| Build command | `npm run build` |
| Build output directory | `out` |
| Node 버전 | `.node-version` 파일(22)로 지정 |

- 커스텀 도메인: `rowflip.com`, `www.rowflip.com` (DNS는 Cloudflare)
- 응답 헤더·캐시는 `public/_headers`
- 광고·검색 인증 값(`NEXT_PUBLIC_*`)은 Cloudflare Pages 프로젝트의 **Settings → Variables and Secrets**에 넣고 다시 배포합니다.

## 배포 전에 꼭 할 일 (SEO)

1. 도메인은 기본으로 **`https://rowflip.com`** 이 들어가 있습니다(`src/config/site.ts`). 다른 주소에서 시험할 때만 `.env`의 `NEXT_PUBLIC_SITE_URL`로 바꿔 빌드합니다. canonical, `sitemap.xml`, `robots.txt`, 공유 이미지 주소가 모두 이 값으로 만들어집니다.
2. **구글 서치 콘솔**, **네이버 서치어드바이저**에 사이트를 등록하고, HTML 태그 인증값을 각각 `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` 에 넣은 뒤 다시 빌드·배포합니다.
3. 두 곳 모두에 `https://도메인/sitemap.xml` 을 제출합니다. 네이버는 ‘웹 페이지 수집 요청’도 한 번 해 두면 색인이 빨라집니다.

이미 들어가 있는 SEO 요소

- 제목·설명·키워드 메타, canonical, Open Graph·Twitter 카드(`public/og.png`, 1200×630)
- 키워드를 담은 H1(엑셀 가로세로 변환기) → H2(사용 방법 / 자주 쓰는 변환 / 자주 묻는 질문) → H3 구조
- 페이지마다 따로 쓴 제목·설명·canonical·공유 이미지 (`og.png`, `og-transpose.png`)
- JSON-LD: `WebApplication` + `FAQPage`, 하위 페이지는 `BreadcrumbList` 추가 (FAQ 화면 문구와 같은 데이터에서 생성)
- 헤더 메뉴·푸터·본문 링크로 페이지끼리 서로 연결 (내부 링크)
- `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, 파비콘·애플 터치 아이콘
- 본문이 모두 정적 HTML로 미리 렌더링되어 검색엔진이 자바스크립트 없이 읽을 수 있음

제목·설명·키워드는 `src/config/site.ts`(메인)와 `src/content/transpose.tsx`(행열 바꾸기), 안내 문구와 FAQ는 `src/content/` 에서 고칩니다.

## 기능 페이지 추가하는 법

1. `src/app/<주소>/page.tsx` 를 만들고 `metadata`(제목·설명·canonical·OG)를 넣습니다.
2. `src/config/nav.ts` 의 `TOOL_PAGES` 에 한 줄 추가하면 헤더 메뉴, 푸터, `sitemap.xml` 에 자동으로 들어갑니다.
3. 콘텐츠·FAQ는 `src/content/` 에 따로 두고 `<JsonLd>` 에 넘깁니다.

## 광고 설정

### Google AdSense — `.env`

```
NEXT_PUBLIC_ADSENSE_ENABLED=true
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_ADSENSE_TOP_SLOT=1234567890
NEXT_PUBLIC_ADSENSE_BOTTOM_SLOT=0987654321
```

`ENABLED`가 `true`가 아니거나 `CLIENT_ID`가 비어 있으면 광고 스크립트와 광고 영역이 아예 렌더링되지 않습니다. 슬롯 ID가 비어 있는 위치도 마찬가지입니다.
상단 슬롯은 변환기 위, 하단 슬롯은 FAQ 위에 들어갑니다.

### 네이버 브랜드커넥트 배너 — `src/config/brandConnect.ts`

배너 내용은 이 파일만 고치면 됩니다.

- `href`: 브랜드커넥트 링크 (비어 있으면 배너 숨김)
- `desktopImage` / `mobileImage`: `public/ads/` 에 이미지를 넣고 `"/ads/파일명.webp"` 로 지정. 비우면 텍스트형 배너, `mobileImage`가 없으면 모바일도 데스크톱 이미지를 씁니다
- `title`, `description`, `ctaText`, `disclosureText`
- `position`: `"top"` | `"middle"`(기본, 변환기 아래) | `"bottom"`(FAQ 위)

`.env`의 `NEXT_PUBLIC_BRAND_CONNECT_ENABLED=false` 로 배포 환경에서 끌 수 있습니다. 링크에는 `target="_blank" rel="sponsored noopener noreferrer"` 가 붙습니다.
`disclosureText`(대가성 표기) 문구는 브랜드커넥트·공정위 최신 가이드에 맞는지 확인하고 쓰세요.

`NEXT_PUBLIC_*` 값은 빌드할 때 코드에 박히므로, 바꾼 뒤에는 다시 빌드해야 합니다.

## 첫 변환 공유 안내

처음 변환할 때만 원본과 결과 사이에 **변환하기** 버튼이 나오고, 누르면 짧은 로딩 뒤 공유를 부탁하는 팝업이 뜹니다. 버튼은 한 번 누르면 사라집니다.

- 설정: `src/config/share.ts` — 끄기(`enabled`), 빈도(`frequency`: `"session"` 방문마다 한 번 / `"once"` 처음 한 번만), 문구, 로딩 시간
- 카카오톡 버튼: `.env`에 `NEXT_PUBLIC_KAKAO_JS_KEY`를 넣으면 나타납니다. 카카오 디벨로퍼스 앱 설정에서 배포 도메인을 [플랫폼 > Web]과 [제품 링크 관리 > 웹 도메인]에 등록해야 동작합니다.
- 휴대폰에서는 기본 공유창(‘다른 앱’)이 함께 나와 카카오톡·문자 등으로 바로 보낼 수 있습니다.
- 문구가 끝까지 한 번 흘러갈 때까지 남은 초가 표시되고, 그 뒤에 닫기 버튼이 나타납니다. 속도는 `share.ts`의 `tickerSpeed`(px/초)로 조절합니다(기본 120, 약 13~14초).
- 팝업 위쪽 안내 문구는 전광판처럼 흘러가고(문구는 `share.ts`의 `message`), 공유 버튼은 동그란 아이콘으로 표시됩니다. 브랜드 아이콘은 `simple-icons` 패키지(CC0)를 씁니다.

## 개인정보

- 입력·결과 데이터는 서버 전송, 저장, 로그, 분석 이벤트 어디에도 들어가지 않습니다.
- LocalStorage에는 출력 형식·구분자 같은 UI 설정만 저장합니다(키 접두사 `rowflip:`) (`src/utils/storage.ts`). 접두사/접미사도 저장하지 않습니다.
- 클릭 측정 `trackPromotionClick` 은 광고 종류와 위치만 받도록 타입이 고정되어 있습니다.

## 구조

```
src/
├─ app/                 layout(공통 메타), page(가로세로), transpose/page(행열 바꾸기),
│                       sitemap, robots, manifest, 아이콘
├─ components/          Header, SiteFooter, JsonLd, Converter, TransposeTool, InputPanel,
│  │                    OutputPanel, PresetButtons, CleanupOptions, OutputOptions, Segmented, Toast
│  └─ ads/              AdSlot, AdSenseScript, BrandConnectBanner, PromotionArea
├─ config/              site.ts(SEO), nav.ts(페이지 목록), ads.ts, brandConnect.ts
├─ content/             seo.tsx(메인), transpose.tsx — 안내 문구 · FAQ
├─ utils/               parser, transformer, transpose(순수 함수), presets, storage, clipboard, tracking
└─ types/
```

변환 순서: 파싱 → 공백 제거 → 빈 줄 제거 → 중복 제거 → 정렬 → 접두사/접미사 → 따옴표 → 번호 → 연결

import type { ReactNode } from "react";

/**
 * 개인정보처리방침 — 화면 문구는 이 파일에서만 고친다.
 * 사이트가 실제로 저장·전송하는 항목이 바뀌면(분석 도구 추가, 저장 키 추가 등) 여기도 같이 고치고 EFFECTIVE_DATE를 갱신한다.
 */
export const PRIVACY_META = {
  path: "/privacy/",
  h1: "개인정보처리방침",
  title: "개인정보처리방침",
  description:
    "RowFlip이 어떤 정보를 저장하고 어떤 정보를 저장하지 않는지, 광고 쿠키와 외부 서비스를 어떻게 쓰는지 안내합니다.",
} as const;

/** 시행일 (YYYY-MM-DD) */
export const EFFECTIVE_DATE = "2026-10-16";

/** 이 사이트가 브라우저에 남기는 값 — 데이터는 저장하지 않고 화면 설정만 저장한다 */
export const BROWSER_STORAGE = [
  {
    key: "rowflip:settings:v1",
    where: "로컬 저장소",
    what: "가로세로 변환기의 옵션(구분자, 결과 형식, 정렬, 중복 제거 등)",
  },
  {
    key: "rowflip:transpose:v1",
    where: "로컬 저장소",
    what: "행열 바꾸기의 복사 형식(엑셀 붙여넣기, CSV, 마크다운 표)",
  },
  {
    key: "rowflip:dedupe:v1",
    where: "로컬 저장소",
    what: "중복 제거의 옵션(결과 종류, 남길 행, 공백·대소문자 무시, 빈 칸 제외)",
  },
  {
    key: "rowflip:split:v1",
    where: "로컬 저장소",
    what: "쉼표를 줄바꿈으로 변환의 옵션(나눌 기준, 결과 모양, 정리 옵션)",
  },
  {
    key: "rowflip:count:v1",
    where: "로컬 저장소",
    what: "글자수 세기의 옵션(줄바꿈 세기, 목표 글자수와 기준)",
  },
  {
    key: "rowflip:linebreak:v1",
    where: "로컬 저장소",
    what: "줄바꿈 제거의 옵션(줄바꿈 처리 방식, 공백 정리)",
  },
  {
    key: "rowflip:diff:v1",
    where: "로컬 저장소",
    what: "텍스트 비교의 옵션(띄어쓰기·대소문자 무시, 보기 방식)",
  },
  {
    key: "rowflip:hanyang:v1",
    where: "로컬 저장소",
    what: "한영 타자 변환의 바꿀 방향",
  },
  {
    key: "rowflip:case:v1",
    where: "로컬 저장소",
    what: "대소문자 변환에서 마지막으로 고른 형식",
  },
  {
    key: "rowflip:certificate:v1",
    where: "로컬 저장소",
    what: "상장·수료증 만들기에서 고른 양식, 글꼴, 날짜 형식(명단·기관명·본문 문구는 저장하지 않음)",
  },
  {
    key: "rowflip:amount:v1",
    where: "로컬 저장소",
    what: "숫자 한글 변환의 표기 방식과 붙이기 옵션",
  },
  {
    key: "rowflip:estimate:v1",
    where: "로컬 저장소",
    what: "견적서 양식의 부가세 방식과 유효기간(품목·거래처·공급자 정보는 저장하지 않음)",
  },
  {
    key: "rowflip:brand-rotation:v1",
    where: "로컬 저장소",
    what: "추천 상품 띠에 마지막으로 보여 준 상품 순번(숫자). 새로고침하면 다음 상품을 보여 주는 데 씁니다.",
  },
  {
    key: "rowflip:convert-gate:v1",
    where: "세션 저장소",
    what: "첫 변환 안내를 이미 봤는지 여부(값은 1). 브라우저 탭을 닫으면 지워집니다.",
  },
] as const;

export interface PolicySection {
  id: string;
  title: string;
  body: ReactNode;
}

export function privacySections(contactEmail: string): PolicySection[] {
  return [
    {
      id: "summary",
      title: "1. 요약",
      body: (
        <>
          <p>
            RowFlip(rowflip.com, 이하 &lsquo;사이트&rsquo;)은 회원가입 없이 쓰는 무료 데이터 변환 도구입니다. 사이트는
            이름, 이메일, 전화번호 같은 개인정보를 입력받거나 수집하지 않습니다.
          </p>
          <ul>
            <li>붙여넣은 데이터와 변환 결과는 사용자의 브라우저 안에서만 처리되며 서버로 전송되지 않습니다.</li>
            <li>브라우저에는 화면 설정만 저장합니다.</li>
            <li>방문 통계(Google Analytics)와 광고(Google AdSense 등)를 위해 Google 등이 쿠키를 사용할 수 있습니다.</li>
          </ul>
        </>
      ),
    },
    {
      id: "input-data",
      title: "2. 붙여넣은 데이터와 변환 결과",
      body: (
        <>
          <p>
            입력창에 붙여넣은 내용과 변환 결과는 사용자 기기의 브라우저 메모리에서만 처리됩니다. 서버 전송, 데이터베이스
            저장, 로그 기록, 방문 분석, 광고 어디에도 사용하지 않습니다.
          </p>
          <p>
            브라우저 탭을 닫거나 새로고침하면 입력한 내용은 사라집니다. 접두사·접미사처럼 직접 입력한 옵션 값도 저장하지
            않습니다.
          </p>
        </>
      ),
    },
    {
      id: "browser-storage",
      title: "3. 브라우저에 저장하는 정보",
      body: (
        <>
          <p>
            다음 방문 때 같은 옵션으로 시작할 수 있도록 화면 설정만 브라우저 저장소(로컬 저장소·세션 저장소)에 저장합니다.
            이 값은 사용자 기기에만 있고 사이트 운영자에게 전송되지 않습니다.
          </p>
          <div className="policyTableWrap">
            <table className="policyTable">
              <thead>
                <tr>
                  <th scope="col">이름</th>
                  <th scope="col">저장 위치</th>
                  <th scope="col">내용</th>
                </tr>
              </thead>
              <tbody>
                {BROWSER_STORAGE.map((s) => (
                  <tr key={s.key}>
                    <td>
                      <code>{s.key}</code>
                    </td>
                    <td>{s.where}</td>
                    <td>{s.what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>브라우저 설정에서 사이트 데이터를 삭제하면 저장된 설정도 모두 지워집니다.</p>
        </>
      ),
    },
    {
      id: "ads",
      title: "4. 광고와 쿠키",
      body: (
        <>
          <p>
            사이트는 운영 비용을 위해 Google AdSense 광고와 네이버 브랜드커넥트 상품 링크를 게재할 수 있습니다.
          </p>
          <ul>
            <li>
              Google을 포함한 제3자 광고 공급업체는 쿠키를 사용해 사용자가 이 사이트나 다른 사이트를 방문한 기록을 바탕으로
              광고를 게재합니다.
            </li>
            <li>
              Google은 광고 쿠키를 사용해 사용자의 이 사이트 방문 및 인터넷의 다른 사이트 방문 기록을 바탕으로 사용자에게
              광고를 게재할 수 있습니다.
            </li>
            <li>
              맞춤 광고는{" "}
              <a className="inlineLink" href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer">
                Google 내 광고 센터
              </a>
              에서 끌 수 있습니다. 다른 광고 공급업체의 쿠키는{" "}
              <a className="inlineLink" href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">
                aboutads.info
              </a>
              에서 거부할 수 있습니다.
            </li>
            <li>
              Google이 광고에서 정보를 사용하는 방식은{" "}
              <a
                className="inlineLink"
                href="https://policies.google.com/technologies/partner-sites"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google 파트너 사이트 정보 사용 방식
              </a>
              에서 확인할 수 있습니다.
            </li>
            <li>
              브랜드커넥트 링크를 누르면 네이버 쇼핑 등 외부 페이지로 이동하며, 이후에는 해당 사이트의 개인정보처리방침이
              적용됩니다. 링크를 통해 구매가 이루어지면 사이트 운영자가 일정액의 수수료를 받을 수 있습니다.
            </li>
          </ul>
          <p>
            쿠키는 브라우저 설정에서 차단하거나 삭제할 수 있습니다. 쿠키를 차단해도 변환 기능은 그대로 쓸 수 있으며, 광고는
            맞춤형이 아닌 일반 광고로 표시될 수 있습니다.
          </p>
        </>
      ),
    },
    {
      id: "third-party",
      title: "5. 사이트가 쓰는 외부 서비스",
      body: (
        <ul>
          <li>
            호스팅: Cloudflare. 사이트에 접속하면 보안과 서비스 제공을 위해 IP 주소, 브라우저 종류, 접속 시각 같은 접속
            기록이 Cloudflare에 일시적으로 남을 수 있습니다. 사이트 운영자는 이 기록으로 개인을 식별하지 않습니다.
          </li>
          <li>글꼴: Pretendard 글꼴은 이 사이트에서 직접 내려받으며, 외부 글꼴 서비스는 쓰지 않습니다.</li>
          <li>
            광고: Google AdSense 광고 스크립트를 모든 페이지에서 불러옵니다. 광고와 쿠키에 관한 내용은 위 4항과 같습니다.
          </li>
          <li>
            공유 버튼: 카카오톡, 네이버, 밴드, 페이스북, X 버튼은 누를 때만 해당 서비스로 이동하거나 공유 창을 엽니다.
            카카오톡 버튼을 위해 공유 창이 열릴 때 카카오 공유 도구(JavaScript SDK)를 불러옵니다. 공유되는 것은 페이지 주소(어느 공유 버튼으로 보냈는지 나타내는 꼬리표 포함)와
            소개 문구뿐이며, 입력한 데이터나 변환 결과는 포함되지 않습니다.
          </li>
          <li>
            방문 분석: Google Analytics 4. 어떤 페이지를 몇 번 봤는지, 어느 검색엔진이나 사이트에서 들어왔는지, 기기와
            브라우저 종류, 대략적인 지역(국가·도시) 같은 통계를 보기 위해 사용합니다. 이를 위해 Google이{" "}
            <code>_ga</code>로 시작하는 쿠키를 저장합니다. 공유 버튼을 누르면 어떤 채널(카카오톡, 링크 복사 등)을 눌렀는지,
            결과 복사·인쇄 버튼을 누르면 어느 페이지에서 눌렀는지도 기록하지만, 입력한 데이터나 변환 결과는 어떤 경우에도 보내지 않습니다. 수집을 원하지 않으면{" "}
            <a
              className="inlineLink"
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google 애널리틱스 차단 브라우저 부가기능
            </a>
            을 설치하거나 브라우저에서 쿠키를 차단하면 됩니다.
          </li>
        </ul>
      ),
    },
    {
      id: "children",
      title: "6. 만 14세 미만 아동",
      body: <p>사이트는 개인정보를 수집하지 않으므로 아동의 개인정보도 수집하지 않습니다.</p>,
    },
    {
      id: "changes",
      title: "7. 방침의 변경",
      body: (
        <p>
          이 방침은 법령이나 사이트 기능이 바뀌면 고칠 수 있으며, 고친 내용과 시행일은 이 페이지에 게시합니다.
        </p>
      ),
    },
    {
      id: "contact",
      title: "8. 문의",
      body: contactEmail ? (
        <p>
          개인정보 관련 문의는{" "}
          <a className="inlineLink" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          로 보내 주세요.
        </p>
      ) : (
        <p>개인정보 관련 문의 창구는 준비 중입니다.</p>
      ),
    },
  ];
}

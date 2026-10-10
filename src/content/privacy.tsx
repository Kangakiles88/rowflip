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
export const EFFECTIVE_DATE = "2026-10-11";

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
            <li>광고(Google AdSense 등)가 게재되는 경우 광고 회사가 쿠키를 사용할 수 있습니다.</li>
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
          <li>글꼴: Pretendard 글꼴을 jsDelivr CDN에서 불러옵니다.</li>
          <li>
            공유 버튼: 카카오톡, 네이버, 밴드, 페이스북, X 버튼은 누를 때만 해당 서비스로 이동하거나 공유 창을 엽니다.
            공유되는 것은 페이지 주소와 소개 문구뿐이며, 입력한 데이터나 변환 결과는 포함되지 않습니다.
          </li>
          <li>사이트는 현재 별도의 방문 분석 도구를 사용하지 않습니다. 도입하게 되면 이 방침을 먼저 고칩니다.</li>
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

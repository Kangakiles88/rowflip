import Link from "next/link";
import type { Post } from "../types";

/**
 * 노리는 검색어: VLOOKUP 여러 조건, VLOOKUP 조건 2개, VLOOKUP 여러 열 가져오기, VLOOKUP 0 대신 빈칸, VLOOKUP 첫 번째 값만
 * /functions/vlookup/(형식·FALSE/TRUE·#N/A·#REF!·INDEX MATCH)과 겹치지 않게 '조건 둘·여러 열·빈칸이 0' 롱테일만 다룬다.
 * VLOOKUP 자체는 네이버 월 3,120(2026-11-03 조회), 롱테일 검색량은 따로 조회하지 않음.
 * 예시는 사이트 수식 엔진(utils/formula evaluateFormula)으로 확인:
 *   VLOOKUP("판교점|A-10235",$A$2:$D$6,4,FALSE)=29,500, 코드만으로 찾으면 첫 줄(강남점) 28,900,
 *   SUMIFS 판교점·A-10235=29,500, 없는 지점(수원점)=0,
 *   MATCH 머리글 열 번호로 E-1003 → 박준호·재무팀·3305, 빈 내선(E-1002) → 0, &"" → 빈칸.
 */
export const excelVlookupMulti: Post = {
  meta: {
    slug: "excel-vlookup-multi",
    title: "VLOOKUP 여러 조건으로 찾기 - 조건 2개·여러 열 한 번에",
    h1: "VLOOKUP 여러 조건으로 찾기: 지점+상품코드처럼 조건이 둘일 때, 여러 열을 한 번에 가져올 때",
    description:
      "VLOOKUP으로 조건 두 개(지점과 상품코드)에 맞는 값을 찾는 방법을 정리했습니다. 도우미 열, XLOOKUP, SUMIFS 비교와 함께 MATCH로 여러 열을 한 번에 가져오기, 빈칸이 0으로 나올 때 해결법까지 다룹니다.",
    keywords: ["VLOOKUP 여러 조건", "VLOOKUP 조건 2개", "VLOOKUP 여러 열", "VLOOKUP 0 대신 빈칸", "엑셀 조건 두개 찾기"],
    published: "2026-11-14",
    tool: "fn-vlookup",
    excerpt:
      "같은 상품코드가 지점마다 단가가 다르면 VLOOKUP은 첫 줄만 가져옵니다. 조건 두 개로 찾는 세 가지 방법과 여러 열을 한 번에 채우는 수식입니다.",
    toc: [
      { id: "problem", title: "코드만으로 찾으면 첫 줄만 나온다" },
      { id: "helper", title: "방법 1: 도우미 열로 조건 합치기" },
      { id: "xlookup", title: "방법 2: XLOOKUP에서 조건 잇기" },
      { id: "sumifs", title: "방법 3: 숫자라면 SUMIFS" },
      { id: "columns", title: "여러 열을 한 번에 가져오기" },
      { id: "zero", title: "빈칸인데 0이 나올 때" },
      { id: "summary", title: "정리" },
    ],
  },
  Body() {
    return (
      <>
        <p>
          VLOOKUP은 찾을 값 하나로 표의 첫 열을 찾습니다. 그런데 실무 표는 &lsquo;지점마다 단가가 다른 상품&rsquo;, &lsquo;월마다 다른 담당자&rsquo;처럼 조건이 두 개여야 한
          줄이 정해지는 경우가 많습니다. 기본 사용법과 #N/A 해결은{" "}
          <Link href="/functions/vlookup/">VLOOKUP 함수 사용법</Link>에 정리해 두었고, 이 글은 조건이 둘일 때와 여러 열을 한 번에 가져올 때만 다룹니다.
        </p>

        <h2 id="problem">코드만으로 찾으면 첫 줄만 나온다</h2>
        <p>지점별 단가표입니다. 같은 상품코드 A-10235가 지점마다 다른 단가로 세 줄 있습니다.</p>
        <div className="postTableWrap">
          <table className="postTable">
            <thead>
              <tr>
                <th scope="col">행</th>
                <th scope="col">A 키(도우미)</th>
                <th scope="col">B 지점</th>
                <th scope="col">C 상품코드</th>
                <th scope="col">D 단가</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["2", "강남점|A-10235", "강남점", "A-10235", "28,900"],
                ["3", "판교점|A-10235", "판교점", "A-10235", "29,500"],
                ["4", "강남점|A-10236", "강남점", "A-10236", "64,000"],
                ["5", "판교점|A-10236", "판교점", "A-10236", "62,000"],
                ["6", "해운대점|A-10235", "해운대점", "A-10235", "30,200"],
              ].map((r) => (
                <tr key={r[0]}>
                  {r.map((c, i) => (
                    <td key={i}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          =VLOOKUP(&quot;A-10235&quot;, $C$2:$D$6, 2, FALSE)는 위에서부터 찾다가 처음 만난 강남점 줄의 28,900을 돌려줍니다. 판교점 단가(29,500)가 필요해도 알 방법이
          없습니다. A열은 아래 방법 1에서 만드는 도우미 열이니 지금은 없다고 보면 됩니다.
        </p>

        <h2 id="helper">방법 1: 도우미 열로 조건 합치기</h2>
        <p>
          표 맨 왼쪽에 열을 하나 넣고 두 조건을 이어 붙인 &lsquo;키&rsquo;를 만듭니다. VLOOKUP은 찾는 열이 맨 왼쪽이어야 하므로 도우미 열은 꼭 표의 첫 열에
          둡니다.
        </p>
        <pre className="postCode">
          <code>{`A2: =B2&"|"&C2                                  → 판교점|A-10235 (아래로 채우기)

찾기: =VLOOKUP("판교점"&"|"&"A-10235", $A$2:$D$6, 4, FALSE)   → 29,500
주문서에서: =VLOOKUP(G2&"|"&H2, $A$2:$D$6, 4, FALSE)`}</code>
        </pre>
        <p>
          가운데 &quot;|&quot;는 구분용입니다. 그냥 붙이면 &lsquo;A1&rsquo;+&lsquo;23&rsquo;과 &lsquo;A12&rsquo;+&lsquo;3&rsquo;이 둘 다 A123이 되어 다른 줄을 같은 키로 볼 수 있습니다. 표에 나오지
          않는 글자면 무엇이든 됩니다. 엑셀 2019 이하에서도 되는 가장 확실한 방법이고, 도우미 열이 보기 싫으면 열 숨기기를 하면 됩니다.
        </p>

        <h2 id="xlookup">방법 2: XLOOKUP에서 조건 잇기</h2>
        <p>Microsoft 365·엑셀 2021이라면 도우미 열 없이 범위끼리 이어서 바로 찾을 수 있습니다.</p>
        <pre className="postCode">
          <code>{`=XLOOKUP("판교점"&"A-10235", B2:B6&C2:C6, D2:D6, "없음")   → 29,500`}</code>
        </pre>
        <p>
          B2:B6&amp;C2:C6이 &lsquo;강남점A-10235, 판교점A-10235…&rsquo;라는 목록을 만들고, 그 안에서 찾습니다. 넷째 인수 &quot;없음&quot;은 못 찾았을 때 보일 값입니다. 행이
          수만 개면 매번 목록을 새로 만들어 계산이 느려질 수 있으니, 그때는 방법 1이 낫습니다.
        </p>

        <h2 id="sumifs">방법 3: 숫자라면 SUMIFS</h2>
        <p>가져올 값이 단가·수량 같은 숫자이고 조건에 맞는 줄이 하나뿐이라면 SUMIFS로도 됩니다.</p>
        <pre className="postCode">
          <code>{`=SUMIFS(D2:D6, B2:B6, "판교점", C2:C6, "A-10235")   → 29,500
=SUMIFS(D2:D6, B2:B6, "수원점", C2:C6, "A-10235")   → 0`}</code>
        </pre>
        <p>
          조건 범위를 얼마든지 늘릴 수 있고 정렬도 필요 없습니다. 대신 두 가지를 알고 써야 합니다. 맞는 줄이 없으면 #N/A가 아니라 0이 나와서
          &lsquo;단가가 0원&rsquo;인지 &lsquo;없는 것&rsquo;인지 구분되지 않고, 같은 조건 줄이 두 개면 둘을 더해 버립니다. 상품명 같은 글자는 가져올 수 없습니다.
        </p>

        <h2 id="columns">여러 열을 한 번에 가져오기</h2>
        <p>
          사번 하나로 이름·부서·내선을 옆으로 나란히 채울 때, 열 번호를 2, 3, 5로 하나씩 고쳐 적으면 표 열 순서가 바뀔 때마다 틀어집니다. 열 번호를
          머리글로 찾게 하면 수식 하나를 오른쪽·아래로 채우기만 하면 됩니다.
        </p>
        <div className="postTableWrap">
          <table className="postTable">
            <thead>
              <tr>
                <th scope="col">사원 표</th>
                <th scope="col">A 사번</th>
                <th scope="col">B 이름</th>
                <th scope="col">C 부서</th>
                <th scope="col">D 직급</th>
                <th scope="col">E 내선</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["2", "E-1001", "김민수", "영업1팀", "과장", "2101"],
                ["3", "E-1002", "이서연", "인사팀", "대리", "(빈칸)"],
                ["4", "E-1003", "박준호", "재무팀", "차장", "3305"],
                ["5", "E-1004", "최지우", "영업2팀", "사원", "2207"],
                ["6", "E-1005", "정하늘", "인사팀", "대리", "4102"],
              ].map((r) => (
                <tr key={r[0]}>
                  {r.map((c, i) => (
                    <td key={i}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <pre className="postCode">
          <code>{`H1:K1 머리글: 사번 | 이름 | 부서 | 내선
H2: E-1003
I2: =VLOOKUP($H2, $A$2:$E$6, MATCH(I$1, $A$1:$E$1, 0), FALSE)
    → 오른쪽으로 채우면 I2 박준호, J2 재무팀, K2 3305`}</code>
        </pre>
        <p>
          $의 위치가 핵심입니다. $H2는 열만 고정해서 오른쪽으로 채워도 늘 사번 칸을 보고, I$1은 행만 고정해서 오른쪽으로 갈 때 J1·K1 머리글로 바뀝니다.
          MATCH가 그 머리글이 사원 표에서 몇 번째 열인지 세어 열 번호로 넣어 줍니다. 가져올 칸의 머리글은 사원 표와 글자가 똑같아야 합니다.
        </p>

        <h2 id="zero">빈칸인데 0이 나올 때</h2>
        <p>
          위 표에서 이서연(E-1002)의 내선은 비어 있는데 =VLOOKUP(&quot;E-1002&quot;, $A$2:$E$6, 5, FALSE)는 0을 돌려줍니다. 엑셀은 빈 칸을 가리키는 수식의 결과를 0으로 보기
          때문입니다. 뒤에 &amp;&quot;&quot;를 붙이면 빈칸으로 나옵니다.
        </p>
        <pre className="postCode">
          <code>{`=VLOOKUP("E-1002", $A$2:$E$6, 5, FALSE)&""   → (빈칸)`}</code>
        </pre>
        <p>
          &amp;&quot;&quot;를 붙이면 결과가 글자가 되므로 3305 같은 숫자도 글자로 바뀝니다. 내선·코드처럼 계산하지 않는 값에만 쓰고, 금액처럼 더해야 하는 값이면
          =IF(VLOOKUP(&hellip;)=&quot;&quot;, &quot;&quot;, VLOOKUP(&hellip;))처럼 두 번 적는 편이 안전합니다.
        </p>

        <h2 id="summary">정리</h2>
        <ul>
          <li>조건 두 개: 첫 열에 =B2&amp;&quot;|&quot;&amp;C2 도우미 열 → VLOOKUP(조건1&amp;&quot;|&quot;&amp;조건2, …)</li>
          <li>Microsoft 365: =XLOOKUP(조건1&amp;조건2, 범위1&amp;범위2, 가져올 범위, &quot;없음&quot;)</li>
          <li>숫자이고 한 줄뿐: SUMIFS (없으면 0, 중복이면 합계가 되는 점 주의)</li>
          <li>여러 열: 열 번호 자리에 MATCH(I$1, 머리글 범위, 0), 찾을 값은 $H2</li>
          <li>빈칸이 0으로 나오면 &amp;&quot;&quot; (결과가 글자가 됨)</li>
        </ul>
      </>
    );
  },
};

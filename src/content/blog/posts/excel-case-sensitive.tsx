import Link from "next/link";
import type { Post } from "../types";

/**
 * 노리는 검색어: 엑셀 대소문자 구분, 엑셀 EXACT 함수, 엑셀 대소문자 구분 VLOOKUP, 대소문자 구분 중복, FIND SEARCH 차이
 * /case/ 안내(UPPER·LOWER·PROPER로 바꾸기)와 겹치지 않게 '바꾸지 않고 구분해서 비교·찾기'를 다룬다.
 * 예시 값은 파이썬으로 확인: k7qp2 찾기 VLOOKUP 10%(틀림) / EXACT 5%, COUNTIF 3 / EXACT 1, 중복 제거 후 2행.
 */
export const excelCaseSensitive: Post = {
  meta: {
    slug: "excel-case-sensitive",
    title: "엑셀 대소문자 구분해서 비교·찾기 - EXACT·FIND",
    h1: "엑셀 대소문자 구분해서 비교·찾기: 쿠폰 코드처럼 A와 a가 다른 값일 때",
    description:
      "엑셀의 =, COUNTIF, VLOOKUP, 중복 제거는 대소문자를 구분하지 않아 k7Qp2와 K7QP2를 같은 값으로 봅니다. EXACT·FIND로 대소문자까지 맞춰 비교하고, 세고, 찾는 수식과 반대로 대소문자를 무시하고 싶을 때의 정리법을 다룹니다.",
    keywords: [
      "엑셀 대소문자 구분",
      "엑셀 EXACT 함수",
      "엑셀 대소문자 구분 VLOOKUP",
      "엑셀 대소문자 구분 중복",
      "엑셀 FIND SEARCH 차이",
    ],
    published: "2026-10-27",
    tool: "case",
    excerpt:
      "쿠폰 코드·단축 링크처럼 대문자와 소문자가 다른 값인데 VLOOKUP과 COUNTIF가 같은 값으로 보는 문제와, EXACT·FIND로 구분해 찾는 수식입니다.",
    toc: [
      { id: "problem", title: "엑셀은 대소문자를 대부분 무시한다" },
      { id: "compare", title: "두 칸이 정확히 같은지: EXACT" },
      { id: "count", title: "대소문자까지 같은 값 세기" },
      { id: "lookup", title: "대소문자 구분해서 찾아오기" },
      { id: "contains", title: "포함 여부: FIND와 SEARCH" },
      { id: "ignore", title: "반대로 대소문자를 무시하고 싶을 때" },
      { id: "summary", title: "정리" },
    ],
  },
  Body() {
    return (
      <>
        <p>
          쿠폰 코드, 단축 링크 주소, 일부 시스템의 상품 코드처럼 대문자와 소문자를 다른 글자로 보는 값이 있습니다. k7Qp2와 K7QP2가
          서로 다른 쿠폰인 식입니다. 그런데 엑셀은 대부분의 비교에서 대소문자를 구분하지 않아서, 이런 목록에서는 찾기와 개수가 조용히
          틀립니다.
        </p>

        <h2 id="problem">엑셀은 대소문자를 대부분 무시한다</h2>
        <p>A열에 쿠폰 코드, B열에 할인율이 있는 표로 보겠습니다.</p>
        <div className="postTableWrap">
          <table className="postTable">
            <thead>
              <tr>
                <th scope="col">A열 (코드)</th>
                <th scope="col">B열 (할인)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>k7Qp2</td>
                <td>10%</td>
              </tr>
              <tr>
                <td>K7QP2</td>
                <td>20%</td>
              </tr>
              <tr>
                <td>x9Lm4</td>
                <td>15%</td>
              </tr>
              <tr>
                <td>k7qp2</td>
                <td>5%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>이 표에서 아래 기능들은 k7Qp2, K7QP2, k7qp2를 모두 같은 값으로 봅니다.</p>
        <div className="postTableWrap">
          <table className="postTable">
            <thead>
              <tr>
                <th scope="col">기능</th>
                <th scope="col">결과</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>=A2=A3</td>
                <td>TRUE (k7Qp2와 K7QP2를 같다고 봄)</td>
              </tr>
              <tr>
                <td>=VLOOKUP(&quot;k7qp2&quot;, A2:B5, 2, FALSE)</td>
                <td>10% (맞는 답은 5%, 위에서 처음 걸린 행을 가져옴)</td>
              </tr>
              <tr>
                <td>=COUNTIF(A2:A5, &quot;k7Qp2&quot;)</td>
                <td>3</td>
              </tr>
              <tr>
                <td>[데이터] → [중복된 항목 제거]</td>
                <td>k7Qp2, x9Lm4 두 행만 남음</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          MATCH, XLOOKUP, SEARCH, UNIQUE, 조건부 서식의 &lsquo;중복 값&rsquo;도 마찬가지로 대소문자를 구분하지 않습니다. 서로 다른 쿠폰
          세 개가 하나로 합쳐지거나 엉뚱한 할인율이 붙는 셈입니다.
        </p>

        <h2 id="compare">두 칸이 정확히 같은지: EXACT</h2>
        <pre className="postCode">
          <code>{`=EXACT(A2, A3)   → FALSE   (k7Qp2 와 K7QP2)
=EXACT(A2, "k7Qp2")   → TRUE`}</code>
        </pre>
        <p>
          EXACT는 대소문자까지 글자가 모두 같을 때만 TRUE를 돌려줍니다. 두 목록을 한 줄씩 대조할 때 =A2=C2 대신 =EXACT(A2, C2)를 쓰면
          대소문자만 다른 행도 찾아냅니다. 앞뒤 공백은 다른 글자로 보니 필요하면 TRIM으로 먼저 정리하세요.
        </p>

        <h2 id="count">대소문자까지 같은 값 세기</h2>
        <p>COUNTIF 대신 EXACT를 범위 전체에 걸고 TRUE 개수를 셉니다.</p>
        <pre className="postCode">
          <code>{`=SUMPRODUCT(--EXACT($A$2:$A$100, A2))

→ k7Qp2 행에서 1`}</code>
        </pre>
        <p>
          C열에 이 수식을 넣고 아래로 채우면, 대소문자까지 똑같은 코드가 두 번 이상 들어간 행만 2 이상이 됩니다. 이 열을 기준으로 필터를
          걸면 진짜 중복만 볼 수 있습니다. 앞의 --는 TRUE·FALSE를 1·0으로 바꾸는 기호입니다.
        </p>

        <h2 id="lookup">대소문자 구분해서 찾아오기</h2>
        <p>D2에 찾을 코드(k7qp2)가 있을 때, Microsoft 365와 엑셀 2021 이상에서는 XLOOKUP에 EXACT를 넣습니다.</p>
        <pre className="postCode">
          <code>{`=XLOOKUP(TRUE, EXACT(A2:A100, D2), B2:B100, "없음")

→ 5%`}</code>
        </pre>
        <p>
          EXACT가 행마다 TRUE·FALSE 목록을 만들고, XLOOKUP이 그중 첫 TRUE 행의 할인율을 가져옵니다. XLOOKUP이 없는 버전에서는 INDEX와
          MATCH로 같은 일을 합니다.
        </p>
        <pre className="postCode">
          <code>{`=INDEX(B2:B100, MATCH(TRUE, EXACT(A2:A100, D2), 0))`}</code>
        </pre>
        <p>예전 엑셀에서는 이 수식을 Enter 대신 Ctrl+Shift+Enter로 입력해야 배열 수식으로 계산됩니다.</p>

        <h2 id="contains">포함 여부: FIND와 SEARCH</h2>
        <p>
          글자가 들어 있는지 찾는 함수도 둘로 나뉩니다. FIND는 대소문자를 구분하고, SEARCH는 구분하지 않습니다(대신 *, ? 같은 와일드카드를
          쓸 수 있습니다).
        </p>
        <pre className="postCode">
          <code>{`=ISNUMBER(FIND("Qp", A2))     → k7Qp2만 TRUE
=ISNUMBER(SEARCH("qp", A2))   → k7Qp2, K7QP2, k7qp2 모두 TRUE`}</code>
        </pre>
        <p>SUBSTITUTE도 대소문자를 구분해서 바꿉니다. &quot;qp&quot;를 바꾸라고 하면 Qp나 QP는 그대로 남습니다.</p>

        <h2 id="ignore">반대로 대소문자를 무시하고 싶을 때</h2>
        <p>
          이메일 주소처럼 대소문자가 섞여 들어와도 같은 값으로 봐야 하는 목록은 반대 문제가 생깁니다. 다른 시스템으로 옮기거나 함수에
          넣기 전에 한쪽으로 통일해 두는 편이 안전합니다.
        </p>
        <pre className="postCode">
          <code>{`=LOWER(TRIM(A2))

Kim.Minsu@Example.com → kim.minsu@example.com`}</code>
        </pre>
        <p>
          수식을 넣지 않고 목록을 한 번에 바꾸려면 <Link href="/case/">대소문자 변환</Link>에 붙여넣고 &lsquo;소문자&rsquo;를 고른 뒤 결과를
          붙여넣으면 됩니다. 붙여넣기로 중복을 지울 때도 주의할 점이 있습니다. <Link href="/dedupe/">엑셀 중복 제거</Link>는 엑셀과 달리
          기본으로 대소문자를 구분하므로, 쿠폰 코드는 그대로 두고 이메일처럼 같은 값으로 봐야 할 때만 &lsquo;대소문자 무시&rsquo;를
          켜세요.
        </p>

        <h2 id="summary">정리</h2>
        <ul>
          <li>=, COUNTIF, VLOOKUP, MATCH, XLOOKUP, SEARCH, 중복 제거는 대소문자를 구분하지 않음</li>
          <li>정확히 같은지: =EXACT(A2, C2)</li>
          <li>대소문자까지 같은 개수: =SUMPRODUCT(--EXACT(범위, A2))</li>
          <li>대소문자 구분 찾기: =XLOOKUP(TRUE, EXACT(범위, 값), 가져올 범위)</li>
          <li>포함 여부: FIND는 구분, SEARCH는 구분 안 함</li>
          <li>구분할 필요가 없는 목록은 LOWER로 먼저 통일</li>
        </ul>
      </>
    );
  },
};

import Link from "next/link";
import type { Post } from "../types";

/**
 * 노리는 검색어: 엑셀 글자수 세기 함수, 엑셀 LEN 함수, 엑셀 공백 제외 글자수, LENB 바이트, 엑셀 글자수 제한 표시
 * 글자수 세기 페이지(/count/)는 '글자수 세기·자소서 글자수'를 노리므로 여기서는 엑셀 칸·열 단위로 세는 방법을 다룬다.
 * 예시 숫자는 utils/count.ts(공백 포함·제외, 한글 2바이트)로 확인한 값.
 */
export const excelLenCount: Post = {
  meta: {
    slug: "excel-len-count",
    title: "엑셀 글자수 세기 - LEN 함수, 공백 제외, 바이트(LENB)",
    h1: "엑셀 글자수 세기: LEN 함수로 공백 제외·바이트·제한 넘는 칸 찾기",
    description:
      "엑셀에서 칸마다 글자수를 세는 LEN 함수 사용법을 정리했습니다. 공백 제외 글자수, 한글 2바이트로 세는 LENB, 셀 안 줄바꿈 빼고 세기, 글자수 제한을 넘는 칸에 색 칠하기와 개수 세기까지 다룹니다.",
    keywords: [
      "엑셀 글자수 세기",
      "엑셀 LEN 함수",
      "엑셀 공백 제외 글자수",
      "엑셀 LENB 바이트",
      "엑셀 글자수 제한",
      "엑셀 글자수 넘는 셀 표시",
    ],
    published: "2026-10-19",
    tool: "count",
    excerpt:
      "상품명·제목처럼 칸마다 글자수 제한이 있을 때 쓰는 LEN 함수 정리입니다. 공백 제외, 바이트, 셀 안 줄바꿈, 제한 넘는 칸 표시까지.",
    toc: [
      { id: "len", title: "LEN: 칸 하나의 글자수" },
      { id: "variants", title: "공백 제외·바이트·줄바꿈 빼고 세기" },
      { id: "limit", title: "제한 글자수를 넘는 칸 찾기" },
      { id: "pitfalls", title: "숫자 칸과 보이지 않는 글자" },
      { id: "long-text", title: "긴 글은 엑셀 밖에서" },
      { id: "summary", title: "정리" },
    ],
  },
  Body() {
    return (
      <>
        <p>
          쇼핑몰 상품명, 광고 문구, 게시판 제목처럼 칸마다 글자수 제한이 있는 목록을 엑셀로 관리할 때가 있습니다. 수백
          줄을 하나씩 세어 볼 수는 없으니 옆 열에 글자수를 띄워 두고, 넘는 칸만 골라 고치는 편이 빠릅니다. 엑셀에서는
          LEN 함수 하나로 시작합니다.
        </p>

        <h2 id="len">LEN: 칸 하나의 글자수</h2>
        <pre className="postCode">
          <code>{`=LEN(A2)`}</code>
        </pre>
        <p>A2에 든 글자수를 띄어쓰기까지 포함해 셉니다. 한글·영문·숫자·기호 모두 한 글자로 셉니다.</p>
        <div className="postTableWrap">
          <table className="postTable">
            <thead>
              <tr>
                <th scope="col">A열 (상품명)</th>
                <th scope="col">=LEN(A2)</th>
                <th scope="col">공백 제외</th>
                <th scope="col">=LENB(A2)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>사무용 의자 메쉬 등받이</td>
                <td>13</td>
                <td>10</td>
                <td>23</td>
              </tr>
              <tr>
                <td>A4 용지 80g 2500매</td>
                <td>15</td>
                <td>12</td>
                <td>18</td>
              </tr>
              <tr>
                <td>데스크매트 가죽 900x400</td>
                <td>16</td>
                <td>14</td>
                <td>23</td>
              </tr>
              <tr>
                <td>USB-C 충전기 65W</td>
                <td>13</td>
                <td>11</td>
                <td>16</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          B2에 수식을 넣고 칸 오른쪽 아래 작은 네모를 더블클릭하면 목록 끝까지 채워집니다. 열 전체 글자수 합계가 필요하면
          =SUMPRODUCT(LEN(A2:A100))처럼 범위를 한 번에 넣을 수 있습니다.
        </p>

        <h2 id="variants">공백 제외·바이트·줄바꿈 빼고 세기</h2>
        <h3>공백 제외</h3>
        <p>띄어쓰기를 빈 글자로 바꾼 뒤 셉니다.</p>
        <pre className="postCode">
          <code>{`=LEN(SUBSTITUTE(A2, " ", ""))`}</code>
        </pre>

        <h3>바이트: LENB</h3>
        <p>
          한국어 엑셀에서 LENB는 한글을 2바이트, 영문·숫자·기호·띄어쓰기를 1바이트로 셉니다. &lsquo;40바이트 이내&rsquo;처럼
          바이트로 제한하는 시스템에 올릴 목록이라면 LEN 대신 LENB를 씁니다. 위 표의 &lsquo;사무용 의자 메쉬 등받이&rsquo;는
          13자지만 한글 10자가 2바이트씩이라 23바이트입니다.
        </p>
        <p>
          웹 서비스나 데이터베이스는 한글을 3바이트(UTF-8)로 세는 경우가 많아서, LENB 결과와 맞지 않을 수 있습니다. 올릴
          곳이 어느 방식인지 먼저 확인하세요.
        </p>

        <h3>셀 안 줄바꿈 빼고 세기</h3>
        <p>
          Alt+Enter로 줄을 바꾼 칸은 LEN이 줄바꿈도 한 글자로 셉니다. 줄바꿈 글자는 CHAR(10)이라, 이것을 지우고 세면
          됩니다.
        </p>
        <pre className="postCode">
          <code>{`=LEN(SUBSTITUTE(A2, CHAR(10), ""))`}</code>
        </pre>
        <p>공백과 줄바꿈을 모두 빼려면 SUBSTITUTE를 두 번 겹칩니다.</p>
        <pre className="postCode">
          <code>{`=LEN(SUBSTITUTE(SUBSTITUTE(A2, " ", ""), CHAR(10), ""))`}</code>
        </pre>

        <h2 id="limit">제한 글자수를 넘는 칸 찾기</h2>
        <h3>넘는 칸에 색 칠하기</h3>
        <p>
          상품명 열(A2:A100)을 선택하고 [홈] → [조건부 서식] → [새 규칙] → &lsquo;수식을 사용하여 서식을 지정할 셀
          결정&rsquo;을 고른 뒤 아래 수식을 넣고 색을 정합니다. 50자를 넘는 칸만 색이 칠해집니다.
        </p>
        <pre className="postCode">
          <code>{`=LEN(A2)>50`}</code>
        </pre>
        <p>
          범위의 첫 칸(A2)을 기준으로 쓰고 $를 붙이지 않아야 아래 칸마다 자기 글자수로 판단합니다. 바이트 기준이면 LENB로
          바꾸면 됩니다.
        </p>

        <h3>넘는 칸이 몇 개인지</h3>
        <pre className="postCode">
          <code>{`=SUMPRODUCT(--(LEN(A2:A100)>50))`}</code>
        </pre>
        <p>
          LEN(A2:A100)&gt;50이 칸마다 참·거짓을 만들고, 앞의 --가 그것을 1·0으로 바꿔 더합니다. 고칠 칸이 몇 개 남았는지
          확인할 때 씁니다.
        </p>

        <h3>몇 자를 줄여야 하는지</h3>
        <pre className="postCode">
          <code>{`=MAX(0, LEN(A2)-50)`}</code>
        </pre>
        <p>제한 안이면 0, 넘으면 넘은 글자수가 나옵니다. 이 열로 정렬하면 많이 넘는 칸부터 고칠 수 있습니다.</p>

        <h2 id="pitfalls">숫자 칸과 보이지 않는 글자</h2>
        <h3>숫자는 보이는 모양이 아니라 값으로 셉니다</h3>
        <p>
          1,200으로 보이는 칸도 실제 값은 1200이라 LEN은 4를 돌려줍니다. 쉼표나 원 표시까지 세야 한다면
          =LEN(TEXT(A2, &quot;#,##0&quot;))처럼 TEXT로 모양을 만든 뒤 셉니다.
        </p>
        <h3>앞뒤 공백</h3>
        <p>
          다른 시스템에서 내려받은 목록은 맨 뒤에 공백이 붙어 있는 경우가 있습니다. 눈으로는 같아 보여도 LEN은 1자 더
          세니, 글자수가 이상하게 크면 =LEN(TRIM(A2))와 비교해 보세요. TRIM은 앞뒤 공백을 지우고 가운데 연속 공백을
          하나로 줄입니다.
        </p>

        <h2 id="long-text">긴 글은 엑셀 밖에서</h2>
        <p>
          엑셀은 칸이 많은 목록을 셀 때 편하고, 자기소개서나 보고서처럼 한 덩어리로 된 긴 글에는 불편합니다. 긴 글은{" "}
          <Link href="/count/">글자수 세기</Link>에 붙여넣으면 공백 포함·공백 제외 글자수와 한글 2바이트·UTF-8 바이트,
          단어·줄·문단 수가 한 번에 나옵니다. 목표 글자수를 넣으면 남은 글자수도 보여 줍니다.
        </p>
        <p>
          PDF나 웹에서 복사해 줄마다 끊긴 글이라면 먼저 <Link href="/linebreak/">줄바꿈 제거</Link>로 문단을 이어 붙인 뒤
          세는 편이 정확합니다.
        </p>

        <h2 id="summary">정리</h2>
        <ul>
          <li>글자수: =LEN(A2) / 공백 제외: =LEN(SUBSTITUTE(A2, &quot; &quot;, &quot;&quot;))</li>
          <li>한글 2바이트 기준: =LENB(A2)</li>
          <li>셀 안 줄바꿈 빼기: =LEN(SUBSTITUTE(A2, CHAR(10), &quot;&quot;))</li>
          <li>제한 넘는 칸 표시: 조건부 서식 =LEN(A2)&gt;50, 개수: =SUMPRODUCT(--(LEN(A2:A100)&gt;50))</li>
        </ul>
      </>
    );
  },
};

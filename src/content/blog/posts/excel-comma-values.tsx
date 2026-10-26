import Link from "next/link";
import type { Post } from "../types";

/**
 * 노리는 검색어: 엑셀 셀 안 쉼표 개수, 엑셀 한 셀 여러 값 개수, 엑셀 특정 단어 포함 여부, 엑셀 쉼표 값 세기, 파워쿼리 행으로 분할
 * /split/ 안내(TEXTSPLIT·텍스트 나누기·Ctrl+J)와 겹치지 않게 '나누지 않고 세고 찾기'와 '행으로 펼치기'를 다룬다.
 * 예시 값은 파이썬으로 계산해 확인: 항목 수 3·2·1·2, '영업' 정확히 2행(COUNTIF *영업*은 3행).
 */
export const excelCommaValues: Post = {
  meta: {
    slug: "excel-comma-values",
    title: "엑셀 한 셀에 쉼표로 든 값 세기·찾기·행으로 펼치기",
    h1: "엑셀 한 셀에 쉼표로 여러 값이 있을 때: 개수 세기, 포함 여부, 행으로 펼치기",
    description:
      "담당 업무·태그·수강 과목처럼 한 셀에 쉼표로 여러 값이 들어 있을 때, 셀마다 몇 개인지 세는 수식, 특정 값이 정확히 들어 있는지 찾는 수식, 값별 건수를 구하는 방법과 한 행에 하나씩 펼치는 방법을 정리했습니다.",
    keywords: [
      "엑셀 셀 안 쉼표 개수",
      "엑셀 한 셀 여러 값 개수",
      "엑셀 특정 단어 포함 여부",
      "엑셀 쉼표 구분 값 세기",
      "파워쿼리 행으로 분할",
    ],
    published: "2026-10-26",
    tool: "split",
    excerpt:
      "한 칸에 '디자인, 마케팅, 영업'처럼 들어 있는 값을 나누지 않고 세고 찾는 수식과, 값별 건수·한 행에 하나씩 펼치는 방법입니다.",
    toc: [
      { id: "setup", title: "예시: 사람마다 담당 업무가 한 칸에" },
      { id: "count", title: "셀마다 값이 몇 개인지 세기" },
      { id: "contains", title: "특정 값이 들어 있는지 찾기" },
      { id: "count-rows", title: "그 값이 든 행이 몇 개인지" },
      { id: "per-value", title: "값별로 몇 건인지 한 번에" },
      { id: "rows", title: "한 행에 값 하나씩 펼치기" },
      { id: "summary", title: "정리" },
    ],
  },
  Body() {
    return (
      <>
        <p>
          설문 응답의 &lsquo;관심 분야&rsquo;, 직원별 담당 업무, 상품 태그처럼 한 칸에 여러 값이 쉼표로 들어가 있는 표를 자주
          받습니다. 보기에는 편하지만 &ldquo;영업 담당이 몇 명이냐&rdquo;를 물으면 바로 답하기 어렵습니다. 값을 꼭 나누지 않아도 수식으로
          셀 수 있고, 나눠야 할 때는 행으로 펼치는 방법이 있습니다.
        </p>

        <h2 id="setup">예시: 사람마다 담당 업무가 한 칸에</h2>
        <div className="postTableWrap">
          <table className="postTable">
            <thead>
              <tr>
                <th scope="col">A열 (이름)</th>
                <th scope="col">B열 (담당 업무)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>김민수</td>
                <td>디자인, 마케팅, 영업</td>
              </tr>
              <tr>
                <td>이서연</td>
                <td>해외영업, 기획</td>
              </tr>
              <tr>
                <td>박준호</td>
                <td>영업</td>
              </tr>
              <tr>
                <td>최지우</td>
                <td>기획, 디자인</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>아래 수식은 2행부터 데이터가 있다고 보고 B2 기준으로 씁니다.</p>

        <h2 id="count">셀마다 값이 몇 개인지 세기</h2>
        <p>값의 개수는 쉼표 개수보다 하나 많습니다. 쉼표 개수는 원래 글자수에서 쉼표를 지운 글자수를 빼서 구합니다.</p>
        <pre className="postCode">
          <code>{`=IF(TRIM(B2)="", 0, LEN(B2)-LEN(SUBSTITUTE(B2, ",", ""))+1)

→ 3 / 2 / 1 / 2`}</code>
        </pre>
        <p>
          빈 칸은 쉼표가 없어도 1이 나오기 때문에 IF로 0을 돌려줍니다. 끝에 쉼표가 하나 더 붙은 &ldquo;디자인,마케팅,&rdquo; 같은
          칸은 값이 2개인데 3으로 셉니다. 다른 시스템에서 받은 데이터라면 끝 쉼표가 있는지 먼저 확인하세요.
        </p>

        <h2 id="contains">특정 값이 들어 있는지 찾기</h2>
        <p>
          =ISNUMBER(SEARCH(&quot;영업&quot;, B2))로 찾으면 &lsquo;해외영업&rsquo;에도 TRUE가 나옵니다. 값 하나를 정확히 찾으려면 양쪽에
          쉼표를 붙여 비교합니다.
        </p>
        <pre className="postCode">
          <code>{`=ISNUMBER(SEARCH(",영업,", ","&SUBSTITUTE(B2, " ", "")&","))

→ TRUE / FALSE / TRUE / FALSE`}</code>
        </pre>
        <p>
          SUBSTITUTE로 띄어쓰기를 모두 지운 뒤 앞뒤에 쉼표를 붙이면 &ldquo;,디자인,마케팅,영업,&rdquo;이 됩니다. 여기서
          &ldquo;,영업,&rdquo;을 찾으니 &lsquo;해외영업&rsquo;은 걸리지 않습니다. &ldquo;디자인,영업&rdquo;처럼 쉼표 뒤 띄어쓰기가
          있든 없든 같게 찾습니다. 다만 값 안의 띄어쓰기도 지워지므로, 찾는 값에 띄어쓰기가 있다면(예: 해외 영업) 붙여서
          &ldquo;,해외영업,&rdquo;으로 찾아야 합니다.
        </p>
        <p>찾을 값을 D1 칸에 적어 두고 싶다면 &quot;,영업,&quot; 자리에 &quot;,&quot;&amp;D1&amp;&quot;,&quot;를 넣으면 됩니다.</p>

        <h2 id="count-rows">그 값이 든 행이 몇 개인지</h2>
        <p>
          &lsquo;영업 담당이 몇 명인지&rsquo;는 위 조건을 범위 전체에 걸어 TRUE 개수를 셉니다. SUMPRODUCT는 배열을 그대로 다루므로 예전
          엑셀에서도 Enter만 누르면 됩니다.
        </p>
        <pre className="postCode">
          <code>{`=SUMPRODUCT(--ISNUMBER(SEARCH(",영업,", ","&SUBSTITUTE(B2:B100, " ", "")&",")))

→ 2   (김민수, 박준호)`}</code>
        </pre>
        <p>
          흔히 쓰는 =COUNTIF(B2:B100, &quot;*영업*&quot;)은 같은 표에서 3을 돌려줍니다. &lsquo;해외영업&rsquo;의 이서연까지 세기
          때문입니다. 이름이 비슷한 값이 섞인 목록에서는 개수가 조용히 틀어지니 쉼표로 감싸는 방식을 쓰세요. 앞의 --는 TRUE·FALSE를
          1·0으로 바꾸는 기호입니다.
        </p>

        <h2 id="per-value">값별로 몇 건인지 한 번에</h2>
        <p>
          디자인 몇 건, 기획 몇 건처럼 모든 값의 건수를 한 번에 보려면 값을 한 줄에 하나씩 꺼낸 뒤 셉니다. 수식보다 붙여넣기가 빠른
          경우가 많습니다.
        </p>
        <ol>
          <li>B열(B2부터 끝까지)을 복사합니다.</li>
          <li>
            <Link href="/split/">쉼표를 줄바꿈으로 변환</Link>에 붙여넣으면 여러 줄에 걸친 값이 한 줄에 하나씩 나옵니다(쉼표 뒤
            띄어쓰기는 지워짐).
          </li>
          <li>
            결과를 복사해 <Link href="/dedupe/">엑셀 중복 제거</Link>에 붙이고 &lsquo;개수 세기&rsquo;를 고르면 값마다 건수가 붙습니다.
          </li>
        </ol>
        <div className="postTableWrap">
          <table className="postTable">
            <thead>
              <tr>
                <th scope="col">값</th>
                <th scope="col">건수</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>디자인</td>
                <td>2</td>
              </tr>
              <tr>
                <td>영업</td>
                <td>2</td>
              </tr>
              <tr>
                <td>기획</td>
                <td>2</td>
              </tr>
              <tr>
                <td>마케팅</td>
                <td>1</td>
              </tr>
              <tr>
                <td>해외영업</td>
                <td>1</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          엑셀 안에서 하려면 값 목록을 한 열에 만든 뒤(E2부터) 옆 칸에 위 SUMPRODUCT 수식의 &quot;,영업,&quot;을
          &quot;,&quot;&amp;E2&amp;&quot;,&quot;로 바꿔 넣고 아래로 채웁니다.
        </p>

        <h2 id="rows">한 행에 값 하나씩 펼치기</h2>
        <p>
          피벗 테이블로 묶거나 다른 표와 연결하려면 결국 &lsquo;김민수 · 디자인&rsquo;, &lsquo;김민수 · 마케팅&rsquo;처럼 한 행에 값 하나가
          되어야 합니다. 이름 같은 다른 열은 반복되어야 하므로 값만 나누는 것으로는 부족합니다.
        </p>
        <h3>파워 쿼리로</h3>
        <ol>
          <li>표 안을 클릭하고 [데이터] → [테이블/범위에서]로 파워 쿼리 편집기를 엽니다.</li>
          <li>담당 업무 열을 선택하고 [홈] → [열 분할] → [구분 기호 기준]을 누릅니다.</li>
          <li>구분 기호는 쉼표, [고급 옵션]에서 나누는 방향을 &lsquo;행&rsquo;으로 고릅니다.</li>
          <li>나뉜 값 앞에 띄어쓰기가 남으면 그 열에서 [변환] → [서식] → [공백 제거]를 누른 뒤 [닫기 및 로드]합니다.</li>
        </ol>
        <p>
          원본 표에 사람이 추가되면 결과 표에서 [새로 고침]만 누르면 다시 펼쳐집니다. 메뉴 이름은 엑셀 버전에 따라 조금 다를 수
          있습니다.
        </p>
        <h3>붙여넣기로</h3>
        <p>
          한 번만 하면 되는 작업이라면 이름과 담당 업무 두 열을 복사해 <Link href="/cell-split/">엑셀 셀 나누기</Link>에 붙이고, 나누는
          기준을 &lsquo;쉼표&rsquo;로, 결과 모양을 &lsquo;아래 행으로&rsquo;로 바꾸면 이름이 반복된 채 값이 한 행에 하나씩 나옵니다.
        </p>

        <h2 id="summary">정리</h2>
        <ul>
          <li>값 개수: =IF(TRIM(B2)=&quot;&quot;, 0, LEN(B2)-LEN(SUBSTITUTE(B2, &quot;,&quot;, &quot;&quot;))+1)</li>
          <li>정확히 포함: 띄어쓰기를 지우고 앞뒤에 쉼표를 붙인 뒤 &quot;,값,&quot;을 SEARCH</li>
          <li>행 개수: SUMPRODUCT로 감싸기 (COUNTIF *값*은 비슷한 값까지 셈)</li>
          <li>값별 건수: 한 줄에 하나씩 꺼낸 뒤 개수 세기</li>
          <li>한 행에 하나씩: 파워 쿼리 &lsquo;열 분할 → 행&rsquo;, 다른 열 반복</li>
        </ul>
      </>
    );
  },
};

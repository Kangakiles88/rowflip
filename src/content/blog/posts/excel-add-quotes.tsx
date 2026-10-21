import Link from "next/link";
import type { Post } from "../types";

/**
 * 노리는 검색어: 엑셀 따옴표 붙이기, 엑셀 작은따옴표 쉼표 붙이기, 엑셀 큰따옴표 넣기 CHAR(34), 엑셀 SQL IN 절 만들기 수식
 * 가로세로 변환기(/)의 'SQL IN 절 · JSON 배열 만들기' 안내는 도구 사용법이라, 여기서는 엑셀 수식으로 하는 방법과 함정을 다룬다.
 */
export const excelAddQuotes: Post = {
  meta: {
    slug: "excel-add-quotes",
    title: "엑셀 목록에 따옴표·쉼표 붙이기 - SQL IN 절 만드는 수식",
    h1: "엑셀 목록에 따옴표·쉼표 붙이기: SQL IN 절과 JSON 배열 만드는 수식",
    description:
      "엑셀 한 열의 코드·사번 목록에 작은따옴표와 쉼표를 붙여 SQL IN 절이나 JSON 배열로 만드는 수식을 정리했습니다. 큰따옴표를 넣는 CHAR(34), 한 칸으로 잇는 TEXTJOIN, 빈 칸이 ''로 들어가는 문제와 값 안의 작은따옴표 처리까지 다룹니다.",
    keywords: [
      "엑셀 따옴표 붙이기",
      "엑셀 작은따옴표 쉼표 붙이기",
      "엑셀 큰따옴표 넣기",
      "엑셀 CHAR(34)",
      "엑셀 SQL IN 만들기",
      "엑셀 TEXTJOIN 따옴표",
    ],
    published: "2026-10-21",
    tool: "garosero",
    excerpt:
      "주문번호 목록을 쿼리에 넣으려고 따옴표와 쉼표를 하나씩 붙이고 있다면. 엑셀 수식 한 줄로 'A-10234','A-10235' 모양을 만드는 방법과 자주 틀리는 부분입니다.",
    toc: [
      { id: "each", title: "칸마다 따옴표 붙이기" },
      { id: "double", title: "큰따옴표 넣기: CHAR(34)" },
      { id: "join", title: "한 칸으로 잇기: TEXTJOIN" },
      { id: "pitfalls", title: "빈 칸과 값 안의 작은따옴표" },
      { id: "old-excel", title: "TEXTJOIN이 없는 엑셀이라면" },
      { id: "summary", title: "정리" },
    ],
  },
  Body() {
    return (
      <>
        <p>
          엑셀에 있는 주문번호나 사번 목록으로 데이터베이스를 조회하려면 &lsquo;A-10234&rsquo;,&lsquo;A-10235&rsquo;처럼 값마다
          작은따옴표를 씌우고 쉼표로 이어야 합니다. 몇 개면 손으로 고치겠지만 수백 개면 수식으로 만드는 편이 빠르고 빠뜨리는
          값도 없습니다. A2부터 아래로 코드가 있다고 하고 정리합니다.
        </p>

        <h2 id="each">칸마다 따옴표 붙이기</h2>
        <p>
          옆 열에 아래 수식을 넣고 아래로 채웁니다. 큰따옴표 안에 작은따옴표를 넣어 글자로 붙이는 방식입니다.
        </p>
        <pre className="postCode">
          <code>{`="'"&A2&"'"         → 'A-10234'
="'"&A2&"',"        → 'A-10234',`}</code>
        </pre>
        <p>
          두 번째 수식은 쉼표까지 붙여서, 결과 열을 복사해 쿼리 편집기에 붙여넣으면 한 줄에 하나씩 들어갑니다. 마지막 줄 끝의
          쉼표 하나만 지우면 됩니다.
        </p>

        <h2 id="double">큰따옴표 넣기: CHAR(34)</h2>
        <p>
          JSON이나 CSV처럼 큰따옴표가 필요할 때는 수식 안에서 큰따옴표를 그대로 쓰기 어렵습니다. 큰따옴표는 수식에서 글자의
          시작과 끝을 뜻하기 때문입니다. 두 가지 방법이 있습니다.
        </p>
        <pre className="postCode">
          <code>{`=CHAR(34)&A2&CHAR(34)     → "A-10234"
=""""&A2&""""             → "A-10234"`}</code>
        </pre>
        <p>
          CHAR(34)는 큰따옴표 한 글자를 뜻합니다. 두 번째 방법은 큰따옴표를 두 번 겹쳐 쓰면 글자 큰따옴표 하나가 되는 규칙을
          이용한 것인데, 따옴표가 네 개씩 붙어 있어 고칠 때 헷갈리기 쉽습니다. CHAR(34) 쪽이 읽기 편합니다.
        </p>

        <h2 id="join">한 칸으로 잇기: TEXTJOIN</h2>
        <p>
          Microsoft 365와 엑셀 2019 이상에서는 TEXTJOIN으로 목록 전체를 한 칸에 이을 수 있습니다. 범위에 따옴표를 붙인 뒤
          쉼표로 잇습니다.
        </p>
        <pre className="postCode">
          <code>{`SQL IN 절
="("&TEXTJOIN(",", TRUE, "'"&A2:A9&"'")&")"
→ ('A-10234','A-10235','B-20411')

JSON 배열
="["&TEXTJOIN(",", TRUE, CHAR(34)&A2:A9&CHAR(34))&"]"
→ ["A-10234","A-10235","B-20411"]`}</code>
        </pre>
        <p>
          Microsoft 365에서는 Enter로 바로 됩니다. 엑셀 2019에서는 범위에 글자를 붙이는 부분 때문에 배열 수식으로 넣어야 해서,
          수식을 쓴 뒤 Ctrl+Shift+Enter를 누릅니다. 값이 많으면 결과가 한 칸에 길게 들어가니, 칸을 선택하고 수식 입력줄에서
          복사하세요.
        </p>

        <h2 id="pitfalls">빈 칸과 값 안의 작은따옴표</h2>
        <h3>빈 칸이 &apos;&apos;로 들어간다</h3>
        <p>
          TEXTJOIN의 두 번째 인수 TRUE는 빈 칸을 건너뛰라는 뜻인데, 위 수식에서는 빈 칸에도 따옴표가 먼저 붙어 &apos;&apos;가
          되므로 빈 칸으로 보지 않습니다. 범위 끝에 빈 줄이 있으면 IN 절 끝에 ,&apos;&apos;가 붙습니다. 빈 칸은 따옴표를 붙이지
          않도록 IF로 거릅니다.
        </p>
        <pre className="postCode">
          <code>{`="("&TEXTJOIN(",", TRUE, IF(A2:A100="", "", "'"&A2:A100&"'"))&")"`}</code>
        </pre>
        <p>이렇게 두면 범위를 넉넉하게 잡아도 빈 줄은 빠지고 값만 이어집니다.</p>

        <h3>값 안에 작은따옴표가 있을 때</h3>
        <p>
          상호명이나 영문 이름에 &lsquo;O&apos;Brien&rsquo;처럼 작은따옴표가 들어 있으면 SQL에서는 따옴표가 거기서 닫혀 버려
          쿼리가 깨집니다. SQL에서는 값 안의 작은따옴표를 두 번 겹쳐 써야 하므로, 따옴표를 붙이기 전에 SUBSTITUTE로 바꿉니다.
        </p>
        <pre className="postCode">
          <code>{`="'"&SUBSTITUTE(A2, "'", "''")&"'"
O'Brien  →  'O''Brien'`}</code>
        </pre>

        <h3>앞자리 0과 숫자 코드</h3>
        <p>
          00123 같은 코드가 숫자로 들어가 123으로 바뀌어 있다면 따옴표를 붙여도 &apos;123&apos;이 됩니다. 원래 자릿수가 정해져 있으면
          TEXT(A2, &quot;00000&quot;)로 자릿수를 되돌린 뒤 따옴표를 붙이세요. 반대로 숫자 열(정수 ID)에 IN 절을 쓸 때는 따옴표 없이
          =TEXTJOIN(&quot;,&quot;, TRUE, A2:A9)만으로 충분합니다.
        </p>

        <h2 id="old-excel">TEXTJOIN이 없는 엑셀이라면</h2>
        <p>
          엑셀 2016 이하에는 TEXTJOIN이 없습니다. 첫 번째 방법(칸마다 =&quot;&apos;&quot;&amp;A2&amp;&quot;&apos;,&quot;)으로 만든 열을 복사해
          쿼리 편집기에 붙여넣는 것이 가장 간단합니다. 한 줄로 이어 붙여야 한다면{" "}
          <Link href="/">엑셀 가로세로 변환기</Link>에 열을 붙여넣고 &lsquo;SQL IN&rsquo;이나 &lsquo;JSON 배열&rsquo;을 누르면 됩니다.
          빈 줄은 빠지고, &lsquo;SQL IN&rsquo;은 겹치는 값도 하나만 남기며, 값 안의 따옴표도 형식에 맞게 바뀝니다.
        </p>
        <p>
          반대로 쿼리에서 복사한 (&apos;A-10234&apos;,&apos;A-10235&apos;)를 다시 엑셀 한 열로 풀어야 한다면{" "}
          <Link href="/split/">쉼표를 줄바꿈으로 변환</Link>에서 괄호와 따옴표를 벗겨 한 줄에 하나씩 나눌 수 있습니다.
        </p>

        <h2 id="summary">정리</h2>
        <ul>
          <li>작은따옴표: =&quot;&apos;&quot;&amp;A2&amp;&quot;&apos;&quot; / 쉼표까지: =&quot;&apos;&quot;&amp;A2&amp;&quot;&apos;,&quot;</li>
          <li>큰따옴표: =CHAR(34)&amp;A2&amp;CHAR(34)</li>
          <li>한 칸에 IN 절: =&quot;(&quot;&amp;TEXTJOIN(&quot;,&quot;, TRUE, IF(A2:A100=&quot;&quot;, &quot;&quot;, &quot;&apos;&quot;&amp;A2:A100&amp;&quot;&apos;&quot;))&amp;&quot;)&quot;</li>
          <li>값 안의 작은따옴표는 SUBSTITUTE(A2, &quot;&apos;&quot;, &quot;&apos;&apos;&quot;)로 두 번 겹쳐 쓰기</li>
        </ul>
      </>
    );
  },
};

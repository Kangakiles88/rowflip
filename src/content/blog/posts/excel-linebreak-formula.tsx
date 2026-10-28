import Link from "next/link";
import type { Post } from "../types";

/**
 * 노리는 검색어: 엑셀 셀 안 줄바꿈 수식, 엑셀 CHAR(10), 엑셀 줄바꿈 합치기, 엑셀 셀 안 줄 수 세기, 엑셀 줄바꿈 복사 따옴표
 * /linebreak/ 안내('엑셀 셀 안의 줄바꿈 지우기' — Ctrl+J·SUBSTITUTE)와 겹치지 않게 '넣기·세기·꺼내기'와 복사할 때 생기는 따옴표를 다룬다.
 * 예시 값은 파이썬·사이트 utils로 확인: 두 줄 주소 줄 수 2, 첫 줄·마지막 줄, 복사 시 따옴표는 excelCellsToText가 벗김.
 */
export const excelLinebreakFormula: Post = {
  meta: {
    slug: "excel-linebreak-formula",
    title: "엑셀 셀 안에 줄바꿈 넣기 - CHAR(10) 수식과 줄 수 세기",
    h1: "엑셀 셀 안에 줄바꿈 넣기: CHAR(10) 수식, 줄 수 세기, 복사하면 생기는 따옴표",
    description:
      "엑셀에서 주소와 회사명을 한 셀에 두 줄로 합치는 CHAR(10) 수식, 줄바꿈이 보이지 않을 때 확인할 설정, 셀 안 줄 수 세기와 첫 줄·마지막 줄 꺼내기, 메모장에 복사하면 큰따옴표가 붙는 이유를 정리했습니다.",
    keywords: [
      "엑셀 셀 안 줄바꿈 수식",
      "엑셀 CHAR(10)",
      "엑셀 줄바꿈 합치기",
      "엑셀 셀 안 줄 수 세기",
      "엑셀 줄바꿈 복사 따옴표",
    ],
    published: "2026-10-28",
    tool: "linebreak",
    excerpt:
      "주소·회사명을 한 셀에 두 줄로 합치는 CHAR(10) 수식과, 줄바꿈이 안 보일 때·복사하면 큰따옴표가 붙을 때 확인할 것입니다.",
    toc: [
      { id: "keys", title: "손으로 넣기: Alt+Enter" },
      { id: "formula", title: "수식으로 넣기: CHAR(10)" },
      { id: "not-shown", title: "줄바꿈이 안 보일 때" },
      { id: "count", title: "셀 안 줄 수 세기" },
      { id: "extract", title: "첫 줄·마지막 줄·N번째 줄 꺼내기" },
      { id: "copy", title: "복사하면 큰따옴표가 붙는 이유" },
      { id: "summary", title: "정리" },
    ],
  },
  Body() {
    return (
      <>
        <p>
          우편 라벨이나 명단 출력용으로 주소와 회사명을 한 셀에 두 줄로 넣고 싶을 때가 있습니다. 한두 칸이면 직접 줄을 바꾸면 되지만, 수백
          행이면 수식으로 합쳐야 합니다. 엑셀에서 셀 안 줄바꿈은 글자 하나로 취급되므로 수식으로 넣고, 세고, 꺼낼 수 있습니다.
        </p>

        <h2 id="keys">손으로 넣기: Alt+Enter</h2>
        <p>
          셀을 편집하는 중에 줄을 바꿀 자리에서 Alt+Enter(맥은 Option+Return, 버전에 따라 Control+Option+Return)를 누르면 셀 안에서 줄이
          바뀝니다. 그냥 Enter를 누르면 아래 셀로 넘어갑니다.
        </p>

        <h2 id="formula">수식으로 넣기: CHAR(10)</h2>
        <p>
          셀 안 줄바꿈은 CHAR(10)이라는 글자입니다. A열에 주소, B열에 회사명이 있을 때 C2에 아래처럼 적으면 두 값이 두 줄로 합쳐집니다.
        </p>
        <pre className="postCode">
          <code>{`=A2&CHAR(10)&B2

서울시 강남구 테헤란로 1
3층 한빛오피스`}</code>
        </pre>
        <p>합칠 칸이 여러 개라면 TEXTJOIN이 편합니다(엑셀 2019·Microsoft 365). 두 번째 인수 TRUE는 빈 칸을 건너뛰라는 뜻입니다.</p>
        <pre className="postCode">
          <code>{`=TEXTJOIN(CHAR(10), TRUE, A2:D2)`}</code>
        </pre>
        <p>
          우편번호처럼 앞에 글자를 붙여야 하면 =&quot;(&quot;&amp;D2&amp;&quot;)&quot;&amp;CHAR(10)&amp;A2처럼 &amp;로 이어 붙이면 됩니다.
        </p>

        <h2 id="not-shown">줄바꿈이 안 보일 때</h2>
        <p>
          수식을 넣었는데 한 줄로 이어 보이면 셀 서식 문제입니다. 결과 열을 선택하고 [홈] → [자동 줄 바꿈]을 켜세요. Alt+Enter로 넣을
          때는 엑셀이 자동으로 켜 주지만, 수식으로 만든 줄바꿈은 직접 켜야 보입니다. 행 높이가 그대로라면 행 머리글 경계를 두 번
          누르면 내용에 맞춰 늘어납니다.
        </p>

        <h2 id="count">셀 안 줄 수 세기</h2>
        <p>줄 수는 줄바꿈 글자 수보다 하나 많습니다. 원래 글자수에서 줄바꿈을 지운 글자수를 빼면 줄바꿈 개수가 나옵니다.</p>
        <pre className="postCode">
          <code>{`=IF(A2="", 0, LEN(A2)-LEN(SUBSTITUTE(A2, CHAR(10), ""))+1)

→ 2   (테헤란로 1 / 3층 한빛오피스)`}</code>
        </pre>
        <p>라벨 칸에 세 줄까지만 들어가는 경우 이 열로 필터를 걸어 넘치는 행을 먼저 찾을 수 있습니다.</p>

        <h2 id="extract">첫 줄·마지막 줄·N번째 줄 꺼내기</h2>
        <p>첫 줄은 첫 줄바꿈 앞까지 자르면 됩니다. 줄바꿈이 없는 셀에서도 오류가 나지 않게 뒤에 CHAR(10)을 하나 붙여 찾습니다.</p>
        <pre className="postCode">
          <code>{`=LEFT(A2, FIND(CHAR(10), A2&CHAR(10))-1)

→ 서울시 강남구 테헤란로 1`}</code>
        </pre>
        <p>Microsoft 365에서는 TEXTSPLIT으로 줄마다 나눈 뒤 원하는 줄을 고를 수 있습니다.</p>
        <pre className="postCode">
          <code>{`=INDEX(TEXTSPLIT(A2, , CHAR(10)), 2)    → 3층 한빛오피스 (두 번째 줄)
=TAKE(TEXTSPLIT(A2, , CHAR(10)), -1)    → 마지막 줄`}</code>
        </pre>
        <p>
          TEXTSPLIT의 세 번째 인수 자리에 구분자를 넣으면 아래로(행으로) 나눕니다. 결과가 여러 칸으로 펼쳐지지 않게 INDEX·TAKE로 한
          줄만 골랐습니다.
        </p>

        <h2 id="copy">복사하면 큰따옴표가 붙는 이유</h2>
        <p>줄바꿈이 든 셀을 복사해 메모장이나 메일에 붙이면 이렇게 앞뒤에 큰따옴표가 붙습니다.</p>
        <pre className="postCode">
          <code>{`"서울시 강남구 테헤란로 1
3층 한빛오피스"`}</code>
        </pre>
        <p>
          엑셀이 복사할 때 셀 안 줄바꿈과 셀 사이 줄바꿈을 구분하려고 그 셀을 따옴표로 감싸기 때문입니다. 다시 엑셀에 붙이면 한 셀로
          돌아가지만, 다른 프로그램에서는 따옴표가 글자로 남습니다. 값 안에 큰따옴표가 있으면 두 개(&quot;&quot;)로 바뀌어 나오기도
          합니다.
        </p>
        <p>
          줄바꿈 없이 한 줄로 옮길 글이라면 <Link href="/linebreak/">줄바꿈 제거</Link>에 붙여넣으세요. 엑셀이 붙인 따옴표를 벗긴 뒤
          줄바꿈을 띄어쓰기로 바꿉니다. 셀 안 줄바꿈을 엑셀 안에서 지우는 방법(찾기·바꾸기에서 Ctrl+J)은 그 페이지 안내에 있습니다.
        </p>

        <h2 id="summary">정리</h2>
        <ul>
          <li>손으로: Alt+Enter (맥 Option+Return)</li>
          <li>수식으로: =A2&amp;CHAR(10)&amp;B2, 여러 칸은 =TEXTJOIN(CHAR(10), TRUE, A2:D2)</li>
          <li>안 보이면 [자동 줄 바꿈] 켜기</li>
          <li>줄 수: =LEN(A2)-LEN(SUBSTITUTE(A2, CHAR(10), &quot;&quot;))+1</li>
          <li>첫 줄: =LEFT(A2, FIND(CHAR(10), A2&amp;CHAR(10))-1)</li>
          <li>복사하면 붙는 따옴표는 엑셀이 셀을 구분하려고 넣은 것</li>
        </ul>
      </>
    );
  },
};

import Link from "next/link";
import type { Post } from "../types";

/**
 * 노리는 검색어: 엑셀 금액 한글 변환 함수, NUMBERSTRING, 엑셀 숫자 한글 표시 셀 서식, DBNum4
 * 금액 한글 페이지(/amount/)는 '숫자 한글 변환·금액 한글 표기'를 노리므로 여기서는 엑셀 안에서 하는 방법을 다룬다.
 */
export const excelAmountKorean: Post = {
  meta: {
    slug: "excel-amount-korean",
    title: "엑셀 금액 한글로 표시하기 - NUMBERSTRING 함수와 셀 서식",
    h1: "엑셀 금액 한글로 표시하기: NUMBERSTRING 함수와 셀 서식",
    description:
      "견적서·계약서에 들어갈 '일금 ○○원정'을 엑셀에서 바로 만드는 두 가지 방법을 정리했습니다. 숨은 함수 NUMBERSTRING, 값은 숫자로 두고 보기만 바꾸는 [DBNum4] 셀 서식, 원 미만 금액과 합계에서 주의할 점까지 다룹니다.",
    keywords: [
      "엑셀 금액 한글 변환 함수",
      "엑셀 NUMBERSTRING",
      "엑셀 숫자 한글로 표시",
      "엑셀 금액 한글 셀 서식",
      "DBNum4",
      "엑셀 일금 원정",
    ],
    published: "2026-10-18",
    tool: "amount",
    excerpt:
      "견적서 합계 칸 옆에 '일금 ○○원정'을 자동으로 띄우는 방법입니다. NUMBERSTRING 함수와 셀 서식의 차이, 원 미만 금액 처리까지 정리했습니다.",
    toc: [
      { id: "two-ways", title: "함수와 셀 서식, 무엇이 다른가" },
      { id: "numberstring", title: "NUMBERSTRING 함수" },
      { id: "format", title: "셀 서식 [DBNum4]" },
      { id: "pitfalls", title: "자주 틀리는 부분" },
      { id: "paste", title: "엑셀 밖에서 한 번에 바꾸기" },
      { id: "summary", title: "정리" },
    ],
  },
  Body() {
    return (
      <>
        <p>
          견적서나 계약서에는 금액을 숫자와 함께 「일금 일백이십삼만사천오백육십칠원정」처럼 한글로도 적습니다. 숫자 한두
          자리를 고쳐 금액을 바꾸지 못하게 하려는 관행입니다. 엑셀로 견적서를 만든다면 합계 칸이 바뀔 때마다 한글 금액을
          손으로 다시 적을 필요 없이, 엑셀이 자동으로 만들게 할 수 있습니다.
        </p>

        <h2 id="two-ways">함수와 셀 서식, 무엇이 다른가</h2>
        <p>방법은 두 가지입니다. 결과가 글자인지 숫자인지가 다릅니다.</p>
        <div className="postTableWrap">
          <table className="postTable">
            <thead>
              <tr>
                <th scope="col"></th>
                <th scope="col">NUMBERSTRING 함수</th>
                <th scope="col">셀 서식 [DBNum4]</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">결과</th>
                <td>글자(텍스트)</td>
                <td>값은 숫자 그대로, 보이는 모양만 한글</td>
              </tr>
              <tr>
                <th scope="row">어디에</th>
                <td>합계 칸 옆의 다른 칸</td>
                <td>합계 칸 자체</td>
              </tr>
              <tr>
                <th scope="row">다른 글자와 이어 붙이기</th>
                <td>&amp;로 자유롭게</td>
                <td>서식 코드 안에서만</td>
              </tr>
              <tr>
                <th scope="row">그 칸으로 계산</th>
                <td>안 됨</td>
                <td>됨</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          숫자 합계는 그대로 두고 아래 칸에 한글 금액을 따로 적는 양식이면 함수, 합계 칸 하나만 한글로 보이게 하면 되는
          양식이면 셀 서식이 편합니다.
        </p>

        <h2 id="numberstring">NUMBERSTRING 함수</h2>
        <p>
          NUMBERSTRING은 숫자를 한글이나 한자로 바꾸는 함수입니다. 한국어 엑셀에 들어 있지만 함수 목록과 자동 완성에는
          나오지 않아서, 이름을 끝까지 직접 입력해야 합니다. 입력 중에 안내가 뜨지 않아도 정상입니다.
        </p>
        <pre className="postCode">
          <code>{`=NUMBERSTRING(숫자, 유형)`}</code>
        </pre>
        <div className="postTableWrap">
          <table className="postTable">
            <thead>
              <tr>
                <th scope="col">수식 (A2 = 1234567)</th>
                <th scope="col">결과</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>=NUMBERSTRING(A2, 1)</code>
                </td>
                <td>일백이십삼만사천오백육십칠</td>
              </tr>
              <tr>
                <td>
                  <code>=NUMBERSTRING(A2, 2)</code>
                </td>
                <td>같은 금액을 한자로</td>
              </tr>
              <tr>
                <td>
                  <code>=NUMBERSTRING(A2, 3)</code>
                </td>
                <td>일이삼사오육칠 (숫자를 한 자씩)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          금액 표기에는 유형 1을 씁니다. 앞뒤에 &lsquo;일금&rsquo;과 &lsquo;원정&rsquo;을 &amp;로 붙이고, 괄호 안에 숫자도
          같이 적으려면 TEXT 함수로 천 단위 쉼표를 넣습니다.
        </p>
        <pre className="postCode">
          <code>{`="일금 "&NUMBERSTRING(A2, 1)&"원정"
→ 일금 일백이십삼만사천오백육십칠원정

="일금 "&NUMBERSTRING(A2, 1)&"원정 (₩"&TEXT(A2, "#,##0")&")"
→ 일금 일백이십삼만사천오백육십칠원정 (₩1,234,567)`}</code>
        </pre>

        <h2 id="format">셀 서식 [DBNum4]</h2>
        <p>
          합계 칸에 숫자는 그대로 두고 화면과 인쇄에서만 한글로 보이게 하는 방법입니다. 합계 칸을 선택하고 Ctrl+1(셀 서식)
          → [표시 형식] → [사용자 지정]에서 &lsquo;형식&rsquo; 칸에 아래 코드를 넣습니다.
        </p>
        <pre className="postCode">
          <code>{`[DBNum4][$-ko-KR]G/표준
→ 987654321 이 구억팔천칠백육십오만사천삼백이십일 로 보임

[DBNum4][$-ko-KR]"일금 "G/표준"원정"
→ 일금 구억팔천칠백육십오만사천삼백이십일원정`}</code>
        </pre>
        <p>
          큰따옴표 안의 글자는 그대로 앞뒤에 붙습니다. 칸에 들어 있는 값은 여전히 987654321이라서, 이 칸을 다른 수식에서
          더하거나 부가세를 계산해도 문제가 없습니다. 숫자 병기까지 한 칸에 넣기는 어려우니, 숫자는 옆 칸에 따로 두는 편이
          깔끔합니다.
        </p>

        <h2 id="pitfalls">자주 틀리는 부분</h2>
        <h3>원 미만이 있는 금액</h3>
        <p>
          부가세를 =A2*0.1처럼 계산하면 1,234.5원 같은 소수가 생깁니다. NUMBERSTRING은 원 단위 정수를 바꾸는 함수라
          소수가 있으면 원하는 결과가 나오지 않습니다. 한글로 바꾸기 전에 원 미만을 정리하세요. 견적서에서는 보통 원 미만을
          버립니다.
        </p>
        <pre className="postCode">
          <code>{`="일금 "&NUMBERSTRING(ROUNDDOWN(A2, 0), 1)&"원정"`}</code>
        </pre>
        <p>
          셀 서식을 쓰는 경우에도 합계 칸에 소수가 남아 있으면 한글 금액이 어색하게 보이고, 인쇄한 금액과 실제 값이 어긋날
          수 있습니다. 합계를 만드는 수식 쪽에서 =ROUNDDOWN(SUM(D2:D20), 0)처럼 먼저 자르는 것이 안전합니다.
        </p>

        <h3>한글 금액 칸을 합계에 넣지 않기</h3>
        <p>
          NUMBERSTRING 결과는 글자라서 SUM 범위에 들어가면 건너뛰고, +로 더하면 #VALUE! 오류가 납니다. 합계와 세금
          계산은 항상 원래 숫자 칸으로 하고, 한글 금액 칸은 보여 주는 용도로만 씁니다.
        </p>

        <h3>다른 사람 컴퓨터에서 다르게 보일 때</h3>
        <p>
          두 방법 모두 한국어 엑셀 기준입니다. 영문 엑셀이나 다른 프로그램에서 파일을 열면 NUMBERSTRING이 오류를 내거나
          셀 서식이 숫자로 보일 수 있습니다. 견적서를 보낼 때는 PDF로 저장해서 보내면 받는 사람 환경과 관계없이 그대로
          보입니다.
        </p>

        <h2 id="paste">엑셀 밖에서 한 번에 바꾸기</h2>
        <p>
          함수를 넣을 양식이 아니라 금액 목록을 한 번에 한글로 바꿔야 할 때는{" "}
          <Link href="/amount/">숫자 한글 변환</Link> 도구를 쓸 수 있습니다. 엑셀에서 금액 열을 복사해 붙여넣으면 줄마다
          &lsquo;일금 ○○원정&rsquo;으로 바꾸고, 결과를 복사해 옆 열에 붙여넣으면 줄이 그대로 맞습니다. 쉼표나 &lsquo;원&rsquo;이
          붙은 금액도 알아서 읽고, 한자 갖은자(壹·貳·參) 표기와 ₩ 숫자 병기도 고를 수 있습니다.
        </p>
        <p>
          견적서 자체를 만들어야 한다면 <Link href="/estimate/">견적서 양식 작성</Link>에서 품목을 붙여넣으면 부가세와
          합계, 한글 금액까지 한 장에 채워집니다.
        </p>

        <h2 id="summary">정리</h2>
        <ul>
          <li>합계 옆 칸에 글자로: =&quot;일금 &quot;&amp;NUMBERSTRING(A2, 1)&amp;&quot;원정&quot;</li>
          <li>합계 칸 자체를 한글로 보이게: 셀 서식 [DBNum4][$-ko-KR]&quot;일금 &quot;G/표준&quot;원정&quot;</li>
          <li>NUMBERSTRING은 목록에 안 나오는 함수라 직접 입력합니다.</li>
          <li>원 미만은 ROUNDDOWN으로 먼저 자르고, 계산은 항상 원래 숫자 칸으로 합니다.</li>
        </ul>
      </>
    );
  },
};

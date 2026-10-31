import Link from "next/link";
import type { Post } from "../types";

/**
 * 노리는 검색어: 엑셀 두 목록 비교, 엑셀 두 열 비교 없는 값 찾기, 엑셀 명단 대조, 엑셀 미제출자 찾기, COUNTIF 비교
 * 중복 제거 페이지(/dedupe/)는 '한 목록 안의 중복'을 노리므로 여기서는 '두 목록 사이의 차이'를 다룬다.
 * 예시: 전체 5명 중 제출 3명 → 미제출 박준호·정하늘.
 * 2026-10-31 보강: '두 열 비교'·'일치하는 값 찾기'(반대 의도) 구간과 VLOOKUP·XLOOKUP 방식 추가(서치 콘솔 검색어 '엑셀 두 열 비교 없는 값 찾기' 반영).
 */
export const excelCompareLists: Post = {
  meta: {
    slug: "excel-compare-lists",
    title: "엑셀 두 목록 비교해서 없는 값 찾기 - COUNTIF·FILTER",
    h1: "엑셀 두 목록 비교해서 없는 값 찾기: 미제출자·누락 코드 골라내기",
    description:
      "전체 명단과 제출자 명단처럼 두 목록을 비교해 한쪽에만 있는 값을 찾는 방법을 정리했습니다. COUNTIF로 표시하기, 조건부 서식으로 색칠하기, FILTER로 빠진 값만 뽑기, 공백·숫자 형식 때문에 못 찾는 경우까지 다룹니다.",
    keywords: [
      "엑셀 두 목록 비교",
      "엑셀 두 열 비교 없는 값",
      "엑셀 명단 대조",
      "엑셀 미제출자 찾기",
      "엑셀 COUNTIF 비교",
      "엑셀 FILTER 없는 값",
    ],
    published: "2026-10-25",
    updated: "2026-10-31",
    tool: "dedupe",
    excerpt:
      "전체 명단에는 있는데 제출 명단에는 없는 사람, 지난달에는 있었는데 이번 달에 빠진 상품코드를 찾는 방법입니다. COUNTIF 한 줄부터 FILTER까지.",
    toc: [
      { id: "setup", title: "예시: 전체 명단과 제출 명단" },
      { id: "countif", title: "두 열 비교: COUNTIF로 '없음' 표시하기" },
      { id: "highlight", title: "조건부 서식으로 색칠하기" },
      { id: "filter", title: "FILTER로 빠진 값만 뽑기" },
      { id: "match", title: "일치하는 값 찾기: VLOOKUP·XLOOKUP" },
      { id: "pitfalls", title: "있는데 못 찾을 때" },
      { id: "paste", title: "붙여넣기로 한 번에 보기" },
      { id: "summary", title: "정리" },
    ],
  },
  Body() {
    return (
      <>
        <p>
          교육 신청자와 실제 수료자, 전체 직원과 서류 제출자, 지난달 상품 목록과 이번 달 상품 목록. 두 목록을 놓고 &ldquo;한쪽에만
          있는 값&rdquo;을 찾아야 할 때가 자주 있습니다. 눈으로 하나씩 대조하면 수십 줄만 넘어도 빠뜨리기 쉽습니다. 엑셀에서는
          COUNTIF 하나로 시작할 수 있습니다.
        </p>

        <h2 id="setup">예시: 전체 명단과 제출 명단</h2>
        <p>A열에 전체 명단, C열에 서류를 낸 사람 명단이 있다고 하겠습니다. 찾고 싶은 것은 A열에는 있지만 C열에는 없는 사람입니다.</p>
        <div className="postTableWrap">
          <table className="postTable">
            <thead>
              <tr>
                <th scope="col">A열 (전체)</th>
                <th scope="col">C열 (제출)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>김민수</td>
                <td>이서연</td>
              </tr>
              <tr>
                <td>이서연</td>
                <td>최지우</td>
              </tr>
              <tr>
                <td>박준호</td>
                <td>김민수</td>
              </tr>
              <tr>
                <td>최지우</td>
                <td></td>
              </tr>
              <tr>
                <td>정하늘</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          답은 박준호와 정하늘입니다. 순서가 서로 달라서 옆 칸끼리 =A2=C2처럼 비교하면 맞지 않습니다. &ldquo;이 값이 상대
          목록 어딘가에 있느냐&rdquo;를 물어야 합니다.
        </p>

        <h2 id="countif">두 열 비교: COUNTIF로 &lsquo;없음&rsquo; 표시하기</h2>
        <p>B2에 아래 수식을 넣고 아래로 채웁니다.</p>
        <pre className="postCode">
          <code>{`=IF(COUNTIF($C$2:$C$100, A2)=0, "없음", "")`}</code>
        </pre>
        <p>
          COUNTIF는 C열에 A2와 같은 값이 몇 개 있는지 셉니다. 0이면 C열에 없다는 뜻이라 &lsquo;없음&rsquo;을 적습니다. 범위에
          $를 붙여야 아래로 채워도 C열 범위가 밀리지 않습니다. 범위는 실제 명단보다 넉넉하게 잡아 두면 제출자가 늘어도 그대로 쓸 수
          있습니다.
        </p>
        <p>
          반대 방향, 즉 제출 명단에는 있는데 전체 명단에는 없는 사람(오타나 외부 인원)을 찾으려면 D열에
          =IF(COUNTIF($A$2:$A$100, C2)=0, &quot;없음&quot;, &quot;&quot;)처럼 범위와 기준만 바꿔 넣습니다. 두 방향을 다 확인해야
          빠진 사람과 잘못 들어간 사람을 모두 찾을 수 있습니다.
        </p>
        <p>
          MATCH를 쓰는 방법도 있습니다. =ISNA(MATCH(A2, $C$2:$C$100, 0))는 C열에서 A2를 못 찾으면 TRUE가 됩니다. 결과는 같고,
          COUNTIF 쪽이 읽기 쉽습니다.
        </p>

        <h2 id="highlight">조건부 서식으로 색칠하기</h2>
        <p>표시 열을 따로 만들고 싶지 않다면 A열에 바로 색을 칠할 수 있습니다.</p>
        <ol>
          <li>A2:A100을 선택합니다.</li>
          <li>[홈] → [조건부 서식] → [새 규칙] → &lsquo;수식을 사용하여 서식을 지정할 셀 결정&rsquo;</li>
          <li>
            수식 칸에 <code>=COUNTIF($C$2:$C$100, A2)=0</code>을 넣고 색을 고릅니다.
          </li>
        </ol>
        <p>
          C열에 없는 이름에만 색이 칠해집니다. 제출자가 C열에 추가되면 색이 바로 사라져서, 마감 전까지 계속 띄워 두고 확인하기
          좋습니다. A열 빈 칸에도 색이 칠해진다면 수식을 <code>=AND(A2&lt;&gt;&quot;&quot;, COUNTIF($C$2:$C$100, A2)=0)</code>로
          바꾸세요.
        </p>

        <h2 id="filter">FILTER로 빠진 값만 뽑기</h2>
        <p>Microsoft 365와 엑셀 2021 이상에서는 빠진 사람만 한 번에 목록으로 뽑을 수 있습니다.</p>
        <pre className="postCode">
          <code>{`=FILTER(A2:A100, (A2:A100<>"")*(COUNTIF(C2:C100, A2:A100)=0), "모두 제출")

→ 박준호
   정하늘`}</code>
        </pre>
        <p>
          COUNTIF에 A열 범위를 통째로 넣으면 이름마다 C열 개수를 한 번에 셉니다. 그중 0인 행만 FILTER가 골라 아래로
          펼칩니다. 앞의 (A2:A100&lt;&gt;&quot;&quot;)는 비어 있는 행을 빼는 조건이고, 마지막 &quot;모두 제출&quot;은 빠진 사람이
          없을 때 보여 줄 문구입니다. 이 결과를 복사해 독촉 메일 받는 사람 칸에 붙이면 됩니다.
        </p>

        <h2 id="match">일치하는 값 찾기: VLOOKUP·XLOOKUP</h2>
        <p>
          반대로 두 목록에 <em>같이 있는</em> 값(일치하는 값)을 찾거나, 일치한 행의 값을 옆에 가져와야 할 때는 조회 함수를
          씁니다. 위 예시에서 B2에 아래 중 하나를 넣고 아래로 채우면 C열에 있는 이름은 그대로, 없는 이름은 &lsquo;없음&rsquo;이
          나옵니다.
        </p>
        <pre className="postCode">
          <code>{`=IFERROR(VLOOKUP(A2, $C$2:$C$100, 1, FALSE), "없음")

=XLOOKUP(A2, $C$2:$C$100, $C$2:$C$100, "없음")`}</code>
        </pre>
        <p>
          VLOOKUP은 모든 엑셀 버전에서 쓸 수 있고, XLOOKUP은 Microsoft 365와 엑셀 2021 이상에서 쓸 수 있습니다. 두 식 모두
          A2와 같은 값을 C열에서 찾아 그 값을 돌려주고, 찾지 못하면 &lsquo;없음&rsquo;을 보여 줍니다. 결과가 &lsquo;없음&rsquo;이 아닌
          행이 일치하는 값입니다. 목록 두 개의 오른쪽 열 값(예: 제출 날짜)을 가져오려면 VLOOKUP의 세 번째 인수나 XLOOKUP의
          반환 범위를 그 열로 바꾸세요.
        </p>

        <h2 id="pitfalls">있는데 못 찾을 때</h2>
        <h3>앞뒤 공백</h3>
        <p>
          &ldquo;김민수&rdquo;와 &ldquo;김민수 &rdquo;(뒤에 공백)는 다른 값입니다. 다른 시스템에서 내려받은 명단에 자주 섞여 있습니다.
          두 열 모두 =TRIM(A2)로 정리한 열을 만들어 그 열끼리 비교하세요.
        </p>
        <h3>숫자와 텍스트</h3>
        <p>
          사번이나 상품코드가 한쪽에서는 숫자(10234), 다른 쪽에서는 텍스트(&apos;10234)로 들어가 있으면 MATCH는 서로 다른 값으로 봅니다.
          COUNTIF로 비교하거나, 열 전체를 선택해 [데이터] → [텍스트 나누기] → [마침]으로 형식을 맞춘 뒤 비교하세요.
        </p>
        <h3>이름으로 비교할 때</h3>
        <p>
          동명이인이 있으면 이름만으로는 누가 빠졌는지 정확히 가릴 수 없습니다. 사번, 학번, 연락처처럼 사람마다 하나뿐인 값이 있다면
          그 열로 비교하는 편이 안전합니다.
        </p>

        <h2 id="paste">붙여넣기로 한 번에 보기</h2>
        <p>
          수식을 넣기 번거로우면 <Link href="/dedupe/">엑셀 중복 제거</Link>를 이렇게 쓸 수 있습니다. 두 목록을 한 열에 이어
          붙여넣고 결과를 &lsquo;개수 세기&rsquo;로 바꾸면, 값마다 몇 번 나왔는지가 옆에 붙습니다. 각 목록 안에 같은 값이 두 번
          들어 있지 않다면 1은 한쪽에만 있는 값, 2는 양쪽에 다 있는 값입니다. &lsquo;중복된 값만&rsquo;을 고르면 양쪽에 다 있는 값만
          모아 볼 수 있습니다. 앞뒤 공백 무시 옵션이 기본으로 켜져 있어 위의 공백 문제도 함께 걸러집니다.
        </p>
        <p>
          두 목록이 한 칸에 쉼표로 이어져 있다면 먼저 <Link href="/split/">쉼표를 줄바꿈으로 변환</Link>으로 한 줄에 하나씩
          풀어 두고 비교하세요.
        </p>
        <p>
          이 방법은 어느 쪽 목록에서 빠졌는지는 알려 주지 않으니, 개수가 1인 값을 보고 원래 목록에서 확인하세요. 어느 쪽에 없는지까지
          바로 알아야 한다면 위의 COUNTIF 방법이 맞습니다.
        </p>

        <h2 id="summary">정리</h2>
        <ul>
          <li>A에는 있고 C에는 없는 값: =IF(COUNTIF($C$2:$C$100, A2)=0, &quot;없음&quot;, &quot;&quot;)</li>
          <li>반대 방향도 범위만 바꿔 한 번 더 확인</li>
          <li>색으로 보기: 조건부 서식 수식 =COUNTIF($C$2:$C$100, A2)=0</li>
          <li>빠진 값만 목록으로: =FILTER(A2:A100, (A2:A100&lt;&gt;&quot;&quot;)*(COUNTIF(C2:C100, A2:A100)=0))</li>
          <li>일치하는 값 찾기: =IFERROR(VLOOKUP(A2, $C$2:$C$100, 1, FALSE), &quot;없음&quot;) 또는 XLOOKUP</li>
          <li>공백·숫자 형식·동명이인은 비교 전에 정리</li>
        </ul>
      </>
    );
  },
};

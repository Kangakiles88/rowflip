import Link from "next/link";
import type { Post } from "../types";

/**
 * 노리는 검색어: 엑셀 성 이름 분리, 엑셀 성 이름 나누기, 엑셀 이름에서 성만, 엑셀 복성 분리, 엑셀 영문 이름 성 이름 분리
 * /cell-split/ 대표 검색어(엑셀 셀 나누기)와 겹치지 않게 '이름' 한 가지 사례의 함수·예외(복성·외자·띄어쓴 이름·영문)를 다룬다.
 * 예시는 파이썬과 사이트 utils(cellSplit splitValue)로 확인:
 *   김민수 → 김|민수, 남궁민수 → 남궁|민수(복성 규칙), 황보람 → 황|보람 + '확인', 김 민수 → 김|민수, 이구 → 이|구
 *   Minsu Kim → Minsu|Kim. 셀 나누기 '글자 수 1'은 남궁민수 → 남|궁민수, 띄어쓰기 기준은 남궁 민수 → 남궁|민수.
 */
export const excelNameSplit: Post = {
  meta: {
    slug: "excel-name-split",
    title: "엑셀 성 이름 분리하기 - 복성·외자·영문 이름까지",
    h1: "엑셀 성 이름 분리하기: LEFT·MID 기본 수식과 남궁·황보 같은 복성 처리",
    description:
      "엑셀 이름 열에서 성과 이름을 나누는 수식을 정리했습니다. LEFT·MID 기본 수식, 남궁·황보 같은 복성 처리, 띄어 쓴 이름과 외자 이름, 영문 이름(Minsu Kim)까지 예외별로 다룹니다.",
    keywords: [
      "엑셀 성 이름 분리",
      "엑셀 성 이름 나누기",
      "엑셀 이름에서 성만",
      "엑셀 복성 분리",
      "엑셀 영문 이름 분리",
    ],
    published: "2026-11-05",
    tool: "cellsplit",
    excerpt:
      "LEFT(A2,1)이면 끝날 것 같은 성 이름 분리, 남궁민수·황보람·띄어 쓴 이름·영문 이름에서 틀어집니다. 예외별 수식입니다.",
    toc: [
      { id: "basic", title: "기본: 성은 LEFT, 이름은 MID" },
      { id: "compound", title: "남궁·황보 같은 복성" },
      { id: "check", title: "세 글자인데 복성처럼 보일 때" },
      { id: "space", title: "띄어 쓴 이름·외자 이름" },
      { id: "english", title: "영문 이름(Minsu Kim)" },
      { id: "no-formula", title: "수식 없이 나누기" },
      { id: "summary", title: "정리" },
    ],
  },
  Body() {
    return (
      <>
        <p>
          회원 명단이나 인사 자료를 시스템에 올릴 때 &lsquo;성&rsquo;과 &lsquo;이름&rsquo; 칸을 따로 달라는 경우가 있습니다. 한국 이름은 대부분 첫 글자가
          성이라 수식 하나로 끝날 것 같지만, 명단이 길어지면 복성·띄어 쓴 이름·영문 이름이 섞여 몇 줄씩 틀어집니다. A열에 이름이 있다고 보고
          예외까지 차례로 정리했습니다.
        </p>

        <h2 id="basic">기본: 성은 LEFT, 이름은 MID</h2>
        <pre className="postCode">
          <code>{`B2 (성):   =LEFT(A2, 1)
C2 (이름): =MID(A2, 2, 20)

김민수 → 김 | 민수
이구   → 이 | 구`}</code>
        </pre>
        <p>
          MID의 마지막 20은 &lsquo;넉넉하게 끝까지&rsquo;라는 뜻입니다. 남은 글자보다 크게 적어도 오류 없이 있는 만큼만 가져옵니다.
          =RIGHT(A2, LEN(A2)-1)로 써도 같습니다. 이구처럼 두 글자 외자 이름도 이 수식으로 맞게 나뉩니다.
        </p>

        <h2 id="compound">남궁·황보 같은 복성</h2>
        <p>
          남궁민수를 위 수식으로 나누면 &lsquo;남 | 궁민수&rsquo;가 됩니다. 복성 목록을 F2:F9에 적어 두고, 앞 두 글자가 목록에 있으면 두 글자를 성으로
          가져옵니다.
        </p>
        <div className="postTableWrap">
          <table className="postTable">
            <thead>
              <tr>
                <th scope="col">F열 복성 목록(예)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>남궁 · 황보 · 제갈 · 선우 · 독고 · 사공 · 서문 · 동방</td>
              </tr>
            </tbody>
          </table>
        </div>
        <pre className="postCode">
          <code>{`B2 (성):   =IF(AND(LEN(A2)>=4, COUNTIF($F$2:$F$9, LEFT(A2, 2))), LEFT(A2, 2), LEFT(A2, 1))
C2 (이름): =MID(A2, LEN(B2)+1, 20)

남궁민수 → 남궁 | 민수
선우재덕 → 선우 | 재덕`}</code>
        </pre>
        <p>
          이름 쪽은 성의 글자 수(LEN(B2)) 다음부터 가져오게 바꿔서, 성이 한 글자든 두 글자든 같은 수식을 씁니다. 목록은 회사 명단에 실제로 나오는
          성만 적어도 충분하고, 새 복성이 나오면 아래에 한 줄 더 적으면 됩니다($F$2:$F$9 범위도 함께 늘리기).
        </p>

        <h2 id="check">세 글자인데 복성처럼 보일 때</h2>
        <p>
          위 수식에 LEN(A2)&gt;=4 조건을 넣은 이유가 있습니다. 황보람은 &lsquo;황 + 보람&rsquo;일 수도, &lsquo;황보 + 람&rsquo;일 수도 있습니다. 글자만으로는
          알 수 없으니 세 글자는 한 글자 성으로 나누고, 확인할 줄만 표시해 둡니다.
        </p>
        <pre className="postCode">
          <code>{`D2 (확인): =IF(AND(LEN(A2)=3, COUNTIF($F$2:$F$9, LEFT(A2, 2))), "확인", "")

황보람 → 황 | 보람 | 확인`}</code>
        </pre>
        <p>D열을 필터로 &lsquo;확인&rsquo;만 골라 원래 자료(주민등록상 성명, 본인 확인)와 대조하면 몇 줄만 손으로 고치면 됩니다.</p>

        <h2 id="space">띄어 쓴 이름·외자 이름</h2>
        <p>
          &lsquo;김 민수&rsquo;처럼 성과 이름 사이를 띄어 쓴 줄이 섞여 있으면 LEFT·MID가 띄어쓰기까지 글자로 세어 이름 칸 앞에 공백이 붙습니다.
          A2 대신 SUBSTITUTE(A2, &quot; &quot;, &quot;&quot;)로 공백을 먼저 지우고 나눕니다. Microsoft 365에서는 LET으로 한 번만 적을 수 있습니다.
        </p>
        <pre className="postCode">
          <code>{`B2 (성): =LET(n, SUBSTITUTE(A2, " ", ""),
            IF(AND(LEN(n)>=4, COUNTIF($F$2:$F$9, LEFT(n, 2))), LEFT(n, 2), LEFT(n, 1)))
C2 (이름): =MID(SUBSTITUTE(A2, " ", ""), LEN(B2)+1, 20)

김 민수   → 김 | 민수
남궁 민수 → 남궁 | 민수`}</code>
        </pre>
        <p>
          LET이 없는 버전이라면 E열에 =SUBSTITUTE(A2, &quot; &quot;, &quot;&quot;)로 공백 없는 이름을 먼저 만들고, 위 수식의 A2를 E2로 바꿔 쓰면 됩니다.
        </p>

        <h2 id="english">영문 이름(Minsu Kim)</h2>
        <p>영문 이름은 글자 수가 아니라 띄어쓰기 위치로 나눕니다. 보통 앞이 이름, 뒤가 성입니다.</p>
        <pre className="postCode">
          <code>{`이름(First): =LEFT(A2, FIND(" ", A2)-1)
성(Last):    =MID(A2, FIND(" ", A2)+1, 50)

Minsu Kim → Minsu | Kim`}</code>
        </pre>
        <p>
          띄어쓰기가 없는 칸에서는 FIND가 #VALUE!를 내므로, 한글·영문이 섞인 명단이면 =IFERROR(&hellip;, A2)로 감싸 두세요. &lsquo;KIM Minsu&rsquo;처럼 성을
          앞에 쓴 명단은 앞뒤가 반대이니 먼저 몇 줄 눈으로 확인합니다. 가운데 이름(Minsu J. Kim)이 있으면 위 수식은 첫 띄어쓰기에서만 나눕니다.
        </p>

        <h2 id="no-formula">수식 없이 나누기</h2>
        <p>
          한 번만 나누면 되는 명단이라면 첫 줄에 &lsquo;김&rsquo;을 직접 쓰고 Ctrl+E(빠른 채우기)를 눌러도 됩니다. 다만 복성은 규칙을 알아채지 못해 남궁민수가
          &lsquo;남&rsquo;으로 채워질 수 있으니 결과를 훑어봐야 합니다.
        </p>
        <p>
          엑셀 밖에서 하려면 이름 열을 복사해 <Link href="/cell-split/">엑셀 셀 나누기</Link>에 붙여넣고 나눌 기준을 &lsquo;글자 수&rsquo;, 칸에 1을 넣습니다.
          김민수는 &lsquo;김 | 민수&rsquo;로 나오지만 남궁민수는 &lsquo;남 | 궁민수&rsquo;가 되니, 복성이 섞인 명단은 위 수식이 낫습니다. &lsquo;남궁 민수&rsquo;처럼
          성과 이름이 띄어 쓰여 있다면 기준을 &lsquo;띄어쓰기&rsquo;로 두면 &lsquo;남궁 | 민수&rsquo;로 나뉩니다.
        </p>

        <h2 id="summary">정리</h2>
        <ul>
          <li>기본: 성 =LEFT(A2, 1), 이름 =MID(A2, 2, 20)</li>
          <li>복성: 목록을 만들고 COUNTIF(목록, LEFT(A2, 2))로 확인, 네 글자 이상일 때만 두 글자 성</li>
          <li>이름 칸은 =MID(A2, LEN(성 칸)+1, 20)으로 성 길이에 맞춤</li>
          <li>세 글자 + 복성 모양(황보람)은 &lsquo;확인&rsquo; 표시 후 원자료와 대조</li>
          <li>띄어 쓴 이름은 SUBSTITUTE로 공백부터 지우기, 영문 이름은 FIND(&quot; &quot;)로 나누기</li>
        </ul>
      </>
    );
  },
};

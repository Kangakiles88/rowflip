import Link from "next/link";
import type { Post } from "../types";

/**
 * 노리는 검색어: 엑셀 출석부 만들기, 엑셀 출석률 계산, 엑셀 출석 체크, 엑셀 지각 결석 개수, 엑셀 출석부 COUNTIF
 * /functions/countif/(형식·비교·빈칸·중복·와일드카드·COUNTIFS)와 겹치지 않게 출석부 한 장을 처음부터 만드는 흐름을 다룬다.
 * 예시는 파이썬으로 확인: 5명 × 5일, 김민수 O4 △1 X0 출석률 100%(지각 포함)·80%(O만),
 *   이서연 4/0/1 80%, 박준호 1/2/2 60%, 최지우 5/0/0 100%, 정하늘 2/0/3 40%·결석 3회 '주의'.
 *   날짜별 O 인원 3,3,4,2,4 / X 인원 1,1,1,2,1.
 */
export const excelAttendance: Post = {
  meta: {
    slug: "excel-attendance",
    title: "엑셀 출석부 만들기 - 출석·지각·결석 개수와 출석률",
    h1: "엑셀 출석부 만들기: COUNTIF로 출석·지각·결석 개수와 출석률 자동 계산",
    description:
      "엑셀로 출석부를 만들어 사람별 출석·지각·결석 횟수와 출석률, 날짜별 출석 인원을 COUNTIF로 자동 계산하는 방법입니다. 목록 선택 입력, 결석 3회 경고, 결석 칸 색칠까지 한 장에 정리했습니다.",
    keywords: ["엑셀 출석부 만들기", "엑셀 출석률 계산", "엑셀 출석 체크", "엑셀 지각 결석 개수", "출석부 COUNTIF"],
    published: "2026-11-22",
    tool: "fn-countif",
    excerpt:
      "O·△·X만 입력하면 사람별 출석·지각·결석 횟수, 출석률, 날짜별 출석 인원이 자동으로 나오는 출석부를 COUNTIF로 만듭니다.",
    toc: [
      { id: "layout", title: "표 모양 정하기" },
      { id: "input", title: "O·△·X만 고르게 하기" },
      { id: "count", title: "사람별 출석·지각·결석 횟수" },
      { id: "rate", title: "출석률 계산" },
      { id: "daily", title: "날짜별 출석 인원" },
      { id: "warn", title: "결석 3회 이상 표시" },
      { id: "summary", title: "정리" },
    ],
  },
  Body() {
    return (
      <>
        <p>
          교육·스터디·학원 출석을 종이에 체크하고 월말에 다시 세는 일은 엑셀로 옮기면 한 번에 끝납니다. 칸에 O·△·X만 입력하면 횟수와 출석률이 알아서
          바뀌는 출석부를 COUNTIF 하나로 만들어 보겠습니다. COUNTIF의 형식과 조건 쓰는 법은{" "}
          <Link href="/functions/countif/">COUNTIF 함수 사용법</Link>에서 예제 표로 바로 연습할 수 있습니다.
        </p>

        <h2 id="layout">표 모양 정하기</h2>
        <p>
          사람은 아래로(행), 날짜는 옆으로(열) 놓습니다. 날짜 오른쪽에 집계 열을 두고, 맨 아래에 날짜별 집계 행을 둡니다. 출석 O, 지각 △, 결석 X로 적기로
          정합니다.
        </p>
        <div className="postTableWrap">
          <table className="postTable">
            <thead>
              <tr>
                <th scope="col">A 이름</th>
                <th scope="col">B 11/3</th>
                <th scope="col">C 11/4</th>
                <th scope="col">D 11/5</th>
                <th scope="col">E 11/6</th>
                <th scope="col">F 11/7</th>
                <th scope="col">G 출석</th>
                <th scope="col">H 지각</th>
                <th scope="col">I 결석</th>
                <th scope="col">J 출석률</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["김민수", "O", "O", "O", "△", "O", "4", "1", "0", "100%"],
                ["이서연", "O", "X", "O", "O", "O", "4", "0", "1", "80%"],
                ["박준호", "△", "△", "O", "X", "X", "1", "2", "2", "60%"],
                ["최지우", "O", "O", "O", "O", "O", "5", "0", "0", "100%"],
                ["정하늘", "X", "O", "X", "X", "O", "2", "0", "3", "40%"],
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
        <p>이름은 A2:A6, 출석 기록은 B2:F6입니다. G~J열이 이 글에서 만드는 수식입니다.</p>

        <h2 id="input">O·△·X만 고르게 하기</h2>
        <p>
          여러 사람이 입력하면 &lsquo;o&rsquo;, &lsquo;0&rsquo;, &lsquo;ㅇ&rsquo;이 섞여 COUNTIF가 세지 못합니다. 영문 o는 대소문자를 구분하지 않아 세어지지만 숫자 0과 한글
          ㅇ은 다른 값입니다. 입력 칸을 목록에서만 고르게 막아 두면 이런 일이 없습니다.
        </p>
        <ol>
          <li>B2:F6을 선택하고 [데이터] → [데이터 유효성 검사]를 엽니다.</li>
          <li>제한 대상을 &lsquo;목록&rsquo;으로 바꾸고 원본 칸에 O,△,X를 쉼표로 이어 적습니다.</li>
          <li>[확인]을 누르면 칸마다 목록 단추가 생기고, 목록에 없는 값은 입력되지 않습니다.</li>
        </ol>

        <h2 id="count">사람별 출석·지각·결석 횟수</h2>
        <pre className="postCode">
          <code>{`G2 (출석): =COUNTIF($B2:$F2, "O")    → 4
H2 (지각): =COUNTIF($B2:$F2, "△")    → 1
I2 (결석): =COUNTIF($B2:$F2, "X")    → 0`}</code>
        </pre>
        <p>
          G2:I2를 아래로 채우면 다섯 명 모두 계산됩니다. 범위의 열 앞에만 $를 붙인 $B2:$F2는 아래로 채울 때 행만 바뀌고 B~F열은 그대로 유지됩니다. 기호를
          수식에 직접 적는 대신 G1·H1·I1 머리글에 O·△·X를 적어 두고 =COUNTIF($B2:$F2, G$1)로 쓰면, 수식 하나를 옆과 아래로 모두 채울 수 있습니다.
        </p>

        <h2 id="rate">출석률 계산</h2>
        <p>지각을 출석으로 칠지 먼저 정합니다. 수업 일수는 날짜 머리글 개수로 셉니다.</p>
        <pre className="postCode">
          <code>{`지각 포함: =(G2+H2)/COUNTA($B$1:$F$1)   → 김민수 100%, 박준호 60%
O만 출석:  =G2/COUNTA($B$1:$F$1)        → 김민수 80%, 박준호 20%`}</code>
        </pre>
        <p>
          결과는 0.8 같은 소수로 나오니 J열을 선택하고 [홈] → [백분율 스타일](%)을 누릅니다. 수업 일수를 5로 직접 적지 않고 COUNTA로 머리글을 세면, 날짜
          열을 추가해도 수식을 고칠 필요가 없습니다(날짜 열은 F열과 G열 사이에 삽입해야 범위가 같이 늘어납니다).
        </p>

        <h2 id="daily">날짜별 출석 인원</h2>
        <pre className="postCode">
          <code>{`B7 (출석 인원): =COUNTIF(B$2:B$6, "O")   → 11/3부터 3, 3, 4, 2, 4
B8 (결석 인원): =COUNTIF(B$2:B$6, "X")   → 1, 1, 1, 2, 1
B9 (미입력):    =COUNTBLANK(B$2:B$6)`}</code>
        </pre>
        <p>
          이번엔 행 앞에 $를 붙여(B$2:B$6) 오른쪽으로 채울 때 열만 바뀌게 합니다. 미입력 줄은 아직 체크하지 않은 날을 찾는 데 씁니다. 0이 아닌 날이
          있으면 그날 출석을 빠뜨린 것입니다.
        </p>

        <h2 id="warn">결석 3회 이상 표시</h2>
        <pre className="postCode">
          <code>{`K2: =IF(I2>=3, "주의", "")   → 정하늘 '주의'`}</code>
        </pre>
        <p>
          눈에 잘 띄게 하려면 조건부 서식을 함께 씁니다. B2:F6을 선택하고 [홈] → [조건부 서식] → [셀 강조 규칙] → [같음]에서 X를 적고 빨간 채우기를
          고르면 결석 칸만 색이 칠해집니다. 이름 줄 전체를 칠하려면 A2:K6을 선택하고 [새 규칙] → &lsquo;수식을 사용하여 서식을 지정할 셀 결정&rsquo;에
          =$I2&gt;=3을 넣습니다.
        </p>
        <p>
          월말에 사람마다 출석 횟수를 다른 표로 모으거나, 여러 반의 명단에서 같은 사람이 두 번 들어갔는지 확인할 때도 COUNTIF가 그대로 쓰입니다. 명단
          중복은 <Link href="/dedupe/">엑셀 중복 제거</Link>에 붙여넣어 한 번에 확인할 수도 있습니다.
        </p>

        <h2 id="summary">정리</h2>
        <ul>
          <li>사람은 행, 날짜는 열, 입력은 데이터 유효성 검사 목록(O,△,X)</li>
          <li>횟수: =COUNTIF($B2:$F2, &quot;O&quot;) — 열만 고정해 아래로 채우기</li>
          <li>출석률: =(출석+지각)/COUNTA(날짜 머리글), 백분율 서식</li>
          <li>날짜별 인원: =COUNTIF(B$2:B$6, &quot;O&quot;) — 행만 고정해 옆으로 채우기</li>
          <li>결석 3회: =IF(결석&gt;=3, &quot;주의&quot;, &quot;&quot;) + 조건부 서식</li>
        </ul>
      </>
    );
  },
};

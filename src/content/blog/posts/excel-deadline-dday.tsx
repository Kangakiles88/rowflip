import Link from "next/link";
import type { Post } from "../types";

/**
 * 노리는 검색어: 엑셀 마감일 지나면 표시, 엑셀 디데이 계산, 엑셀 D-day 표시, 엑셀 TODAY 함수, 엑셀 날짜 지나면 색
 * /functions/if/(형식·비교·계산·중첩·AND/OR·빈칸)와 겹치지 않게 '오늘 날짜와 비교'하는 업무 관리표만 다룬다.
 * 예시는 오늘을 2026-11-23(월)로 두고 파이썬으로 확인: 견적서 회신 11/20 → D+3·지연, 세금계산서 발행 11/25 → D-2·임박,
 *   재고 실사 11/23 → D-day·임박, 계약서 날인 11/18(완료 11/17) → 완료, 연말 정산 자료 12/5 → D-12·진행.
 *   NETWORKDAYS(11/23, 11/25)=3, (11/23, 12/5)=10. 날짜 일련번호 2026-11-23 = 46349.
 */
export const excelDeadlineDday: Post = {
  meta: {
    slug: "excel-deadline-dday",
    title: "엑셀 마감일 지나면 표시하기 - D-day·지연·임박 자동",
    h1: "엑셀 마감일 지나면 표시하기: TODAY와 IF로 D-day, 지연·임박 자동 표시",
    description:
      "엑셀 업무표에서 마감일까지 남은 날짜와 D-day를 계산하고, 마감이 지나면 '지연', 사흘 안이면 '임박'을 자동으로 표시하는 방법입니다. TODAY·IF 수식, 주말 뺀 남은 일수, 지난 줄 색칠까지 다룹니다.",
    keywords: ["엑셀 마감일 지나면 표시", "엑셀 디데이 계산", "엑셀 D-day 표시", "엑셀 TODAY 함수", "엑셀 날짜 지나면 색"],
    published: "2026-11-23",
    tool: "fn-if",
    excerpt:
      "마감일만 적어 두면 남은 일수, D-day, '지연·임박·완료'가 매일 알아서 바뀌는 업무표를 TODAY와 IF로 만듭니다.",
    toc: [
      { id: "table", title: "예시: 이번 주 업무표" },
      { id: "days", title: "남은 일수: 마감일 − TODAY()" },
      { id: "dday", title: "D-3, D-day, D+2로 보여 주기" },
      { id: "status", title: "지연·임박·완료 자동 표시" },
      { id: "workdays", title: "주말 빼고 남은 날" },
      { id: "color", title: "지난 줄 색칠하기" },
      { id: "pitfalls", title: "자주 막히는 곳" },
      { id: "summary", title: "정리" },
    ],
  },
  Body() {
    return (
      <>
        <p>
          업무 목록에 마감일을 적어 두고도 매일 달력과 비교해 보는 것은 번거롭습니다. 엑셀의 TODAY 함수는 파일을 열 때마다 오늘 날짜를 돌려주므로, 마감일과
          빼기만 하면 남은 일수가 매일 바뀝니다. 여기에 IF를 더하면 &lsquo;지연&rsquo;·&lsquo;임박&rsquo;까지 자동으로 붙습니다. IF 형식이 처음이라면{" "}
          <Link href="/functions/if/">IF 함수 사용법</Link>의 연습장에서 먼저 입력해 보세요.
        </p>

        <h2 id="table">예시: 이번 주 업무표</h2>
        <p>오늘이 2026년 11월 23일(월)이라고 보고 계산한 결과입니다. B열 마감일과 C열 완료일은 엑셀이 날짜로 알아보는 2026-11-20 형태로 적습니다.</p>
        <div className="postTableWrap">
          <table className="postTable">
            <thead>
              <tr>
                <th scope="col">A 업무</th>
                <th scope="col">B 마감일</th>
                <th scope="col">C 완료일</th>
                <th scope="col">D 남은 일수</th>
                <th scope="col">E D-day</th>
                <th scope="col">F 상태</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["견적서 회신", "2026-11-20", "", "-3", "D+3", "지연"],
                ["세금계산서 발행", "2026-11-25", "", "2", "D-2", "임박"],
                ["재고 실사", "2026-11-23", "", "0", "D-day", "임박"],
                ["계약서 날인", "2026-11-18", "2026-11-17", "-5", "D+5", "완료"],
                ["연말정산 자료", "2026-12-05", "", "12", "D-12", "진행"],
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

        <h2 id="days">남은 일수: 마감일 − TODAY()</h2>
        <pre className="postCode">
          <code>{`D2: =B2-TODAY()   → 견적서 회신 -3, 세금계산서 발행 2, 재고 실사 0`}</code>
        </pre>
        <p>
          엑셀은 날짜를 1900년 1월 1일부터 센 숫자로 저장합니다(2026-11-23은 46349). 그래서 두 날짜를 빼면 사이의 일수가 나옵니다. 결과가 1900-01-02 같은
          날짜로 보이면 D열 서식을 [일반]이나 [숫자]로 바꾸세요. 엑셀이 날짜끼리 뺀 결과에 날짜 서식을 그대로 붙여서 생기는 일입니다.
        </p>

        <h2 id="dday">D-3, D-day, D+2로 보여 주기</h2>
        <pre className="postCode">
          <code>{`E2: =IF(D2=0, "D-day", IF(D2>0, "D-"&D2, "D+"&-D2))
→ D+3, D-2, D-day, D+5, D-12`}</code>
        </pre>
        <p>
          남은 일수(D열)가 0이면 D-day, 양수면 D-남은 날, 음수면 부호를 뒤집어 D+지난 날을 붙입니다. &amp;는 글자와 숫자를 잇는 기호입니다. D열을 따로 두기
          싫다면 D2 자리에 (B2-TODAY())를 그대로 넣어도 됩니다.
        </p>

        <h2 id="status">지연·임박·완료 자동 표시</h2>
        <p>완료일이 적혀 있는지를 가장 먼저 봐야 다 끝난 일이 &lsquo;지연&rsquo;으로 남지 않습니다.</p>
        <pre className="postCode">
          <code>{`F2: =IF(C2<>"", "완료", IF(D2<0, "지연", IF(D2<=3, "임박", "진행")))
→ 지연, 임박, 임박, 완료, 진행`}</code>
        </pre>
        <p>
          판단 순서는 완료 → 지연 → 임박 → 진행입니다. 계약서 날인은 마감이 닷새 지났지만 C열에 완료일이 있어 &lsquo;완료&rsquo;로 나옵니다. &lsquo;임박&rsquo;
          기준(3일)은 팀 사정에 맞게 바꾸면 되고, 기준 숫자를 H1 같은 칸에 적어 두고 D2&lt;=$H$1로 쓰면 수식을 고치지 않고 기준만 바꿀 수 있습니다.
        </p>

        <h2 id="workdays">주말 빼고 남은 날</h2>
        <pre className="postCode">
          <code>{`=NETWORKDAYS(TODAY(), B3)   → 세금계산서 발행(11/25) 3
=NETWORKDAYS(TODAY(), B6)   → 연말정산 자료(12/5) 10`}</code>
        </pre>
        <p>
          NETWORKDAYS는 시작일과 끝 날을 모두 포함해 토·일요일을 뺀 날을 셉니다. 오늘(월)부터 수요일까지가 3입니다. 공휴일까지 빼려면 휴일 날짜를 J2:J20
          같은 곳에 적어 두고 =NETWORKDAYS(TODAY(), B3, $J$2:$J$20)처럼 셋째 인수로 넣습니다.
        </p>

        <h2 id="color">지난 줄 색칠하기</h2>
        <ol>
          <li>A2:F6을 선택하고 [홈] → [조건부 서식] → [새 규칙]을 누릅니다.</li>
          <li>&lsquo;수식을 사용하여 서식을 지정할 셀 결정&rsquo;을 고르고 =AND($C2=&quot;&quot;, $B2&lt;TODAY())를 넣습니다.</li>
          <li>[서식]에서 채우기 색을 고르고 [확인]을 누릅니다.</li>
        </ol>
        <p>
          $C2·$B2처럼 열 앞에만 $를 붙여야 줄 전체가 같은 판단을 따릅니다. 임박한 줄을 다른 색으로 칠하려면 규칙을 하나 더 만들고
          =AND($C2=&quot;&quot;, $B2&gt;=TODAY(), $B2-TODAY()&lt;=3)을 넣습니다.
        </p>

        <h2 id="pitfalls">자주 막히는 곳</h2>
        <h3>마감일을 글자로 적었을 때</h3>
        <p>
          &lsquo;11월 25일&rsquo;, &lsquo;2026.11.25&rsquo;처럼 적으면 엑셀이 날짜로 보지 않아 =B2-TODAY()가 #VALUE!를 냅니다. 칸이 왼쪽 정렬돼 있으면 글자로 저장된
          것입니다. 2026-11-25나 2026/11/25 형태로 다시 적거나, 글자로 된 날짜를 날짜로 되돌리는 방법은{" "}
          <Link href="/blog/excel-date-korean/">엑셀 날짜를 &apos;2026년 10월 30일&apos;로 표시하기</Link>의 마지막 부분을 참고하세요.
        </p>
        <h3>기록용 날짜까지 TODAY로 넣었을 때</h3>
        <p>
          TODAY는 파일을 열 때마다 바뀝니다. 완료일처럼 그날 날짜를 남겨야 하는 칸에 =TODAY()를 넣으면 내일 열었을 때 내일 날짜로 바뀝니다. 오늘 날짜를
          고정해 넣으려면 칸을 선택하고 Ctrl+;(세미콜론)을 누르세요.
        </p>

        <h2 id="summary">정리</h2>
        <ul>
          <li>남은 일수: =마감일-TODAY() (결과 서식은 일반)</li>
          <li>D-day: =IF(D2=0, &quot;D-day&quot;, IF(D2&gt;0, &quot;D-&quot;&amp;D2, &quot;D+&quot;&amp;-D2))</li>
          <li>상태: 완료일 먼저 → 지연(음수) → 임박(3일 이하) → 진행</li>
          <li>주말 제외: NETWORKDAYS(TODAY(), 마감일, 휴일 목록)</li>
          <li>색칠: 조건부 서식 =AND($C2=&quot;&quot;, $B2&lt;TODAY())</li>
          <li>기록용 날짜는 TODAY 대신 Ctrl+;</li>
        </ul>
      </>
    );
  },
};

import Link from "next/link";
import type { Post } from "../types";

/**
 * 노리는 검색어: 엑셀 중복 제외 개수, 엑셀 고유값 개수, 엑셀 중복 없이 개수 세기, 엑셀 UNIQUE 개수, 엑셀 조건별 고유 개수
 * /functions/countif/(조건에 맞는 개수·중복 확인)와 겹치지 않게 '서로 다른 값이 몇 개인지'를 다룬다.
 * 예시는 파이썬·사이트 utils(dedupeText)로 확인: 고객명 10행 중 빈 칸 1 → COUNTA 9, 고유 6(뒤 공백 '김민수 ' 포함),
 * TRIM 하면 5, 강남점 고유 4(TRIM 3), 판교점 3. 중복 제거 도구 결과 5줄(앞뒤 공백 무시·빈 줄 제거 기본).
 */
export const excelCountUnique: Post = {
  meta: {
    slug: "excel-count-unique",
    title: "엑셀 중복 제외 개수 세기 - 고유값 개수 UNIQUE·COUNTIF",
    h1: "엑셀 중복 제외 개수 세기: 고객이 몇 명인지, 지점별로는 몇 명인지",
    description:
      "주문 목록에서 서로 다른 고객이 몇 명인지처럼 중복을 뺀 개수를 세는 방법을 정리했습니다. COUNTA(UNIQUE), 예전 버전용 SUMPRODUCT(1/COUNTIF), 지점별 고유 개수, 피벗 고유 개수와 공백 때문에 개수가 틀어지는 경우까지 다룹니다.",
    keywords: [
      "엑셀 중복 제외 개수",
      "엑셀 고유값 개수",
      "엑셀 중복 없이 개수 세기",
      "엑셀 UNIQUE 개수",
      "엑셀 조건별 고유 개수",
    ],
    published: "2026-11-04",
    tool: "fn-countif",
    excerpt:
      "주문 10건인데 고객은 몇 명일까요? 중복을 뺀 개수를 세는 COUNTA(UNIQUE), SUMPRODUCT(1/COUNTIF), 지점별 고유 개수 수식입니다.",
    toc: [
      { id: "setup", title: "예시: 주문 10건, 고객은 몇 명?" },
      { id: "unique", title: "Microsoft 365: COUNTA(UNIQUE)" },
      { id: "sumproduct", title: "예전 버전: SUMPRODUCT(1/COUNTIF)" },
      { id: "condition", title: "지점별로 고유 개수 세기" },
      { id: "pivot", title: "피벗 테이블로 고유 개수" },
      { id: "pitfalls", title: "개수가 하나씩 많을 때" },
      { id: "summary", title: "정리" },
    ],
  },
  Body() {
    return (
      <>
        <p>
          &ldquo;이번 달 주문은 몇 건?&rdquo;은 COUNTA 하나면 되지만 &ldquo;주문한 고객은 몇 명?&rdquo;은 다릅니다. 같은 고객이 여러 번 주문했으니
          중복을 빼고 세어야 합니다. 엑셀 버전에 따라 쓰는 수식이 달라서 두 가지를 모두 정리했습니다.
        </p>

        <h2 id="setup">예시: 주문 10건, 고객은 몇 명?</h2>
        <p>A열 주문번호, B열 고객명, C열 지점입니다. B6은 비어 있고, B9의 &lsquo;김민수 &rsquo;에는 뒤에 띄어쓰기가 하나 붙어 있습니다.</p>
        <div className="postTableWrap">
          <table className="postTable">
            <thead>
              <tr>
                <th scope="col">행</th>
                <th scope="col">A 주문번호</th>
                <th scope="col">B 고객명</th>
                <th scope="col">C 지점</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["2", "A-10234", "김민수", "강남점"],
                ["3", "A-10235", "이서연", "판교점"],
                ["4", "A-10236", "김민수", "강남점"],
                ["5", "A-10237", "박준호", "강남점"],
                ["6", "A-10238", "(빈 칸)", "판교점"],
                ["7", "A-10239", "이서연", "강남점"],
                ["8", "A-10240", "최지우", "판교점"],
                ["9", "A-10241", "김민수␣", "강남점"],
                ["10", "A-10242", "박준호", "강남점"],
                ["11", "A-10243", "정하늘", "판교점"],
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
        <p>
          =COUNTA(B2:B11)은 9(빈 칸 제외)입니다. 사람으로 보면 김민수·이서연·박준호·최지우·정하늘 5명인데, 아래 수식은 그대로 쓰면 6이 나옵니다.
          이유는 맨 끝 &lsquo;개수가 하나씩 많을 때&rsquo;에서 다룹니다.
        </p>

        <h2 id="unique">Microsoft 365: COUNTA(UNIQUE)</h2>
        <p>UNIQUE가 중복을 뺀 목록을 만들고, 그 목록의 개수를 셉니다.</p>
        <pre className="postCode">
          <code>{`=COUNTA(UNIQUE(FILTER(B2:B11, B2:B11<>"")))

→ 6`}</code>
        </pre>
        <p>
          FILTER로 빈 칸을 먼저 빼야 합니다. =COUNTA(UNIQUE(B2:B11))만 쓰면 빈 칸이 0이라는 값 하나로 들어가 1이 더 많게 나옵니다. 빈 칸이
          없는 목록이라면 =COUNTA(UNIQUE(B2:B11))로 충분합니다. UNIQUE는 Microsoft 365와 엑셀 2021 이후에 있습니다.
        </p>

        <h2 id="sumproduct">예전 버전: SUMPRODUCT(1/COUNTIF)</h2>
        <p>UNIQUE가 없는 엑셀 2019 이하에서는 &ldquo;각 값이 몇 번 나왔는지&rdquo;로 나눠 더하는 방법을 씁니다.</p>
        <pre className="postCode">
          <code>{`=SUMPRODUCT((B2:B11<>"")/COUNTIF(B2:B11, B2:B11&""))

→ 6`}</code>
        </pre>
        <p>
          김민수가 2번 나오면 그 두 줄에서 1/2씩, 합쳐서 1이 됩니다. 모든 이름이 이렇게 1씩 더해져 고유 개수가 됩니다. 앞의
          (B2:B11&lt;&gt;&quot;&quot;)는 빈 칸을 0으로 만들고, COUNTIF 안의 &amp;&quot;&quot;는 빈 칸 때문에 0으로 나누는 오류(#DIV/0!)를 막습니다.
          행이 수만 개면 계산이 느려지니 그때는 피벗 테이블이 낫습니다.
        </p>

        <h2 id="condition">지점별로 고유 개수 세기</h2>
        <p>강남점에서 주문한 고객만 세려면 FILTER 조건에 지점을 더합니다.</p>
        <pre className="postCode">
          <code>{`=COUNTA(UNIQUE(FILTER(B2:B11, (C2:C11="강남점")*(B2:B11<>""))))   → 4
예전 버전:
=SUMPRODUCT((C2:C11="강남점")*(B2:B11<>"")/COUNTIFS(B2:B11, B2:B11&"", C2:C11, C2:C11))   → 4`}</code>
        </pre>
        <p>
          조건이 둘 이상이면 FILTER 안에서 (조건1)*(조건2)처럼 곱합니다. 예전 버전 수식은 COUNTIF 대신 COUNTIFS로 &lsquo;같은 고객이면서 같은 지점&rsquo;인
          줄 수를 셉니다. 지점명을 F2에 적어 두고 &quot;강남점&quot; 자리에 F2를 넣으면 지점 목록 옆에 채워 내려 지점별 표를 만들 수 있습니다. 조건에
          맞는 줄 수만 필요하다면(중복 포함) <Link href="/functions/countif/">COUNTIF 함수</Link>로 충분합니다.
        </p>

        <h2 id="pivot">피벗 테이블로 고유 개수</h2>
        <p>
          지점별·월별로 한 번에 보고 싶다면 피벗 테이블이 편합니다. 표를 선택하고 [삽입] → [피벗 테이블]을 누를 때 &lsquo;데이터 모델에 이 데이터
          추가&rsquo;를 체크합니다. 행에 지점, 값에 고객명을 넣은 뒤 값 필드 설정에서 &lsquo;고유 개수&rsquo;를 고르면 중복을 뺀 고객 수가 나옵니다. 이
          체크를 하지 않으면 값 요약 방식에 고유 개수가 보이지 않습니다. 메뉴 이름은 버전에 따라 조금 다를 수 있습니다.
        </p>

        <h2 id="pitfalls">개수가 하나씩 많을 때</h2>
        <h3>뒤에 붙은 띄어쓰기</h3>
        <p>
          위 예시에서 6이 나온 이유는 B9의 &lsquo;김민수 &rsquo;입니다. 눈에는 같아 보여도 끝에 띄어쓰기가 있어 UNIQUE와 COUNTIF 모두 다른 값으로
          봅니다. =COUNTA(UNIQUE(FILTER(TRIM(B2:B11), B2:B11&lt;&gt;&quot;&quot;)))처럼 TRIM으로 감싸면 5가 됩니다(지점별 강남점도 3으로 줄어듭니다).
          다른 시스템에서 내려받은 명단에 특히 자주 섞여 있습니다.
        </p>
        <h3>표기가 조금씩 다른 같은 사람</h3>
        <p>
          &lsquo;(주)가온디자인&rsquo;과 &lsquo;가온디자인&rsquo;, &lsquo;김민수&rsquo;와 &lsquo;김 민수&rsquo;는 어떤 수식도 같은 값으로 보지 않습니다. 고유 개수를 세기
          전에 목록을 한 번 정렬해 비슷한 이름이 붙어 있는지 확인하세요. 반대로 영문 대소문자(ABC와 abc)는 UNIQUE·COUNTIF 모두 같은 값으로
          셉니다.
        </p>
        <p>
          수식 없이 확인만 하려면 고객명 열을 복사해 <Link href="/dedupe/">엑셀 중복 제거</Link>에 붙여넣으면 됩니다. 앞뒤 공백 무시와 빈 줄 제거가
          기본으로 켜져 있어 위 예시는 5줄로 나오고, &lsquo;개수 세기&rsquo;를 고르면 고객마다 몇 번 주문했는지(김민수 3, 이서연 2, 박준호 2…)도 함께
          보입니다.
        </p>

        <h2 id="summary">정리</h2>
        <ul>
          <li>Microsoft 365: =COUNTA(UNIQUE(FILTER(범위, 범위&lt;&gt;&quot;&quot;)))</li>
          <li>예전 버전: =SUMPRODUCT((범위&lt;&gt;&quot;&quot;)/COUNTIF(범위, 범위&amp;&quot;&quot;))</li>
          <li>조건별: FILTER에 (조건)*(빈 칸 아님), 예전 버전은 COUNTIFS로 나누기</li>
          <li>지점·월별 한꺼번에: 피벗 테이블 + 데이터 모델 + &lsquo;고유 개수&rsquo;</li>
          <li>개수가 많게 나오면 뒤 공백(TRIM)과 표기 차이부터 확인</li>
        </ul>
      </>
    );
  },
};

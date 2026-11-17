import Link from "next/link";
import type { Post } from "../types";

/**
 * 노리는 검색어: 엑셀 텍스트를 숫자로 변환, 엑셀 숫자로 변환, 엑셀 텍스트 형식 숫자, 엑셀 합계 0, 엑셀 숫자 인식 안됨, 엑셀 VALUE 함수
 * /functions/sumif/ FAQ는 '텍스트 숫자 때문에 0'이라는 원인만 한 줄로 적었고, 이 글은 찾는 법과 바꾸는 방법 다섯 가지를 다룬다.
 * 예시 합계는 파이썬으로 확인: 189,000(숫자) + "28,900"(텍스트) + 64,000 + "18,900"(텍스트)
 *   → SUM 253,000, 실제 300,800, COUNTA-COUNT = 2. "1,200원" → SUBSTITUTE 후 VALUE 1200.
 */
export const excelTextToNumber: Post = {
  meta: {
    slug: "excel-text-to-number",
    title: "엑셀 텍스트를 숫자로 변환 - 합계가 0이거나 안 맞을 때",
    h1: "엑셀 텍스트를 숫자로 변환하기: 합계가 0이거나 일부만 더해질 때",
    description:
      "엑셀에서 숫자가 텍스트로 저장돼 SUM·SUMIF 합계가 0이거나 일부만 더해질 때 찾는 법과 숫자로 바꾸는 다섯 가지 방법입니다. 초록 삼각형, 텍스트 나누기, 붙여넣기 곱하기, VALUE, '원'·특수 공백 처리까지 다룹니다.",
    keywords: ["엑셀 텍스트를 숫자로 변환", "엑셀 숫자로 변환", "엑셀 텍스트 형식 숫자", "엑셀 합계 0", "엑셀 VALUE 함수"],
    published: "2026-11-18",
    tool: "fn-sumif",
    excerpt:
      "SUM 결과가 실제보다 작거나 SUMIF가 0이라면 숫자가 텍스트로 저장된 것입니다. 찾는 법과 한 번에 숫자로 바꾸는 다섯 가지 방법입니다.",
    toc: [
      { id: "symptom", title: "이런 증상이면 텍스트 숫자" },
      { id: "find", title: "텍스트 숫자 찾기" },
      { id: "warning", title: "방법 1: 초록 삼각형 '숫자로 변환'" },
      { id: "text-to-columns", title: "방법 2: 텍스트 나누기 → 마침" },
      { id: "multiply", title: "방법 3: 선택하여 붙여넣기 → 곱하기" },
      { id: "value", title: "방법 4: VALUE 함수" },
      { id: "dirty", title: "방법 5: '원'·특수 공백이 섞였을 때" },
      { id: "keep", title: "바꾸면 안 되는 숫자" },
      { id: "summary", title: "정리" },
    ],
  },
  Body() {
    return (
      <>
        <p>
          다른 프로그램에서 내려받은 매출 파일의 합계가 손으로 계산한 값보다 작거나, SUMIF가 0을 돌려줄 때가 있습니다. 수식은 맞는데 결과가
          틀리다면 대부분 <strong>숫자처럼 보이지만 텍스트로 저장된 칸</strong> 때문입니다. 엑셀은 이런 칸을 글자로 보고 SUM·SUMIF·AVERAGE에서
          건너뜁니다.
        </p>

        <h2 id="symptom">이런 증상이면 텍스트 숫자</h2>
        <p>금액 네 칸 중 둘이 텍스트로 저장된 예입니다.</p>
        <div className="postTableWrap">
          <table className="postTable">
            <thead>
              <tr>
                <th scope="col">행</th>
                <th scope="col">D 금액</th>
                <th scope="col">저장 형식</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2</td>
                <td>189,000</td>
                <td>숫자 (오른쪽 정렬)</td>
              </tr>
              <tr>
                <td>3</td>
                <td>28,900</td>
                <td>텍스트 (왼쪽 정렬, 초록 삼각형)</td>
              </tr>
              <tr>
                <td>4</td>
                <td>64,000</td>
                <td>숫자</td>
              </tr>
              <tr>
                <td>5</td>
                <td>18,900</td>
                <td>텍스트</td>
              </tr>
            </tbody>
          </table>
        </div>
        <pre className="postCode">
          <code>{`=SUM(D2:D5)   → 253,000   (실제 합계 300,800)
=D2+D3+D4+D5  → 300,800   (+ 연산은 텍스트 숫자도 숫자로 바꿔 더함)`}</code>
        </pre>
        <p>
          SUM은 범위 안의 텍스트를 건너뛰고, + 연산은 바꿔서 더합니다. 그래서 두 결과가 다르면 텍스트 숫자가 섞여 있다는 신호입니다. 정렬 방향(텍스트는
          기본이 왼쪽 정렬)과 칸 왼쪽 위의 초록 삼각형도 단서지만, 정렬을 직접 바꿔 둔 파일에서는 믿을 수 없습니다.
        </p>

        <h2 id="find">텍스트 숫자 찾기</h2>
        <pre className="postCode">
          <code>{`몇 개인지:   =COUNTA(D2:D5)-COUNT(D2:D5)   → 2
어느 칸인지: E2에 =ISTEXT(D2) 넣고 아래로 채우기 → TRUE인 줄`}</code>
        </pre>
        <p>
          COUNTA는 비어 있지 않은 칸, COUNT는 숫자 칸만 셉니다. 차이가 0이 아니면 숫자가 아닌 칸이 그만큼 있습니다(제목이나 &lsquo;-&rsquo; 같은 글자도
          포함되니 범위는 숫자만 있어야 할 곳으로 잡습니다).
        </p>

        <h2 id="warning">방법 1: 초록 삼각형 &lsquo;숫자로 변환&rsquo;</h2>
        <p>
          텍스트 숫자 칸들을 선택하면 옆에 느낌표 단추가 나타납니다. 누르고 &lsquo;숫자로 변환&rsquo;을 고르면 끝입니다. 선택 범위의 첫 칸이 텍스트 숫자여야
          단추가 나오므로, 열 전체를 바꿀 땐 첫 칸부터 선택합니다. 수만 행이면 꽤 오래 걸리니 아래 방법 2·3이 빠릅니다.
        </p>

        <h2 id="text-to-columns">방법 2: 텍스트 나누기 → 마침</h2>
        <p>
          열 하나를 통째로 바꿀 때 가장 빠릅니다. 열을 선택하고 [데이터] → [텍스트 나누기]를 누른 뒤, 아무것도 바꾸지 않고 바로 [마침]을 누릅니다.
          엑셀이 칸을 다시 읽으면서 숫자로 보이는 값을 숫자로 바꿉니다. 한 번에 한 열만 됩니다.
        </p>

        <h2 id="multiply">방법 3: 선택하여 붙여넣기 → 곱하기</h2>
        <ol>
          <li>빈 칸에 1을 적고 복사합니다(Ctrl+C).</li>
          <li>바꿀 범위를 선택하고 [선택하여 붙여넣기](Ctrl+Alt+V)를 엽니다.</li>
          <li>연산에서 &lsquo;곱하기&rsquo;를 고르고 [확인]을 누릅니다.</li>
        </ol>
        <p>
          모든 칸에 1을 곱하면서 숫자로 바뀝니다. 여러 열을 한 번에 바꿀 수 있고, 이미 숫자인 칸은 그대로입니다. 글자 칸은 그대로 남지만 빈 칸이나 제목이 섞인 범위는
          결과를 한 번 확인하고, 되도록 숫자 열만 선택하세요.
        </p>

        <h2 id="value">방법 4: VALUE 함수</h2>
        <pre className="postCode">
          <code>{`=VALUE(D3)   → 28900
같은 결과: =D3*1, =--D3`}</code>
        </pre>
        <p>
          원본을 건드리지 않고 옆 열에 숫자를 만들 때 씁니다. 원본이 매번 새로 내려받는 파일이라 다시 붙여넣을 일이 많다면 이 방법이 편합니다. 다 됐으면
          결과 열을 복사해 [값 붙여넣기]로 바꾼 뒤 원래 열을 지웁니다.
        </p>

        <h2 id="dirty">방법 5: &lsquo;원&rsquo;·특수 공백이 섞였을 때</h2>
        <p>
          위 방법으로도 안 바뀌는 칸은 숫자 말고 다른 글자가 들어 있는 경우입니다. &lsquo;1,200원&rsquo;처럼 단위가 붙었으면 단위를 지우고 바꿉니다.
        </p>
        <pre className="postCode">
          <code>{`=VALUE(SUBSTITUTE(D2, "원", ""))          → 1200
=VALUE(SUBSTITUTE(D2, CHAR(160), ""))     → 웹에서 복사한 '줄바꿈 없는 공백' 제거
=VALUE(TRIM(D2))                          → 앞뒤 일반 공백 제거`}</code>
        </pre>
        <p>
          웹페이지나 메신저에서 복사한 숫자에는 눈에 보이지 않는 특수 공백(CHAR(160))이 붙는 경우가 있는데, TRIM은 이 공백을 지우지 못합니다. TRIM으로도
          #VALUE!가 나면 CHAR(160)부터 의심해 보세요. [찾기 및 바꾸기]로 지우려면 찾을 내용 칸에서 Alt를 누른 채 숫자 패드로 0160을 입력하는 방법도
          있습니다.
        </p>

        <h2 id="keep">바꾸면 안 되는 숫자</h2>
        <p>
          모든 텍스트 숫자가 잘못된 것은 아닙니다. 전화번호(010…), 우편번호, 사번 00123처럼 앞자리 0이 의미 있는 값은 일부러 텍스트로 둔 것입니다. 숫자로
          바꾸면 0이 사라지니 계산할 열에만 위 방법을 쓰세요. 이미 사라진 0을 되살리는 방법은{" "}
          <Link href="/blog/excel-phone-number/">엑셀 전화번호 010 앞자리 0 살리기</Link>에 정리했습니다. 숫자로 바꾼 뒤 조건별 합계는{" "}
          <Link href="/functions/sumif/">SUMIF 함수 사용법</Link>의 연습장에서 바로 시험해 볼 수 있습니다.
        </p>

        <h2 id="summary">정리</h2>
        <ul>
          <li>증상: SUM과 + 연산 결과가 다름, SUMIF가 0, 왼쪽 정렬·초록 삼각형</li>
          <li>찾기: =COUNTA(범위)-COUNT(범위), =ISTEXT(칸)</li>
          <li>바꾸기: 숫자로 변환 / 텍스트 나누기 → 마침 / 1 곱하기 붙여넣기 / =VALUE(칸)</li>
          <li>안 바뀌면: SUBSTITUTE로 &lsquo;원&rsquo;·CHAR(160) 지우고 VALUE</li>
          <li>010·사번처럼 앞자리 0이 필요한 값은 텍스트로 둠</li>
        </ul>
      </>
    );
  },
};

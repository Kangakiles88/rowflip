import Link from "next/link";
import type { Post } from "../types";

/**
 * 노리는 검색어: 엑셀 거래명세서 만들기, 엑셀 거래명세서 자동, 품목코드 단가 자동 입력, 거래명세서 VLOOKUP
 * 도구 /statement/ 대표 검색어('거래명세서 양식')는 피한다. VLOOKUP 자체 설명은 excel-vlookup-multi·/functions/vlookup/로.
 * 예시: P-1001 5×24,500=122,500(세액 12,250), P-1002 2×6,000=12,000(1,200), P-1003 10×1,200=12,000(1,200)
 *       → 공급가액 146,500, 세액 14,650, 합계 161,150.
 */
export const excelStatementLookup: Post = {
  meta: {
    slug: "excel-statement-lookup",
    title: "엑셀 거래명세서 만들기 - 품목코드로 단가 자동 입력",
    h1: "엑셀 거래명세서 만들기: 품목코드만 치면 품명·단가가 채워지게",
    description:
      "엑셀 거래명세서에 품목코드를 입력하면 품명·규격·단가가 품목 시트에서 자동으로 채워지게 만드는 방법입니다. VLOOKUP·XLOOKUP 수식, 공급가액·세액·잔액 계산, #N/A 오류와 단가가 바뀔 때 주의할 점까지 정리했습니다.",
    keywords: [
      "엑셀 거래명세서 만들기",
      "엑셀 거래명세서 자동",
      "거래명세서 품목 단가 자동",
      "거래명세서 VLOOKUP",
      "엑셀 품목코드 단가 불러오기",
      "거래명세서 잔액 계산",
    ],
    published: "2026-11-21",
    tool: "statement",
    excerpt:
      "납품할 때마다 품명과 단가를 손으로 옮겨 적는 대신, 품목코드만 치면 품목 시트에서 불러오는 거래명세서를 만드는 방법.",
    toc: [
      { id: "items", title: "품목 시트 따로 두기" },
      { id: "lookup", title: "코드로 품명·단가 불러오기" },
      { id: "xlookup", title: "XLOOKUP으로 쓰기" },
      { id: "amount", title: "공급가액·세액·합계" },
      { id: "balance", title: "전잔액·입금액·잔액" },
      { id: "errors", title: "자주 생기는 문제" },
      { id: "summary", title: "정리" },
    ],
  },
  Body() {
    return (
      <>
        <p>
          같은 거래처에 같은 물건을 자주 납품하면 거래명세서를 쓸 때마다 품명과 규격, 단가를 똑같이 옮겨 적게 됩니다. 옮겨 적다 단가를
          잘못 쓰면 받을 돈이 틀어집니다. 품목 목록을 한 시트에 모아 두고, 명세서에는 품목코드만 치면 나머지가 채워지게 만들어 두면
          이런 실수가 없어집니다.
        </p>
        <p>
          엑셀 서식을 따로 만들지 않고 이번 납품분만 바로 출력하려면 <Link href="/statement/">거래명세서 양식 작성</Link>에 품목 표를
          붙여넣으세요. 공급가액·세액·잔액을 계산해 공급자용·공급받는자용 두 부를 A4 한 장에 찍습니다.
        </p>

        <h2 id="items">품목 시트 따로 두기</h2>
        <p>
          시트 이름을 &lsquo;품목&rsquo;으로 하고 A열 코드, B열 품명, C열 규격, D열 단가를 적습니다. 코드는 한 품목에 하나씩, 겹치지
          않게 정합니다.
        </p>
        <div className="postTableWrap">
          <table className="postTable">
            <thead>
              <tr>
                <th scope="col">A 코드</th>
                <th scope="col">B 품명</th>
                <th scope="col">C 규격</th>
                <th scope="col">D 단가</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>P-1001</td>
                <td>A4 복사용지</td>
                <td>80g 2,500매</td>
                <td>24,500</td>
              </tr>
              <tr>
                <td>P-1002</td>
                <td>볼펜</td>
                <td>0.5mm 검정 12개입</td>
                <td>6,000</td>
              </tr>
              <tr>
                <td>P-1003</td>
                <td>클립</td>
                <td>33mm 100개입</td>
                <td>1,200</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="lookup">코드로 품명·단가 불러오기</h2>
        <p>
          명세서 시트의 품목 줄은 A열 월일, B열 코드, C열 품명, D열 규격, E열 수량, F열 단가, G열 공급가액, H열 세액으로 두고 12행부터
          적는다고 하겠습니다. C12·D12·F12에 아래 수식을 넣고 아래로 채웁니다.
        </p>
        <pre className="postCode">
          <code>{`C12 품명: =IFERROR(VLOOKUP($B12, 품목!$A:$D, 2, FALSE), "")
D12 규격: =IFERROR(VLOOKUP($B12, 품목!$A:$D, 3, FALSE), "")
F12 단가: =IFERROR(VLOOKUP($B12, 품목!$A:$D, 4, FALSE), "")`}</code>
        </pre>
        <p>
          VLOOKUP은 품목 시트 A열에서 B12의 코드를 찾아, 같은 행의 2번째(품명)·3번째(규격)·4번째(단가) 칸 값을 가져옵니다. 마지막
          FALSE는 &ldquo;똑같은 코드만 찾으라&rdquo;는 뜻이라 빼먹으면 비슷한 코드의 엉뚱한 값을 가져옵니다. IFERROR는 코드를 아직 안
          적은 빈 줄에 #N/A 대신 빈칸을 보이게 합니다. 여러 조건으로 찾거나 여러 열을 한 번에 가져오는 방법은{" "}
          <Link href="/blog/excel-vlookup-multi/">VLOOKUP 여러 조건·여러 열</Link>에 있습니다.
        </p>

        <h2 id="xlookup">XLOOKUP으로 쓰기</h2>
        <p>Microsoft 365나 엑셀 2021 이상이라면 XLOOKUP이 더 읽기 쉽습니다. 몇 번째 열인지 세지 않고 가져올 열을 직접 고릅니다.</p>
        <pre className="postCode">
          <code>{`F12 단가: =XLOOKUP($B12, 품목!$A:$A, 품목!$D:$D, "")`}</code>
        </pre>
        <p>
          네 번째 인수 &ldquo;&rdquo;는 코드를 못 찾았을 때 보일 값이라 IFERROR를 따로 감쌀 필요가 없습니다. 품목 시트 중간에 열을
          끼워 넣어도 수식이 틀어지지 않는 것도 장점입니다.
        </p>

        <h2 id="amount">공급가액·세액·합계</h2>
        <pre className="postCode">
          <code>{`G12 공급가액: =IF(E12="", "", E12*F12)
H12 세액:     =IF(G12="", "", ROUNDDOWN(G12*0.1, 0))

P-1001  5 × 24,500 = 122,500   세액 12,250
P-1002  2 ×  6,000 =  12,000   세액  1,200
P-1003 10 ×  1,200 =  12,000   세액  1,200
공급가액 합계 146,500 + 세액 14,650 = 합계 161,150`}</code>
        </pre>
        <p>
          거래명세서는 품목마다 세액 칸이 있어 줄마다 세액을 계산하는 경우가 많습니다. 합계에서 한 번에 계산한 세액과 몇 원 차이가 날 수
          있는데, 어느 쪽으로 할지는 <Link href="/blog/excel-vat-formula/">엑셀 부가세 계산 수식</Link>을 참고하세요.
        </p>

        <h2 id="balance">전잔액·입금액·잔액</h2>
        <p>외상 거래처라면 명세서 아래에 잔액을 적어 두면 거래처와 금액을 맞추기 쉽습니다.</p>
        <pre className="postCode">
          <code>{`잔액 = 전잔액 + 이번 합계 − 이번 입금액

전잔액 300,000 + 합계 161,150 − 입금 200,000 = 잔액 261,150`}</code>
        </pre>
        <p>
          전잔액을 매번 손으로 옮기지 않으려면 거래처별 매출·입금 장부에서 SUMIFS로 뽑으면 됩니다. 방법은{" "}
          <Link href="/blog/excel-receivable-balance/">엑셀 거래처별 미수금 잔액</Link>에 정리했습니다.
        </p>

        <h2 id="errors">자주 생기는 문제</h2>
        <h3>코드가 분명히 있는데 #N/A(또는 빈칸)</h3>
        <p>
          코드 앞뒤에 공백이 붙었거나, 한쪽은 숫자 1001이고 다른 쪽은 텍스트 &ldquo;1001&rdquo;인 경우가 대부분입니다. 코드를
          P-1001처럼 글자를 섞어 정하면 숫자·텍스트 문제가 생기지 않습니다. 이미 숫자 코드를 쓰고 있다면{" "}
          <Link href="/blog/excel-text-to-number/">엑셀 텍스트를 숫자로 변환</Link>에서 양쪽 형식을 맞추세요.
        </p>
        <h3>단가를 올렸더니 지난 명세서 금액도 바뀜</h3>
        <p>
          수식은 품목 시트를 계속 바라보기 때문에, 품목 시트의 단가를 고치면 그 시트를 참조하는 지난 명세서도 새 단가로 바뀝니다. 발행한
          명세서는 품목 줄을 복사해 [선택하여 붙여넣기] → [값]으로 바꿔 두거나 PDF로 저장해 두세요.
        </p>
        <h3>두 부를 찍어야 할 때</h3>
        <p>
          공급자 보관용과 공급받는자 보관용을 한 장에 찍으려면 명세서 범위를 아래에 한 번 더 두고, 아래쪽 칸은 =A12처럼 위쪽 칸을
          참조하게 만듭니다. 제목만 &lsquo;(공급받는자 보관용)&rsquo;으로 바꾸면 위쪽만 고쳐도 두 부가 같이 바뀝니다.
        </p>

        <h2 id="summary">정리</h2>
        <ul>
          <li>품목 시트에 코드·품명·규격·단가를 한 번만 적어 둔다</li>
          <li>=IFERROR(VLOOKUP($B12, 품목!$A:$D, 열 번호, FALSE), &quot;&quot;)로 불러오기</li>
          <li>365·2021 이상은 =XLOOKUP(코드, 코드 열, 가져올 열, &quot;&quot;)</li>
          <li>공급가액 = 수량 × 단가, 세액 = ROUNDDOWN(공급가액 × 0.1, 0)</li>
          <li>잔액 = 전잔액 + 합계 − 입금액</li>
          <li>발행한 명세서는 값으로 붙여넣거나 PDF로 남기기</li>
        </ul>
      </>
    );
  },
};

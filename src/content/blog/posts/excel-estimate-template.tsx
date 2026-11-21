import Link from "next/link";
import type { Post } from "../types";

/**
 * 노리는 검색어: 엑셀 견적서 만들기, 엑셀 견적서 수식, 견적서 금액 자동 계산, 엑셀 견적서 인쇄 설정
 * 도구 /estimate/ 대표 검색어('견적서 양식')는 피한다. 부가세 원 미만 처리는 excel-vat-formula 글로 넘긴다.
 * 예시 숫자: 245,000 + 178,000 + 159,000 = 582,000, 세액 58,200, 합계 640,200(육십사만이백).
 */
export const excelEstimateTemplate: Post = {
  meta: {
    slug: "excel-estimate-template",
    title: "엑셀 견적서 만들기 - 금액·합계 수식과 인쇄 설정",
    h1: "엑셀 견적서 만들기: 금액·합계 자동 계산과 A4 한 장 인쇄",
    description:
      "엑셀로 견적서를 직접 만들 때 필요한 수식을 순서대로 정리했습니다. 수량×단가 금액, 빈 줄 처리, 공급가액·세액·합계, 일금 한글 금액, 견적번호·유효기간, A4 한 장에 맞춰 인쇄하는 설정까지 다룹니다.",
    keywords: [
      "엑셀 견적서 만들기",
      "엑셀 견적서 수식",
      "견적서 금액 자동 계산",
      "엑셀 견적서 인쇄 설정",
      "견적서 일금 한글",
      "엑셀 견적번호 자동",
    ],
    published: "2026-11-21",
    tool: "estimate",
    excerpt:
      "품목을 적으면 금액과 합계, 한글 금액까지 저절로 채워지는 견적서를 엑셀로 만드는 방법. 빈 줄 처리와 A4 한 장 인쇄 설정까지.",
    toc: [
      { id: "layout", title: "칸 배치" },
      { id: "amount", title: "금액: 수량 × 단가" },
      { id: "total", title: "공급가액·세액·합계" },
      { id: "korean", title: "일금 ○○원정" },
      { id: "header", title: "견적일·유효기간·견적번호" },
      { id: "print", title: "A4 한 장에 인쇄하기" },
      { id: "summary", title: "정리" },
    ],
  },
  Body() {
    return (
      <>
        <p>
          견적서는 품목과 수량만 바뀌고 나머지 계산은 매번 같습니다. 그런데 금액과 합계를 계산기로 두드려 옮겨 적으면 숫자 하나만 고쳐도
          합계, 부가세, 한글 금액을 모두 다시 써야 합니다. 처음 한 번 수식을 넣어 두면 품목만 바꿔 계속 쓸 수 있습니다.
        </p>
        <p>
          품목 표가 이미 엑셀에 있고 서식까지 만들 시간이 없다면 <Link href="/estimate/">견적서 양식 작성</Link>에 품목 표를
          붙여넣어 보세요. 아래 수식과 같은 계산으로 A4 견적서를 만들어 인쇄·PDF로 저장합니다. 엑셀 파일로 직접 관리하려면 아래 순서대로
          만들면 됩니다.
        </p>

        <h2 id="layout">칸 배치</h2>
        <p>
          위쪽 10줄 정도는 받는 곳·견적일·공급자 정보에 쓰고, 12행부터 품목을 적는다고 하겠습니다. 품목 칸은 A열 번호, B열 품목, C열 규격,
          D열 수량, E열 단가, F열 금액, G열 비고입니다.
        </p>
        <div className="postTableWrap">
          <table className="postTable">
            <thead>
              <tr>
                <th scope="col">A 번호</th>
                <th scope="col">B 품목</th>
                <th scope="col">C 규격</th>
                <th scope="col">D 수량</th>
                <th scope="col">E 단가</th>
                <th scope="col">F 금액</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>A4 복사용지</td>
                <td>80g 2,500매</td>
                <td>10</td>
                <td>24,500</td>
                <td>245,000</td>
              </tr>
              <tr>
                <td>2</td>
                <td>레이저 토너</td>
                <td>검정</td>
                <td>2</td>
                <td>89,000</td>
                <td>178,000</td>
              </tr>
              <tr>
                <td>3</td>
                <td>사무용 의자</td>
                <td>메시 등받이</td>
                <td>1</td>
                <td>159,000</td>
                <td>159,000</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>품목 줄은 21행까지 10줄을 잡아 두고, 22~24행에 공급가액·세액·합계를 둡니다.</p>

        <h2 id="amount">금액: 수량 × 단가</h2>
        <p>F12에 아래 수식을 넣고 F21까지 채웁니다.</p>
        <pre className="postCode">
          <code>{`=IF(D12="", "", D12*E12)`}</code>
        </pre>
        <p>
          그냥 =D12*E12만 쓰면 품목이 없는 빈 줄에 0이 찍혀 인쇄했을 때 지저분합니다. 수량이 비어 있으면 빈칸으로 두라는 조건을
          붙인 것입니다. 번호도 같은 방법으로 품목이 있을 때만 붙입니다.
        </p>
        <pre className="postCode">
          <code>{`A12: =IF(B12="", "", ROW()-11)`}</code>
        </pre>
        <p>
          ROW()는 지금 행 번호입니다. 12행에서 11을 빼면 1이 되고, 중간에 줄을 끼워 넣어도 번호가 저절로 다시 매겨집니다. 금액·단가
          칸은 [셀 서식] → 숫자 → &lsquo;1000 단위 구분 기호 사용&rsquo;을 켜 두세요.
        </p>

        <h2 id="total">공급가액·세액·합계</h2>
        <pre className="postCode">
          <code>{`F22 공급가액: =SUM(F12:F21)          → 582,000
F23 세액:     =ROUNDDOWN(F22*0.1, 0)  → 58,200
F24 합계:     =F22+F23                → 640,200`}</code>
        </pre>
        <p>
          SUM은 빈 줄의 &ldquo;&rdquo;(빈 글자)를 건너뛰고 숫자만 더합니다. 세액은 원 미만을 버리는 ROUNDDOWN이 일반적이지만, 품목마다
          세액을 따로 계산할지, 단가가 부가세 포함 금액일 때는 어떻게 거꾸로 구할지에 따라 몇 원씩 달라집니다. 이 부분은{" "}
          <Link href="/blog/excel-vat-formula/">엑셀 부가세 계산 수식</Link>에 따로 정리했습니다.
        </p>

        <h2 id="korean">일금 ○○원정</h2>
        <p>견적서 위쪽의 합계 금액 칸에는 고칠 수 없게 한글로도 적습니다. 엑셀 함수 NUMBERSTRING을 쓰면 합계가 바뀔 때 같이 바뀝니다.</p>
        <pre className="postCode">
          <code>{`="일금 "&NUMBERSTRING(F24, 1)&"원정 (₩"&TEXT(F24, "#,##0")&")"

→ 일금 육십사만이백원정 (₩640,200)`}</code>
        </pre>
        <p>
          NUMBERSTRING은 함수 목록에 나오지 않는 숨은 함수라 직접 입력해야 하고, 구글 시트에는 없습니다. 유형 1·2·3의 차이와 셀 서식으로
          하는 방법은 <Link href="/blog/excel-amount-korean/">엑셀 금액 한글로 표시하기</Link>에 있습니다.
        </p>

        <h2 id="header">견적일·유효기간·견적번호</h2>
        <pre className="postCode">
          <code>{`견적일(C5):   2026-11-21 (직접 입력, 또는 Ctrl+; 로 오늘 날짜)
유효기간:     =C5+30                         → 2026-12-21
견적번호:     =TEXT(C5, "yyyymmdd")&"-01"     → 20261121-01`}</code>
        </pre>
        <p>
          견적일에 =TODAY()를 넣으면 파일을 열 때마다 날짜가 바뀌어, 지난 견적서를 다시 열었을 때 날짜가 오늘로 바뀌어 버립니다. 견적일은
          Ctrl+;(세미콜론)으로 오늘 날짜를 값으로 넣는 편이 안전합니다. 유효기간은 날짜에 숫자를 더하면 그만큼 뒤의 날짜가 되고, 칸 서식이
          숫자로 바뀌어 보이면 [셀 서식] → 날짜로 바꾸세요.
        </p>

        <h2 id="print">A4 한 장에 인쇄하기</h2>
        <ol>
          <li>견적서 범위(A1:G30 등)를 선택하고 [페이지 레이아웃] → [인쇄 영역] → [인쇄 영역 설정]을 누릅니다.</li>
          <li>
            [페이지 레이아웃] → [크기 조정] 묶음에서 너비 &lsquo;1페이지&rsquo;, 높이 &lsquo;1페이지&rsquo;로 바꾸면 A4 한 장에 맞춰
            줄어듭니다.
          </li>
          <li>[페이지 설정] → [여백] 탭에서 &lsquo;페이지 가운데 맞춤&rsquo;의 가로를 켜면 종이 가운데에 찍힙니다.</li>
          <li>
            품목이 많아 두 장이 넘으면 [페이지 설정] → [시트] 탭의 &lsquo;반복할 행&rsquo;에 품목 머리글 행($11:$11)을 넣어 둘째 장에도
            머리글이 찍히게 합니다.
          </li>
        </ol>
        <p>
          PDF로 보낼 때는 [파일] → [다른 이름으로 저장]에서 PDF를 고르거나, 인쇄 창의 프린터를 &lsquo;Microsoft Print to PDF&rsquo;로
          바꾸면 됩니다.
        </p>

        <h2 id="summary">정리</h2>
        <ul>
          <li>금액: =IF(D12=&quot;&quot;, &quot;&quot;, D12*E12)로 빈 줄은 빈칸</li>
          <li>번호: =IF(B12=&quot;&quot;, &quot;&quot;, ROW()-11)</li>
          <li>공급가액 SUM, 세액 ROUNDDOWN(공급가액*0.1, 0), 합계는 둘을 더함</li>
          <li>한글 금액: =&quot;일금 &quot;&amp;NUMBERSTRING(합계, 1)&amp;&quot;원정&quot;</li>
          <li>견적일은 TODAY() 대신 Ctrl+;로 값을 넣기</li>
          <li>인쇄 영역 설정 + 너비·높이 1페이지 + 반복할 행</li>
        </ul>
      </>
    );
  },
};

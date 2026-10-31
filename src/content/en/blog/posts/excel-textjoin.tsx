import Link from "next/link";
import type { EnPost } from "../index";

/**
 * 영어 블로그 첫 글. 노리는 검색어: excel textjoin, textjoin ignore blanks, textjoin with quotes,
 * textjoin unique values, textjoin filter condition, textjoin not working.
 * /en/(column to comma separated list)의 대표 검색어와 겹치지 않게 TEXTJOIN 함수 쪽 롱테일로 쓴다.
 * 결과 예시는 파이썬으로 같은 규칙을 돌려 확인:
 *   ", " TRUE  → A-10234, B-20031, C-30012, D-40055
 *   ", " FALSE → A-10234, B-20031, , C-30012, D-40055
 *   "'"&A2:A6&"'" → 빈 칸이 '' 로 남음 / IF로 감싸면 'A-10234','B-20031','C-30012','D-40055'
 *   UNIQUE → C-30012, A-10234, B-20031 / SORT(UNIQUE) → A-10234, B-20031, C-30012
 *   FILTER North → A-10234, C-30012, E-50017
 */
export const excelTextjoin: EnPost = {
  meta: {
    slug: "excel-textjoin",
    title: "Excel TEXTJOIN: Join a Range with Commas, Quotes, No Blanks",
    h1: "Excel TEXTJOIN: Join a Range with Commas, Skip Blanks and Add Quotes",
    description:
      "Use Excel TEXTJOIN to join a range with commas, skip empty cells, wrap each value in quotes, join only unique or matching values, and fix #NAME? or #VALUE! errors.",
    keywords: [
      "excel textjoin",
      "textjoin ignore blanks",
      "textjoin with quotes",
      "textjoin unique values",
      "textjoin if condition",
      "textjoin not working",
    ],
    published: "2026-10-31",
    tool: "column-to-comma",
    excerpt:
      "TEXTJOIN joins a whole range into one cell. Here is how to skip blanks, add quotes without leaving empty '' pairs, and join only unique or matching values.",
    toc: [
      { id: "syntax", title: "TEXTJOIN syntax" },
      { id: "blanks", title: "Skip empty cells" },
      { id: "quotes", title: "Wrap each value in quotes" },
      { id: "unique", title: "Join unique values only" },
      { id: "condition", title: "Join values that match a condition" },
      { id: "line-breaks", title: "One value per line in a cell" },
      { id: "errors", title: "When TEXTJOIN does not work" },
      { id: "summary", title: "Summary" },
    ],
  },
  Body() {
    return (
      <>
        <p>
          TEXTJOIN puts every value in a range into one cell with a separator between them. It replaces long chains like
          =A2&amp;&quot;, &quot;&amp;A3&amp;&quot;, &quot;&amp;A4 and, unlike CONCAT, it can skip empty cells. The examples below
          use product codes in A2:A6, with A4 left empty on purpose.
        </p>

        <h2 id="syntax">TEXTJOIN syntax</h2>
        <pre className="postCode">
          <code>{`=TEXTJOIN(delimiter, ignore_empty, text1, [text2], ...)`}</code>
        </pre>
        <ul>
          <li>delimiter: what goes between values, for example &quot;, &quot; or &quot;;&quot;</li>
          <li>ignore_empty: TRUE skips empty cells, FALSE keeps them</li>
          <li>text1, text2: a range such as A2:A6, single cells, or text</li>
        </ul>
        <p>
          TEXTJOIN is available in Excel 2019, Excel 2021, Excel 2024, Microsoft 365 and Excel for the web. Google Sheets has a
          TEXTJOIN function with the same arguments.
        </p>

        <h2 id="blanks">Skip empty cells</h2>
        <pre className="postCode">
          <code>{`=TEXTJOIN(", ", TRUE, A2:A6)    → A-10234, B-20031, C-30012, D-40055
=TEXTJOIN(", ", FALSE, A2:A6)   → A-10234, B-20031, , C-30012, D-40055`}</code>
        </pre>
        <p>
          With FALSE the empty A4 still gets a separator, so you see two commas in a row. Use TRUE unless the position of each
          value matters.
        </p>

        <h2 id="quotes">Wrap each value in quotes</h2>
        <p>
          For an SQL IN clause you need &apos;A-10234&apos;,&apos;B-20031&apos;. The obvious formula has a trap:
        </p>
        <pre className="postCode">
          <code>{`=TEXTJOIN(",", TRUE, "'"&A2:A6&"'")
→ 'A-10234','B-20031','','C-30012','D-40055'`}</code>
        </pre>
        <p>
          Adding quotes turns the empty A4 into &apos;&apos;, which is no longer empty, so TRUE does not skip it. Check for
          blanks before adding the quotes:
        </p>
        <pre className="postCode">
          <code>{`=TEXTJOIN(",", TRUE, IF(A2:A6="", "", "'"&A2:A6&"'"))
→ 'A-10234','B-20031','C-30012','D-40055'`}</code>
        </pre>
        <p>
          For double quotes, as in a JSON array, use CHAR(34) in place of &quot;&apos;&quot;. In Excel 2019 a formula that
          works on a whole range like this may need to be confirmed with Ctrl+Shift+Enter; newer versions handle it with a
          plain Enter.
        </p>

        <h2 id="unique">Join unique values only</h2>
        <p>
          If A2:A6 holds C-30012, A-10234, B-20031, A-10234, C-30012, wrap the range in UNIQUE, and in SORT as well if you
          want the list in order. UNIQUE and SORT need Excel 2021, 2024 or Microsoft 365.
        </p>
        <pre className="postCode">
          <code>{`=TEXTJOIN(", ", TRUE, UNIQUE(A2:A6))         → C-30012, A-10234, B-20031
=TEXTJOIN(", ", TRUE, SORT(UNIQUE(A2:A6)))   → A-10234, B-20031, C-30012`}</code>
        </pre>

        <h2 id="condition">Join values that match a condition</h2>
        <p>
          With codes in A2:A6 and regions in B2:B6 (North, South, North, East, North), FILTER picks the rows first and
          TEXTJOIN joins what is left:
        </p>
        <pre className="postCode">
          <code>{`=TEXTJOIN(", ", TRUE, FILTER(A2:A6, B2:B6="North", ""))
→ A-10234, C-30012, E-50017`}</code>
        </pre>
        <p>
          The last argument of FILTER, &quot;&quot;, is what it returns when nothing matches, so the cell stays empty instead of
          showing an error.
        </p>

        <h2 id="line-breaks">One value per line in a cell</h2>
        <p>
          Use CHAR(10), the line break character, as the delimiter, then turn on Wrap Text for the cell. Without Wrap Text the
          values look joined on one line.
        </p>
        <pre className="postCode">
          <code>{`=TEXTJOIN(CHAR(10), TRUE, A2:A6)`}</code>
        </pre>

        <h2 id="errors">When TEXTJOIN does not work</h2>
        <ul>
          <li>
            <strong>#NAME?</strong> Your Excel version does not have TEXTJOIN (Excel 2016 and older). Join with &amp; or use a
            browser tool instead.
          </li>
          <li>
            <strong>#VALUE!</strong> The result is longer than 32,767 characters, the most one cell can hold. Split the range
            into parts.
          </li>
          <li>
            <strong>#N/A or another error</strong> One of the cells in the range already has that error. Fix the source cell or
            wrap the range in IFERROR(A2:A6, &quot;&quot;).
          </li>
          <li>
            <strong>The result is a formula, not text</strong> To paste the list elsewhere, copy the cell and use Paste
            Special, Values.
          </li>
        </ul>
        <p>
          If you only need the list once and do not want to keep a formula in the sheet, paste the column into the{" "}
          <Link href="/en/">Column to Comma Separated List converter</Link>. It can also skip blanks, remove duplicates, add
          quotes and build an SQL IN clause, and it runs entirely in your browser.
        </p>

        <h2 id="summary">Summary</h2>
        <ul>
          <li>Commas, skip blanks: =TEXTJOIN(&quot;, &quot;, TRUE, A2:A6)</li>
          <li>Quotes without empty pairs: =TEXTJOIN(&quot;,&quot;, TRUE, IF(A2:A6=&quot;&quot;, &quot;&quot;, &quot;&apos;&quot;&amp;A2:A6&amp;&quot;&apos;&quot;))</li>
          <li>Unique values: =TEXTJOIN(&quot;, &quot;, TRUE, UNIQUE(A2:A6))</li>
          <li>Matching rows: =TEXTJOIN(&quot;, &quot;, TRUE, FILTER(A2:A6, B2:B6=&quot;North&quot;, &quot;&quot;))</li>
          <li>One per line: =TEXTJOIN(CHAR(10), TRUE, A2:A6) plus Wrap Text</li>
        </ul>
      </>
    );
  },
};

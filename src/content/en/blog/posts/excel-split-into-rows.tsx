import Link from "next/link";
import type { EnPost } from "../index";

/**
 * 영어 블로그 세 번째 글. 노리는 검색어: excel split comma separated values into rows, excel textsplit into rows,
 * excel split cell into multiple rows, power query split into rows, excel split and repeat id.
 * google-sheets-split(구글 시트 SPLIT)의 엑셀 짝이지만 '열이 아니라 행으로, 옆 열 값은 반복'에 초점을 둔다.
 * /en/ 대표 검색어(column to comma separated list)는 피한다.
 * 예시는 파이썬으로 확인: 주문 3건(SO-1001 2개, SO-1002 1개, SO-1003 3개) → 6행,
 * TEXTJOIN(",",TRUE,B2:B4) → "A-10234, B-20031,C-30012,A-10234, D-40055, E-50017"(쉼표 뒤 공백이 섞임 → TRIM 필요).
 */
export const excelSplitIntoRows: EnPost = {
  meta: {
    slug: "excel-split-into-rows",
    title: "Excel: Split Comma Separated Values into Rows (TEXTSPLIT)",
    h1: "Excel: Split Comma Separated Values into Rows and Repeat the ID",
    description:
      "Split a cell with comma separated values into rows in Excel with TEXTSPLIT, keep the order ID on every row, use Power Query Split into Rows, and keep leading zeros.",
    keywords: [
      "excel split comma separated values into rows",
      "excel textsplit into rows",
      "excel split cell into multiple rows",
      "power query split into rows",
      "excel split cell and repeat id",
    ],
    published: "2026-11-04",
    tool: "column-to-comma",
    excerpt:
      "One cell holds A-10234, B-20031 and you need one value per row, with the order ID next to each. TEXTSPLIT, Power Query and a version for Excel 2019.",
    toc: [
      { id: "setup", title: "Example: items in one cell per order" },
      { id: "one-cell", title: "One cell into rows: TEXTSPLIT" },
      { id: "column", title: "A whole column into one list" },
      { id: "repeat-id", title: "Keep the order ID on every row" },
      { id: "power-query", title: "Power Query: Split into Rows" },
      { id: "older", title: "Excel 2019 and earlier" },
      { id: "zeros", title: "Leading zeros" },
      { id: "summary", title: "Summary" },
    ],
  },
  Body() {
    return (
      <>
        <p>
          Exports from order systems and forms often put several values in one cell: the items in an order, the tags on a ticket, the
          people on a team. To count, filter or look them up, you usually need one value per row. Splitting into columns is the easy
          part; this post is about splitting down into rows, and keeping the other columns next to each value.
        </p>

        <h2 id="setup">Example: items in one cell per order</h2>
        <div className="postTableWrap">
          <table className="postTable">
            <thead>
              <tr>
                <th scope="col">Row</th>
                <th scope="col">A Order</th>
                <th scope="col">B Items</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2</td>
                <td>SO-1001</td>
                <td>A-10234, B-20031</td>
              </tr>
              <tr>
                <td>3</td>
                <td>SO-1002</td>
                <td>C-30012</td>
              </tr>
              <tr>
                <td>4</td>
                <td>SO-1003</td>
                <td>A-10234, D-40055, E-50017</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>The goal is six rows, one per item, with the order number repeated: SO-1001 A-10234, SO-1001 B-20031, SO-1002 C-30012 and so on.</p>

        <h2 id="one-cell">One cell into rows: TEXTSPLIT</h2>
        <p>
          TEXTSPLIT (Microsoft 365 and Excel for the web) has two delimiter arguments. The second one splits across columns, the third
          one splits down rows. Leave the second empty to get a column:
        </p>
        <pre className="postCode">
          <code>{`=TEXTSPLIT(B4, ",")          → A-10234 | D-40055 | E-50017   (across)
=TEXTSPLIT(B4, , ",")        → A-10234
                                D-40055
                                E-50017                      (down)
=TRIM(TEXTSPLIT(B4, , ","))  → same, without the leading spaces`}</code>
        </pre>
        <p>
          Splitting at &quot;,&quot; leaves the space that followed each comma at the start of the next value, so &quot; D-40055&quot; will not
          match &quot;D-40055&quot; in a lookup. Wrap the result in TRIM, or split at &quot;, &quot; if every comma is followed by exactly one
          space. To split at more than one character, pass an array: TEXTSPLIT(B4, , {`{",", ";"}`}).
        </p>

        <h2 id="column">A whole column into one list</h2>
        <p>
          TEXTSPLIT does not spill a separate list for each cell of a range, so =TEXTSPLIT(B2:B4, , &quot;,&quot;) does not give you all six
          items. Join the column first, then split once:
        </p>
        <pre className="postCode">
          <code>{`=TRIM(TEXTSPLIT(TEXTJOIN(",", TRUE, B2:B4), , ","))
→ A-10234, B-20031, C-30012, A-10234, D-40055, E-50017 (one per row)`}</code>
        </pre>
        <p>
          The joined text is A-10234, B-20031,C-30012,A-10234, D-40055, E-50017, with some commas followed by a space and some not,
          which is another reason to keep TRIM. TEXTJOIN fails with #VALUE! when the joined text passes 32,767 characters; for long
          columns use Power Query below. Wrap the formula in UNIQUE to list each item once.
        </p>

        <h2 id="repeat-id">Keep the order ID on every row</h2>
        <p>
          A list of items alone loses which order each one came from. In Microsoft 365 one formula can build the two-column table,
          stacking the result for each row with REDUCE and VSTACK:
        </p>
        <pre className="postCode">
          <code>{`=DROP(REDUCE("", ROW(A2:A4), LAMBDA(acc, r,
   LET(v, TRIM(TEXTSPLIT(INDEX(B:B, r), , ",", TRUE)),
       VSTACK(acc, HSTACK(IF(v<>"", INDEX(A:A, r)), v))))), 1)

→ SO-1001  A-10234
  SO-1001  B-20031
  SO-1002  C-30012
  SO-1003  A-10234
  SO-1003  D-40055
  SO-1003  E-50017`}</code>
        </pre>
        <p>
          The TRUE in TEXTSPLIT drops empty pieces (from &quot;A-10234,,B-20031&quot; or a trailing comma). IF(v&lt;&gt;&quot;&quot;, &hellip;)
          simply repeats the order number once for each item, and DROP removes the empty first row that REDUCE starts with. The formula
          is easier to read than to write, so if you only need the table once, Power Query is the better choice.
        </p>

        <h2 id="power-query">Power Query: Split into Rows</h2>
        <ol>
          <li>Select the table and choose Data &gt; From Table/Range.</li>
          <li>In the Power Query editor, select the Items column.</li>
          <li>Choose Split Column &gt; By Delimiter, pick Comma, and open Advanced options.</li>
          <li>Set Split into to Rows and press OK.</li>
          <li>With the column still selected, choose Transform &gt; Format &gt; Trim to remove the spaces.</li>
          <li>Choose Close &amp; Load. The result is a new table with six rows and the order number repeated.</li>
        </ol>
        <p>
          The steps are saved, so when the export changes, paste the new data into the source table and press Refresh. This also works
          for tens of thousands of rows, where the formulas above get slow.
        </p>

        <h2 id="older">Excel 2019 and earlier</h2>
        <p>
          TEXTSPLIT is not available before Microsoft 365, but Power Query is built into Excel 2016 and later, so the steps above still
          work. For a quick one-off without Power Query, split into columns first and turn the result:
        </p>
        <ol>
          <li>Select the Items cell and choose Data &gt; Text to Columns &gt; Delimited &gt; Comma.</li>
          <li>Copy the cells it filled, right-click an empty cell and choose Paste Special &gt; Transpose.</li>
        </ol>
        <p>
          This works one cell at a time and does not repeat the order number. For a single cell, you can also paste the comma list
          into the <Link href="/en/">column to comma separated list converter</Link>, choose Comma under Split in the status bar and
          press To column. Copy the result and paste it down a column. The list stays in your browser and is not uploaded.
        </p>

        <h2 id="zeros">Leading zeros</h2>
        <p>
          TEXTSPLIT returns text, so codes such as 00123 keep their zeros. Text to Columns does not: it turns 00123 into the number 123
          unless you select the column in the last step of the wizard and set its data format to Text. Power Query may also detect the
          new column as a number; change its type back to Text before loading.
        </p>

        <h2 id="summary">Summary</h2>
        <ul>
          <li>One cell down a column: =TRIM(TEXTSPLIT(B2, , &quot;,&quot;)) (third argument, not second)</li>
          <li>Whole column: TEXTJOIN first, then TEXTSPLIT once</li>
          <li>Repeat the ID: REDUCE + VSTACK + HSTACK in Microsoft 365</li>
          <li>Large or repeated jobs: Power Query, Split Column by Delimiter, Split into Rows</li>
          <li>Quick one-off: Text to Columns, then Paste Special &gt; Transpose; set Text format to keep leading zeros</li>
        </ul>
      </>
    );
  },
};

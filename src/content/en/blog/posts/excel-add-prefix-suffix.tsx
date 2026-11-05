import Link from "next/link";
import type { EnPost } from "../index";

/**
 * 영어 블로그 네 번째 글. 노리는 검색어: excel add text to beginning of cell, add prefix to all cells excel,
 * excel add suffix to column, excel add text to end of cell, excel custom format add text.
 * /en/ 대표 검색어(column to comma separated list)와 겹치지 않게 '모든 칸 앞뒤에 글자 붙이기'를 다룬다.
 * 예시는 파이썬·사이트 utils(transform)로 확인: 2026-11-05의 엑셀 일련번호 46331,
 * 도구 Prefix SKU- · Suffix -KR → SKU-10234-KR …(빈 줄은 기본으로 빠짐), Remove empty lines 끄면 빈 줄이 'SKU-'로 남음.
 */
export const excelAddPrefixSuffix: EnPost = {
  meta: {
    slug: "excel-add-prefix-suffix",
    title: "Excel: Add Text to the Beginning or End of Every Cell",
    h1: "Excel: Add Text to the Beginning or End of Every Cell in a Column",
    description:
      "Add a prefix or suffix to every cell in Excel with & or CONCAT, skip blank cells, keep leading zeros and dates, show text with a custom format, or use Flash Fill.",
    keywords: [
      "excel add text to beginning of cell",
      "add prefix to all cells excel",
      "excel add suffix to column",
      "excel add text to end of cell",
      "excel custom format add text",
    ],
    published: "2026-11-05",
    tool: "column-to-comma",
    excerpt:
      "Turn 10234 into SKU-10234 down a whole column. Formulas, blanks, leading zeros, dates, a custom number format that only changes the display, and Flash Fill.",
    toc: [
      { id: "formula", title: "The basic formula" },
      { id: "values", title: "Replace the original column" },
      { id: "blanks", title: "Skip blank cells" },
      { id: "once", title: "Only add it where it is missing" },
      { id: "numbers", title: "Leading zeros and dates" },
      { id: "format", title: "Custom number format: display only" },
      { id: "other", title: "Flash Fill, Google Sheets and a no-formula option" },
      { id: "summary", title: "Summary" },
    ],
  },
  Body() {
    return (
      <>
        <p>
          Product codes need a SKU- in front, file names need .pdf at the end, phone numbers need a country code. Excel has no button
          for &ldquo;add this text to every cell&rdquo;, but a short formula does it for any number of rows. The examples use codes such
          as 10234 in A2:A100.
        </p>

        <h2 id="formula">The basic formula</h2>
        <p>Put the formula in B2 and fill it down (double-click the fill handle at the bottom-right corner of B2).</p>
        <pre className="postCode">
          <code>{`Prefix:  ="SKU-"&A2          → SKU-10234
Suffix:  =A2&"-KR"           → 10234-KR
Both:    ="SKU-"&A2&"-KR"    → SKU-10234-KR
Same with CONCAT: =CONCAT("SKU-", A2)`}</code>
        </pre>
        <p>
          The text goes in double quotes, and &amp; joins the pieces. Include any space or separator inside the quotes: =&quot;Dr. &quot;&amp;A2
          adds the space after the period. In Microsoft 365 a single formula can fill the whole column: =&quot;SKU-&quot;&amp;A2:A100 spills
          down by itself.
        </p>

        <h2 id="values">Replace the original column</h2>
        <p>
          The new column still depends on column A, so deleting A breaks it. To keep only the result, select B2:B100, copy, then use
          Paste Special &gt; Values (Ctrl+Alt+V, then V) on the same cells. Once they are plain text you can delete column A or paste
          the values over it.
        </p>

        <h2 id="blanks">Skip blank cells</h2>
        <p>
          Empty rows otherwise turn into a lonely SKU-. Check for a blank first:
        </p>
        <pre className="postCode">
          <code>{`=IF(A2="", "", "SKU-"&A2)
Microsoft 365, whole column: =IF(A2:A100="", "", "SKU-"&A2:A100)`}</code>
        </pre>

        <h2 id="once">Only add it where it is missing</h2>
        <p>
          When some codes already have the prefix (SKU-10235 next to 10236), adding it again gives SKU-SKU-10235. Test the first
          characters before adding:
        </p>
        <pre className="postCode">
          <code>{`=IF(LEFT(A2, 4)="SKU-", A2, "SKU-"&A2)
For a suffix: =IF(RIGHT(A2, 4)=".pdf", A2, A2&".pdf")`}</code>
        </pre>
        <p>The 4 is the length of the prefix or suffix; change it with the text. The = comparison ignores case, so sku- also counts as present.</p>

        <h2 id="numbers">Leading zeros and dates</h2>
        <p>
          &amp; uses the stored value, not what the cell shows. A code formatted to show 00123 is stored as 123, so =&quot;INV-&quot;&amp;A2
          returns INV-123. A date shown as 2026-11-05 is stored as the number 46331, so =&quot;Due &quot;&amp;A2 returns Due 46331. Wrap the
          cell in TEXT with the format you want to see:
        </p>
        <pre className="postCode">
          <code>{`="INV-"&TEXT(A2, "00000")        → INV-00123
="Due "&TEXT(A2, "yyyy-mm-dd")    → Due 2026-11-05`}</code>
        </pre>
        <p>
          If the zeros were typed into a text-formatted cell (the cell really contains 00123), the plain formula keeps them and TEXT is
          not needed.
        </p>

        <h2 id="format">Custom number format: display only</h2>
        <p>
          If the prefix is only for the eye, for example on a printed report, you can leave the values alone and change the format.
          Select the cells, press Ctrl+1, choose Number &gt; Custom and type a format:
        </p>
        <pre className="postCode">
          <code>{`"SKU-"@      text cells   → shows SKU-A10234
"SKU-"0      number cells → shows SKU-10234
0" pcs"      suffix       → shows 25 pcs`}</code>
        </pre>
        <p>
          The cell still contains 10234: formulas, sorting and lookups see the original value, and copying the cell into another program
          pastes 10234 without the prefix. Use the formula approach whenever the prefix has to be part of the data, for example in an
          import file.
        </p>

        <h2 id="other">Flash Fill, Google Sheets and a no-formula option</h2>
        <p>
          Flash Fill can also do it: type SKU-10234 next to the first code, press Enter, then press Ctrl+E in the cell below. Excel
          repeats the pattern down the column. It creates plain values, so it will not update when column A changes.
        </p>
        <p>In Google Sheets the same formulas work; to fill a whole column at once, wrap them in ARRAYFORMULA:</p>
        <pre className="postCode">
          <code>{`=ARRAYFORMULA(IF(A2:A="", "", "SKU-"&A2:A))`}</code>
        </pre>
        <p>
          Without any formula, copy the column into the <Link href="/en/">column to comma separated list converter</Link>, type SKU- in
          Prefix (and -KR in Suffix if needed) under Add before / after, and press To column. The result, SKU-10234-KR and so on, pastes
          back down a column. Empty lines are dropped by default; untick Remove empty lines if the rows must stay aligned with the
          original, keeping in mind that each empty line then becomes SKU-. The same page can join the result with commas or quotes if
          the list is going into an email or an SQL query.
        </p>

        <h2 id="summary">Summary</h2>
        <ul>
          <li>Prefix: =&quot;SKU-&quot;&amp;A2, suffix: =A2&amp;&quot;-KR&quot;, then Paste Special &gt; Values to keep the result</li>
          <li>Skip blanks: =IF(A2=&quot;&quot;, &quot;&quot;, &quot;SKU-&quot;&amp;A2)</li>
          <li>Avoid doubles: =IF(LEFT(A2, 4)=&quot;SKU-&quot;, A2, &quot;SKU-&quot;&amp;A2)</li>
          <li>Leading zeros and dates: TEXT(A2, &quot;00000&quot;) or TEXT(A2, &quot;yyyy-mm-dd&quot;)</li>
          <li>Display only: custom format &quot;SKU-&quot;@ or &quot;SKU-&quot;0 (the value does not change)</li>
        </ul>
      </>
    );
  },
};

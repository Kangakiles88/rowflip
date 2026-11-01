import Link from "next/link";
import type { EnPost } from "../index";

/**
 * 영어 블로그 두 번째 글. 노리는 검색어: google sheets split function, google sheets split by comma,
 * google sheets split text into rows, split by line break google sheets, google sheets split not working.
 * /en/(column to comma separated list)의 대표 검색어와 겹치지 않게 SPLIT 함수 쪽 롱테일로 쓴다.
 * 결과 예시는 split_by_each·remove_empty_text 규칙을 파이썬으로 따라 해 확인:
 *   "Jordan Lee, Priya Shah, Sam Ortiz" + ", " (기본 TRUE) → Jordan | Lee | Priya | Shah | Sam | Ortiz
 *   같은 값 + ", " FALSE → Jordan Lee | Priya Shah | Sam Ortiz
 *   "A-10234,,C-30012" + "," (remove_empty_text 기본 TRUE) → A-10234 | C-30012, FALSE면 가운데 빈 칸이 남음
 */
export const googleSheetsSplit: EnPost = {
  meta: {
    slug: "google-sheets-split",
    title: "Google Sheets SPLIT: By Comma, Line Break, Into Rows",
    h1: "Google Sheets SPLIT Function: Split by Comma, Line Break, or Into Rows",
    description:
      "How Google Sheets SPLIT works, why \", \" splits names apart, how to split by line break, put the pieces in rows instead of columns, and keep leading zeros.",
    keywords: [
      "google sheets split function",
      "google sheets split by comma",
      "google sheets split text into rows",
      "split by line break google sheets",
      "google sheets split not working",
    ],
    published: "2026-11-01",
    tool: "column-to-comma",
    excerpt:
      "SPLIT breaks one cell into several. Here is why \", \" splits names apart, how to split by line break, into rows instead of columns, and without losing leading zeros.",
    toc: [
      { id: "syntax", title: "SPLIT syntax" },
      { id: "split-by-each", title: "Why \", \" splits names apart" },
      { id: "empty", title: "Empty pieces between delimiters" },
      { id: "line-break", title: "Split by line break" },
      { id: "rows", title: "Put the pieces in rows" },
      { id: "zeros", title: "Leading zeros disappear" },
      { id: "menu", title: "Without a formula: Split text to columns" },
      { id: "summary", title: "Summary" },
    ],
  },
  Body() {
    return (
      <>
        <p>
          SPLIT takes one cell and spreads its pieces across the cells to the right. It is the quickest way to break up a
          comma-separated list that arrived in a single cell, such as tags from a form or a list of names pasted from an email. Most
          surprises come from two optional arguments that are on by default.
        </p>

        <h2 id="syntax">SPLIT syntax</h2>
        <pre className="postCode">
          <code>{`=SPLIT(text, delimiter, [split_by_each], [remove_empty_text])

=SPLIT(A2, ",")`}</code>
        </pre>
        <ul>
          <li>text: the cell to split</li>
          <li>delimiter: the character or characters to split at</li>
          <li>split_by_each: TRUE by default. Every character in the delimiter is used on its own</li>
          <li>remove_empty_text: TRUE by default. Empty pieces are dropped</li>
        </ul>
        <p>The result spills into the cells to the right, so leave those cells empty or you will get a #REF! error.</p>

        <h2 id="split-by-each">Why &quot;, &quot; splits names apart</h2>
        <p>Say A2 holds a list of names separated by a comma and a space.</p>
        <pre className="postCode">
          <code>{`A2: Jordan Lee, Priya Shah, Sam Ortiz

=SPLIT(A2, ", ")          → Jordan | Lee | Priya | Shah | Sam | Ortiz
=SPLIT(A2, ", ", FALSE)   → Jordan Lee | Priya Shah | Sam Ortiz`}</code>
        </pre>
        <p>
          Because split_by_each is TRUE, the delimiter &quot;, &quot; is read as two separate delimiters: a comma and a space. Every space
          inside a name becomes a split point too. Set the third argument to FALSE to treat &quot;, &quot; as one delimiter.
        </p>
        <p>
          If the spacing after commas is inconsistent (some &quot;, &quot;, some &quot;,&quot;), split by the comma alone and trim each piece
          instead:
        </p>
        <pre className="postCode">
          <code>{`=ARRAYFORMULA(TRIM(SPLIT(A2, ",")))`}</code>
        </pre>

        <h2 id="empty">Empty pieces between delimiters</h2>
        <p>
          With two commas in a row, as in A-10234,,C-30012, SPLIT drops the empty piece by default and returns two cells. If the position
          of each piece matters (the third value must always land in the third column), keep the empty piece with the fourth argument:
        </p>
        <pre className="postCode">
          <code>{`=SPLIT(A2, ",")               → A-10234 | C-30012
=SPLIT(A2, ",", TRUE, FALSE)  → A-10234 | (empty) | C-30012`}</code>
        </pre>

        <h2 id="line-break">Split by line break</h2>
        <p>
          Cells with several lines (typed with Ctrl+Enter or imported from a form) use a line feed character between lines. Pass it with
          CHAR(10):
        </p>
        <pre className="postCode">
          <code>{`=SPLIT(A2, CHAR(10))`}</code>
        </pre>
        <p>
          If some lines still end with an invisible character, the text probably came from Windows with CHAR(13) as well. Split by both
          with =SPLIT(A2, CHAR(13)&amp;CHAR(10)); split_by_each treats them as two delimiters and the empty pieces are dropped.
        </p>

        <h2 id="rows">Put the pieces in rows</h2>
        <p>SPLIT always returns a row. To list the pieces down a column instead, wrap it in TRANSPOSE:</p>
        <pre className="postCode">
          <code>{`=TRANSPOSE(SPLIT(A2, ","))`}</code>
        </pre>
        <p>
          To turn a whole column of comma lists into one long column, split every row and stack the result with TOCOL. The second
          argument 3 skips both the blank cells left by shorter lists and the errors from empty rows:
        </p>
        <pre className="postCode">
          <code>{`=TOCOL(ARRAYFORMULA(TRIM(SPLIT(A2:A100, ","))), 3)`}</code>
        </pre>
        <p>
          If you only need this once, you can also paste the comma list into the{" "}
          <Link href="/en/">column to comma separated list converter</Link> and press To column. It splits a single comma-separated
          cell into one value per line, which you can paste back down a column. The same page turns the column back into a comma list
          when you are done.
        </p>

        <h2 id="zeros">Leading zeros disappear</h2>
        <p>
          SPLIT converts any piece that looks like a number into a number, so a list such as 00123, 00456 comes back as 123 and 456. When
          all codes have the same length, format them back with TEXT:
        </p>
        <pre className="postCode">
          <code>{`=ARRAYFORMULA(TEXT(SPLIT(A2, ","), "00000"))   → 00123 | 00456`}</code>
        </pre>
        <p>
          The result is text, which is what you want for codes. For codes of different lengths, check the split values against the
          original before you use them.
        </p>

        <h2 id="menu">Without a formula: Split text to columns</h2>
        <p>
          For a one-time cleanup, select the column and choose Data &gt; Split text to columns. A small separator box appears where you
          can pick comma, semicolon, period, space or a custom separator. Unlike SPLIT, this overwrites the cells to the right with plain
          values, so insert empty columns first if there is data next to it.
        </p>

        <h2 id="summary">Summary</h2>
        <ul>
          <li>=SPLIT(A2, &quot;,&quot;) splits at each comma and drops empty pieces</li>
          <li>&quot;, &quot; splits at commas and spaces separately unless the third argument is FALSE</li>
          <li>Inconsistent spacing: =ARRAYFORMULA(TRIM(SPLIT(A2, &quot;,&quot;)))</li>
          <li>Line breaks: CHAR(10)</li>
          <li>Into rows: TRANSPOSE for one cell, TOCOL(&hellip;, 3) for a whole column</li>
          <li>Leading zeros: rebuild them with TEXT(&hellip;, &quot;00000&quot;)</li>
        </ul>
      </>
    );
  },
};

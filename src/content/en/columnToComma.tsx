import type { FaqItem, Guide } from "@/content/seo";

/**
 * 영어 첫 페이지(/en/) — 한국어 '/'(엑셀 가로세로 변환기)와 같은 도구.
 * 노리는 검색어: column to comma separated list, excel column to comma separated list,
 * convert column to comma list online, comma separated list to column.
 * 예시 값은 transformer로 직접 돌려 확인한 결과.
 */
export const EN_HOME = {
  path: "/en/",
  koPath: "/",
  h1: "Column to Comma Separated List Converter",
  title: "Column to Comma Separated List Converter for Excel | RowFlip",
  description:
    "Convert an Excel or Google Sheets column to a comma separated list, one row, an SQL IN clause or a JSON array, and split a comma list back. Free, in your browser.",
  keywords: [
    "column to comma separated list",
    "excel column to comma separated list",
    "convert column to comma separated list",
    "comma separated list to column",
    "excel column to row",
    "list to sql in clause",
    "column to json array",
    "remove duplicates from list",
  ],
  features: [
    "Convert a column to a comma separated list",
    "Convert a comma separated list back to a column",
    "Turn a column into one Excel row",
    "Remove duplicates and sort",
    "Add prefix, suffix, quotes and numbering",
    "Build an SQL IN clause",
    "Build JSON, JavaScript and Python arrays",
  ],
  ogImage: "/og-en.png",
} as const;

export const EN_GUIDES: Guide[] = [
  {
    id: "column-to-comma",
    title: "Excel column to comma separated list",
    body: "Copy the cells of one column, paste them into the source box and press ‘Comma list’. Each cell becomes one item joined by a comma and a space. Use the separator menu for a plain comma, pipe, slash, space or your own text.",
    input: "A-10234\nA-10871\nB-20017",
    output: "A-10234, A-10871, B-20017",
  },
  {
    id: "comma-to-column",
    title: "Comma separated list back to a column",
    body: "Paste the list and choose ‘Comma’ under Split in the status bar (a ‘Split by comma’ button appears when the input looks like a comma list), then press ‘To column’. Copy the result and paste it into Excel to fill one cell per line.",
    input: "A-10234, A-10871, B-20017",
    output: "A-10234\nA-10871\nB-20017",
  },
  {
    id: "column-to-row",
    title: "Turn a column into one row",
    body: "‘To row’ joins the items with tabs. Paste the result into a single cell in Excel or Google Sheets and the values spread across the row to the right.",
    input: "A-10234\nA-10871\nB-20017",
    output: "A-10234⇥A-10871⇥B-20017",
  },
  {
    id: "sql-in",
    title: "SQL IN clause from a column",
    body: "‘SQL IN’ trims spaces, drops empty lines and duplicates, wraps every value in single quotes and adds the brackets, ready for WHERE code IN (…).",
    input: "A-10234\nA-10871\nB-20017",
    output: "('A-10234','A-10871','B-20017')",
  },
  {
    id: "json-array",
    title: "JSON, JavaScript or Python array",
    body: "Pick JSON, JS or Python under Output format. JSON is compact; the JS and Python formats add a space after each comma.",
    input: "A-10234\nA-10871\nB-20017",
    output: '["A-10234","A-10871","B-20017"]',
  },
  {
    id: "dedupe-sort",
    title: "Remove duplicates and sort a list",
    body: "Tick ‘Remove duplicates’ and choose a sort order. The first occurrence of each value is kept; the status bar shows how many duplicates and empty lines were removed.",
    input: "B-20017\nA-10234\nB-20017\nA-10871",
    output: "A-10234\nA-10871\nB-20017",
  },
];

export const EN_FAQ: FaqItem[] = [
  {
    q: "Is my data uploaded anywhere?",
    a: "No. The conversion runs in your browser. The data you paste and the result are not sent to a server and are not saved. Only option settings, such as the separator you picked, are stored in your browser.",
    plain:
      "No. The conversion runs in your browser. The data you paste and the result are not sent to a server and are not saved. Only option settings, such as the separator you picked, are stored in your browser.",
  },
  {
    q: "Will leading zeros like 00123 stay when I paste back into Excel?",
    a: "Yes. When a column or row result contains values such as 00123 or long numbers, Copy also puts a table version on the clipboard that marks those cells as text, so Excel keeps the zeros.",
    plain:
      "Yes. When a column or row result contains values such as 00123 or long numbers, Copy also puts a table version on the clipboard that marks those cells as text, so Excel keeps the zeros.",
  },
  {
    q: "Can I do this with an Excel formula instead?",
    a: "In Excel 2019, Microsoft 365 and Google Sheets, =TEXTJOIN(\", \", TRUE, A2:A100) joins a range with a comma and skips empty cells. This page is quicker when you also need to remove duplicates, add quotes or produce an SQL or JSON list.",
    plain:
      "In Excel 2019, Microsoft 365 and Google Sheets, =TEXTJOIN(\", \", TRUE, A2:A100) joins a range with a comma and skips empty cells. This page is quicker when you also need to remove duplicates, add quotes or produce an SQL or JSON list.",
  },
  {
    q: "I copied several columns. Which one is converted?",
    a: "All cells are used, row by row. When more than one column is detected, a menu in the status bar lets you pick a single column.",
    plain:
      "All cells are used, row by row. When more than one column is detected, a menu in the status bar lets you pick a single column.",
  },
  {
    q: "How long can the list be?",
    a: "Tens of thousands of lines work. The result follows your typing with a short delay so the page stays responsive on large pastes.",
    plain:
      "Tens of thousands of lines work. The result follows your typing with a short delay so the page stays responsive on large pastes.",
  },
];

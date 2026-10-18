import { parseTable } from "./parser";
import { hasMultilineCell, toHtmlTable } from "./transpose";

/**
 * 엑셀에 붙여넣을 때 망가지기 쉬운 값 — 앞자리 0이 있는 숫자(010, 00123),
 * 16자리 이상 숫자(카드·계좌번호: 엑셀은 15자리 넘으면 뒤를 0으로 바꾼다).
 */
export const looksLikeText = (s: string) => /^0\d+$/.test(s) || /^\d{16,}$/.test(s);

/**
 * 표 결과를 엑셀에 붙여넣을 때 함께 넣을 표 형식(HTML).
 * 셀 안 줄바꿈이 있거나 앞자리 0 같은 값이 있을 때만 만든다 — 그 칸은 '텍스트' 서식으로 넣어 엑셀이 숫자로 바꾸지 않게 한다.
 * 필요 없으면 undefined(글자만 복사).
 */
export function excelHtmlForRows(rows: string[][]): string | undefined {
  const needsText = rows.some((r) => r.some(looksLikeText));
  if (!needsText && !hasMultilineCell(rows)) return undefined;
  return toHtmlTable(rows, looksLikeText);
}

/**
 * 목록 결과 글자(탭·줄바꿈) → 엑셀용 표 형식. 앞자리 0 같은 값이 있을 때만 만든다.
 * 셀 안 줄바꿈 때문에는 만들지 않는다 — 코드·글 결과를 문서 편집기에 붙여넣을 때 표로 바뀌지 않게.
 */
export function excelHtmlForText(text: string): string | undefined {
  if (text === "" || !/\d/.test(text)) return undefined;
  const rows = parseTable(text).rows;
  return rows.some((r) => r.some(looksLikeText)) ? toHtmlTable(rows, looksLikeText) : undefined;
}

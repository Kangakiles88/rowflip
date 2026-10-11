import styles from "./tool.module.css";

interface Props {
  rows: string[][];
  maxRows?: number;
  maxCols?: number;
  /** 첫 행을 머리글처럼 강조 */
  headerRow?: boolean;
  /** 비교 기준 열처럼 눈에 띄게 할 열(0부터) */
  highlightCol?: number;
}

/** 엑셀처럼 열 이름(A, B, …)과 행 번호가 붙은 결과 미리보기. 큰 표는 앞부분만 그린다. */
export function SheetPreview({ rows, maxRows = 200, maxCols = 40, headerRow = false, highlightCol }: Props) {
  const hl = (c: number) => (c === highlightCol ? styles.gridKeyCol : undefined);
  const shown = rows.slice(0, maxRows);
  const width = shown.reduce((m, r) => Math.max(m, r.length), 0);
  const cols = Math.min(width, maxCols);
  return (
    <div className={styles.tableWrap}>
      <table className={`${styles.grid} ${headerRow ? styles.gridHead : ""}`}>
        <thead>
          <tr>
            <th aria-hidden="true" />
            {Array.from({ length: cols }, (_, c) => (
              <th key={c} scope="col" className={hl(c)} title={c === highlightCol ? "비교 기준 열" : undefined}>
                {columnLetter(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={i}>
              <th scope="row">{i + 1}</th>
              {Array.from({ length: cols }, (_, c) => (
                <td key={c} className={hl(c)}>
                  {r[c] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 0 → A, 25 → Z, 26 → AA — 엑셀 열 이름 */
export function columnLetter(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

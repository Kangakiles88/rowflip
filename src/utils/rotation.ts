/**
 * 새로고침할 때마다 다음 상품을 보여 주는 순번 계산.
 * 처음 방문이면(저장값 없음) 무작위로 시작해 모든 방문자가 같은 상품만 먼저 보지 않게 한다.
 */
export function nextRotationIndex(stored: string | null, length: number, random: number): number {
  if (length <= 0) return 0;
  const prev = stored === null ? NaN : Number.parseInt(stored, 10);
  if (!Number.isInteger(prev) || prev < 0) return Math.floor(random * length) % length;
  return (prev + 1) % length;
}

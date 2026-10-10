import { describe, expect, it } from "vitest";
import { nextRotationIndex } from "./rotation";

describe("nextRotationIndex", () => {
  it("저장된 순번 다음 상품, 끝이면 처음으로", () => {
    expect(nextRotationIndex("0", 5, 0)).toBe(1);
    expect(nextRotationIndex("4", 5, 0)).toBe(0);
  });
  it("상품 수가 줄어 순번이 넘쳐도 범위 안으로", () => {
    expect(nextRotationIndex("9", 5, 0)).toBe(0);
  });
  it("처음 방문이나 이상한 값이면 무작위 시작", () => {
    expect(nextRotationIndex(null, 5, 0.5)).toBe(2);
    expect(nextRotationIndex("abc", 5, 0.99)).toBe(4);
    expect(nextRotationIndex("-1", 5, 0)).toBe(0);
  });
  it("상품이 없으면 0", () => {
    expect(nextRotationIndex(null, 0, 0.5)).toBe(0);
  });
});

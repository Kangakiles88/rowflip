import { describe, expect, it } from "vitest";
import { whiteToTransparent } from "./sealImage";

describe("whiteToTransparent", () => {
  it("흰색은 투명, 빨간 도장색은 그대로, 그 사이는 반투명", () => {
    const px = new Uint8ClampedArray([
      255, 255, 255, 255, // 흰색
      200, 30, 30, 255, // 빨강
      220, 220, 220, 255, // 밝은 회색(경계)
    ]);
    whiteToTransparent(px);
    expect(px[3]).toBe(0);
    expect(px[7]).toBe(255);
    expect(px[11]).toBeGreaterThan(0);
    expect(px[11]).toBeLessThan(255);
  });
});

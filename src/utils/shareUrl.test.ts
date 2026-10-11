import { describe, expect, it } from "vitest";
import { withShareUtm } from "./shareUrl";

describe("withShareUtm", () => {
  it("채널별 꼬리표를 붙인다", () => {
    expect(withShareUtm("https://rowflip.com/dedupe/", "kakao")).toBe(
      "https://rowflip.com/dedupe/?utm_source=kakao&utm_medium=share&utm_campaign=rowflip_share",
    );
  });
  it("이미 물음표가 있으면 &로 잇는다", () => {
    expect(withShareUtm("https://rowflip.com/?a=1", "copy")).toBe(
      "https://rowflip.com/?a=1&utm_source=copy&utm_medium=share&utm_campaign=rowflip_share",
    );
  });
});

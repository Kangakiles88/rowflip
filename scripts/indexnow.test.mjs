import { describe, expect, it } from "vitest";
import { changedPaths, pageText, sitemapPaths } from "./indexnow.mjs";

describe("sitemapPaths", () => {
  it("loc 주소를 경로로", () => {
    const xml = `<urlset><url><loc>https://rowflip.com/</loc></url><url><loc>https://rowflip.com/blog/excel-vat-formula/</loc></url></urlset>`;
    expect(sitemapPaths(xml)).toEqual(["/", "/blog/excel-vat-formula/"]);
  });
});

describe("pageText", () => {
  it("스크립트·파일 이름이 달라도 화면 글자가 같으면 같다", () => {
    const a = `<head><title>견적서 양식 | RowFlip</title><meta name="description" content="부가세 별도"><script src="/_next/a1.js"></script></head><body><h1>견적서</h1><script>self.__next_f.push([1,"a"])</script></body>`;
    const b = `<head><title>견적서 양식 | RowFlip</title><meta name="description" content="부가세 별도"><script src="/_next/b2.js"></script></head><body><h1>견적서</h1><script>self.__next_f.push([1,"b"])</script></body>`;
    expect(pageText(a)).toBe(pageText(b));
  });
  it("설명(meta)만 바뀌어도 다르다", () => {
    const a = `<meta name="description" content="A-10234"><h1>t</h1>`;
    const b = `<meta name="description" content="A-10235"><h1>t</h1>`;
    expect(pageText(a)).not.toBe(pageText(b));
  });
  it("문자 참조를 풀어 비교", () => {
    expect(pageText("<p>&#x27;2026년&#x27; &amp; 합계</p>")).toBe("'2026년' & 합계");
  });
});

describe("changedPaths", () => {
  const text = { "/": "가", "/count/": "나", "/old/": "다" };
  it("새 주소·바뀐 주소·사라진 주소", () => {
    const next = { "/": "가", "/count/": "나2", "/blog/new/": "라" };
    const r = changedPaths(Object.keys(next), Object.keys(text), (p) => next[p], (p) => text[p]);
    expect(r.changed).toEqual(["/count/", "/blog/new/"]);
    expect(r.removed).toEqual(["/old/"]);
  });
});

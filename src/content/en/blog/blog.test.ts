import { describe, expect, it } from "vitest";
import { EN_TOOL_PAGES } from "../../../config/navEn";
import { enPostPath, formatEnDate, getEnPost, getEnPosts } from "./index";

const posts = getEnPosts();

describe("영어 블로그 글 목록", () => {
  it("slug는 겹치지 않고 주소에 쓸 수 있는 글자만 쓴다", () => {
    const slugs = posts.map((p) => p.meta.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("제목·설명이 검색 결과에 맞는 길이다", () => {
    for (const { meta } of posts) {
      expect(meta.title.length).toBeLessThanOrEqual(60);
      expect(meta.description.length).toBeGreaterThanOrEqual(80);
      expect(meta.description.length).toBeLessThanOrEqual(170);
    }
  });

  it("이어지는 영어 도구 페이지가 실제로 있다", () => {
    const ids = new Set<string>(EN_TOOL_PAGES.map((t) => t.id));
    for (const { meta } of posts) expect(ids.has(meta.tool)).toBe(true);
  });

  it("목차 id가 겹치지 않고 날짜 형식이 맞다", () => {
    for (const { meta } of posts) {
      const ids = meta.toc.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(meta.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("도우미", () => {
    expect(getEnPost(posts[0].meta.slug)).toBe(posts[0]);
    expect(enPostPath("a-b")).toBe("/en/blog/a-b/");
    expect(formatEnDate("2026-10-31")).toBe("October 31, 2026");
  });
});

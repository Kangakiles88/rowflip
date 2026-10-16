import { describe, expect, it } from "vitest";
import { TOOL_PAGES } from "../../config/nav";
import { formatDate, getPost, getPosts, getPostsForTool, postPath } from "./index";

const posts = getPosts();

describe("블로그 글 목록", () => {
  it("글이 하나 이상 있다", () => {
    expect(posts.length).toBeGreaterThan(0);
  });

  it("slug는 겹치지 않고 주소에 쓸 수 있는 글자만 쓴다", () => {
    const slugs = posts.map((p) => p.meta.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("제목·설명이 검색 결과에 맞는 길이다", () => {
    for (const { meta } of posts) {
      expect(meta.title.length).toBeLessThanOrEqual(45);
      expect(meta.description.length).toBeGreaterThanOrEqual(80);
      expect(meta.description.length).toBeLessThanOrEqual(170);
    }
  });

  it("제목이 기능 페이지 제목과 겹치지 않는다", () => {
    const toolTitles = new Set<string>(TOOL_PAGES.map((t) => t.title));
    for (const { meta } of posts) expect(toolTitles.has(meta.h1)).toBe(false);
  });

  it("이어지는 기능 페이지가 실제로 있다", () => {
    const ids = new Set<string>(TOOL_PAGES.map((t) => t.id));
    for (const { meta } of posts) expect(ids.has(meta.tool)).toBe(true);
  });

  it("날짜는 YYYY-MM-DD이고 수정일은 게시일 이후다", () => {
    for (const { meta } of posts) {
      expect(meta.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (meta.updated) expect(meta.updated >= meta.published).toBe(true);
    }
  });

  it("목차 id가 겹치지 않는다", () => {
    for (const { meta } of posts) {
      const ids = meta.toc.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("최신 글이 먼저 온다", () => {
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i - 1].meta.published >= posts[i].meta.published).toBe(true);
    }
  });
});

describe("블로그 도우미", () => {
  it("slug로 글을 찾는다", () => {
    expect(getPost(posts[0].meta.slug)).toBe(posts[0]);
    expect(getPost("no-such-post")).toBeUndefined();
  });

  it("기능 페이지별 관련 글을 고른다", () => {
    const { tool } = posts[0].meta;
    expect(getPostsForTool(tool)).toContain(posts[0]);
  });

  it("주소와 날짜를 만든다", () => {
    expect(postPath("excel-address-split")).toBe("/blog/excel-address-split/");
    expect(formatDate("2026-10-07")).toBe("2026년 10월 7일");
  });
});

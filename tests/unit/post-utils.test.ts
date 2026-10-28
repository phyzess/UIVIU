import { describe, expect, it } from "vitest";

import {
  filterPublished,
  formatPostDate,
  formatPostDateLong,
  isPublished,
  sortByPubDateDesc,
  type PostListEntry,
} from "../../src/lib/post-utils";

function post(id: string, pubDate: string, draft = false): PostListEntry {
  return { id, data: { pubDate: new Date(pubDate), draft } };
}

describe("isPublished", () => {
  it("publishes only explicit non-drafts", () => {
    expect(isPublished(post("a", "2026-01-01", false))).toBe(true);
    expect(isPublished(post("a", "2026-01-01", true))).toBe(false);
  });
});

describe("filterPublished", () => {
  it("removes drafts and keeps order", () => {
    const posts = [
      post("b", "2026-02-01"),
      post("draft", "2026-02-02", true),
      post("a", "2026-01-01"),
    ];

    expect(filterPublished(posts).map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("does not mutate the input", () => {
    const posts = [post("draft", "2026-02-02", true)];
    filterPublished(posts);
    expect(posts).toHaveLength(1);
  });
});

describe("sortByPubDateDesc", () => {
  it("sorts newest first", () => {
    const posts = [
      post("jan", "2026-01-01"),
      post("mar", "2026-03-01"),
      post("feb", "2026-02-01"),
    ];

    expect(sortByPubDateDesc(posts).map((p) => p.id)).toEqual(["mar", "feb", "jan"]);
  });

  it("keeps incoming order for equal dates", () => {
    const posts = [post("first", "2026-02-01"), post("second", "2026-02-01")];

    expect(sortByPubDateDesc(posts).map((p) => p.id)).toEqual(["first", "second"]);
  });

  it("does not mutate the input", () => {
    const posts = [post("jan", "2026-01-01"), post("mar", "2026-03-01")];
    sortByPubDateDesc(posts);
    expect(posts.map((p) => p.id)).toEqual(["jan", "mar"]);
  });
});

describe("date formatting", () => {
  it("formats a frontmatter date without shifting the day", () => {
    expect(formatPostDate(new Date("2026-10-28"))).toBe("2026-10-28");
    expect(formatPostDate(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01-01");
  });

  it("keeps the last day of a month intact", () => {
    expect(formatPostDate(new Date("2026-02-28T23:59:59Z"))).toBe("2026-02-28");
    expect(formatPostDateLong(new Date("2026-02-28T00:00:00Z"))).toBe(
      "2026 年 2 月 28 日",
    );
  });

  it("pads single digit months and days", () => {
    expect(formatPostDate(new Date("2026-03-05T00:00:00Z"))).toBe("2026-03-05");
    expect(formatPostDateLong(new Date("2026-03-05T00:00:00Z"))).toBe(
      "2026 年 3 月 5 日",
    );
  });
});

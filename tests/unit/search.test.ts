import { describe, expect, it } from "vitest";

import { toSearchResults } from "../../src/lib/search";

describe("toSearchResults", () => {
  it("maps pagefind results to the shape the UI renders", () => {
    expect(
      toSearchResults([
        {
          url: "/posts/about-this-site/",
          excerpt: "关于 <mark>Markdown</mark> 的说明",
          meta: { title: "这个站点如何工作" },
        },
      ]),
    ).toEqual([
      {
        url: "/posts/about-this-site/",
        title: "这个站点如何工作",
        excerpt: "关于 <mark>Markdown</mark> 的说明",
      },
    ]);
  });

  it("falls back to the URL when no title was indexed", () => {
    const [item] = toSearchResults([{ url: "/posts/x/", excerpt: "text" }]);
    expect(item?.title).toBe("/posts/x/");
  });

  it("prefers the highlighted excerpt and falls back to plain text", () => {
    const [withExcerpt] = toSearchResults([
      { url: "/a/", excerpt: "  <mark>a</mark>  ", plain_excerpt: "a" },
    ]);
    const [plainOnly] = toSearchResults([{ url: "/b/", plain_excerpt: "  plain  " }]);
    const [nothing] = toSearchResults([{ url: "/c/" }]);

    expect(withExcerpt?.excerpt).toBe("<mark>a</mark>");
    expect(plainOnly?.excerpt).toBe("plain");
    expect(nothing?.excerpt).toBe("");
  });

  it("keeps an empty result list empty", () => {
    expect(toSearchResults([])).toEqual([]);
  });
});

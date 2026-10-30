import { describe, expect, it } from "vitest";

import { absolutizeHtml } from "../../src/lib/feed";

const BASE = "https://uiviu.me/posts/example/";

describe("absolutizeHtml", () => {
  it("prefixes root-relative links and images with the origin", () => {
    const html = '<a href="/about/">about</a><img src="/_astro/a.webp" />';
    expect(absolutizeHtml(html, BASE)).toBe(
      '<a href="https://uiviu.me/about/">about</a><img src="https://uiviu.me/_astro/a.webp" />',
    );
  });

  it("resolves document-relative URLs against the post", () => {
    expect(absolutizeHtml('<a href="./next/">x</a>', BASE)).toBe(
      '<a href="https://uiviu.me/posts/example/next/">x</a>',
    );
    expect(absolutizeHtml('<img src="../cover.png" />', BASE)).toBe(
      '<img src="https://uiviu.me/posts/cover.png" />',
    );
  });

  it("keeps fragments, mail links and absolute URLs untouched", () => {
    const html =
      '<a href="#note">n</a><a href="mailto:hi@uiviu.me">m</a><a href="https://example.com/x">e</a>';
    expect(absolutizeHtml(html, BASE)).toBe(html);
  });

  it("rewrites every candidate in a srcset", () => {
    const html =
      '<img srcset="/_astro/a-320.webp 320w, /_astro/a-640.webp 640w" src="/_astro/a-320.webp" />';
    expect(absolutizeHtml(html, BASE)).toBe(
      '<img srcset="https://uiviu.me/_astro/a-320.webp 320w, https://uiviu.me/_astro/a-640.webp 640w" src="https://uiviu.me/_astro/a-320.webp" />',
    );
  });

  it("handles protocol-relative URLs and query strings", () => {
    expect(absolutizeHtml('<a href="//cdn.example/x.css">c</a>', BASE)).toBe(
      '<a href="https://cdn.example/x.css">c</a>',
    );
    expect(absolutizeHtml('<a href="/archive/?year=2026">a</a>', BASE)).toBe(
      '<a href="https://uiviu.me/archive/?year=2026">a</a>',
    );
  });

  it("leaves plain text and attribute-free markup alone", () => {
    const html = "<p>hello</p><p>world</p>";
    expect(absolutizeHtml(html, BASE)).toBe(html);
  });
});

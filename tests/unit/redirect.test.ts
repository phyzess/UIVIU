import { describe, expect, it } from "vitest";

import { canonicalRedirectTarget } from "../../worker/redirect";

describe("canonical host redirect", () => {
  it("moves www to the apex and keeps path and query", () => {
    expect(canonicalRedirectTarget(new URL("https://www.uiviu.me/posts/a/?q=1"))).toBe(
      "https://uiviu.me/posts/a/?q=1",
    );
  });

  it("keeps the root path", () => {
    expect(canonicalRedirectTarget(new URL("https://www.uiviu.me/"))).toBe(
      "https://uiviu.me/",
    );
  });

  it("upgrades a plain-http www request to https", () => {
    expect(canonicalRedirectTarget(new URL("http://www.uiviu.me/about/"))).toBe(
      "https://uiviu.me/about/",
    );
  });

  it("leaves the apex alone", () => {
    expect(canonicalRedirectTarget(new URL("https://uiviu.me/posts/a/"))).toBeNull();
  });

  it("leaves preview hosts alone", () => {
    expect(
      canonicalRedirectTarget(new URL("https://uiviu.example.workers.dev/")),
    ).toBeNull();
    expect(canonicalRedirectTarget(new URL("http://localhost:4321/"))).toBeNull();
  });

  it("only matches the exact www host", () => {
    expect(
      canonicalRedirectTarget(new URL("https://www.uiviu.me.evil.test/")),
    ).toBeNull();
    expect(canonicalRedirectTarget(new URL("https://staging.www.uiviu.me/"))).toBeNull();
  });
});

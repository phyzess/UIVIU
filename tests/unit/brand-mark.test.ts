import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const favicon = readFileSync("public/favicon.svg", "utf8");
const component = readFileSync("src/components/BrandMark.astro", "utf8");
const wordmark = readFileSync("public/brand/uiviu-wordmark.svg", "utf8");

const paths = (svg: string) =>
  [...svg.matchAll(/<path[^>]*d="([^"]+)"/g)].map((match) => match[1]);

describe("brand mark", () => {
  it("keeps the inline component in sync with the favicon", () => {
    expect(paths(component)).toEqual(paths(favicon));
  });

  it("draws the U in ink and the escape in signal red", () => {
    expect(favicon).toContain('stroke="#252525"');
    expect(favicon).toContain('stroke="#FF623D"');
  });

  it("keeps the favicon background transparent", () => {
    expect(favicon).not.toMatch(/<rect/);
    expect(favicon).not.toContain("fff");
    expect(favicon).not.toContain("f8f7f2");
  });

  it("ships a wordmark with the same ink and accent", () => {
    expect(paths(wordmark)).toHaveLength(6);
    expect(wordmark).toContain('stroke="#252525"');
    expect(wordmark).toContain('stroke="#FF623D"');
  });
});

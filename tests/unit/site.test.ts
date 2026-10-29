import { describe, expect, it } from "vitest";

import {
  BRAND_HEADLINE_EN,
  BRAND_SUBTITLE_ZH,
  BRAND_SUBTITLE_ZH_LINE_1,
  BRAND_SUBTITLE_ZH_LINE_2,
  CONTENT_DIRECTIONS,
  CONTENT_DIRECTIONS_LABEL,
  CONTENT_INTRO_ZH,
  CORE_CONCEPT_ZH,
  DEFAULT_DESCRIPTION,
  SITE_NAME,
} from "../../src/lib/site";

describe("brand assets", () => {
  it("keeps the brand name", () => {
    expect(SITE_NAME).toBe("UIVIU");
  });

  it("keeps the English headline verbatim", () => {
    expect(BRAND_HEADLINE_EN).toBe(
      "A Rigorous Derivation of Something Entirely Useless, Yet Perfectly Symmetrical.",
    );
  });

  it("keeps the Chinese subtitle verbatim", () => {
    expect(BRAND_SUBTITLE_ZH).toBe(
      "经过严谨的非严谨推导，最终得到一个没有实际用途，但看起来很对称的结果。",
    );
  });

  it("rejoins the rendered subtitle halves into the canonical string", () => {
    expect(`${BRAND_SUBTITLE_ZH_LINE_1}${BRAND_SUBTITLE_ZH_LINE_2}`).toBe(
      BRAND_SUBTITLE_ZH,
    );
    expect(BRAND_SUBTITLE_ZH_LINE_1.endsWith("，")).toBe(true);
  });

  it("keeps the content introduction verbatim", () => {
    expect(CONTENT_INTRO_ZH).toBe(
      "关于代码、生活、思考，以及一些本来不必想那么多的事情。",
    );
  });

  it("renders the content directions in their canonical order", () => {
    expect(CONTENT_DIRECTIONS).toEqual(["LIFE", "THOUGHTS", "CODE"]);
    expect(CONTENT_DIRECTIONS_LABEL).toBe("LIFE · THOUGHTS · CODE");
  });

  it("marks the core concept as a statement about symmetry", () => {
    expect(CORE_CONCEPT_ZH).toBe("一个对称的非必要结构");
  });
});

describe("copy roles", () => {
  it("does not swap the Chinese subtitle with the content introduction", () => {
    expect(BRAND_SUBTITLE_ZH).not.toBe(CONTENT_INTRO_ZH);
    expect(DEFAULT_DESCRIPTION).toBe(CONTENT_INTRO_ZH);
  });

  it("keeps every string free of stray whitespace", () => {
    for (const value of [
      BRAND_HEADLINE_EN,
      BRAND_SUBTITLE_ZH,
      BRAND_SUBTITLE_ZH_LINE_1,
      BRAND_SUBTITLE_ZH_LINE_2,
      CONTENT_INTRO_ZH,
      CORE_CONCEPT_ZH,
    ]) {
      expect(value).toBe(value.trim());
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it("ends the English headline with a period", () => {
    expect(BRAND_HEADLINE_EN.endsWith(".")).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import {
  CATEGORIES,
  CATEGORY_META,
  countByCategory,
  countByYear,
  isCategory,
} from "../../src/lib/taxonomy";

describe("categories", () => {
  it("keeps the canonical order", () => {
    expect(CATEGORIES).toEqual(["life", "thoughts", "code"]);
    expect(CATEGORIES.map((category) => CATEGORY_META[category].label)).toEqual([
      "Life",
      "Thoughts",
      "Code",
    ]);
  });

  it("validates category values", () => {
    expect(isCategory("life")).toBe(true);
    expect(isCategory("meta")).toBe(false);
  });
});

describe("countByCategory", () => {
  it("counts real posts and keeps zero categories", () => {
    const counts = countByCategory([
      { data: { category: "code" } },
      { data: { category: "code" } },
      { data: { category: "life" } },
    ]);

    expect(counts).toEqual([
      { category: "life", count: 1 },
      { category: "thoughts", count: 0 },
      { category: "code", count: 2 },
    ]);
  });

  it("returns zeros for an empty list", () => {
    expect(countByCategory([]).map((entry) => entry.count)).toEqual([0, 0, 0]);
  });
});

describe("countByYear", () => {
  it("groups by UTC year and sorts newest first", () => {
    const counts = countByYear([
      { data: { pubDate: new Date("2026-10-28") } },
      { data: { pubDate: new Date("2026-01-05") } },
      { data: { pubDate: new Date("2025-12-31T23:00:00Z") } },
    ]);

    expect(counts).toEqual([
      { year: 2026, count: 2 },
      { year: 2025, count: 1 },
    ]);
  });

  it("returns an empty list when there are no posts", () => {
    expect(countByYear([])).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";

import { computeReadingProgress } from "../../src/lib/reading-progress";

describe("computeReadingProgress", () => {
  it("is zero while the article starts below the viewport", () => {
    expect(computeReadingProgress({ top: 400, height: 3000, viewport: 800 })).toBe(0);
  });

  it("grows as the article scrolls past", () => {
    const half = computeReadingProgress({ top: -1100, height: 3000, viewport: 800 });
    expect(half).toBeCloseTo(0.5, 5);
  });

  it("reaches one when the article end is at the viewport bottom", () => {
    expect(computeReadingProgress({ top: -2200, height: 3000, viewport: 800 })).toBe(1);
  });

  it("clamps after scrolling past the end", () => {
    expect(computeReadingProgress({ top: -9000, height: 3000, viewport: 800 })).toBe(1);
  });

  it("treats an article shorter than the viewport as fully read", () => {
    expect(computeReadingProgress({ top: 100, height: 400, viewport: 800 })).toBe(1);
    expect(computeReadingProgress({ top: 100, height: 800, viewport: 800 })).toBe(1);
  });

  it("never returns a negative value", () => {
    expect(computeReadingProgress({ top: 5000, height: 3000, viewport: 800 })).toBe(0);
  });
});

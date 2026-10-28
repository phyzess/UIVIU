/**
 * Reading progress is a pure function of the article's position so it can be
 * unit tested: given the article box and the viewport height, how much of the
 * article has actually scrolled past?
 */

export interface ReadingProgressInput {
  /** `getBoundingClientRect().top` of the article body. */
  top: number;
  /** Full height of the article body. */
  height: number;
  /** Viewport height. */
  viewport: number;
}

/** Returns a value in [0, 1] where 1 means the article has been read through. */
export function computeReadingProgress({
  top,
  height,
  viewport,
}: ReadingProgressInput): number {
  const travel = height - viewport;

  // Short article: everything fits on screen, so it counts as fully visible.
  if (travel <= 0) {
    return 1;
  }

  const progress = -top / travel;
  return Math.min(1, Math.max(0, progress));
}

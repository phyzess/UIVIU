/**
 * Pure helpers for post lists and dates.
 *
 * Kept free of `astro:content` imports so they can be unit tested directly.
 */

export interface PostListEntry {
  id: string;
  data: {
    pubDate: Date;
    draft: boolean;
  };
}

/** A post is public only when `draft` is explicitly `false`. */
export function isPublished(post: PostListEntry): boolean {
  return post.data.draft === false;
}

/** Removes drafts without mutating the input array. */
export function filterPublished<T extends PostListEntry>(posts: readonly T[]): T[] {
  return posts.filter(isPublished);
}

/**
 * Newest first. Ties keep their incoming order (Array.prototype.sort is stable)
 * so two posts sharing a date do not jump around between builds.
 */
export function sortByPubDateDesc<T extends PostListEntry>(posts: readonly T[]): T[] {
  return posts.toSorted((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

/**
 * Formats a date as `YYYY-MM-DD` using UTC parts.
 *
 * Frontmatter dates are calendar dates, not instants: formatting them in local
 * time would shift them by a day for readers west of UTC.
 */
export function formatPostDate(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Long form used in post headers, e.g. `2026 年 10 月 28 日`. */
export function formatPostDateLong(date: Date): string {
  return `${date.getUTCFullYear()} 年 ${date.getUTCMonth() + 1} 月 ${date.getUTCDate()} 日`;
}

/**
 * Content categories: the three directions the site is about.
 *
 * A category is real frontmatter metadata, never inferred from a title. The
 * class strings are literals so Tailwind can see them.
 */

export const CATEGORIES = ["life", "thoughts", "code"] as const;

export type Category = (typeof CATEGORIES)[number];

export interface CategoryMeta {
  /** Sidebar label. */
  label: string;
  /** Uppercase label used inside the small pill. */
  badge: string;
  /** Pill classes: low-saturation background with a readable text color. */
  pillClass: string;
  /** Dot color for the sidebar. */
  dotClass: string;
  path: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  life: {
    label: "Life",
    badge: "LIFE",
    pillClass: "bg-life-soft text-life",
    dotClass: "bg-life",
    path: "/categories/life/",
  },
  thoughts: {
    label: "Thoughts",
    badge: "THOUGHTS",
    pillClass: "bg-thoughts-soft text-thoughts",
    dotClass: "bg-thoughts",
    path: "/categories/thoughts/",
  },
  code: {
    label: "Code",
    badge: "CODE",
    pillClass: "bg-code-soft text-code",
    dotClass: "bg-code",
    path: "/categories/code/",
  },
};

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

export interface CategorizedEntry {
  data: { category: Category };
}

/** Published post count per category, in canonical order. */
export function countByCategory(
  posts: readonly CategorizedEntry[],
): { category: Category; count: number }[] {
  return CATEGORIES.map((category) => ({
    category,
    count: posts.filter((post) => post.data.category === category).length,
  }));
}

export interface DatedEntry {
  data: { pubDate: Date };
}

/** Published post count per year, newest year first. */
export function countByYear(
  posts: readonly DatedEntry[],
): { year: number; count: number }[] {
  const counts = new Map<number, number>();

  for (const post of posts) {
    const year = post.data.pubDate.getUTCFullYear();
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([year, count]) => ({ year, count }))
    .toSorted((a, b) => b.year - a.year);
}

/**
 * Shapes Pagefind results for the search UI.
 *
 * Pagefind returns one object per page with `excerpt` (HTML with `<mark>`, safe
 * to inject) plus `plain_excerpt`. The UI only needs a small, stable shape.
 */

export interface PagefindResultData {
  url: string;
  excerpt?: string;
  plain_excerpt?: string;
  meta?: {
    title?: string;
  };
}

export interface SearchResultItem {
  url: string;
  title: string;
  excerpt: string;
}

export function toSearchResults(data: PagefindResultData[]): SearchResultItem[] {
  return data.map((result) => ({
    url: result.url,
    title: result.meta?.title?.trim() || result.url,
    excerpt: result.excerpt?.trim() || result.plain_excerpt?.trim() || "",
  }));
}

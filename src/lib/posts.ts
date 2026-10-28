import { getCollection, type CollectionEntry } from "astro:content";

import { filterPublished, sortByPubDateDesc } from "./post-utils";

export type Post = CollectionEntry<"posts">;

/** Canonical URL path for a post. Trailing slash matches the static output. */
export function postPath(post: Post): string {
  return `/posts/${post.id}/`;
}

/**
 * Published posts, newest first.
 *
 * Drafts are always excluded, including in `astro dev`: a draft is never a
 * preview mechanism here, only a "do not ship" marker. To look at a draft,
 * flip its flag locally and do not commit it.
 */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection("posts");
  return sortByPubDateDesc(filterPublished(posts));
}

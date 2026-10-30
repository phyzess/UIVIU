import rss from "@astrojs/rss";
import type { APIContext } from "astro";

import { getPublishedPosts, postPath } from "../lib/posts";
import { CONTENT_INTRO_ZH, SITE_NAME } from "../lib/site";

export async function GET(context: APIContext) {
  if (!context.site) {
    throw new Error(
      "RSS needs absolute URLs: set `site` in astro.config.mjs before building the feed.",
    );
  }

  const posts = await getPublishedPosts();

  return rss({
    title: SITE_NAME,
    description: CONTENT_INTRO_ZH,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      link: postPath(post),
      pubDate: post.data.pubDate,
    })),
    customData: "<language>zh-cn</language>",
  });
}

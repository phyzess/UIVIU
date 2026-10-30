import { experimental_AstroContainer as AstroContainer } from "astro/container";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";

import { render } from "astro:content";
import { absolutizeHtml } from "../lib/feed";
import { getPublishedPosts, postPath } from "../lib/posts";
import { CONTENT_INTRO_ZH, SITE_NAME } from "../lib/site";

export async function GET(context: APIContext) {
  if (!context.site) {
    throw new Error(
      "RSS needs absolute URLs: set `site` in astro.config.mjs before building the feed.",
    );
  }

  const site = context.site;
  const posts = await getPublishedPosts();

  // Full-text entries: render the Markdown body to HTML once, then make every
  // internal URL absolute so readers do not resolve links against their own
  // origin. `astro/container` is the official way to render a content entry
  // outside a page.
  const container = await AstroContainer.create();
  const items = [];
  for (const post of posts) {
    const { Content } = await render(post);
    const link = new URL(postPath(post), site).toString();
    items.push({
      title: post.data.title,
      description: post.data.description,
      link,
      pubDate: post.data.pubDate,
      content: absolutizeHtml(await container.renderToString(Content), link),
    });
  }

  return rss({
    title: SITE_NAME,
    description: CONTENT_INTRO_ZH,
    site,
    items,
    customData: "<language>zh-cn</language>",
  });
}

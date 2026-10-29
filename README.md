# UIVIU

> A Rigorous Derivation of Something Entirely Useless, Yet Perfectly Symmetrical.
>
> 经过严谨的非严谨推导，最终得到一个没有实际用途，但看起来很对称的结果。

关于代码、生活、思考，以及一些本来不必想那么多的事情。

A personal blog about LIFE · THOUGHTS · CODE: static, Markdown-driven, with
editorial typography and very little machinery.

## Stack

- [Astro](https://astro.build) 7 — static output, no SSR adapter
- TypeScript in `strict` mode
- Tailwind CSS 4 through the official `@tailwindcss/vite` plugin
- Astro Content Collections for Markdown posts, Shiki for code highlighting
- [Pagefind](https://pagefind.app) search, `@astrojs/rss`, `@astrojs/sitemap`
- Oxlint + Oxfmt, Vitest, `simple-git-hooks` + `lint-staged`
- Cloudflare Workers static assets (`wrangler.jsonc`), no SSR adapter

## Requirements

- Node.js 24.20.0 (see `.node-version`; Astro needs `>=22.23.4`)
- pnpm 12.3.4 (see `packageManager`)

```bash
pnpm install
pnpm dev        # http://localhost:4321
```

## Scripts

| Command                             | Description                                    |
| ----------------------------------- | ---------------------------------------------- |
| `pnpm dev`                          | Start the dev server                           |
| `pnpm build`                        | Astro build into `dist/`, then Pagefind index  |
| `pnpm build:astro`                  | Astro build only (no search index)             |
| `pnpm search:index`                 | Rebuild the Pagefind index over `dist/`        |
| `pnpm preview`                      | Serve the build locally                        |
| `pnpm preview:worker`               | Preview through `wrangler dev`                 |
| `pnpm check`                        | `astro check` — types and template diagnostics |
| `pnpm lint`                         | Oxlint                                         |
| `pnpm format` / `pnpm format:check` | Oxfmt write / verify                           |
| `pnpm test` / `pnpm test:watch`     | Vitest                                         |
| `pnpm verify`                       | check → lint → format:check → test → build     |
| `pnpm deploy`                       | Build, then `wrangler deploy` (needs auth)     |

## Project layout

```text
src/
  components/   SiteHeader, SiteFooter, Hero, PostList, PostListItem, PostIndexPage,
                Pagination, EmptyState, CategoryTag, Sidebar, TableOfContents,
                ReadingProgress
  content/      posts/*.md
  layouts/      BaseLayout, PostLayout
  lib/          site.ts — brand copy in one place
  pages/        index, notes, archive, search, about, 404,
                categories/[category], posts/[...slug], rss.xml
  styles/       global.css — Tailwind import and @theme tokens
public/         favicon.svg, favicon.ico, apple-touch-icon.png, icon-512.png,
                og.png, brand/uiviu-wordmark.svg
tests/unit/     Vitest unit tests
docs/agents/    Notes for AI agents: design, content, workflow
```

Brand copy lives in `src/lib/site.ts` and is covered by tests: the homepage
strings are requirements, not placeholders.

## Writing posts

A post is one Markdown file in `src/content/posts/`; the file name becomes the
slug, so `hello-uiviu.md` becomes `/posts/hello-uiviu/`. The about page is
content too: edit `src/content/pages/about.md`.

```yaml
---
title: "这个站点如何工作"
description: "一句话说明这篇文章在讲什么。"
pubDate: 2026-10-28
updatedDate: null
category: code
draft: false
---
```

`title`, `description`, `pubDate`, `category` and `draft` are required and
validated at build time. `category` is one of `life`, `thoughts`, `code` and
drives the pills, sidebar counts and `/categories/<category>/`. `draft` must be written explicitly: drafts never appear in
listings or generate pages, not even in `astro dev`. The full contract, including
slug and image rules, is in [`docs/agents/content.md`](docs/agents/content.md).

## Search, RSS and sitemap

Search uses [Pagefind](https://pagefind.app) and is built after the Astro build:

```bash
pnpm build        # astro build, then pagefind --site dist
pnpm preview      # serves dist/, including /pagefind/
# open http://localhost:4321/search/?q=Markdown
```

The index only exists in a built site; `pnpm dev` shows an explicit "index
unavailable" message instead of fake results. Only post articles are indexed,
so navigation, footer and archive text stay out, and drafts never reach the
index because they are never built. `dist/pagefind/` is build output and is not
committed.

The feed is at `/rss.xml` (announced in every page head) and the sitemap is
`/sitemap-index.xml`. Both are generated from published posts only. `/notes/`
paginates at 10 posts per page, and category pages paginate the same way.

Typography: Newsreader 400 (latin, 22 KB woff2) is self-hosted and preloaded;
Chinese text falls back to the system serif stack.

## Deployment (Cloudflare Workers static assets)

`wrangler.jsonc` serves `dist/` as static assets, with `not_found_handling:
"404-page"` and no Worker script or SSR adapter.

Check the build locally first:

```bash
pnpm verify            # check, lint, format, tests, build + search index
pnpm preview:worker    # wrangler dev → http://localhost:8787
```

Then confirm `/`, `/posts/about-this-site/`, an unknown path (custom 404),
`/rss.xml`, `/sitemap-index.xml` and `/search/` (Pagefind assets) all behave.
`pnpm exec wrangler deploy --dry-run` validates the config without uploading.

Deploying needs your Cloudflare account and is never done by the project itself:

```bash
pnpm build
pnpm exec wrangler login     # once per machine
pnpm exec wrangler deploy    # uploads dist/ as the `uiviu` Worker
```

Before the first deploy:

1. Replace the placeholder `site` in `astro.config.mjs` with the production
   domain, and update `public/robots.txt` to match.
2. Attach the domain in the Cloudflare dashboard (Workers → `uiviu` → Settings →
   Domains & Routes). DNS records are yours to change.
3. Keep `compatibility_date` in `wrangler.jsonc` no later than the installed
   workerd supports; it is a date, not a version.

Wrangler's local state lives in `.wrangler/`, which is git-ignored.

## License

MIT — see [LICENSE](LICENSE). All post content is © phyzess unless stated
otherwise.

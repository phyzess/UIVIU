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
| `pnpm fonts:build`                  | Rebuild the font subsets from pinned releases  |
| `pnpm fonts:check`                  | Fail when source copy needs missing glyphs     |
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

Typography: four self-hosted subsets — LXGW WenKai (headings), LXGW Neo XiHei
(body/UI), Maple Mono (dates/labels/code) and Fusion Pixel (the 404 digits).
They are rebuilt automatically by `pnpm fonts:ensure` (the first step of
`pnpm dev`, `pnpm build` and `pnpm verify`) whenever new copy needs glyphs, from
pinned releases cached in `.fonts-cache/`. The subsets are renamed to neutral
`UIVIU …` family names, as OFL reserved names and the IPA license require for
modified fonts. Newsreader still carries the `UIVIU` wordmark.

## Deployment (Cloudflare Workers static assets)

`wrangler.jsonc` serves `dist/` as static assets with `not_found_handling:
"404-page"`, no Worker script and no SSR adapter.

Deploys run in **Cloudflare Workers Builds** (Cloudflare's Git integration).
GitHub Actions only runs checks — it never deploys.

### Workers Builds settings

Connect the repository to the `uiviu` Worker and use:

| Setting           | Value                            |
| ----------------- | -------------------------------- |
| Production branch | `main`                           |
| Build command     | `pnpm build`                     |
| Deploy command    | `npx wrangler deploy` (default)  |
| Preview command   | `npx wrangler preview` (default) |
| Root directory    | repository root                  |

- The Worker name in the dashboard must equal `name` in `wrangler.jsonc`
  (`uiviu`), otherwise the build fails.
- Node comes from `.node-version` (`24`, resolved to the build image's 24.22.1
  LTS) and pnpm from the `packageManager` field; Workers Builds installs
  dependencies before running the build command.
- Limits: 20 minutes per build, 8 GB memory, 3000 build minutes/month on the
  free plan. This site builds in one to two minutes.
- Pushes to branches other than `main` create Preview URLs; production deploys
  create a Worker version that can be rolled back.

`pnpm build` runs `fonts:ensure`, the Astro build and the Pagefind index, so the
uploaded assets always match the content. The committed font subsets normally
make the build network-free; if a commit adds new glyphs, `fonts:ensure` rebuilds
them inside the Workers Builds run (downloading the pinned sources once) and the
deploy is still correct — commit `public/fonts/*` afterwards to keep CI builds
offline.

### Checking a build locally

```bash
pnpm verify             # fonts:ensure, check, lint, format, tests, build + search index
pnpm preview            # astro preview → http://localhost:4321
pnpm preview:worker     # wrangler dev → http://localhost:8787 (real Workers assets)
pnpm exec wrangler deploy --dry-run   # validate the config without uploading
```

`pnpm deploy` (build + `wrangler deploy`) remains available for a manual deploy
from a machine with `wrangler login`; it is not part of the normal flow.

### Before the first deploy

1. Keep `site` in `astro.config.mjs` (`https://uiviu.me`) and
   `public/robots.txt` pointing at the production domain.
2. Attach the domain in the Cloudflare dashboard (Workers → `uiviu` → Settings →
   Domains & Routes); DNS records are yours to change.
3. `compatibility_date` in `wrangler.jsonc` must not be later than the installed
   workerd supports; it is a date, not a version.

Wrangler's local state lives in `.wrangler/`, which is git-ignored.

## License

MIT — see [LICENSE](LICENSE). All post content is © phyzess unless stated
otherwise.

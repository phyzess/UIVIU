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
- Oxlint + Oxfmt, Vitest, `simple-git-hooks` + `lint-staged`
- Planned: Astro Content Collections, Pagefind search, `@astrojs/rss`, sitemap,
  Cloudflare Workers static assets

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
| `pnpm build`                        | Build the static site into `dist/`             |
| `pnpm preview`                      | Serve the build locally                        |
| `pnpm check`                        | `astro check` — types and template diagnostics |
| `pnpm lint`                         | Oxlint                                         |
| `pnpm format` / `pnpm format:check` | Oxfmt write / verify                           |
| `pnpm test` / `pnpm test:watch`     | Vitest                                         |
| `pnpm verify`                       | check → lint → format:check → test → build     |

## Project layout

```text
src/
  components/   SiteHeader (nav), SiteFooter, PostCard, TableOfContents, ReadingProgress
  content/      posts/*.md
  layouts/      BaseLayout, PostLayout
  lib/          site.ts — brand copy in one place
  pages/        index, archive, about, 404, posts/[...slug]
  styles/       global.css — Tailwind import and @theme tokens
tests/unit/     Vitest unit tests
docs/agents/    Notes for AI agents: design, content, workflow
```

Brand copy lives in `src/lib/site.ts` and is covered by tests: the homepage
strings are requirements, not placeholders.

## Writing posts

A post is one Markdown file in `src/content/posts/`; the file name becomes the
slug, so `/posts/about-this-site/` comes from `about-this-site.md`.

```yaml
---
title: "这个站点如何工作"
description: "一句话说明这篇文章在讲什么。"
pubDate: 2026-10-28
updatedDate: null
tags:
  - meta
draft: false
---
```

`title`, `description`, `pubDate`, `tags` and `draft` are required and validated
at build time. `draft` must be written explicitly: drafts never appear in
listings or generate pages, not even in `astro dev`. The full contract, including
slug and image rules, is in [`docs/agents/content.md`](docs/agents/content.md).

## Deployment

Not configured yet. The target is Cloudflare Workers static assets serving
`dist/`, with a custom 404 page and no SSR adapter. See
[`docs/agents/workflow.md`](docs/agents/workflow.md). No domain has been chosen,
so `astro.config.mjs` intentionally has no `site` value yet.

## License

MIT — see [LICENSE](LICENSE). All post content is © phyzess unless stated
otherwise.

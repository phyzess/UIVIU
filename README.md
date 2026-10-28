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
  components/   SiteHeader, SiteFooter
  layouts/      BaseLayout — document head, chrome, skip link
  lib/          site.ts — brand copy in one place
  pages/        index.astro, 404.astro
  styles/       global.css — Tailwind import and @theme tokens
tests/unit/     Vitest unit tests
docs/agents/    Notes for AI agents: design, content, workflow
```

Brand copy lives in `src/lib/site.ts` and is covered by tests: the homepage
strings are requirements, not placeholders.

## Writing posts

Posts arrive with the content collection (phase 3). The agreed format —
frontmatter fields, draft handling, slugs, images — is documented in
[`docs/agents/content.md`](docs/agents/content.md).

## Deployment

Not configured yet. The target is Cloudflare Workers static assets serving
`dist/`, with a custom 404 page and no SSR adapter. See
[`docs/agents/workflow.md`](docs/agents/workflow.md). No domain has been chosen,
so `astro.config.mjs` intentionally has no `site` value yet.

## License

MIT — see [LICENSE](LICENSE). All post content is © phyzess unless stated
otherwise.

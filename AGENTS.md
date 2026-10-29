# UIVIU — agent guide

Entry point for AI agents working in this repository. Read this file first, then
the topic file that matches the task:

- `docs/agents/design.md` — design tokens, typography, layout and accessibility rules.
- `docs/agents/content.md` — post format, drafts, slugs and images.
- `docs/agents/workflow.md` — commands, hooks, CI and environment quirks.
- `docs/agents/backlog.md` — deferred work and why it is deferred.

## What this project is

UIVIU is a personal blog about LIFE, THOUGHTS and CODE, built as a static Astro
site with editorial typography and a small amount of dry humour. It is not a
SaaS, CMS or documentation platform.

Stack: Astro 7 (static output) · TypeScript strict · Tailwind CSS 4 (Vite plugin)
· Astro Content Collections · Shiki · Pagefind · @astrojs/rss · @astrojs/sitemap
· Vitest · Oxlint · Oxfmt.

## Brand assets — do not edit, shorten or swap

These strings are product requirements. They live in `src/lib/site.ts` and are
guarded by `tests/unit/site.test.ts`:

1. Brand name: `UIVIU`
2. English headline: `A Rigorous Derivation of Something Entirely Useless, Yet Perfectly Symmetrical.`
3. Chinese subtitle: `经过严谨的非严谨推导，最终得到一个没有实际用途，但看起来很对称的结果。`
4. Content introduction: `关于代码、生活、思考，以及一些本来不必想那么多的事情。`
5. Content directions: `LIFE · THOUGHTS · CODE`
6. Core concept: `一个对称的非必要结构`

The Chinese subtitle is the homepage subtitle and stays on the homepage. The
content introduction is a supporting line, never a replacement for the subtitle.
If copy does not fit, change the layout, measure or spacing — never the copy.

## Hard constraints

- Do not invent brand copy, domains, author identities, social handles or metrics.
- Never render fabricated data: no fake dashboards, status readouts, article
  counts that are not computed from real content.
- Drafts (`draft: true`) must not appear in listings, archives, post routes, RSS,
  search index or sitemap of a production build.
- No database, auth, comments, CMS backend, SSR adapter or client framework in
  this version. No analytics or tracking scripts without explicit approval.
- No secrets in the repo. Anything pushed here is meant to be public.
- Every new dependency needs a stated purpose; prefer platform features.
- Commands must actually be run. "The script exists" is not verification.

## Repository map

```text
src/
  components/   SiteHeader (nav only), SiteFooter, Hero, PostList, PostListItem,
                PostIndexPage, Pagination, EmptyState, CategoryTag, Sidebar,
                TableOfContents, ReadingProgress
  content/      posts/*.md (posts), pages/about.md (about page)
  layouts/      BaseLayout (head, chrome, skip link), PostLayout (article, TOC)
  lib/          site.ts (brand copy), posts.ts (queries), post-utils.ts,
                taxonomy.ts (categories, counts), reading-time.ts,
                reading-progress.ts, search.ts
  pages/        index, notes/[...page], archive, search, about, 404,
                categories/[category]/[...page], posts/[...slug], rss.xml.ts
  styles/       global.css — Tailwind import, @theme tokens, .post-body typography
  content.config.ts — posts collection schema
tests/unit/     Vitest unit tests
docs/agents/    Agent-facing documentation
wrangler.jsonc  Cloudflare Workers static assets config (dist/, 404-page)
public/         favicon.svg (mark source), favicon.ico, apple-touch-icon.png,
                icon-512.png, og.png, brand/uiviu-wordmark.svg
```

## Commands

```bash
pnpm dev             # dev server; Astro 7 can run it in the background
pnpm build           # astro build → dist/
pnpm preview         # preview the build (astro preview)
pnpm preview:worker  # preview through wrangler dev (Workers assets)
pnpm check           # astro check (types + template diagnostics)
pnpm lint            # oxlint
pnpm format          # oxfmt --write
pnpm format:check    # oxfmt --check
pnpm test            # vitest run
pnpm verify          # check → lint → format:check → test → build
```

`astro dev --background` starts a detached dev server with
`astro dev status | logs | stop`. Prefer it over a foreground server when
working non-interactively.

## Current phase

Delivery phases (the local planning document has been removed after the final
QA):

| Phase | Scope                                                   | Status |
| ----- | ------------------------------------------------------- | ------ |
| 0     | Environment check                                       | done   |
| 1     | Astro skeleton, Tailwind, brand homepage, 404           | done   |
| 2     | Tooling baseline: check, lint, format, test, hooks, CI  | done   |
| 3     | Content collections, post routes, TOC, reading progress | done   |
| 4     | Homepage, archive, about, responsive polish             | done   |
| 5     | Pagefind search, RSS, sitemap, canonical/OG             | done   |
| 6     | Cloudflare Workers static assets config and docs        | done   |
| 7     | Final QA and delivery                                   | done   |

## Notes for agents

- Content is authored in Markdown; a Git-based CMS is the preferred future
  option, and no Git write token may ever reach browser code.
- When a tool behaves unexpectedly, check the installed version's official docs
  first and record the finding in `docs/agents/workflow.md`.

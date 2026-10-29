# Content rules

The collections are defined in `src/content.config.ts` and queried through
`src/lib/posts.ts`. `getPublishedPosts()` is the only entry point pages use; it
sorts newest first and drops drafts.

## Where content lives

Writing is private. Posts, post images and the about page live in a separate
private repository, never in this one:

```text
posts/<slug>.md      # one Markdown file per post
posts/<slug>/        # images for that post
pages/about.md       # the about page, rendered at /about/
```

`scripts/content.mjs` copies exactly `posts/` and `pages/` into the git-ignored
`src/content/` before a build. Everything under that path is staged build input,
not a tracked file:

- `pnpm content:sync --from <path>` (or `UIVIU_CONTENT_DIR=<path>`) for local
  preview.
- `pnpm content:sync:fixtures` stages `tests/fixtures/content/` for public CI and
  for checking the code without the private repository. Fixtures are test
  material, never writing, and are never deployed.
- `pnpm build:prod` clones the private repository's `main` with a read-only
  token; that is how Cloudflare builds the site.

Every sync wipes `src/content/` first, so a deleted post disappears from the next
build instead of lingering. `.git`, `.github`, dotfiles, symlinks and the content
repository's own README are not copied.

`pnpm content:status` prints what a build would see, including the content commit
and how many drafts it is hiding. `pnpm content:check` fails if anything under
`src/content/` ever becomes tracked by git.

## About the about page

`/about/` is not hardcoded: it renders `pages/about.md` from the content
repository (title and description in frontmatter, the rest is Markdown). Edit
that file to change the page; no template change is needed. A build without it
fails — the page never falls back to a stale copy in this repository.

## Slugs

Slugs are lowercase with hyphens. The slug is derived from the file name and must
stay stable: renaming a post changes its URL, so rename deliberately. Titles can
change freely.

## Frontmatter

```yaml
---
title: "Hello, UIVIU"
description: "一篇用于验证写作流程的示例文章。"
pubDate: 2026-10-28
updatedDate: null
category: thoughts
draft: true
---
```

Required: `title`, `description`, `pubDate`, `category`, `draft`.
Optional: `updatedDate`.

Validation rules:

- `title` and `description` must be meaningful, not single placeholder words.
- `pubDate` and `updatedDate` must be valid dates; posts sort by `pubDate` desc.
- `draft` must be an explicit boolean in every post. Frontmatter is parsed, not
  guessed.
- `category` is one of `life`, `thoughts`, `code` and drives the homepage pills,
  the sidebar counts and `/categories/<category>/`. It is real metadata: never
  inferred from a title.

Reading time on the homepage is estimated from the Markdown body (CJK and Latin
counted separately, fenced code skipped). It is labelled `N min read` and is an
estimate, not analytics.

## Drafts

`draft: true` posts are excluded from the homepage list, the archive, the post
routes, RSS, the Pagefind index, the sitemap and the font subsets of a production
build. Queries must filter `draft !== true` explicitly instead of relying on a
single helper being called.

A draft is not a preview mechanism: `astro dev` hides drafts too. To look at one,
flip its flag locally in the content repository and revert it before pushing; that
keeps a single code path for production and development.

Because the file lives in the private repository, an unfinished post can be
committed as `draft: true` without publishing anything: only a build that sees
`draft: false` can ship it. Published pages are public the moment they deploy, so
anything that must stay private after publishing does not belong in a post at all.

## Writing standard

- Markdown only: headings, lists, quotes, tables, links, images, fenced code.
- Use `##` and deeper inside a post; the page title is the `h1`.
- Fenced code blocks declare a language so Astro/Shiki can highlight them.
- Images live beside the post in `posts/<slug>/` inside the content repository
  and are referenced relatively; do not hot link to third-party URLs.
- External links open in the same tab by default.
- Do not invent posts, authors, dates or social accounts to fill the layout. An
  empty list shows an honest empty state.

# Content rules

The collection is defined in `src/content.config.ts` and queried through
`src/lib/posts.ts`. `getPublishedPosts()` is the only entry point pages use; it
sorts newest first and drops drafts.

## Where content lives

```text
src/content/posts/<slug>.md      # one Markdown file per post
src/content/pages/about.md       # standalone pages, rendered at /about/
```

## About the about page

`/about/` is not hardcoded: it renders `src/content/pages/about.md` (title and
description in frontmatter, the rest is Markdown). Edit that file to change the
page; no template change is needed.

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
routes, RSS, the Pagefind index and the sitemap of a production build. Queries
must filter `draft !== true` explicitly instead of relying on a single helper
being called.

A draft is not a privacy boundary. Anything in this repository is treated as
public: private journals and sensitive notes belong in a private repository, not
in a `draft: true` file here.

Drafts are hidden in `astro dev` as well, so there is intentionally no preview
flag. To look at a draft, flip its `draft` value locally and revert it before
committing; that keeps a single code path for production and development.

## Writing standard

- Markdown only: headings, lists, quotes, tables, links, images, fenced code.
- Use `##` and deeper inside a post; the page title is the `h1`.
- Fenced code blocks declare a language so Astro/Shiki can highlight them.
- Images live beside the post in a resource folder or in `public/`; do not hot
  link to third-party URLs.
- External links open in the same tab by default.
- Do not invent posts, authors, dates or social accounts to fill the layout. An
  empty list shows an honest empty state.

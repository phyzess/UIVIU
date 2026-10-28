# Content rules

Status: the content collection lands in phase 3. Until then this file is the
agreed contract; `src/content.config.ts` will enforce it with Zod.

## Where posts live

```text
src/content/posts/<slug>.md      # one Markdown file per post
```

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
tags:
  - meta
draft: true
---
```

Required: `title`, `description`, `pubDate`, `tags`, `draft`.
Optional: `updatedDate`.

Validation rules:

- `title` and `description` must be meaningful, not single placeholder words.
- `pubDate` and `updatedDate` must be valid dates; posts sort by `pubDate` desc.
- `tags` may be empty, and empty tags must not break layout.
- `draft` must be an explicit boolean in every post. Frontmatter is parsed, not
  guessed.

## Drafts

`draft: true` posts are excluded from the homepage list, the archive, the post
routes, RSS, the Pagefind index and the sitemap of a production build. Queries
must filter `draft !== true` explicitly instead of relying on a single helper
being called.

A draft is not a privacy boundary. Anything in this repository is treated as
public: private journals and sensitive notes belong in a private repository, not
in a `draft: true` file here.

## Writing standard

- Markdown only: headings, lists, quotes, tables, links, images, fenced code.
- Use `##` and deeper inside a post; the page title is the `h1`.
- Fenced code blocks declare a language so Astro/Shiki can highlight them.
- Images live beside the post in a resource folder or in `public/`; do not hot
  link to third-party URLs.
- External links open in the same tab by default.
- Do not invent posts, authors, dates or social accounts to fill the layout. An
  empty list shows an honest empty state.

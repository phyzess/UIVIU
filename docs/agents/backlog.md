# Backlog — deferred on purpose

Deliberately not done yet. Each item records why it is deferred and what the
next step is, so it can be picked up without re-deriving the context. Nothing
here is a bug.

## 1. First real posts

Status: the blog ships with zero published posts. That is intentional — the
sample posts were removed on purpose, not by accident.

Consequences while empty (all temporary, all disappear with the first post):

- `astro build` prints `collection "posts" is empty`; the build still exits 0.
- Pagefind falls back to indexing whole pages, because no page carries
  `data-pagefind-body`. Search therefore returns pages instead of posts.
- The homepage, Notes, Archive and category pages render their empty states and
  the sidebar shows 0/0/0.

Next step: add `src/content/posts/<slug>.md` with the required frontmatter
(`title`, `description`, `pubDate`, `category`, `draft`). See
`docs/agents/content.md`. Verify afterwards that the counts, the archive
grouping and post-only search indexing come back.

## 2. Android web app manifest

Status: skipped. iOS already gets a home-screen icon through
`public/apple-touch-icon.png`; Android would need a manifest.

Next step: add `public/site.webmanifest` with `icon-512.png` (already generated),
`theme_color: "#f8f7f2"`, `background_color: "#f8f7f2"`, `display: "standalone"`,
`start_url: "/"`, name/short_name `UIVIU`; then link it from `BaseLayout` with
`<link rel="manifest" href="/site.webmanifest" />`. Keep the mark rules from
`docs/agents/design.md`.

## 3. Full-text RSS

Status: the feed is summary + link (`title`, `description`, `link`, `pubDate`).
Full text was considered and deferred because it is a pipeline, not a setting:
the Markdown body has to be rendered to HTML inside an endpoint, and relative
links and image paths must be rewritten to absolute URLs or feed readers show
broken links.

Next step if it is ever wanted: render the entry body to an HTML string
(`astro/container` is the official experimental route, or a markdown-it
pipeline), rewrite site-relative `href`/`src` with `new URL(path, site)`, and
keep the summary field for clients that prefer it. No sanitizer is required
because the only authors are the site owners; never feed untrusted HTML into it.

## Also worth remembering

- Search has no stemming for `zh-cn` (Pagefind limitation); recall is literal.
- Local Node may be newer than `.node-version`; before a release run
  `mise exec node@24.20.0 -- pnpm verify` (see `workflow.md`).

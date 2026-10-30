# Backlog — deferred on purpose

Deliberately not done yet. Each item records why it is deferred and what the
next step is, so it can be picked up without re-deriving the context. Nothing
here is a bug.

## 1. First real posts

Status: the blog ships with zero published posts. That is intentional — the
sample posts were removed on purpose, not by accident.

Consequences while empty (all temporary, all disappear with the first post):

- `astro build` warns that `src/content/posts/` has no matching files (or
  does not exist); the build still exits 0.
- Pagefind falls back to indexing whole pages, because no page carries
  `data-pagefind-body`. Search therefore returns pages instead of posts.
- The homepage, Notes, Archive and category pages render their empty states and
  the sidebar shows 0/0/0.

Next step: add `posts/<slug>.md` (or `posts/<slug>/index.md` when it has
images) in the private content repository with the required frontmatter
(`title`, `description`, `pubDate`, `category`, `draft`) and stage it with
`pnpm content:sync --from <path>`. See `docs/agents/content.md`. Verify
afterwards that the counts, the archive grouping and post-only search indexing
come back.

## Also worth remembering

- Search has no stemming for `zh-cn` (Pagefind limitation); recall is literal.
- Local Node may be newer than `.node-version`; before a release run
  `mise exec node@24.20.0 -- pnpm verify` (see `workflow.md`).
- Font subsets are generated per build and git-ignored, so a fresh clone or a
  Cloudflare build needs network access for the pinned sources once.
- The public history still contains the pre-split about page. It was public by
  design before the split; removing it now stops future edits from leaking, it
  does not make the old text secret.

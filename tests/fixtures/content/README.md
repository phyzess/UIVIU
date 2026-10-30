# Test-only content fixtures

Not writing, and not brand copy. `pnpm content:sync:fixtures` copies `posts/` and
`pages/about.md` into the git-ignored `src/content/` so public CI can type-check
and build the templates without access to the private content repository.

- Never deployed: Cloudflare builds read the private repository through
  `pnpm build:prod`.
- Keep the copy generic. It must not reproduce the real about page or real posts.
- `posts/fixture-published/index.md` exercises the post bundle layout with a
  relative image; `posts/fixture-draft.md` covers the plain layout and must stay
  out of every public entry point. `posts/对称结构.md` keeps a Han slug in the
  build so the sitemap and feed decoding stay covered.
- Keep the fixture copy small: a new glyph makes the build regenerate the font
  subsets, and the CI font cache only covers the source downloads.

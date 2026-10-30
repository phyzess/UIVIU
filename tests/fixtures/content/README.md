# Test-only content fixtures

Not writing, and not brand copy. `pnpm content:sync:fixtures` copies `posts/` and
`pages/about.md` into the git-ignored `src/content/` so public CI can type-check
and build the templates without access to the private content repository.

- Never deployed: Cloudflare builds read the private repository through
  `pnpm build:prod`.
- Keep the copy generic. It must not reproduce the real about page or real posts.
- `posts/fixture-published/index.md` exercises the post bundle layout with a
  relative image; `posts/fixture-draft.md` covers the plain layout and must stay
  out of every public entry point.
- Keep the copy to characters already covered by `public/fonts/ui-charset.json`:
  a fixture that adds glyphs makes every CI run rebuild the font subsets (~35 MB
  download) instead of reusing the committed ones.

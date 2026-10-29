# Workflow and environment

## Toolchain

| Tool       | Version source                              | Notes                                                                          |
| ---------- | ------------------------------------------- | ------------------------------------------------------------------------------ |
| Node.js    | `.node-version` (24.20.0, Active LTS)       | Astro 7 requires `>=22.23.4`; CI reads the same file                           |
| pnpm       | `packageManager` in `package.json` (12.3.4) | CI reads the same field via `pnpm/action-setup`                                |
| TypeScript | devDependency, `^6.0.3`                     | `@astrojs/check` peer range is `^5 \|\| ^6`; TypeScript 7 is not supported yet |
| Oxfmt      | devDependency, 0.75.x                       | `.astro` support enabled through `"astro": true`                               |
| Oxlint     | devDependency, 1.90.x                       | Does not type check Astro templates; `astro check` does that                   |

## pnpm 12 specifics that bite

- **Settings are not read from `.npmrc`.** Only auth, registry, TLS, proxy and
  `local-address` come from `.npmrc`; everything else belongs in
  `pnpm-workspace.yaml` (or the global `config.yaml`). `fetchTimeout`,
  `fetchRetries` and `allowBuilds` live there for this reason.
- **Lifecycle scripts are blocked by default** (`strictDepBuilds`), surfacing as
  `ERR_PNPM_IGNORED_BUILDS`. Approve a package explicitly:
  `allowBuilds: { package-name: true }`. `simple-git-hooks` is approved because
  it registers the Git hooks.
- **The registry is local, not committed.** `.npmrc` is git-ignored and holds a
  local mirror for this machine; the repository assumes the default npm
  registry, so CI and other clones need no override. See `.npmrc` on disk for
  the current host. Large platform binaries can arrive slowly; the raised
  `fetchTimeout` in `pnpm-workspace.yaml` prevents pnpm from aborting mid
  download and silently dropping native optional dependencies (which later
  fails as `Cannot find native binding`, e.g.
  `@rolldown/binding-darwin-arm64`).
- If a native binding is missing after a network hiccup, remove `node_modules`
  and run `pnpm install` again (a plain `install` reuses the store). Avoid
  `--force`: it re-downloads every platform's binaries.

## Local Node vs pinned Node

CI uses `.node-version` (24.20.0, LTS) while a local `mise` shell may resolve a
newer Current release through PATH (26.x here). Astro only requires
`>=22.23.4`, so both work, but "green locally, red in CI" stays possible for
runtime-dependent code. Before a release, run the gate under the pinned version:

```bash
mise exec node@24.20.0 -- pnpm verify
```

## Commands

```bash
pnpm dev            # foreground dev server
pnpm build          # astro build → dist/, then Pagefind indexes dist/
pnpm build:astro    # Astro build only, no search index
pnpm search:index   # Pagefind over dist/ (used by `pnpm build`)
pnpm preview        # serve dist/
pnpm check          # astro check
pnpm lint           # oxlint
pnpm format         # oxfmt --write
pnpm format:check   # oxfmt --check
pnpm test           # vitest run
pnpm verify         # the full gate: check, lint, format:check, test, build
```

Astro 7 adds a detached dev server:

```bash
astro dev --background   # start in the background
astro dev status|logs|stop
```

## Git hooks

`simple-git-hooks` installs `.git/hooks/pre-commit` on `pnpm install`
(`postinstall`), running `lint-staged` with only the staged files:

- `{js,mjs,cjs,ts,mts,cts,json,jsonc,css,md,yaml,yml}` → `oxlint --fix`, `oxfmt --write`
- `*.astro` → `oxfmt --write`

Hooks never run a build; CI is the authority. Reinstall after cloning with
`pnpm install` (or `pnpm simple-git-hooks`).

## CI

`.github/workflows/ci.yml` runs on pushes to `main` and on pull requests:
install with `--frozen-lockfile`, then check, lint, format check, test, build.
No check may be removed or skipped to make it green.

The three third-party actions are pinned to reviewed commit SHAs
(`actions/checkout` v7.0.1, `pnpm/action-setup` v6.1.0, `actions/setup-node`
v7.1.0); the tag after each SHA is only a comment. Update both together.

## Commits

Conventional commits, one atomic commit per phase or change:

```text
feat(scaffold): …
fix(content): …
chore(tooling): …
docs(agents): …
```

Commits in this repository use `phyzess <phyzess@gmail.com>` (set locally, not
globally).

## Search

Pagefind indexes `dist/` after the Astro build, so the index only exists in a
built site — never in `astro dev`. The search page detects a missing index and
says so instead of pretending to search. Local verification:

```bash
pnpm build          # astro build + pagefind --site dist
pnpm preview        # serves dist/, including /pagefind/
# open http://localhost:4321/search/?q=Markdown
```

Only the post article carries `data-pagefind-body`, so navigation, footer,
archive, about and the table of contents are not indexed, and drafts never
reach the index because they are never built.

Caveat: Pagefind only honours that rule while at least one page has the
attribute. With zero published posts it falls back to indexing every page
(navigation is skipped automatically), so a search on an empty blog can match
chrome text. The behaviour corrects itself with the first post. `dist/pagefind/` is build output
and is not committed.

## Deployment

Configured for Cloudflare Workers static assets, not deployed.

- `wrangler.jsonc` sets `name: "uiviu"`, `assets.directory: "./dist"` and
  `not_found_handling: "404-page"`. There is no `main` and no adapter, so
  Cloudflare serves the files directly and returns `dist/404.html` for misses.
- `compatibility_date` must not be later than the installed workerd supports.
  Wrangler refuses a future date with `Compatibility date … is in the future and
  unsupported`; update the date together with wrangler.
- Local checks that were actually run: `wrangler deploy --dry-run` (reads 35
  files, uploads nothing) and `wrangler dev --port 8787`, where `/` and the post
  page return 200, an unknown path returns 404 with the custom page, `/about`
  redirects 307 to `/about/`, `/rss.xml` and `/sitemap-index.xml` are XML,
  `/pagefind/pagefind.js` is served, `/search/` returns results and the reading
  progress bar still tracks scrolling.
- Commands: `pnpm preview:worker` (wrangler dev), `pnpm exec wrangler deploy`
  after `pnpm build`. `pnpm deploy` does both. Nothing is uploaded by CI, and no
  DNS record is changed from this repository.

Before the first deploy the placeholder `site` in `astro.config.mjs`
(`https://uiviu.example.com`) and `public/robots.txt` must be replaced with the
production domain; that single config value drives RSS, canonical, Open Graph and
the sitemap. Production deploys and DNS changes require explicit approval.

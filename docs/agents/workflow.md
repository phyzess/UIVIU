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
pnpm content:sync   # stage content: --from <path>, --fixtures or --remote
pnpm content:status # staged source, content commit, draft count
pnpm content:check  # fail when git tracks anything under src/content/
pnpm build:prod     # content:sync:remote → build (Cloudflare build command)
pnpm fonts:check    # assert every source glyph is in the font subsets
pnpm fonts:build    # rebuild the subsets (needs network or .fonts-cache/)
pnpm verify         # check, lint, format:check, fonts:check, test, build
```

Astro 7 adds a detached dev server:

```bash
astro dev --background   # start in the background
astro dev status|logs|stop
```

## Content repository

Writing is private: `posts/`, post images and `pages/about.md` live in
`phyzess/uiviu-content`, and `scripts/content.mjs` assembles them into the
git-ignored `src/content/` before a build. Authoring rules are in
`docs/agents/content.md`.

| Mode     | Command                           | Source                                               | Used by                 |
| -------- | --------------------------------- | ---------------------------------------------------- | ----------------------- |
| local    | `pnpm content:sync --from <path>` | a local clone (`UIVIU_CONTENT_DIR` also works)       | preview, local builds   |
| fixtures | `pnpm content:sync:fixtures`      | `tests/fixtures/content/`                            | public CI; never deploy |
| remote   | `pnpm content:sync:remote`        | `UIVIU_CONTENT_REPO` at `UIVIU_CONTENT_REF` (`main`) | Cloudflare builds       |

Remote mode needs `UIVIU_CONTENT_TOKEN`: a fine-grained GitHub token with
`Contents: read` on the content repository only. It is passed to `git` through an
environment-provided HTTP header, so it never appears in argv, in the clone's
remote URL or in the log; failures print one redacted line and exit non-zero.
`pnpm build:prod` chains sync and build with `&&`, so a failed read, a missing
about page or a broken about frontmatter stops the deploy instead of publishing a
site with holes in it.

Rules the script enforces:

- `src/content/` is wiped first, so a post deleted in the content repository
  disappears from the next build.
- Only `posts/` and `pages/` are copied: the content repository's `.git`,
  `.github`, dotfiles and README never reach the site.
- Symlinks are refused instead of resolved.
- A missing `posts/` is a new content repository, not an error: the site builds
  with zero posts.
- `pages/about.md` must exist and carry `title` and `description`.
- The log prints the content commit, the site commit and counts; never the token
  and never a post body.

The last staging is recorded in `src/content/.source.json` (mode, source, commit,
file counts) and printed by `pnpm content:status`.

## Fonts

Four subsets ship with the site (`public/fonts/uiviu-*.woff2`): Kai (headings),
Hei (body/UI), Meta (dates/labels/code) and Pixel (the `404` digits only). They
are generated, renamed and checked by one script:

- `pnpm fonts:ensure` — compare the characters used by `src/` with
  `public/fonts/ui-charset.json`; rebuild only when something is missing. It runs
  after content staging in `pnpm dev`, `pnpm build` and `pnpm verify`, so a new
  post (or new interface copy) rebuilds the subsets automatically and the build
  keeps going. It prints how many glyphs were added and reminds you to commit the
  regenerated files if you want offline builds.
- Drafts are skipped: `draft: true` files contribute no glyphs, so a private
  draft cannot leak characters into the public `ui-charset.json` or subsets.
- All four fonts — including the pixel face — derive their character set from the
  same scan, so expanding what the pixel font renders needs no list to maintain.
- `pnpm fonts:build` — force a rebuild.
- `pnpm fonts:check` — strict audit that fails instead of rebuilding, useful in
  review to see whether the committed subsets are current.

Sources are pinned release files downloaded with Node's `fetch` into
`.fonts-cache/` (git ignored, cached in CI by `.github/workflows/ci.yml`); the
zip for the pixel font is unpacked in-process with `DecompressionStream`, so no
`curl`, `unzip` or Python is required on the build image. Full fonts never enter
the repository. The script subsets with `subset-font`, rewrites the internal
`name` table to the `UIVIU …` family names (OFL reserved names and IPA Article
3.1(4) both require this for modified fonts), preserves the upstream
copyright/license records and compresses with `fontverter`.

### Build environments

- **GitHub Actions** (`.github/workflows/ci.yml`): network plus the
  `.fonts-cache` cache step; a rebuild only downloads when glyphs actually
  change.
- **Cloudflare Workers Builds**: the font step needs no system binaries, but the
  build image must run Node 24 (`NODE_VERSION=24`), and there is no
  `.fonts-cache` cache, so a rebuild downloads ~35 MB once. Committing the
  regenerated subsets after adding content keeps that path network-free.
- **One builder at a time**: Cloudflare builds and deploys on every push and is
  the only environment with content credentials. A local `pnpm deploy` is a
  fallback for incidents, not a second pipeline.

Licensing: WenKai is OFL 1.1 with an Additional Permission for web subsets;
Hei is IPA Font License 1.0 (derived subset must ship the license and allow
replacement by the original — both covered in `public/fonts/README.md`);
Maple Mono and Fusion Pixel are OFL 1.1. License texts sit next to the fonts.

## Git hooks

`simple-git-hooks` installs `.git/hooks/pre-commit` on `pnpm install`
(`postinstall`), running `lint-staged` with only the staged files:

- `{js,mjs,cjs,ts,mts,cts,json,jsonc,css,md,yaml,yml}` → `oxlint --fix`, `oxfmt --write`
- `*.astro` → `oxfmt --write`

Hooks never run a build; CI is the authority. Reinstall after cloning with
`pnpm install` (or `pnpm simple-git-hooks`).

## CI

`.github/workflows/ci.yml` runs on pushes to `main` and on pull requests:
install with `--frozen-lockfile`, stage the test fixtures, then check, lint,
format check, test, build. No check may be removed or skipped to make it green.

- `pnpm content:check` runs first and fails if git tracks anything under
  `src/content/`: writing may only exist in the private repository, and this is
  what keeps a stray `git add` from publishing it.
- `pnpm content:sync:fixtures` supplies `tests/fixtures/content/`, so templates,
  types and the build stay covered without the private repository. The fixtures
  are test material committed here on purpose and are never deployed.
- CI holds no content repository credentials and needs no repository secret.

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

Static assets on Cloudflare Workers, deployed by **Workers Builds**. GitHub
Actions runs checks only and never deploys. Production builds read the private
content repository, so this public repository alone cannot publish the site.

Workers Builds settings (Cloudflare dashboard → Worker → Settings → Builds):

| Setting           | Value                  |
| ----------------- | ---------------------- |
| Production branch | `main`                 |
| Build command     | `pnpm build:prod`      |
| Deploy command    | `npx wrangler deploy`  |
| Preview command   | `npx wrangler preview` |
| Root directory    | repository root        |

- **Preview Builds stay off.** A preview build would run branch or PR code in an
  environment that can read the private repository. Pull requests are verified by
  GitHub CI with fixtures instead.
- **Build secret** `UIVIU_CONTENT_TOKEN`: fine-grained, `Contents: read` on the
  content repository only. Plain variables: `UIVIU_CONTENT_REPO` (`owner/name`)
  and optionally `UIVIU_CONTENT_REF` (default `main`). The build image already
  provides `git`. It is a build setting, not a runtime variable: the deployed site
  never talks to GitHub.
- **Deploy hook + webhook**: create a deploy hook for `main` and add it as a
  GitHub webhook on the content repository, `push` events only. A content push
  then rebuilds and deploys with no GitHub Actions minutes at all. Treat the hook
  URL as a password. GitHub may also deliver pushes from other branches or tags,
  but every build reads `main`, so only `main` content can ship; add a branch
  filter if the extra builds become noise. If the direct webhook turns out not to
  work, the fallback is a one-step Action in the content repository that only
  POSTs to the hook — the site build stays in Cloudflare.
- The Worker name must match `name` in `wrangler.jsonc` (`uiviu`).
- Node: `.node-version` (`24`, the image's default is 24.22.1); pnpm: the
  `packageManager` field. The image installs dependencies before the build
  command and times out at 20 minutes (this build takes 1–2).
- `wrangler.jsonc` uses `assets.directory: "./dist"` and
  `not_found_handling: "404-page"`; `compatibility_date` must not be later than
  the installed workerd supports.
- Fonts: content glyphs arrive with the private content, so a build that needs new
  ones runs `fonts:ensure` inside the build (one ~35 MB download without
  `.fonts-cache`). Committing subsets regenerated from private content publishes
  that character set — decide that deliberately.
- Rollback: every production deploy creates a Worker version; redeploy a previous
  one (Worker → Deployments → rollback), then fix the content or the credentials
  before rebuilding.
- Manual fallback: `pnpm deploy` (syncs the private content, builds, then
  `wrangler deploy`) after `wrangler login`, with the content variables set. No
  DNS change or production deploy happens without explicit approval.

### One-time switch to the split

Order matters: an automatic Cloudflare build must never publish a site whose
content came from nowhere.

1. Create the private content repository, move the about page to
   `pages/about.md`, and confirm it is not publicly reachable. The old about page
   stays visible in this repository's history; the split stops future changes
   from leaking, it does not make the past private.
2. Land the public staging code while the old `src/content/pages/about.md` is
   still in place, so the current build command keeps working.
3. In Cloudflare: disable Preview Builds, add the token and the repository
   variables, switch the build command to `pnpm build:prod`, and run one manual
   build. Confirm `/about/` renders the private copy and that an unreadable
   content repository fails the build.
4. Remove `src/content/pages/about.md` from this repository; `pnpm content:check`
   keeps it out from then on.
5. Create the deploy hook and the webhook, push a small about-page edit, and
   confirm the build ran (GitHub → Webhooks → Recent Deliveries, Cloudflare →
   Deployments).

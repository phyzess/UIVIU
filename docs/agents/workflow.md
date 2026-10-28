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
- **The registry is a local mirror.** This machine can only reach
  `https://mirrors.cloud.tencent.com/npm/` (npmjs and npmmirror are blocked) and
  large platform binaries arrive at ~35 KB/s. The raised `fetchTimeout` prevents
  pnpm from aborting mid-download and silently dropping native optional
  dependencies (which later fails as `Cannot find native binding`, e.g.
  `@rolldown/binding-darwin-arm64`).
- If a native binding is missing after a network hiccup, remove `node_modules`
  and run `pnpm install` again (a plain `install` reuses the store). Avoid
  `--force`: it re-downloads every platform's binaries.

## Commands

```bash
pnpm dev            # foreground dev server
pnpm build          # astro build → dist/
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

Open hardening item: third-party actions are referenced by tag, not by commit
SHA. Pin them before treating CI as a security boundary.

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

## Deployment

Not configured yet (phase 6). The target is Cloudflare Workers static assets with
`dist/` as the asset directory and `not_found_handling: "404-page"`, without an
SSR adapter. No production deployment, DNS change or remote repository creation
happens without explicit approval, and no domain is invented: `astro.config.mjs`
has no `site` value yet, which RSS and the sitemap will need.

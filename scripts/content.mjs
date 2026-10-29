#!/usr/bin/env node
/**
 * Content staging.
 *
 * This repository holds code. Posts, post images and the about page live in a
 * separate private repository and are copied into the git-ignored `src/content/`
 * before a build runs, so no writing has to be published to be published on the
 * site.
 *
 *   node scripts/content.mjs sync --from <path>   # local clone of the content repo
 *   node scripts/content.mjs sync --fixtures      # public CI and tests only
 *   node scripts/content.mjs sync --remote        # Cloudflare build, read-only token
 *   node scripts/content.mjs status               # what a build would see
 *   node scripts/content.mjs check                # fail if git tracks src/content
 *
 * Every sync wipes `src/content/` first, so a post deleted in the private
 * repository also disappears from the next build. Nothing is staged implicitly:
 * `pnpm build` builds exactly what is on disk, and a production build without an
 * about page fails instead of shipping a site with a hole in it.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const STAGE = path.join(ROOT, "src/content");
const FIXTURES = path.join(ROOT, "tests/fixtures/content");

const POST_FILE = /\.(md|mdx)$/i;
const DRAFT = /^draft:\s*true\s*$/m;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

const HELP = `usage: node scripts/content.mjs <command>

commands:
  sync     stage content into src/content/ (git-ignored build input)
             --from <path>  local clone of the private content repository
             --fixtures     tests/fixtures/content; checks only, never deploy
             --remote       clone UIVIU_CONTENT_REPO at UIVIU_CONTENT_REF
                            (default main) using UIVIU_CONTENT_TOKEN
  status   print what is staged right now
  check    fail when git tracks anything under src/content/`;

function git(args, cwd = ROOT) {
  return execFileSync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function commitOf(dir) {
  try {
    return git(["rev-parse", "--short=7", "HEAD"], dir);
  } catch {
    return null;
  }
}

function isDirty(dir) {
  try {
    return git(["status", "--porcelain"], dir).length > 0;
  } catch {
    return false;
  }
}

function redact(text, secrets) {
  return secrets
    .filter(Boolean)
    .reduce((out, secret) => out.split(secret).join("***"), text);
}

function parseArgs(argv) {
  const flags = new Set();
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const equals = arg.indexOf("=");
    if (equals !== -1) {
      values.set(arg.slice(0, equals), arg.slice(equals + 1));
      continue;
    }
    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith("--")) {
      values.set(arg, next);
      index += 1;
    } else {
      flags.add(arg);
    }
  }
  return { flags, values };
}

/**
 * Copy a directory tree. Dot entries are skipped, which is what keeps `.git`,
 * `.github` and `.DS_Store` out of the site; symlinks are refused instead of
 * followed, so a link in the private repository cannot pull in outside files.
 */
function copyTree(from, to, label) {
  fs.mkdirSync(to, { recursive: true });
  let files = 0;
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const source = path.join(from, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`${label}: refusing to copy symlink ${source}`);
    }
    if (entry.isDirectory()) {
      files += copyTree(source, path.join(to, entry.name), label);
    } else if (entry.isFile()) {
      fs.copyFileSync(source, path.join(to, entry.name));
      files += 1;
    }
  }
  return files;
}

function count(dir, match) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += count(full, match);
    else if (entry.isFile() && match(full)) total += 1;
  }
  return total;
}

function countPosts(dir) {
  return count(dir, (file) => POST_FILE.test(file));
}

function countDrafts(dir) {
  return count(
    dir,
    (file) => POST_FILE.test(file) && DRAFT.test(fs.readFileSync(file, "utf8")),
  );
}

/** The about page is required by `/about/`; fail before the render does. */
function assertAbout(file) {
  if (!fs.existsSync(file)) {
    throw new Error(
      "pages/about.md is missing; /about/ cannot render (see docs/agents/content.md)",
    );
  }
  const match = FRONTMATTER.exec(fs.readFileSync(file, "utf8"));
  if (!match) throw new Error("pages/about.md has no frontmatter block");
  for (const key of ["title", "description"]) {
    if (!new RegExp(`^${key}\\s*:\\s*\\S`, "m").test(match[1])) {
      throw new Error(`pages/about.md frontmatter is missing "${key}"`);
    }
  }
}

/**
 * Stage a content repository: `posts/` and `pages/` only, replacing whatever was
 * staged before. Returns the marker written next to the staged content.
 */
export function stageContent({
  from,
  to = STAGE,
  mode = "local",
  source = from,
  commit = null,
  dirty = false,
}) {
  const sourceDir = path.resolve(from);
  const targetDir = path.resolve(to);
  if (targetDir === sourceDir || targetDir.startsWith(sourceDir + path.sep)) {
    throw new Error(`refusing to stage ${sourceDir} onto itself`);
  }
  if (targetDir === path.parse(targetDir).root) {
    throw new Error(`refusing to clear ${targetDir}`);
  }
  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    throw new Error(`content directory ${sourceDir} does not exist`);
  }
  // A content repository starts with no posts at all, and git cannot keep an
  // empty directory: a missing posts/ means "no posts yet", not "wrong path".
  const sourcePosts = path.join(sourceDir, "posts");
  const hasPosts = fs.existsSync(sourcePosts);
  if (hasPosts && !fs.statSync(sourcePosts).isDirectory()) {
    throw new Error(`${sourcePosts} is not a directory`);
  }
  assertAbout(path.join(sourceDir, "pages/about.md"));

  fs.rmSync(targetDir, { recursive: true, force: true });
  const stagePosts = path.join(targetDir, "posts");
  const stagePages = path.join(targetDir, "pages");
  fs.mkdirSync(stagePosts, { recursive: true });
  const posts = hasPosts ? copyTree(sourcePosts, stagePosts, "posts") : 0;
  const pages = copyTree(path.join(sourceDir, "pages"), stagePages, "pages");
  assertAbout(path.join(stagePages, "about.md"));

  const marker = {
    mode,
    source: String(source),
    commit: commit ?? null,
    dirty: Boolean(dirty),
    siteCommit: commitOf(ROOT),
    posts: countPosts(stagePosts),
    drafts: countDrafts(stagePosts),
    files: { posts, pages },
    hasPosts,
  };
  fs.writeFileSync(
    path.join(targetDir, ".source.json"),
    `${JSON.stringify(marker, null, 2)}\n`,
  );
  return marker;
}

function localSource(dir) {
  const from = path.resolve(dir);
  if (!fs.existsSync(from)) throw new Error(`content directory ${from} does not exist`);
  return {
    from,
    mode: "local",
    source: from,
    commit: commitOf(from),
    dirty: isDirty(from),
  };
}

/**
 * Clone the private repository into a temp directory. The token travels in an
 * environment-provided HTTP header, never in argv (visible in `ps`) or in the
 * remote URL (which git may record in the clone's config).
 */
function remoteSource() {
  const repo = (process.env.UIVIU_CONTENT_REPO ?? "").trim();
  const token = (process.env.UIVIU_CONTENT_TOKEN ?? "").trim();
  const ref = (process.env.UIVIU_CONTENT_REF ?? "").trim() || "main";
  if (!repo) {
    throw new Error(
      "UIVIU_CONTENT_REPO is not set (owner/name of the private content repository)",
    );
  }
  if (!token) {
    throw new Error(
      "UIVIU_CONTENT_TOKEN is not set (read-only token for the content repository)",
    );
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
    throw new Error(`UIVIU_CONTENT_REPO "${repo}" is not owner/name`);
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "uiviu-content-"));
  const basic = Buffer.from(`x-access-token:${token}`).toString("base64");
  try {
    execFileSync(
      "git",
      [
        "clone",
        "--depth=1",
        "--single-branch",
        "--branch",
        ref,
        "--no-tags",
        "--quiet",
        `https://github.com/${repo}.git`,
        dir,
      ],
      {
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: "0",
          GIT_CONFIG_COUNT: "1",
          GIT_CONFIG_KEY_0: "http.extraHeader",
          GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${basic}`,
        },
        stdio: ["ignore", "ignore", "pipe"],
        timeout: 180_000,
      },
    );
  } catch (error) {
    fs.rmSync(dir, { recursive: true, force: true });
    const detail = redact(String(error.stderr ?? error.message), [token, basic])
      .trim()
      .split("\n")[0];
    throw new Error(`could not read ${repo}@${ref}: ${detail}`, { cause: error });
  }
  return {
    from: dir,
    mode: "remote",
    source: `${repo}@${ref}`,
    commit: commitOf(dir),
    dirty: false,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

function report(marker) {
  const commit = marker.commit
    ? `commit ${marker.commit}${marker.dirty ? " + uncommitted edits" : ""}`
    : "not a git checkout";
  console.log(`content: ${marker.source} (${marker.mode}, ${commit})`);
  if (marker.siteCommit) console.log(`content: site commit ${marker.siteCommit}`);
  const drafts = marker.drafts > 0 ? `, ${marker.drafts} draft(s) hidden` : "";
  console.log(
    `content: staged ${marker.posts} post(s)${drafts} and ${marker.files.pages} page file(s) into src/content/`,
  );
  if (!marker.hasPosts) {
    console.log(
      "content: the source has no posts/ yet; the site will build with zero posts",
    );
  }
  if (marker.mode === "fixtures") {
    console.log(
      "content: TEST FIXTURES staged — for checks only, never deploy this build",
    );
  }
}

function sync(argv) {
  const { flags, values } = parseArgs(argv);

  const requested = [
    flags.has("--fixtures"),
    flags.has("--remote"),
    values.has("--from"),
  ].filter(Boolean).length;
  if (requested > 1) throw new Error("pass only one of --from, --fixtures and --remote");
  let source;
  if (flags.has("--fixtures")) {
    source = {
      from: FIXTURES,
      mode: "fixtures",
      source: path.relative(ROOT, FIXTURES),
      commit: commitOf(FIXTURES),
      dirty: false,
    };
  } else if (flags.has("--remote")) {
    source = remoteSource();
  } else {
    const from = values.get("--from") || (process.env.UIVIU_CONTENT_DIR ?? "").trim();
    if (!from) {
      throw new Error(
        "no content source: pass --from <path>, set UIVIU_CONTENT_DIR, or use --fixtures / --remote",
      );
    }
    source = localSource(from);
  }

  try {
    report(stageContent({ ...source, to: STAGE }));
  } finally {
    source.cleanup?.();
  }
}

function status() {
  const markerPath = path.join(STAGE, ".source.json");
  if (!fs.existsSync(markerPath)) {
    console.log("content: nothing staged (run `pnpm content:sync --from <path>`)");
    return;
  }
  const marker = JSON.parse(fs.readFileSync(markerPath, "utf8"));
  console.log(`content: ${marker.mode} ${marker.source}`);
  console.log(
    `content: content commit ${marker.commit ?? "unknown"}${marker.dirty ? " + uncommitted edits" : ""}, site commit ${marker.siteCommit ?? "unknown"}`,
  );
  console.log(
    `content: ${marker.posts} post(s), ${marker.drafts} draft(s), ${marker.files.posts} post file(s), ${marker.files.pages} page file(s)`,
  );
}

/** Fail when writing content is tracked: staged content must stay private. */
export function checkTracking(cwd = ROOT) {
  try {
    if (git(["rev-parse", "--is-inside-work-tree"], cwd) !== "true") {
      throw new Error("not a work tree");
    }
  } catch {
    console.log("content: no git checkout here; skipping the tracking check");
    return;
  }
  const tracked = git(["ls-files", "-z", "--", "src/content"], cwd)
    .split("\0")
    .filter(Boolean);
  if (tracked.length > 0) {
    throw new Error(
      `git tracks ${tracked.length} file(s) under src/content/ (${tracked
        .slice(0, 3)
        .join(
          ", ",
        )}); writing belongs in the private repository — run \`git rm --cached <path>\``,
    );
  }
  console.log(
    "content: src/content/ is untracked; writing stays in the private repository",
  );
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === "help" || command === "--help" || command === "-h") {
    console.log(HELP);
    return;
  }
  if (command === "sync") sync(rest);
  else if (command === "status") status();
  else if (command === "check") checkTracking();
  else throw new Error(`unknown command "${command}"\n\n${HELP}`);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(import.meta.filename)
) {
  main().catch((error) => {
    console.error(`content: ${error.message}`);
    process.exitCode = 1;
  });
}

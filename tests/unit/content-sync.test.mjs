import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { checkTracking, stageContent } from "../../scripts/content.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const SCRIPT = path.join(ROOT, "scripts/content.mjs");

const ABOUT = `---
title: "关于"
description: "测试使用的关于页样稿，不是站点内容。"
---

样稿。
`;

const POST = `---
title: "样稿"
description: "测试使用的文章样稿，不是站点内容。"
pubDate: 2026-01-01
category: code
draft: false
---

样稿。
`;

const DRAFT = POST.replace("draft: false", "draft: true");

const tempDirs = [];

function tempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "uiviu-content-test-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
  }
});

/** A minimal private content repository: posts/, pages/, plus noise to skip. */
function contentRepo({ about = ABOUT, posts = {} } = {}) {
  const dir = tempDir();
  fs.mkdirSync(path.join(dir, "pages"), { recursive: true });
  if (posts !== null) fs.mkdirSync(path.join(dir, "posts"), { recursive: true });
  fs.writeFileSync(path.join(dir, "README.md"), "content repository\n");
  fs.mkdirSync(path.join(dir, ".git"), { recursive: true });
  fs.writeFileSync(path.join(dir, ".git", "config"), "[core]\n");
  if (about !== null) fs.writeFileSync(path.join(dir, "pages/about.md"), about);
  for (const [name, body] of Object.entries(posts ?? {})) {
    const file = path.join(dir, "posts", name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
  }
  return dir;
}

function runSync(args, env = {}) {
  return spawnSync(process.execPath, [SCRIPT, "sync", ...args], {
    cwd: ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      UIVIU_CONTENT_DIR: "",
      UIVIU_CONTENT_REPO: "",
      UIVIU_CONTENT_TOKEN: "",
      ...env,
    },
  });
}

function gitRepo(files) {
  const dir = tempDir();
  execFileSync("git", ["init", "-q"], { cwd: dir });
  for (const [name, body] of Object.entries(files)) {
    const file = path.join(dir, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
  }
  return dir;
}

describe("stageContent", () => {
  it("copies posts and pages and records the source", () => {
    const from = contentRepo({
      posts: { "hello.md": POST, "draft.md": DRAFT, "hello/sample.png": "png" },
    });
    const to = tempDir();

    const marker = stageContent({ from, to });

    expect(marker.mode).toBe("local");
    expect(marker.posts).toBe(2);
    expect(marker.drafts).toBe(1);
    expect(marker.files).toEqual({ posts: 3, pages: 1 });
    expect(fs.existsSync(path.join(to, "posts", "hello.md"))).toBe(true);
    expect(fs.existsSync(path.join(to, "posts", "hello", "sample.png"))).toBe(true);
    expect(fs.existsSync(path.join(to, "pages", "about.md"))).toBe(true);
    expect(fs.existsSync(path.join(to, ".source.json"))).toBe(true);
  });

  it("removes content a previous sync left behind", () => {
    const from = contentRepo({ posts: { "hello.md": POST } });
    const to = tempDir();
    fs.mkdirSync(path.join(to, "posts"), { recursive: true });
    fs.writeFileSync(path.join(to, "posts/deleted.md"), "stale");

    stageContent({ from, to });

    expect(fs.existsSync(path.join(to, "posts/deleted.md"))).toBe(false);
    expect(fs.readdirSync(path.join(to, "posts"))).toEqual(["hello.md"]);
  });

  it("skips dot entries and everything outside posts/ and pages/", () => {
    const from = contentRepo({ posts: { "hello.md": POST } });
    fs.writeFileSync(path.join(from, "posts/.DS_Store"), "junk");

    const to = tempDir();
    stageContent({ from, to });

    expect(fs.existsSync(path.join(to, "posts/.DS_Store"))).toBe(false);
    expect(fs.existsSync(path.join(to, ".git"))).toBe(false);
    expect(fs.existsSync(path.join(to, "README.md"))).toBe(false);
  });

  it("fails when the source has no about page", () => {
    const from = contentRepo({ about: null, posts: { "hello.md": POST } });

    expect(() => stageContent({ from, to: tempDir() })).toThrow(/about\.md is missing/);
  });

  it("fails when the about frontmatter is incomplete", () => {
    const from = contentRepo({ about: "---\ntitle: \u5173\u4e8e\n---\n", posts: {} });

    expect(() => stageContent({ from, to: tempDir() })).toThrow(/missing "description"/);
  });

  it("stages an empty blog when the source has no posts/ yet", () => {
    const from = contentRepo({ posts: null });
    const to = tempDir();

    const marker = stageContent({ from, to });

    expect(marker.hasPosts).toBe(false);
    expect(marker.posts).toBe(0);
    expect(fs.readdirSync(path.join(to, "posts"))).toEqual([]);
    expect(fs.existsSync(path.join(to, "pages", "about.md"))).toBe(true);
  });

  it("fails when posts/ is a file instead of a directory", () => {
    const from = contentRepo({ posts: null });
    fs.writeFileSync(path.join(from, "posts"), "not a directory");

    expect(() => stageContent({ from, to: tempDir() })).toThrow(/is not a directory/);
  });

  it("refuses symlinks instead of following them", () => {
    const from = contentRepo({ posts: { "hello.md": POST } });
    fs.symlinkSync("/etc/hosts", path.join(from, "posts/link.md"));

    expect(() => stageContent({ from, to: tempDir() })).toThrow(
      /refusing to copy symlink/,
    );
  });

  it("leaves the previous staging untouched when the source is invalid", () => {
    const to = tempDir();
    fs.mkdirSync(path.join(to, "posts"), { recursive: true });
    fs.writeFileSync(path.join(to, "posts/kept.md"), POST);

    expect(() => stageContent({ from: tempDir(), to })).toThrow();

    expect(fs.existsSync(path.join(to, "posts/kept.md"))).toBe(true);
  });
});

describe("sync command", () => {
  it("exits non-zero without a content source", () => {
    const result = runSync([]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("no content source");
  });

  it("exits non-zero when the remote source has no credentials", () => {
    const result = runSync(["--remote"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("UIVIU_CONTENT_REPO");
  });

  it("rejects two content sources before touching anything", () => {
    const result = runSync(["--fixtures", "--remote"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("pass only one of");
  });
});

describe("checkTracking", () => {
  it("fails when git tracks staged content", () => {
    const dir = gitRepo({ "src/content/posts/leak.md": POST });
    execFileSync("git", ["add", "--force", "src/content/posts/leak.md"], { cwd: dir });

    expect(() => checkTracking(dir)).toThrow(/git tracks 1 file/);
  });

  it("passes when staged content is untracked", () => {
    const dir = gitRepo({
      ".gitignore": "/src/content/\n",
      "src/content/posts/hello.md": POST,
      "src/content/pages/about.md": ABOUT,
    });

    expect(checkTracking(dir)).toBeUndefined();
  });
});

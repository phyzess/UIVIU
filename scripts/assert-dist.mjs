#!/usr/bin/env node
/**
 * Build-output contract checks.
 *
 * Runs after `astro build` and `pagefind` in `pnpm build`, so `pnpm verify`,
 * CI and Cloudflare's `pnpm build:prod` all fail when the shipped artefact
 * breaks a promise the source alone cannot prove:
 *
 * - the sitemap lists only canonical, indexable pages (never `/search/`, never
 *   drafts, never the 404 page);
 * - the feed describes itself in Chinese and links exactly the published posts;
 * - drafts have no route, no feed entry and no sitemap entry;
 * - the search page and the 404 page stay `noindex`;
 * - the web app manifest and its icons are actually deployed;
 * - robots.txt points crawlers at the sitemap index.
 *
 * Anything checked here is about `dist/`, not about intentions: if a check
 * cannot read its input, that is a failure, not a skip.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CONTENT_INTRO_ZH, SITE_NAME } from "../src/lib/site.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const POSTS_DIR = path.join(ROOT, "src/content/posts");
const SITE_ORIGIN = "https://uiviu.me";

const failures = [];
let checks = 0;

/** Records one expectation; a failed one is reported after every check ran. */
function expect(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

async function readText(file) {
  try {
    return await readFile(file, "utf8");
  } catch {
    return null;
  }
}

async function exists(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

/** Recursively lists files below `dir`; a missing directory yields an empty list. */
async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

function unescapeXml(value) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

/** Post id the same way the glob loader derives it: `slug` or `slug/index`. */
function postSlug(file) {
  const relative = path.relative(POSTS_DIR, file).replaceAll("\\", "/");
  const withoutExtension = relative.replace(/\.mdx?$/, "");
  return withoutExtension.endsWith("/index")
    ? withoutExtension.slice(0, -"/index".length)
    : withoutExtension;
}

function frontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : "";
}

// --- sitemap ---------------------------------------------------------------

const distEntries = await readdir(DIST).catch(() => null);
expect(distEntries !== null, "dist/ is missing: run `pnpm build` first");

const sitemapChunks = (distEntries ?? []).filter((name) =>
  /^sitemap-\d+\.xml$/.test(name),
);
expect(sitemapChunks.length > 0, "no sitemap-<n>.xml chunk found in dist/");

const sitemapUrls = [];
for (const chunk of sitemapChunks) {
  const xml = await readText(path.join(DIST, chunk));
  expect(xml !== null, `sitemap chunk ${chunk} is unreadable`);
  for (const match of (xml ?? "").matchAll(/<loc>([^<]+)<\/loc>/g)) {
    sitemapUrls.push(unescapeXml(match[1]));
  }
}

expect(sitemapUrls.length > 0, "sitemap lists no URLs");

const sitemapPaths = new Set();
for (const url of sitemapUrls) {
  const parsed = new URL(url);
  sitemapPaths.add(parsed.pathname);
  expect(parsed.origin === SITE_ORIGIN, `sitemap URL is not on ${SITE_ORIGIN}: ${url}`);
  expect(
    parsed.pathname !== "/search/" && !parsed.pathname.startsWith("/search/"),
    `sitemap still lists a search URL: ${url}`,
  );
  expect(
    parsed.pathname !== "/404/" && parsed.pathname !== "/404",
    `sitemap lists 404: ${url}`,
  );
}

expect(sitemapPaths.size === sitemapUrls.length, "sitemap contains duplicate URLs");

// --- feed ------------------------------------------------------------------

const rssXml = await readText(path.join(DIST, "rss.xml"));
expect(rssXml !== null, "dist/rss.xml is missing");

const feedDescription = rssXml?.match(/<description>([^<]*)<\/description>/)?.[1];
expect(
  feedDescription !== undefined && unescapeXml(feedDescription) === CONTENT_INTRO_ZH,
  "feed channel description is not the Chinese content introduction",
);
expect(
  rssXml?.includes("<language>zh-cn</language>") ?? false,
  "feed is missing <language>zh-cn",
);
expect(
  rssXml?.includes(`<title>${SITE_NAME}</title>`) ?? false,
  "feed title is not the site name",
);

const feedPaths = new Set();
for (const match of (rssXml ?? "").matchAll(/<item>([\s\S]*?)<\/item>/g)) {
  const link = match[1].match(/<link>([^<]+)<\/link>/)?.[1];
  expect(link !== undefined, "feed item without a link");
  if (link) feedPaths.add(new URL(unescapeXml(link)).pathname);

  const encodedRaw = match[1].match(
    /<content:encoded>([\s\S]*?)<\/content:encoded>/,
  )?.[1];
  const encoded =
    encodedRaw === undefined
      ? undefined
      : encodedRaw.startsWith("<![CDATA[")
        ? encodedRaw.slice("<![CDATA[".length, -"]]>".length)
        : unescapeXml(encodedRaw);
  expect(encoded !== undefined, "feed item is missing full text");
  expect(
    !/(?:href|src)="\/(?!\/)/.test(encoded ?? ""),
    "feed full text still contains a site-relative URL",
  );
}

// --- posts, drafts and their routes ---------------------------------------

const postFiles = (await walk(POSTS_DIR)).filter((file) => /\.mdx?$/.test(file));

for (const file of postFiles) {
  const source = (await readText(file)) ?? "";
  const meta = frontmatter(source);
  const slug = postSlug(file);
  const route = `/posts/${slug}/`;
  const draft = /^\s*draft:\s*true\s*$/m.test(meta);

  if (draft) {
    expect(!sitemapPaths.has(route), `draft ${slug} is in the sitemap`);
    expect(!feedPaths.has(route), `draft ${slug} is in the feed`);
    expect(
      !(await exists(path.join(DIST, "posts", slug, "index.html"))),
      `draft ${slug} was built to dist/posts/${slug}/`,
    );
  } else {
    expect(sitemapPaths.has(route), `published post ${slug} is missing from the sitemap`);
    expect(feedPaths.has(route), `published post ${slug} is missing from the feed`);
  }
}

// --- noindex, manifest, robots --------------------------------------------

const searchHtml = await readText(path.join(DIST, "search/index.html"));
expect(searchHtml !== null, "dist/search/index.html is missing");
expect(
  searchHtml?.includes('<meta name="robots" content="noindex">') ?? false,
  "the search page is not noindex",
);

const notFoundHtml = await readText(path.join(DIST, "404.html"));
expect(notFoundHtml !== null, "dist/404.html is missing");
expect(
  notFoundHtml?.includes('<meta name="robots" content="noindex">') ?? false,
  "the 404 page is not noindex",
);

const manifestText = await readText(path.join(DIST, "site.webmanifest"));
expect(manifestText !== null, "dist/site.webmanifest is missing");
let manifest = null;
try {
  manifest = JSON.parse(manifestText ?? "");
} catch {
  failures.push("site.webmanifest is not valid JSON");
}
expect(manifest?.name === SITE_NAME, "manifest name is not the site name");
expect(manifest?.start_url === "/", "manifest start_url is not /");

const iconSources = new Set((manifest?.icons ?? []).map((icon) => icon.src));
expect(iconSources.has("/icon-192.png"), "manifest is missing the 192px icon");
expect(iconSources.has("/icon-512.png"), "manifest is missing the 512px icon");
for (const icon of iconSources) {
  expect(await exists(path.join(DIST, icon)), `manifest icon ${icon} was not deployed`);
}

const robots = await readText(path.join(DIST, "robots.txt"));
expect(
  robots?.includes(`Sitemap: ${SITE_ORIGIN}/sitemap-index.xml`) ?? false,
  "robots.txt does not point at the sitemap index",
);

// --- report ----------------------------------------------------------------

if (failures.length > 0) {
  console.error(`dist contract: ${failures.length} of ${checks} checks failed`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}

console.log(`dist contract: ${checks} checks passed`);

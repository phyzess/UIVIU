#!/usr/bin/env node
/**
 * Formal website fonts.
 *
 *   node scripts/fonts.mjs build    # rebuild subsets from pinned releases
 *   node scripts/fonts.mjs check    # assert the subsets cover all source copy
 *   node scripts/fonts.mjs ensure   # check, rebuild only when out of date
 *
 * `ensure` is wired into `pnpm dev` / `pnpm build` / `pnpm verify`, and it runs
 * after the content staging step, so adding copy is enough: a build notices new
 * glyphs, rebuilds the subsets (sources cached in .fonts-cache/, downloaded once
 * when needed) and continues.
 *
 * Licensing consequences, both handled here:
 * - OFL fonts with Reserved Font Names, and the IPA-licensed Neo XiHei, must not
 *   ship a modified subset under the original name. The subsets are renamed
 *   internally (name table) and on disk to UIVIU neutral names.
 * - Copyright/license name records from the originals are preserved, and the
 *   license texts live next to the fonts.
 */
import fs from "node:fs";
import path from "node:path";
import fontverter from "fontverter";
import subsetFont from "subset-font";

const ROOT = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(ROOT, ".fonts-cache");
const OUT = path.join(ROOT, "public/fonts");
const MANIFEST = path.join(OUT, "ui-charset.json");
const SPECIMEN_FREE = true; // the specimen page is gone; scan everything in src/
// A draft is private and never renders; its characters must not reach the
// committed subsets (public/fonts/ui-charset.json is public). Only frontmatter
// decides: a published post may quote "draft: true" in its body.
const FRONTMATTER_BLOCK = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const DRAFT_FLAG = /^draft:\s*true\s*$/m;

const SOURCES = {
  kai: {
    file: "LXGWWenKai-Regular.ttf",
    url: "https://github.com/lxgw/LxgwWenKai/releases/download/v1.520/LXGWWenKai-Regular.ttf",
    origin: "LXGW WenKai v1.520 Regular",
    license: "SIL OFL 1.1 + Additional Permission (web subsets allowed)",
    family: "UIVIU Kai",
    postscript: "UIVIU-Kai",
    output: "uiviu-kai.woff2",
  },
  hei: {
    file: "LXGWNeoXiHei.ttf",
    url: "https://github.com/lxgw/LxgwNeoXiHei/releases/download/v1.308/LXGWNeoXiHei.ttf",
    origin: "LXGW Neo XiHei v1.308 Regular",
    license: "IPA Font License 1.0 (modified subset, see LICENSE-lxgw-neo-xihei.md)",
    family: "UIVIU Hei",
    postscript: "UIVIU-Hei",
    output: "uiviu-hei.woff2",
  },
  meta: {
    file: "MapleMono-VF.woff2",
    url: "https://cdn.jsdelivr.net/gh/subframe7536/maple-font@v7.9/woff2/var/MapleMono%5Bwght%5D-VF.woff2",
    origin: "Maple Mono v7.9 (wght 400)",
    license: "SIL OFL 1.1",
    family: "UIVIU Meta",
    postscript: "UIVIU-Meta",
    output: "uiviu-meta.woff2",
    variationAxes: { wght: 400 },
  },
  pixel: {
    file: "fusion-pixel-10px-monospaced-zh_hans.ttf.woff2",
    zipUrl:
      "https://github.com/TakWolf/fusion-pixel-font/releases/download/2026.10.25/fusion-pixel-font-10px-monospaced-ttf.woff2-v2026.10.25.zip",
    zipMember: "fusion-pixel-10px-monospaced-zh_hans.ttf.woff2",
    zipName: "fusion-pixel-10.25.zip",
    origin: "Fusion Pixel Font 10px monospaced zh_hans, 2026.10.25",
    license: "SIL OFL 1.1",
    family: "UIVIU Pixel",
    postscript: "UIVIU-Pixel",
    output: "uiviu-pixel.woff2",
  },
};

const MONO_EXTRA = "·—…→×";
const TEXT_EXTENSIONS = new Set([".astro", ".ts", ".md", ".css"]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      walk(full, out);
    } else if (TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

/** Every character the site can render from source copy and content. */
function requiredChars() {
  const chars = new Set();
  for (let code = 0x20; code < 0x7f; code += 1) chars.add(String.fromCharCode(code));

  for (const file of walk(path.join(ROOT, "src"))) {
    if (SPECIMEN_FREE === false && file.endsWith("type-specimen.astro")) continue;
    const text = fs.readFileSync(file, "utf8");
    if (DRAFT_FLAG.test(FRONTMATTER_BLOCK.exec(text)?.[1] ?? "")) continue;
    for (const char of text) {
      const code = char.codePointAt(0);
      if (
        (code >= 0x4e00 && code <= 0x9fff) ||
        (code >= 0x3000 && code <= 0x303f) ||
        (code >= 0xff00 && code <= 0xffef) ||
        MONO_EXTRA.includes(char)
      ) {
        chars.add(char);
      }
    }
  }

  chars.delete("\n");
  chars.delete("\r");
  return chars;
}

const sorted = (set) => [...set].sort().join("");

async function inflateRaw(buffer) {
  const stream = new Blob([buffer])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return Buffer.from(await new Response(stream).arrayBuffer());
}

/** Extract one entry from a zip archive without shelling out to `unzip`. */
async function unzipEntry(zip, name) {
  const eocd = (() => {
    const start = Math.max(0, zip.length - 0xffff - 22);
    for (let offset = zip.length - 22; offset >= start; offset -= 1) {
      if (zip.readUInt32LE(offset) === 0x06054b50) return offset;
    }
    throw new Error("not a zip archive (no end-of-central-directory record)");
  })();

  const entries = zip.readUInt16LE(eocd + 10);
  let cursor = zip.readUInt32LE(eocd + 16);

  for (let index = 0; index < entries; index += 1) {
    if (zip.readUInt32LE(cursor) !== 0x02014b50)
      throw new Error("corrupt zip central directory");
    const method = zip.readUInt16LE(cursor + 10);
    const compressedSize = zip.readUInt32LE(cursor + 20);
    const nameLength = zip.readUInt16LE(cursor + 28);
    const extraLength = zip.readUInt16LE(cursor + 30);
    const commentLength = zip.readUInt16LE(cursor + 32);
    const localOffset = zip.readUInt32LE(cursor + 42);
    const entryName = zip.toString("utf8", cursor + 46, cursor + 46 + nameLength);

    if (entryName === name) {
      const localNameLength = zip.readUInt16LE(localOffset + 26);
      const localExtraLength = zip.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const data = zip.subarray(dataStart, dataStart + compressedSize);
      if (method === 0) return Buffer.from(data);
      if (method === 8) return inflateRaw(data);
      throw new Error(`unsupported zip compression method ${method} for ${name}`);
    }

    cursor += 46 + nameLength + extraLength + commentLength;
  }

  throw new Error(`${name} not found in the release archive`);
}

async function download(url, label) {
  let response;
  try {
    response = await fetch(url, { redirect: "follow" });
  } catch (error) {
    throw new Error(
      `fonts: could not download ${label} (${error instanceof Error ? error.message : String(error)}).\n` +
        "A build without network access cannot create new glyphs: run `pnpm fonts:build` " +
        "on a machine with network, then commit public/fonts/*.",
      { cause: error },
    );
  }
  if (!response.ok) {
    throw new Error(`fonts: ${label} returned HTTP ${response.status} from ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function fetchSource(source) {
  fs.mkdirSync(CACHE, { recursive: true });
  const target = path.join(CACHE, source.file);
  if (fs.existsSync(target) && fs.statSync(target).size > 0) return target;

  console.log(
    `fonts: downloading ${source.zipUrl ? path.basename(source.zipUrl) : path.basename(source.url)}`,
  );
  if (source.zipUrl) {
    const zip = await download(source.zipUrl, source.zipMember);
    fs.writeFileSync(target, await unzipEntry(zip, source.zipMember));
  } else {
    fs.writeFileSync(target, await download(source.url, source.file));
  }
  return target;
}

/* ---------------------------------------------------------------------------
 * Rename the subset's internal name table.
 *
 * Both OFL reserved-font-name clauses and IPA clause 3.1(4) forbid shipping a
 * modified font under the original name, so the derived subsets are renamed.
 * Copyright (nameID 0) and license records are copied unchanged.
 * ------------------------------------------------------------------------- */

const NAME_IDS = {
  1: "family",
  2: "subfamily",
  3: "unique",
  4: "full",
  6: "postscript",
  16: "family",
  17: "subfamily",
};

function readTables(sfnt) {
  const numTables = sfnt.readUInt16BE(4);
  const tables = [];
  for (let index = 0; index < numTables; index += 1) {
    const recordOffset = 12 + index * 16;
    tables.push({
      tag: sfnt.toString("latin1", recordOffset, recordOffset + 4),
      recordOffset,
      offset: sfnt.readUInt32BE(recordOffset + 8),
      length: sfnt.readUInt32BE(recordOffset + 12),
    });
  }
  return tables;
}

function decodeName(platformID, bytes) {
  return platformID === 3 || platformID === 0
    ? bytes.swap16().toString("utf16le")
    : bytes.toString("latin1");
}

function encodeName(platformID, value) {
  if (platformID === 3 || platformID === 0) {
    return Buffer.from(value, "utf16le").swap16();
  }
  return Buffer.from(value, "latin1");
}

function checksum(buffer) {
  let sum = 0;
  for (let offset = 0; offset < buffer.length; offset += 4) {
    sum = (sum + buffer.readUInt32BE(offset)) >>> 0;
  }
  return sum;
}

function patchNames(sfnt, { family, postscript }) {
  const tables = readTables(sfnt);
  const name = tables.find((table) => table.tag === "name");
  const head = tables.find((table) => table.tag === "head");
  if (!name || !head) throw new Error("font is missing a name or head table");

  const base = name.offset;
  const count = sfnt.readUInt16BE(base + 2);
  const stringOffset = sfnt.readUInt16BE(base + 4);
  const records = [];
  const strings = [];
  let cursor = 0;

  for (let index = 0; index < count; index += 1) {
    const record = base + 6 + index * 12;
    const platformID = sfnt.readUInt16BE(record);
    const encodingID = sfnt.readUInt16BE(record + 2);
    const languageID = sfnt.readUInt16BE(record + 4);
    const nameID = sfnt.readUInt16BE(record + 6);
    const length = sfnt.readUInt16BE(record + 8);
    const offset = sfnt.readUInt16BE(record + 10);

    const current = decodeName(
      platformID,
      Buffer.from(
        sfnt.subarray(
          base + stringOffset + offset,
          base + stringOffset + offset + length,
        ),
      ),
    );

    let value = current;
    const role = NAME_IDS[nameID];
    if (role === "family") value = family;
    else if (role === "subfamily") value = "Regular";
    else if (role === "full") value = `${family} Regular`;
    else if (role === "postscript") value = postscript;
    else if (role === "unique") value = `${family} Regular 400`;

    const encoded = encodeName(platformID, value);
    records.push({
      platformID,
      encodingID,
      languageID,
      nameID,
      length: encoded.length,
      offset: cursor,
    });
    strings.push(encoded);
    cursor += encoded.length;
  }

  const header = Buffer.alloc(6);
  header.writeUInt16BE(0, 0);
  header.writeUInt16BE(records.length, 2);
  header.writeUInt16BE(6 + records.length * 12, 4);

  const directory = Buffer.alloc(records.length * 12);
  records.forEach((record, index) => {
    const at = index * 12;
    directory.writeUInt16BE(record.platformID, at);
    directory.writeUInt16BE(record.encodingID, at + 2);
    directory.writeUInt16BE(record.languageID, at + 4);
    directory.writeUInt16BE(record.nameID, at + 6);
    directory.writeUInt16BE(record.length, at + 8);
    directory.writeUInt16BE(record.offset, at + 10);
  });

  const nameTable = Buffer.concat([header, directory, ...strings]);

  // Append the new table, 4-byte aligned, and update its directory entry.
  const padded = Buffer.concat([sfnt, Buffer.alloc((4 - (sfnt.length % 4)) % 4)]);
  const nameOffset = padded.length;
  const tail = Buffer.alloc((4 - (nameTable.length % 4)) % 4);
  const output = Buffer.concat([padded, nameTable, tail]);

  output.writeUInt32BE(nameOffset, name.recordOffset + 8);
  output.writeUInt32BE(nameTable.length, name.recordOffset + 12);
  output.writeUInt32BE(checksum(Buffer.concat([nameTable, tail])), name.recordOffset + 4);

  // head.checkSumAdjustment must be recomputed over the whole file.
  const headOffset = head.offset;
  output.writeUInt32BE(0, headOffset + 8);
  output.writeUInt32BE(checksum(output), headOffset + 4);
  output.writeUInt32BE((0xb1b0afba - checksum(output)) >>> 0, headOffset + 8);

  return output;
}

async function buildSubset(source, text) {
  const input = fs.readFileSync(await fetchSource(source));
  // Subset to SFNT first so the name table can be rewritten, then compress.
  const subset = await subsetFont(input, text, {
    targetFormat: "sfnt",
    variationAxes: source.variationAxes,
    preserveNameIds: [0, 13, 14],
  });
  const renamed = patchNames(subset, source);
  return fontverter.convert(renamed, "woff2");
}

function readManifest() {
  if (!fs.existsSync(MANIFEST)) return null;
  return JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
}

function compare(manifest) {
  const required = requiredChars();
  const covered = new Set(manifest?.chars ?? []);
  const missing = [...required].filter((char) => !covered.has(char));
  const stale = Object.entries(manifest?.files ?? {})
    .filter(([name, bytes]) => {
      const file = path.join(OUT, name);
      return !fs.existsSync(file) || fs.statSync(file).size !== bytes;
    })
    .map(([name]) => name);
  return { required, missing, stale };
}

async function build() {
  const chars = sorted(requiredChars());
  const mono = sorted(
    new Set([
      ...Array.from({ length: 0x5f }, (_, i) => String.fromCharCode(0x20 + i)),
      ...MONO_EXTRA,
    ]),
  );

  fs.mkdirSync(OUT, { recursive: true });
  const files = {};

  for (const [key, source] of Object.entries(SOURCES)) {
    const text = key === "meta" ? mono : chars;
    const output = await buildSubset(source, text);
    fs.writeFileSync(path.join(OUT, source.output), output);
    files[source.output] = output.length;
    console.log(`fonts: ${source.output} ${output.length} B (${text.length} chars)`);
  }

  fs.writeFileSync(
    MANIFEST,
    `${JSON.stringify(
      {
        version: 1,
        generated: new Date().toISOString().slice(0, 10),
        chars,
        mono,
        files,
        sources: Object.fromEntries(
          Object.entries(SOURCES).map(([key, source]) => [
            key,
            {
              origin: source.origin,
              license: source.license,
              url: source.url ?? source.zipUrl,
              subsetFamily: source.family,
            },
          ]),
        ),
      },
      null,
      2,
    )}\n`,
  );
  console.log(`fonts: manifest written (${chars.length} chars)`);
}

function check() {
  const manifest = readManifest();
  if (!manifest) {
    console.error(
      "fonts:check: missing public/fonts/ui-charset.json — run `pnpm fonts:build`",
    );
    process.exit(1);
  }
  const { required, missing, stale } = compare(manifest);

  if (missing.length > 0) {
    console.error(
      `fonts:check: ${missing.length} character(s) are not in the font subsets:\n  ${missing.join(" ")}`,
    );
  }
  if (stale.length > 0) {
    console.error(`fonts:check: missing or stale font file(s): ${stale.join(", ")}`);
  }
  if (missing.length > 0 || stale.length > 0) process.exit(1);

  console.log(
    `fonts:check: ${required.size} characters covered by ${Object.keys(manifest.files).length} subsets`,
  );
}

async function ensure() {
  const manifest = readManifest();
  if (!manifest) {
    await build();
    return;
  }
  const { required, missing, stale } = compare(manifest);
  if (missing.length === 0 && stale.length === 0) {
    console.log(`fonts: ${required.size} characters covered; no rebuild needed`);
    return;
  }
  console.log(
    `fonts: ${missing.length} new character(s), ${stale.length} stale file(s); rebuilding subsets` +
      (missing.length
        ? ` (${missing.slice(0, 12).join("")}${missing.length > 12 ? "…" : ""})`
        : ""),
  );
  await build();
  console.log(
    "fonts: subsets rebuilt — commit public/fonts/* if you want builds to stay offline",
  );
}

const mode = process.argv[2];
if (mode === "build") await build();
else if (mode === "check") check();
else if (mode === "ensure") await ensure();
else {
  console.error("usage: node scripts/fonts.mjs <build|check|ensure>");
  process.exit(1);
}

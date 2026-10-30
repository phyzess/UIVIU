# Design rules

Editorial minimalism with engineering detail and restrained deadpan humour. The
reference feel is a printed journal: warm paper, hairlines, generous measure.
Do not copy Claude's palette or layout, do not use large saturated surfaces, and
do not add decoration that does not serve reading.

## Tokens

Defined once in `src/styles/global.css` under `@theme`, consumed as Tailwind
utilities (`bg-paper`, `text-ink`, `border-rule`, …):

| Token                        | Value                 | Use                             |
| ---------------------------- | --------------------- | ------------------------------- |
| `--color-paper`              | `#f8f7f2`             | Page background                 |
| `--color-ink`                | `#252525`             | Body and headings               |
| `--color-ink-soft`           | `#5f5c56`             | Secondary text (6.2:1 on paper) |
| `--color-signal`             | `#ff623d`             | Accent lines, markers, fills    |
| `--color-signal-ink`         | `#b8431d`             | Accent text (5.1:1 on paper)    |
| `--color-ink-faint`          | `#8a8880`             | Decorative chevrons only        |
| `--color-rule`               | `#d8d5cd`             | Hairlines and borders           |
| `--color-life` / `-soft`     | `#3d6a4e` / `#e8efe9` | LIFE pill and dot               |
| `--color-thoughts` / `-soft` | `#9e4832` / `#f8e7e0` | THOUGHTS pill and dot           |
| `--color-code` / `-soft`     | `#445f7c` / `#e8edf3` | CODE pill and dot               |

`--color-signal` reaches only ~2.8:1 on paper, so it is never used for small text.
Use it for markers, underlines, focus rings and fills; small accent text uses
`--color-signal-ink`. Category labels are plain text, never pills: the label is
`--color-signal-ink` on Paper (5.07:1) and the word itself stays readable, so
colour is not the only cue.

## Type roles

Four self-hosted subsets, built by `scripts/fonts.mjs` from pinned releases,
renamed to `UIVIU …` family names (a modified subset may not keep the original
name) and rebuilt automatically by `pnpm fonts:ensure` when copy needs new
glyphs. Files are `uiviu-kai`, `uiviu-hei`, `uiviu-meta`, `uiviu-pixel`:

| Role                                            | Font                              | Size / line-height        |
| ----------------------------------------------- | --------------------------------- | ------------------------- |
| Wordmark `UIVIU`                                | Newsreader 400 (`--font-display`) | 15px, 0.42em              |
| Hero slogan                                     | LXGW WenKai (`--font-kai`)        | 15px / 16px, 1.9          |
| Page titles (Notes, Archive, category, article) | WenKai                            | 30px / 36px, 1.3          |
| List + archive article titles                   | WenKai                            | 20px / 22px, 1.5          |
| Body `h2`                                       | WenKai                            | 25px / 27px, 1.4          |
| Body `h3`, navigation, interface                | LXGW Neo XiHei (`--font-sans`)    | 20–22px `h3`; 14px nav    |
| Body prose                                      | Neo XiHei                         | 17px, 1.85                |
| List excerpt                                    | Neo XiHei                         | 15px, 1.8, two-line clamp |
| Dates, category, reading time, pagination, code | Maple Mono (`--font-mono`)        | ≥12px, tabular numbers    |
| 404 digits                                      | Fusion Pixel (`--font-pixel`)     | 12.8px, not preloaded     |

Rules that keep the mixture honest: Maple Mono only ever renders Latin and
numbers — CJK labels (目录, 上一页, 更新于, 月份) use Neo XiHei, because a CJK
glyph in the mono font would silently fall back to the system face. Weight 400
only; no italic. `font-display: swap` everywhere, and each family has a system
fallback in the token.

Loading: the hub preloads WenKai plus Neo XiHei (and Newsreader on the homepage
only, via `preloadBrand`); 404 preloads WenKai alone (`preloadBody={false}`);
the pixel font is never preloaded.

Pagination is text only: `1 / 3` in Maple Mono on the left, Chinese previous /
next links in Neo XiHei on the right, one hairline above.

Pagination (Notes and category pages) is text only: `1 / 3` on the left,
previous/next links on the right, one hairline above. No boxes or buttons.

## Empty states

One component (`EmptyState`) for every "nothing here yet" case: the mark drawn
in `--color-rule` with a `signal/30` axis, a title in Ink, one muted hint line
and at most one quiet text-link action (never a button). It is centred on both
axes inside a `min-h-[17rem]` band, so the list area keeps its shape whether it
holds one post or none. Sidebar rows use the compact variant: the title only,
no mark, no action, no band.

The design is shared, the copy is not. Each state names its own situation and
offers its own next step:

| State            | Title                    | Action                   |
| ---------------- | ------------------------ | ------------------------ |
| No posts yet     | 还没有文章。             | 关于这个站点 → `/about/` |
| Notes empty      | 还没有文章。             | —                        |
| Category empty   | 这个分类暂时还没有内容。 | 浏览全部文章 → `/notes/` |
| Archive empty    | 还没有留下记录。         | 查看全部文章 → `/notes/` |
| Search: no match | 没有找到符合条件的结果。 | 查看全部文章 → `/notes/` |

The action row keeps a fixed height even when a state has no next step, so the
mark, title and hint sit at the same vertical position on every page and the
layout does not jump when moving between Notes, Archive and a category.

Search keeps the typed query in the input, hides the now-duplicate status line
visually while keeping it as the `aria-live` region, and shows an explicit
error (never an empty state) when Pagefind itself fails. Never add an
illustration and never fake content to fill the space.

## 404 voice

`/404` is an editorial field note, not an error screen: `FIELD NOTE NO. 404`
and `STATUS: UNRESOLVED` on a hairline, an `AN UNEXPECTED RESULT` label, the
serif line `404. A page of no particular use.`, one sentence of Chinese, the
English close `The derivation was sound. The destination was not.`, and a
`返回首页 →` text link. No oversized number, no illustration, no button, and it
carries `noindex`. The humour comes from the deadpan wording, so keep the copy
plain and never add a joke that breaks the tone.

## Homepage hierarchy

The order is fixed and must survive every layout change:

1. `UIVIU` — small, letterspaced, the page `h1`.
2. Chinese slogan — the single brand statement, one step smaller than the name.

The slogan breaks on its commas: clauses 1+2 then 3 on `md` (two lines), and one
clause per line below it (three lines), so no word is split in half. No
decorative rule sits under it; the post list follows after plain whitespace.

The hero carries no English copy, no content introduction and no directions.
`LIFE · THOUGHTS · CODE` lives only in the footer. The English headline remains
in `site.ts` as a guarded brand asset, but nothing renders it: the feed
description and the share-card alt text are Chinese. Never swap the slogan with
the content introduction, never move it into the footer or the about page, and
never shorten it to fit: fix the measure, wrapping or spacing instead.

## Homepage layout

- No wordmark in the header. Navigation sits on the right: Home, About, Notes,
  Archive plus a search icon; the current page gets a 1px signal underline and
  the header has no bottom border.
- Hero is centred plain text; no illustration, card, badge or decorative shape.
- Main area is one hairline under the section label, then a two-column grid from
  `lg`: post list (`1fr`, 70–75%) and sidebar (15rem, 25–30%). No vertical rule
  between them.
- The post list is pure text with an information column: from `md` each row is
  a `6.5rem` date column (date, category label, reading time, stacked) plus the
  title and a two-line excerpt; below `md` the same DOM stacks as meta → title →
  excerpt. **No thumbnails, cover images, image placeholders, cards or shadows**,
  and one 1px hairline between rows only.
- Categories and Archive rows are plain text rows with a dot, a count and a
  chevron; no per-row rules, no boxes. The sidebar ends with Archive — there is
  no note block or secondary About link in it. The sidebar keeps its 15rem
  column; it never turns into a horizontal information band.
- Footer closes the page in normal flow with a single hairline, two centred
  lines: `LIFE · THOUGHTS · CODE` and the domain.

When in doubt, remove a line before adding one.

## Layout and interaction

- Content sits in a `max-w-5xl` container with consistent side padding; blocks
  set their own measure inside it.
- Hairlines organise the page; no card borders, no shadows, no rounded-corner
  SaaS look.
- No fabricated data. Counts, dates and update times must be computed from real
  content, and only when they mean something to a reader.
- Motion is limited to fast, purposeful transitions and must respect
  `prefers-reduced-motion` (handled globally in `global.css`).

## Accessibility

- One `h1` per page, headings in order.
- Skip link to `#main` is the first focusable element.
- `:focus-visible` uses a 2px signal outline with offset; never remove outlines.
- Keyboard reachable navigation and controls; visible focus on every interactive
  element.
- Page language is `zh-CN`; add `lang` attributes to purely English passages when
  it materially helps screen-reader pronunciation.
- Keep text contrast at 4.5:1 or better for body copy.

## Mark and wordmark

The mark is a plain geometric U (ink `#252525`, stroke 2.5 on a 32 grid, ~7.8%
of the box) whose right stem escapes four units upward in signal `#FF623D`.
One deviation, nothing else: no second notch, dot, gradient or glow. Read at
16px it is a U with a small red tick; at 48px the tick reads as the stem
continuing when it should not.

The wordmark (`public/brand/uiviu-wordmark.svg`) draws `UIVIU` with the same
stroke language (3 on a 32-tall grid) and repeats the escape at the end of the
last U. It is a shipped source asset for print, social and future use — the
site itself keeps the text wordmark in the header and does **not** display this
SVG anywhere.

- `public/favicon.svg` is the canonical mark (transparent, no background rect).
- `src/components/BrandMark.astro` inlines the same geometry so pages can size
  it; `tests/unit/brand-mark.test.ts` fails if the two drift apart.
- `public/favicon.ico` carries 16/32/48 (transparent); `apple-touch-icon.png`
  (180) and `icon-512.png` are paper-backed tiles because iOS and Android
  composite transparency as black.
- `public/og.png` is the 1200×630 share card (mark, wordmark, headline,
  subtitle, domain).

Usage is deliberately narrow: favicon, the 404 field note (32px), and empty
states (28px). Do not put the mark or the wordmark in the hero, the header, the
article list, next to headings, in a floating control or in a per-page brand
block, and do not animate it. `public/brand/uiviu-mark.svg` is intentionally
absent: the favicon is the mark source, and copying it would only create a
second file to keep in sync.

Limitation: the SVG is ink-on-transparent, so it is low contrast on a dark
browser tab strip. The rules forbid baking a background into the icon, so this
is accepted and documented rather than solved with a paper block.

## Known gaps

- No Android web app manifest; `icon-512.png` is ready if one is added.

## Overflow rules

Long unbroken strings (titles, tags, heading text) must wrap instead of widening
the page. `PostCard`, the post `h1`, the table of contents and `.post-body`
headings carry `overflow-wrap: anywhere`; grid children around the article body
carry `min-w-0` so a wide code block scrolls inside its own box. Check any new
text container at 320px before merging.

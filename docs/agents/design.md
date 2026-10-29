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
`--color-signal-ink`. Category pills are 5.1–5.6:1 on their soft backgrounds.

Fonts: Newsreader 400 (latin subset, 22 KB woff2) is self-hosted through
`@fontsource/newsreader` and preloaded in `BaseLayout`; `--font-display` falls
back to Iowan/Palatino/Songti for CJK. `--font-sans` is the system UI plus CJK
stack, `--font-mono` prefers JetBrains Mono. Weight 400 only: display text is
never bold, so a second weight is not downloaded. Italic is not shipped either.

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
2. English headline — serif, muted, capped at 29.5rem on `md` so it breaks
   after "Useless," (measured against the self-hosted Newsreader metrics).
3. Chinese subtitle — full string, never truncated, broken at its comma on `md`.

No decorative rule sits under the subtitle; the post list follows after plain
whitespace.

The content introduction and `LIFE · THOUGHTS · CODE` do not appear in the hero.
The directions live only in the footer. Never swap the Chinese subtitle with the
content introduction, never move the subtitle into the footer or the about page,
and never shorten it to fit: fix the measure, wrapping or spacing instead.

## Homepage layout

- No wordmark in the header. Navigation sits on the right: Home, About, Notes,
  Archive plus a search icon; the current page gets a 1px signal underline and
  the header has no bottom border.
- Hero is centred plain text; no illustration, card, badge or decorative shape.
- Main area is one hairline under the section label, then a two-column grid from
  `lg`: post list (`1fr`, 70–75%) and sidebar (15rem, 25–30%). No vertical rule
  between them.
- The post list is pure text: date + category pill, title, two-line excerpt,
  reading time. **No thumbnails, cover images, image placeholders, cards,
  per-item borders or shadows.** Spacing creates the rhythm.
- Categories and Archive rows are plain text rows with a dot, a count and a
  chevron; no per-row rules, no boxes. The sidebar ends with Archive — there is
  no note block or secondary About link in it.
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

## Mark and icons

The mark is a symmetric frame with one corner missing, a signal-coloured axis,
and — from 48px up — the piece that fell off, sitting just outside the frame.
It is deliberately deadpan: the structure is not broken, it was simply not put
back. Do not add gloss, gradients, rounded corners or a second accent.

- `public/favicon.svg` — 16/32px version: frame + axis + corner gap, no loose
  piece (the dot turns into noise below 48px).
- `public/favicon.ico` — 16 and 32 from that version, 48 with the piece.
- `public/apple-touch-icon.png` (180) and `public/icon-512.png` — full version.
- `public/og.png` — 1200×630 default share card: mark, wordmark, English
  headline, Chinese subtitle, domain, on Paper.

## Known gaps

- No Android web app manifest; `icon-512.png` is ready if one is added.

## Overflow rules

Long unbroken strings (titles, tags, heading text) must wrap instead of widening
the page. `PostCard`, the post `h1`, the table of contents and `.post-body`
headings carry `overflow-wrap: anywhere`; grid children around the article body
carry `min-w-0` so a wide code block scrolls inside its own box. Check any new
text container at 320px before merging.

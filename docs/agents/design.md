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

Fonts: `--font-display` (serif stack, Newsreader first if ever self-hosted),
`--font-sans` (system UI plus CJK stack), `--font-mono` (JetBrains Mono if
available, otherwise system mono). No webfont is downloaded today; adding one
requires a self-hosted subset and a measured reason.

## Homepage hierarchy

The order is fixed and must survive every layout change:

1. `UIVIU` — small, letterspaced, the page `h1`.
2. English headline — serif, muted, generous measure.
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
  chevron; no per-row rules, no boxes.
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

## Known gaps

- No webfont yet (see above); the serif stack falls back to system faces.

## Overflow rules

Long unbroken strings (titles, tags, heading text) must wrap instead of widening
the page. `PostCard`, the post `h1`, the table of contents and `.post-body`
headings carry `overflow-wrap: anywhere`; grid children around the article body
carry `min-w-0` so a wide code block scrolls inside its own box. Check any new
text container at 320px before merging.

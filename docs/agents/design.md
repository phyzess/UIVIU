# Design rules

Editorial minimalism with engineering detail and restrained deadpan humour. The
reference feel is a printed journal: warm paper, hairlines, generous measure.
Do not copy Claude's palette or layout, do not use large saturated surfaces, and
do not add decoration that does not serve reading.

## Tokens

Defined once in `src/styles/global.css` under `@theme`, consumed as Tailwind
utilities (`bg-paper`, `text-ink`, `border-rule`, …):

| Token              | Value     | Use                             |
| ------------------ | --------- | ------------------------------- |
| `--color-paper`    | `#f8f7f2` | Page background                 |
| `--color-ink`      | `#252525` | Body and headings               |
| `--color-ink-soft` | `#5f5c56` | Secondary text (6.2:1 on paper) |
| `--color-signal`   | `#ff623d` | Accent only                     |
| `--color-rule`     | `#d8d5cd` | Hairlines and borders           |

`--color-signal` reaches only ~2.8:1 on paper, so it is never used for small text.
Use it for markers, underlines, focus rings and hover states. If accent text is
needed, use ink with a signal underline or a signal block beside it.

Fonts: `--font-display` (serif stack, Newsreader first if ever self-hosted),
`--font-sans` (system UI plus CJK stack), `--font-mono` (JetBrains Mono if
available, otherwise system mono). No webfont is downloaded today; adding one
requires a self-hosted subset and a measured reason.

## Homepage hierarchy

The order is fixed and must survive every layout change:

1. `UIVIU` — the clearest identifying element.
2. English headline — secondary expression, generous measure.
3. Chinese subtitle — full string, real visual weight, never truncated.
4. Content introduction — clearly below the subtitle, supporting role.
5. `LIFE · THOUGHTS · CODE` — content directions, tied to the post list.

Never swap the Chinese subtitle with the content introduction, never move the
subtitle into the footer or the about page, and never shorten it to fit. Fix the
measure, wrapping or spacing instead.

## Layout and interaction

- Two-column brand block from `md`, single column below; content max width is
  controlled by the container (`max-w-5xl`) and per-block measures.
- Hairlines and numbering organise the page; no card borders, no shadows, no
  rounded-corner SaaS look.
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

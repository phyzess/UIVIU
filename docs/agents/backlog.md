# Backlog — deferred on purpose

Deliberately not done yet. Each item records why it is deferred and what the
next step is, so it can be picked up without re-deriving the context. Nothing
here is a bug.

No open items. Add a dated section here when something is deliberately deferred,
and write down the next step so it can be resumed without re-deriving the
context.

## Also worth remembering

- Search has no stemming for `zh-cn` (Pagefind limitation); recall is literal.
- Local Node may be newer than `.node-version`; before a release run
  `mise exec node@24.20.0 -- pnpm verify` (see `workflow.md`).
- Font subsets are generated per build and git-ignored, so a fresh clone or a
  Cloudflare build needs network access for the pinned sources once.
- The public history still contains the pre-split about page. It was public by
  design before the split; removing it now stops future edits from leaking, it
  does not make the old text secret.

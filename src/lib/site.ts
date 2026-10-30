/**
 * Site-wide copy and brand assets.
 *
 * These strings are product requirements, not placeholders. They are rendered
 * verbatim on the homepage and must not be rewritten, shortened or swapped.
 * `tests/unit/site.test.ts` fails if any of them changes by accident.
 */

export const SITE_NAME = "UIVIU";

/**
 * English headline. Kept verbatim as a brand asset and guarded by
 * `tests/unit/site.test.ts`, but currently rendered nowhere: the hero, the feed
 * description and the share-card alt text are Chinese. Do not shorten or
 * translate it.
 */
export const BRAND_HEADLINE_EN =
  "A Rigorous Derivation of Something Entirely Useless, Yet Perfectly Symmetrical.";

/**
 * Chinese subtitle, split at its commas so the homepage can break it on
 * semantic boundaries: 2 lines on `md` (clauses 1+2, then 3) and 3 lines below.
 * `BRAND_SUBTITLE_ZH` stays the single canonical string; every part exists only
 * for rendering and must rejoin to it.
 */
export const BRAND_SUBTITLE_ZH_CLAUSE_1 = "经过严谨的非严谨推导，";
export const BRAND_SUBTITLE_ZH_CLAUSE_2 = "最终得到一个没有实际用途，";
export const BRAND_SUBTITLE_ZH_CLAUSE_3 = "但看起来很对称的结果。";
export const BRAND_SUBTITLE_ZH_LINE_1 =
  BRAND_SUBTITLE_ZH_CLAUSE_1 + BRAND_SUBTITLE_ZH_CLAUSE_2;
export const BRAND_SUBTITLE_ZH_LINE_2 = BRAND_SUBTITLE_ZH_CLAUSE_3;
export const BRAND_SUBTITLE_ZH = BRAND_SUBTITLE_ZH_LINE_1 + BRAND_SUBTITLE_ZH_LINE_2;

/** Content introduction. Explains what the blog covers; not a subtitle. */
export const CONTENT_INTRO_ZH = "关于代码、生活、思考，以及一些本来不必想那么多的事情。";

/** The three content directions, in their canonical order. */
export const CONTENT_DIRECTIONS = ["LIFE", "THOUGHTS", "CODE"] as const;

/** Rendered label for the content directions: `LIFE · THOUGHTS · CODE`. */
export const CONTENT_DIRECTIONS_LABEL = CONTENT_DIRECTIONS.join(" · ");

/** Design concept behind the layout, used as a quiet accent in the chrome. */
export const CORE_CONCEPT_ZH = "一个对称的非必要结构";

/** Default meta description for pages without their own. */
export const DEFAULT_DESCRIPTION = CONTENT_INTRO_ZH;

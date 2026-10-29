/**
 * Site-wide copy and brand assets.
 *
 * These strings are product requirements, not placeholders. They are rendered
 * verbatim on the homepage and must not be rewritten, shortened or swapped.
 * `tests/unit/site.test.ts` fails if any of them changes by accident.
 */

export const SITE_NAME = "UIVIU";

/** English headline. Rendered as the English expression of the brand. */
export const BRAND_HEADLINE_EN =
  "A Rigorous Derivation of Something Entirely Useless, Yet Perfectly Symmetrical.";

/**
 * Chinese subtitle, split at its comma so the homepage can break it the way the
 * design does. `BRAND_SUBTITLE_ZH` is the single canonical string; the two
 * halves exist only for rendering and must always rejoin to it.
 */
export const BRAND_SUBTITLE_ZH_LINE_1 =
  "经过严谨的非严谨推导，最终得到一个没有实际用途，";
export const BRAND_SUBTITLE_ZH_LINE_2 = "但看起来很对称的结果。";
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

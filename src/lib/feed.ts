/**
 * Feed HTML helpers.
 *
 * Full-text RSS renders the post body to HTML and ships it as
 * `<content:encoded>`. Feed readers have no site origin, so every internal
 * `href`/`src` (including the `srcset` pairs Astro emits for images) must be
 * absolute before the HTML leaves the build.
 */

const ABSOLUTE_SCHEME = /^[a-z][a-z\d+.-]*:/i;

function rewriteUrl(value: string, base: URL): string {
  if (!value || value.startsWith("#")) return value;
  if (ABSOLUTE_SCHEME.test(value)) return value;
  return new URL(value, base).toString();
}

/**
 * Makes relative URLs in an HTML fragment absolute against `base`.
 *
 * `base` is normally the post's canonical URL, so a document-relative `./x`
 * resolves the same way it does on the page. Fragments, `mailto:`/`tel:` and
 * already-absolute URLs are left untouched.
 */
export function absolutizeHtml(html: string, base: URL | string): string {
  const baseUrl = new URL(base);

  return html
    .replace(
      /\b(href|src)=(["'])(.*?)\2/g,
      (_match, name: string, quote: string, value: string) =>
        `${name}=${quote}${rewriteUrl(value, baseUrl)}${quote}`,
    )
    .replace(/\bsrcset=(["'])(.*?)\1/g, (_match, quote: string, value: string) => {
      const candidates = value.split(",").map((candidate) => {
        const [url, ...descriptor] = candidate.trim().split(/\s+/);
        return [rewriteUrl(url ?? "", baseUrl), ...descriptor].filter(Boolean).join(" ");
      });
      return `srcset=${quote}${candidates.join(", ")}${quote}`;
    });
}

/**
 * Canonical-host redirect.
 *
 * `uiviu.me` and `www.uiviu.me` are both custom domains of the same Worker, so
 * a host-level redirect is the only place that can collapse them. The rule is
 * kept pure and dependency-free so it can be unit tested without a runtime.
 */

/** Every request on a redirect host lands here, scheme and host normalised. */
export const CANONICAL_ORIGIN = "https://uiviu.me";

/** Hostnames that permanently redirect to `CANONICAL_ORIGIN`. */
const REDIRECT_HOSTS = new Set(["www.uiviu.me"]);

/**
 * Absolute canonical URL for a request that must move, or `null` when the
 * request is already on the canonical host (apex, workers.dev preview, local).
 *
 * Path and query string survive verbatim; the fragment never reaches a server.
 */
export function canonicalRedirectTarget(url: URL): string | null {
  if (!REDIRECT_HOSTS.has(url.hostname)) return null;
  return new URL(`${url.pathname}${url.search}`, CANONICAL_ORIGIN).toString();
}

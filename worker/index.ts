import { canonicalRedirectTarget } from "./redirect";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

/**
 * Entrypoint for the static-assets Worker.
 *
 * The site is still pre-rendered: this script only enforces the canonical host
 * and then hands every request to the asset binding, which keeps
 * `not_found_handling` and the `_headers` rules intact.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const target = canonicalRedirectTarget(new URL(request.url));

    if (target) {
      return new Response(null, { status: 301, headers: { Location: target } });
    }

    return env.ASSETS.fetch(request);
  },
};

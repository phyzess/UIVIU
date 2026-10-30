import { describe, expect, it } from "vitest";

import worker from "../../worker/index";

const env = {
  ASSETS: {
    async fetch(request: Request): Promise<Response> {
      return new Response(`asset:${new URL(request.url).pathname}`, { status: 200 });
    },
  },
};

describe("worker entrypoint", () => {
  it("redirects www before touching assets", async () => {
    const response = await worker.fetch(
      new Request("https://www.uiviu.me/posts/a/?q=1"),
      env,
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://uiviu.me/posts/a/?q=1");
  });

  it("hands canonical requests to the asset binding unchanged", async () => {
    const request = new Request("https://uiviu.me/about/");
    const response = await worker.fetch(request, env);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("asset:/about/");
  });
});

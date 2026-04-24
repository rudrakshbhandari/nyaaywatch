import { afterEach, describe, expect, it, vi } from "vitest";

import { assertReleasePurgeConfig, loadReleasePurgeConfig, main } from "../src/dev/release-purge-public-routes.js";

describe("release public-route purge command", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("does not require the full app runtime config for manual public-route purges", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/zones?name=")) {
        return new Response(JSON.stringify({ success: true, result: [{ id: "zone_123" }] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, result: { id: "purge_123" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    global.fetch = fetchMock as typeof fetch;

    await main(["--high-court=himachal"], {
      CANONICAL_HOST: "nyaaywatch.in",
      CLOUDFLARE_API_TOKEN: "cf-test-token",
    });

    const purgeCall = fetchMock.mock.calls[1];
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(purgeCall?.[1]?.body))).toEqual({
      files: [
        "https://nyaaywatch.in/high-courts",
        "https://nyaaywatch.in/high-courts/himachal",
        "https://nyaaywatch.in/high-courts/himachal/data",
        "https://nyaaywatch.in/high-courts/himachal/methodology",
        "https://nyaaywatch.in/high-courts/himachal/api",
        "https://nyaaywatch.in/v1/high-courts/himachal/stats",
        "https://nyaaywatch.in/v1/high-courts/himachal/trends",
      ],
    });
  });

  it("fails loudly when a release purge would otherwise skip missing Cloudflare config", () => {
    const config = loadReleasePurgeConfig({
      PUBLIC_BASE_URL: "https://nyaaywatch.in",
    });

    expect(() => assertReleasePurgeConfig(config)).toThrow(
      /release:purge-public-routes requires Cloudflare configuration/,
    );
  });

  it("allows an explicit missing-Cloudflare local check without calling Cloudflare", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as typeof fetch;

    await main(["--high-court=himachal", "--allow-missing-cloudflare"], {
      PUBLIC_BASE_URL: "https://nyaaywatch.in",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

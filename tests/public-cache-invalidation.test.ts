import { afterEach, describe, expect, it, vi } from "vitest";

import { loadConfig } from "../src/config/env.js";
import { PublicCacheInvalidationService } from "../src/services/public-cache-invalidation.js";

describe("PublicCacheInvalidationService", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("purges the public data URLs for a published public state", async () => {
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

    const service = new PublicCacheInvalidationService(
      loadConfig({
        NODE_ENV: "test",
        PORT: "3000",
        DATABASE_URL: "postgres://postgres:postgres@localhost:5432/nyaaywatch",
        AWS_REGION: "ap-south-1",
        AWS_ACCESS_KEY_ID: "test",
        AWS_SECRET_ACCESS_KEY: "test",
        S3_BUCKET: "nyaaywatch-test-artifacts",
        DEPLOY_ENV: "dev",
        OPERATOR_API_TOKEN: "operator-test-token",
        STATE_CODE: "HP",
        CANONICAL_HOST: "nyaaywatch.in",
        LEGACY_HOSTS: "nyaaywatch.com,www.nyaaywatch.com",
        CLOUDFLARE_API_TOKEN: "cf-test-token",
      }),
    );

    await service.invalidatePublishedData("PB", ["ludhiana", "amritsar"]);

    const zoneLookupCall = fetchMock.mock.calls[0];
    const purgeCall = fetchMock.mock.calls[1];

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(zoneLookupCall?.[0])).toContain("/zones?name=nyaaywatch.in");
    expect(String(purgeCall?.[0])).toContain("/zones/zone_123/purge_cache");
    expect(purgeCall?.[1]).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({
        Authorization: "Bearer cf-test-token",
      }),
    });
    expect(JSON.parse(String(purgeCall?.[1]?.body))).toEqual({
      files: [
        "https://nyaaywatch.in/states/punjab/data",
        "https://nyaaywatch.in/states/punjab/data/districts.csv",
        "https://nyaaywatch.in/states/punjab/data/districts/ludhiana.csv",
        "https://nyaaywatch.in/states/punjab/data/districts/amritsar.csv",
      ],
    });
  });

  it("purges the public High Court route family", async () => {
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

    const service = new PublicCacheInvalidationService(
      loadConfig({
        NODE_ENV: "test",
        PORT: "3000",
        DATABASE_URL: "postgres://postgres:postgres@localhost:5432/nyaaywatch",
        AWS_REGION: "ap-south-1",
        AWS_ACCESS_KEY_ID: "test",
        AWS_SECRET_ACCESS_KEY: "test",
        S3_BUCKET: "nyaaywatch-test-artifacts",
        DEPLOY_ENV: "dev",
        OPERATOR_API_TOKEN: "operator-test-token",
        STATE_CODE: "HP",
        CANONICAL_HOST: "nyaaywatch.in",
        LEGACY_HOSTS: "nyaaywatch.com,www.nyaaywatch.com",
        CLOUDFLARE_API_TOKEN: "cf-test-token",
      }),
    );

    await service.invalidateHighCourtRoutes({
      courtCode: "UPHC",
      courtSlug: "uttar-pradesh",
      courtName: "Allahabad High Court",
      hcNjdgStateValue: "9~13",
      coveredGeographies: [
        {
          geographyCode: "UP",
          geographyName: "Uttar Pradesh",
          geographyType: "state",
          lowerCourtStateCode: "UP",
        },
      ],
      publicBeta: true,
      sourceReviewStatus: "reviewed",
      sourceUrls: {
        hcNjdg: "https://njdg.ecourts.gov.in/hcnjdg_v2/",
        hcServices: "https://hcservices.ecourts.gov.in/hcservices/main.php",
      },
    });

    const purgeCall = fetchMock.mock.calls[1];
    expect(JSON.parse(String(purgeCall?.[1]?.body))).toEqual({
      files: [
        "https://nyaaywatch.in/high-courts",
        "https://nyaaywatch.in/high-courts/uttar-pradesh",
        "https://nyaaywatch.in/high-courts/uttar-pradesh/data",
        "https://nyaaywatch.in/high-courts/uttar-pradesh/methodology",
        "https://nyaaywatch.in/high-courts/uttar-pradesh/api",
        "https://nyaaywatch.in/v1/high-courts/uttar-pradesh/stats",
        "https://nyaaywatch.in/v1/high-courts/uttar-pradesh/trends",
      ],
    });
  });

  it("purges the public Supreme Court route family", async () => {
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

    const service = new PublicCacheInvalidationService(
      loadConfig({
        NODE_ENV: "test",
        PORT: "3000",
        DATABASE_URL: "postgres://postgres:postgres@localhost:5432/nyaaywatch",
        AWS_REGION: "ap-south-1",
        AWS_ACCESS_KEY_ID: "test",
        AWS_SECRET_ACCESS_KEY: "test",
        S3_BUCKET: "nyaaywatch-test-artifacts",
        DEPLOY_ENV: "dev",
        OPERATOR_API_TOKEN: "operator-test-token",
        STATE_CODE: "HP",
        CANONICAL_HOST: "nyaaywatch.in",
        LEGACY_HOSTS: "nyaaywatch.com,www.nyaaywatch.com",
        CLOUDFLARE_API_TOKEN: "cf-test-token",
      }),
    );

    await service.invalidateSupremeCourtRoutes();

    const purgeCall = fetchMock.mock.calls[1];
    expect(JSON.parse(String(purgeCall?.[1]?.body))).toEqual({
      files: [
        "https://nyaaywatch.in/supreme-court",
        "https://nyaaywatch.in/supreme-court/data",
        "https://nyaaywatch.in/supreme-court/methodology",
        "https://nyaaywatch.in/supreme-court/api",
        "https://nyaaywatch.in/v1/supreme-court/stats",
        "https://nyaaywatch.in/v1/supreme-court/trends",
      ],
    });
  });

  it("skips invalidation when Cloudflare is not configured", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as typeof fetch;

    const service = new PublicCacheInvalidationService(
      loadConfig({
        NODE_ENV: "test",
        PORT: "3000",
        DATABASE_URL: "postgres://postgres:postgres@localhost:5432/nyaaywatch",
        AWS_REGION: "ap-south-1",
        AWS_ACCESS_KEY_ID: "test",
        AWS_SECRET_ACCESS_KEY: "test",
        S3_BUCKET: "nyaaywatch-test-artifacts",
        DEPLOY_ENV: "dev",
        OPERATOR_API_TOKEN: "operator-test-token",
        STATE_CODE: "HP",
        CANONICAL_HOST: "nyaaywatch.in",
        LEGACY_HOSTS: "nyaaywatch.com,www.nyaaywatch.com",
      }),
    );

    await service.invalidatePublishedData("HP", ["kangra"]);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

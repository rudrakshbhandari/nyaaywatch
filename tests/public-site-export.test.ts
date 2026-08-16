import { describe, expect, it } from "vitest";
import {
  buildStaticRedirects,
  buildStaticComparisonShell,
  buildStaticSubscribeNotice,
  isCrawlablePublicUrl,
  extractInternalUrls,
  extractSitemapUrls,
  extractPublicationIdentities,
  assertExportResourceIdentities,
  assertExportedSitemapCoverage,
  assertCloudflareRedirectBudget,
  exportManifestPath,
  isSkippableUnpublishedPublicUrl,
  isUnpublishedPinnedResource,
  mergeStaticHostingRewrites,
  normalizeOrigin,
  outputPathForResource,
  prepareOutputDirectory,
  recordPublicationIdentities,
  requiredPublicationScope,
  resourceRequiresPublicationIdentity,
  STATIC_COMPARISON_REWRITES,
  type PublicResource,
} from "../src/export/public-site.js";

const origin = normalizeOrigin("https://nyaaywatch.in");

describe("public static export helpers", () => {
  it("extracts same-origin links while excluding operator and token routes", () => {
    const urls = extractInternalUrls(
      `<a href="/states/punjab">Punjab</a><a href="/districts?view=flagged">query view</a><a href="https://example.com">external</a><a href="/operator/runs">operator</a><a href="/cdn-cgi/l/email-protection">email</a><a href="/og/states/punjab/district/amritsar.png?v=2026-04-5">district social card</a><meta property="og:image" content="/og/home.png"><meta name="description" content="A public snapshot page">`,
      new URL("https://nyaaywatch.in/"),
      origin,
    );

    expect(urls.map((url) => url.pathname)).toEqual(["/og/home.png", "/og/states/punjab/district/amritsar.png", "/states/punjab"]);
  });

  it("does not crawl newsletter POST or token routes", () => {
    expect(isCrawlablePublicUrl(new URL("https://nyaaywatch.in/subscribe"), origin)).toBe(false);
    expect(isCrawlablePublicUrl(new URL("https://nyaaywatch.in/subscribe/confirm/token"), origin)).toBe(false);
    expect(isCrawlablePublicUrl(new URL("https://nyaaywatch.in/unsubscribe/token"), origin)).toBe(false);
    expect(
      extractInternalUrls(
        `<a href="/subscribe">Subscribe</a><a href="/unsubscribe/secret">Unsub</a><a href="/states/punjab">Punjab</a>`,
        new URL("https://nyaaywatch.in/"),
        origin,
      ).map((url) => url.pathname),
    ).toEqual(["/states/punjab"]);
  });

  it("extracts sitemap locations deterministically", () => {
    const urls = extractSitemapUrls(
      `<urlset><url><loc>https://nyaaywatch.in/z</loc></url><url><loc>https://nyaaywatch.in/a</loc></url></urlset>`,
      origin,
    );

    expect(urls.map((url) => url.pathname)).toEqual(["/a", "/z"]);
  });

  it("maps extensionless pages and APIs to Pages-compatible files", () => {
    expect(outputPathForResource(new URL("https://nyaaywatch.in/"), "text/html; charset=utf-8")).toBe("index.html");
    expect(outputPathForResource(new URL("https://nyaaywatch.in/states/punjab"), "text/html")).toBe("states/punjab/index.html");
    expect(outputPathForResource(new URL("https://nyaaywatch.in/v1/stats/himachal"), "application/json")).toBe("v1/stats/himachal.json");
    expect(outputPathForResource(new URL("https://nyaaywatch.in/sitemap.xml"), "application/xml")).toBe("sitemap.xml");
  });

  it("creates rewrites for extensionless JSON endpoints", () => {
    const resources: PublicResource[] = [
      { url: new URL("https://nyaaywatch.in/v1/stats/himachal"), body: new Uint8Array(), contentType: "application/json" },
      { url: new URL("https://nyaaywatch.in/sitemap.xml"), body: new Uint8Array(), contentType: "application/xml" },
      { url: new URL("https://nyaaywatch.in/states/punjab"), body: new Uint8Array(), contentType: "text/html" },
    ];

    expect(buildStaticRedirects(resources, "/tmp/nyaaywatch-static-export")).toEqual([
      "/v1/stats/himachal /v1/stats/himachal.json 200",
    ]);
  });

  it("provides a client-side comparison fallback for arbitrary district pairs", () => {
    const shell = buildStaticComparisonShell(origin);
    const body = new TextDecoder().decode(shell.body);
    expect(body).toContain("/v1/states/");
    expect(shell.url.pathname).toBe("/compare");
    expect(outputPathForResource(shell.url, shell.contentType)).toBe("compare/index.html");
    expect(body).toContain("methodology");
    expect(body).toContain("<thead><tr><th>Metric</th><th>");
  });

  it("replaces newsletter sign-up with a static notice instead of a POST form", () => {
    const notice = buildStaticSubscribeNotice(origin);
    const body = new TextDecoder().decode(notice.body);
    expect(notice.url.pathname).toBe("/subscribe");
    expect(outputPathForResource(notice.url, notice.contentType)).toBe("subscribe/index.html");
    expect(body).toContain("Email updates aren't available here yet.");
    expect(body).not.toMatch(/method=["']post["']/i);
    expect(body).not.toContain('action="/subscribe"');
    expect(body).toContain("/methodology");
  });

  it("extracts publication identities from evidence packs that split stateCode and publishedAt", () => {
    const resource: PublicResource = {
      url: new URL("https://nyaaywatch.in/states/punjab/data/evidence/state.json"),
      body: new TextEncoder().encode(
        JSON.stringify({
          geography: { stateCode: "PB", stateName: "Punjab" },
          snapshot: { publishedAt: "2026-08-15T00:00:00.000Z" },
        }),
      ),
      contentType: "application/json",
    };

    expect(extractPublicationIdentities(resource)).toEqual([
      { scope: "state:PB", publishedAt: "2026-08-15T00:00:00.000Z" },
    ]);
  });

  it("extracts stable publication identities from JSON resources", () => {
    const resource: PublicResource = {
      url: new URL("https://nyaaywatch.in/v1/stats/himachal"),
      body: new TextEncoder().encode(JSON.stringify({ snapshot: { stateCode: "HP", publishedAt: "2026-08-15T00:00:00.000Z" } })),
      contentType: "application/json",
    };

    expect(extractPublicationIdentities(resource)).toEqual([
      { scope: "state:HP", publishedAt: "2026-08-15T00:00:00.000Z" },
    ]);
  });

  it("extracts publication identities from CSV resources", () => {
    const resource: PublicResource = {
      url: new URL("https://nyaaywatch.in/data/districts.csv"),
      body: new TextEncoder().encode("published_at,state_code\n2026-08-15T00:00:00.000Z,HP\n"),
      contentType: "text/csv",
    };

    expect(extractPublicationIdentities(resource)).toEqual([
      { scope: "state:HP", publishedAt: "2026-08-15T00:00:00.000Z" },
    ]);
  });

  it("uses the latest row for district history CSV publication identity", () => {
    const resource: PublicResource = {
      url: new URL("https://nyaaywatch.in/data/districts/kangra.csv"),
      body: new TextEncoder().encode("snapshot_date,published_at\n2026-07-15T00:00:00.000Z,2026-07-20T00:00:00.000Z\n2026-08-15T00:00:00.000Z,2026-08-20T00:00:00.000Z\n"),
      contentType: "text/csv",
    };

    expect(extractPublicationIdentities(resource)).toEqual([
      { scope: "state:HP", publishedAt: "2026-08-20T00:00:00.000Z" },
    ]);
  });

  it("prefers response-header identities for binary publication assets", () => {
    const resource: PublicResource = {
      url: new URL("https://nyaaywatch.in/og/district/kangra.png"),
      body: new Uint8Array([137, 80, 78, 71]),
      contentType: "image/png",
      publicationIdentities: [{ scope: "state:HP", publishedAt: "2026-08-20T00:00:00.000Z" }],
    };

    expect(extractPublicationIdentities(resource)).toEqual(resource.publicationIdentities);
  });

  it("preserves explicitly absent response-header identities for crawl validation", () => {
    const resource: PublicResource = {
      url: new URL("https://nyaaywatch.in/states/punjab"),
      body: new TextEncoder().encode("<html></html>"),
      contentType: "text/html",
      publicationIdentities: [{ scope: "state:PB", publishedAt: null }],
    };

    expect(extractPublicationIdentities(resource)).toEqual(resource.publicationIdentities);
  });

  it("rejects protected directories and their descendants", async () => {
    await expect(prepareOutputDirectory("src/export")).rejects.toThrow("unsafe export directory");
    await expect(prepareOutputDirectory("tests/output")).rejects.toThrow("unsafe export directory");
  });

  it("requires publication identity for JSON, CSV, HTML, OG, and feeds", () => {
    const jsonResource: PublicResource = {
      url: new URL("https://nyaaywatch.in/v1/stats/himachal"),
      body: new Uint8Array(),
      contentType: "application/json",
    };
    const htmlResource: PublicResource = {
      url: new URL("https://nyaaywatch.in/"),
      body: new Uint8Array(),
      contentType: "text/html; charset=utf-8",
    };
    const ogResource: PublicResource = {
      url: new URL("https://nyaaywatch.in/og/home.png"),
      body: new Uint8Array(),
      contentType: "image/png",
    };
    const feedResource: PublicResource = {
      url: new URL("https://nyaaywatch.in/states/punjab/feed.xml"),
      body: new Uint8Array(),
      contentType: "application/rss+xml",
    };
    const apiReference: PublicResource = {
      url: new URL("https://nyaaywatch.in/supreme-court/api"),
      body: new Uint8Array(),
      contentType: "text/html",
    };
    const pressResource: PublicResource = {
      url: new URL("https://nyaaywatch.in/press"),
      body: new Uint8Array(),
      contentType: "text/html",
    };

    expect(resourceRequiresPublicationIdentity(jsonResource)).toBe(true);
    expect(resourceRequiresPublicationIdentity(htmlResource)).toBe(true);
    expect(resourceRequiresPublicationIdentity(ogResource)).toBe(true);
    expect(resourceRequiresPublicationIdentity(feedResource)).toBe(true);
    expect(resourceRequiresPublicationIdentity(apiReference)).toBe(false);
    expect(resourceRequiresPublicationIdentity(pressResource)).toBe(false);
  });

  it("records unpublished scopes and rejects a later first publication", () => {
    const recorded = new Map();
    recordPublicationIdentities(recorded, [{ scope: "state:PB", publishedAt: null }]);
    expect(() =>
      recordPublicationIdentities(recorded, [{ scope: "state:PB", publishedAt: "2026-08-20T00:00:00.000Z" }]),
    ).toThrow("Publication changed during crawl for state:PB");
  });

  it("rejects HTML and OG resources that do not carry a publication identity", () => {
    const recorded = new Map();
    assertExportResourceIdentities(recorded, {
      url: new URL("https://nyaaywatch.in/v1/stats/himachal"),
      body: new TextEncoder().encode(JSON.stringify({ snapshot: { stateCode: "HP", publishedAt: "2026-08-15T00:00:00.000Z" } })),
      contentType: "application/json",
    });
    expect(() =>
      assertExportResourceIdentities(recorded, {
        url: new URL("https://nyaaywatch.in/"),
        body: new TextEncoder().encode("<html><title>NyaayWatch</title></html>"),
        contentType: "text/html",
      }),
    ).toThrow("Publication identity missing for /");
    expect(() =>
      assertExportResourceIdentities(recorded, {
        url: new URL("https://nyaaywatch.in/og/home.png"),
        body: new Uint8Array([137, 80, 78, 71]),
        contentType: "image/png",
      }),
    ).toThrow("Publication identity missing for /og/home.png");
  });

  it("pins HTML identities to the same publication as JSON for that scope", () => {
    const recorded = new Map();
    assertExportResourceIdentities(recorded, {
      url: new URL("https://nyaaywatch.in/v1/states/punjab/stats"),
      body: new TextEncoder().encode(JSON.stringify({ snapshot: { stateCode: "PB", publishedAt: "2026-08-15T00:00:00.000Z" } })),
      contentType: "application/json",
    });
    expect(() =>
      assertExportResourceIdentities(recorded, {
        url: new URL("https://nyaaywatch.in/states/punjab"),
        body: new TextEncoder().encode("<html></html>"),
        contentType: "text/html",
        publicationIdentities: [{ scope: "state:PB", publishedAt: "2026-08-15T00:00:00.000Z" }],
      }),
    ).not.toThrow();
    expect(() =>
      assertExportResourceIdentities(recorded, {
        url: new URL("https://nyaaywatch.in/og/states/punjab/district/amritsar.png"),
        body: new Uint8Array([137, 80, 78, 71]),
        contentType: "image/png",
        publicationIdentities: [{ scope: "state:PB", publishedAt: "2026-08-16T00:00:00.000Z" }],
      }),
    ).toThrow("Publication changed during crawl for state:PB");
  });

  it("emits Cloudflare-valid comparison rewrites with a single trailing splat", () => {
    expect([...STATIC_COMPARISON_REWRITES]).toEqual([
      "/compare/* /compare/index.html 200",
      "/states/:state/compare/* /compare/index.html 200",
    ]);
    const redirects = mergeStaticHostingRewrites([
      "/v1/trends /v1/trends.json 200",
      "/v1/supreme-court/stats /v1/supreme-court/stats.json 200",
    ]);
    expect(redirects.slice(0, 2)).toEqual([
      "/v1/supreme-court/stats /v1/supreme-court/stats.json 200",
      "/v1/trends /v1/trends.json 200",
    ]);
    expect(redirects.slice(-2)).toEqual([
      "/compare/* /compare/index.html 200",
      "/states/:state/compare/* /compare/index.html 200",
    ]);
    expect(redirects.some((line) => line.includes("/states/*/compare/*"))).toBe(false);
    expect(() =>
      assertCloudflareRedirectBudget(["/compare/* /compare/index.html 200", "/v1/trends /v1/trends.json 200"]),
    ).toThrow("static rewrite after a dynamic rule");
  });

  it("rejects movers HTML that is pinned only to another geography", () => {
    expect(requiredPublicationScope("/movers")).toBe("state:HP");
    expect(requiredPublicationScope("/states/punjab/movers")).toBe("state:PB");
    const recorded = new Map();
    expect(() =>
      assertExportResourceIdentities(recorded, {
        url: new URL("https://nyaaywatch.in/movers"),
        body: new TextEncoder().encode("<html><title>Movers</title></html>"),
        contentType: "text/html",
        publicationIdentities: [{ scope: "state:PB", publishedAt: "2026-08-15T00:00:00.000Z" }],
      }),
    ).toThrow("expected state:HP");
  });

  it("writes the export manifest beside the public bundle, not inside it", () => {
    expect(exportManifestPath("dist-public").endsWith("dist-public.manifest.json")).toBe(true);
    expect(exportManifestPath("dist-public").includes("dist-public/export-manifest.json")).toBe(false);
  });

  it("treats unpublished configured geographies as skippable empty states", () => {
    expect(isSkippableUnpublishedPublicUrl(new URL("https://nyaaywatch.in/states/punjab"))).toBe(true);
    expect(isSkippableUnpublishedPublicUrl(new URL("https://nyaaywatch.in/v1/states/punjab/stats"))).toBe(true);
    expect(isSkippableUnpublishedPublicUrl(new URL("https://nyaaywatch.in/high-courts"))).toBe(true);
    expect(isSkippableUnpublishedPublicUrl(new URL("https://nyaaywatch.in/high-courts/delhi"))).toBe(true);
    expect(isSkippableUnpublishedPublicUrl(new URL("https://nyaaywatch.in/"))).toBe(false);
    expect(isSkippableUnpublishedPublicUrl(new URL("https://nyaaywatch.in/supreme-court"))).toBe(false);
    expect(isSkippableUnpublishedPublicUrl(new URL("https://nyaaywatch.in/states/punjab/districts/amritsar"))).toBe(false);
  });

  it("does not export a 200 page whose required scope is still unpublished", () => {
    expect(
      isUnpublishedPinnedResource({
        url: new URL("https://nyaaywatch.in/states/goa/movers"),
        body: new TextEncoder().encode("<html></html>"),
        contentType: "text/html",
        publicationIdentities: [{ scope: "state:GA", publishedAt: null }],
      }),
    ).toBe(true);
  });

  it("fails verification when a sitemap location is missing from the export", () => {
    expect(() =>
      assertExportedSitemapCoverage(
        `<urlset><url><loc>https://nyaaywatch.in/states/punjab</loc></url><url><loc>https://nyaaywatch.in/high-courts/delhi</loc></url></urlset>`,
        origin,
        ["/states/punjab"],
      ),
    ).toThrow("missing sitemap URL /high-courts/delhi");
  });
});

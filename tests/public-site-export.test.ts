import { describe, expect, it } from "vitest";
import {
  buildStaticRedirects,
  buildStaticComparisonShell,
  extractInternalUrls,
  extractSitemapUrls,
  extractPublicationIdentities,
  normalizeOrigin,
  outputPathForResource,
  prepareOutputDirectory,
  type PublicResource,
} from "../src/export/public-site.js";

const origin = normalizeOrigin("https://nyaaywatch.in");

describe("public static export helpers", () => {
  it("extracts same-origin links while excluding operator and token routes", () => {
    const urls = extractInternalUrls(
      `<a href="/states/punjab">Punjab</a><a href="/districts?view=flagged">query view</a><a href="https://example.com">external</a><a href="/operator/runs">operator</a><a href="/cdn-cgi/l/email-protection">email</a><a href="/og/district/punjab.png?v=2026-04-5">district social card</a><meta property="og:image" content="/og/home.png"><meta name="description" content="A public snapshot page">`,
      new URL("https://nyaaywatch.in/"),
      origin,
    );

    expect(urls.map((url) => url.pathname)).toEqual(["/og/district/punjab.png", "/og/home.png", "/states/punjab"]);
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
    expect(new TextDecoder().decode(shell.body)).toContain("/v1/states/");
    expect(shell.url.pathname).toBe("/compare");
    expect(new TextDecoder().decode(shell.body)).toContain("methodology");
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

  it("rejects protected directories and their descendants", async () => {
    await expect(prepareOutputDirectory("src/export")).rejects.toThrow("unsafe export directory");
    await expect(prepareOutputDirectory("tests/output")).rejects.toThrow("unsafe export directory");
  });
});

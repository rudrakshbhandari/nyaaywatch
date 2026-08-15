import { describe, expect, it } from "vitest";
import {
  buildStaticRedirects,
  extractInternalUrls,
  extractSitemapUrls,
  normalizeOrigin,
  outputPathForResource,
  type PublicResource,
} from "../src/export/public-site.js";

const origin = normalizeOrigin("https://nyaaywatch.in");

describe("public static export helpers", () => {
  it("extracts same-origin links while excluding operator and token routes", () => {
    const urls = extractInternalUrls(
      `<a href="/states/punjab">Punjab</a><a href="https://example.com">external</a><a href="/operator/runs">operator</a><a href="/cdn-cgi/l/email-protection">email</a><a href="/og/district/punjab.png">missing social card</a><meta property="og:image" content="/og/home.png"><meta name="description" content="A public snapshot page">`,
      new URL("https://nyaaywatch.in/"),
      origin,
    );

    expect(urls.map((url) => url.pathname)).toEqual(["/og/home.png", "/states/punjab"]);
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
});

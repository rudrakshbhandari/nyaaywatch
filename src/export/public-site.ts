import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

export const DEFAULT_SEED_PATHS = [
  "/sitemap.xml",
  "/robots.txt",
  "/v1/stats/himachal",
  "/v1/districts",
  "/v1/trends",
  "/v1/supreme-court/stats",
  "/v1/supreme-court/trends",
  "/og/home.png",
  "/og/supreme-court.png",
] as const;

const INTERNAL_ATTRIBUTE_PATTERN = /(href|src|content)=["']([^"']+)["']/gi;
const SITEMAP_LOCATION_PATTERN = /<loc>([^<]+)<\/loc>/gi;
const HTML_CONTENT_TYPE = "text/html";

export type PublicResource = {
  url: URL;
  body: Uint8Array;
  contentType: string;
};

export function normalizeOrigin(value: string): URL {
  const url = new URL(value);
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url;
}

export function isCrawlablePublicUrl(url: URL, origin: URL): boolean {
  if (url.origin !== origin.origin || url.username || url.password) {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }

  const path = url.pathname;
  return (
    !path.startsWith("/operator/") &&
    path !== "/operator" &&
    path !== "/health" &&
    !path.startsWith("/cdn-cgi/") &&
    !path.startsWith("/og/district/") &&
    !path.startsWith("/subscribe/confirm/") &&
    !path.startsWith("/unsubscribe/")
  );
}

export function extractInternalUrls(body: string, pageUrl: URL, origin: URL): URL[] {
  const urls = new Map<string, URL>();
  for (const match of body.matchAll(INTERNAL_ATTRIBUTE_PATTERN)) {
    const attributeName = match[1]?.toLowerCase();
    const rawValue = match[2]?.trim();
    if (!rawValue || rawValue.startsWith("data:") || rawValue.startsWith("mailto:")) {
      continue;
    }
    if (attributeName === "content" && !/^(?:https?:)?\/\//i.test(rawValue) && !rawValue.startsWith("/")) {
      continue;
    }

    try {
      const url = new URL(rawValue, pageUrl);
      url.hash = "";
      if (!isCrawlablePublicUrl(url, origin)) {
        continue;
      }
      urls.set(url.href, url);
    } catch {
      // Attribute content such as analytics configuration is not necessarily a URL.
    }
  }
  return [...urls.values()].sort((left, right) => left.href.localeCompare(right.href));
}

export function extractSitemapUrls(body: string, origin: URL): URL[] {
  const urls = new Map<string, URL>();
  for (const match of body.matchAll(SITEMAP_LOCATION_PATTERN)) {
    try {
      const url = new URL(match[1].trim(), origin);
      if (isCrawlablePublicUrl(url, origin)) {
        urls.set(url.href, url);
      }
    } catch {
      // Ignore malformed upstream sitemap entries; the exporter will fail on the
      // resulting missing route only if it is needed by the public surface.
    }
  }
  return [...urls.values()].sort((left, right) => left.href.localeCompare(right.href));
}

export function outputPathForResource(url: URL, contentType: string): string {
  const pathname = decodeURIComponent(url.pathname);
  const normalizedPath = pathname.replace(/^\/+/, "");
  const lowerContentType = contentType.toLowerCase();

  if (lowerContentType.includes(HTML_CONTENT_TYPE)) {
    return normalizedPath.length === 0 ? "index.html" : join(normalizedPath, "index.html");
  }

  if (normalizedPath.length > 0 && /\.[a-z0-9]+$/i.test(normalizedPath)) {
    return normalizedPath;
  }

  if (lowerContentType.includes("json")) {
    return `${normalizedPath || "index"}.json`;
  }
  if (lowerContentType.includes("xml")) {
    return `${normalizedPath || "index"}.xml`;
  }
  if (lowerContentType.includes("text/plain")) {
    return `${normalizedPath || "index"}.txt`;
  }

  return normalizedPath || "index";
}

export function buildStaticRedirects(resources: PublicResource[], outputRoot: string): string[] {
  const redirects = new Map<string, string>();
  for (const resource of resources) {
    const requestPath = resource.url.pathname;
    const outputPath = outputPathForResource(resource.url, resource.contentType);
    if (resource.contentType.toLowerCase().includes(HTML_CONTENT_TYPE)) {
      continue;
    }
    if (requestPath === `/${outputPath}`) {
      continue;
    }

    const absoluteOutputPath = resolve(outputRoot, outputPath);
    const relativeOutputPath = relative(outputRoot, absoluteOutputPath).replaceAll("\\", "/");
    redirects.set(`${requestPath} /${relativeOutputPath} 200`, `${requestPath} /${relativeOutputPath} 200`);
  }
  return [...redirects.values()].sort();
}

export async function writePublicResource(resource: PublicResource, outputRoot: string): Promise<string> {
  const outputPath = outputPathForResource(resource.url, resource.contentType);
  const absolutePath = resolve(outputRoot, outputPath);
  const relativePath = relative(outputRoot, absolutePath);
  if (relativePath.startsWith("..") || resolve(outputRoot) === absolutePath) {
    throw new Error(`Refusing to write resource outside export directory: ${outputPath}`);
  }
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, resource.body);
  return outputPath;
}

export async function prepareOutputDirectory(outputRoot: string): Promise<void> {
  const resolvedOutputRoot = resolve(outputRoot);
  const currentWorkingDirectory = resolve(process.cwd());
  const relativeOutputRoot = relative(currentWorkingDirectory, resolvedOutputRoot);
  if (
    !relativeOutputRoot ||
    relativeOutputRoot.startsWith("..") ||
    [".git", "src", "tests"].includes(relativeOutputRoot)
  ) {
    throw new Error(`Refusing to clean unsafe export directory: ${outputRoot}`);
  }
  await rm(resolvedOutputRoot, { recursive: true, force: true });
  await mkdir(resolvedOutputRoot, { recursive: true });
}

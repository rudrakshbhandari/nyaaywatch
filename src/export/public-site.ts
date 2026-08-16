import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { getPublicStateProfileBySlug } from "../geographies.js";

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
  publicationIdentities?: PublicationIdentity[];
};

export type PublicationIdentity = {
  scope: string;
  publishedAt: string | null;
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
    path !== "/subscribe" &&
    !path.startsWith("/subscribe/") &&
    path !== "/unsubscribe" &&
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
      // Query strings are runtime view state. Static hosting maps every query
      // variant to the same file, so crawling them would make whichever
      // variant finishes last overwrite the canonical page.
      if (url.search) {
        if (url.pathname.startsWith("/og/") || /\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i.test(url.pathname)) {
          url.search = "";
        } else {
          continue;
        }
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

export function buildStaticSubscribeNotice(origin: URL): PublicResource {
  const body = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Subscribe — NyaayWatch</title>
<style>body{margin:0;padding:40px 20px;background:#f4efe3;color:#0c0a08;font:16px system-ui,sans-serif}main{max-width:720px;margin:auto}h1{font-size:clamp(28px,5vw,52px);margin:0 0 16px}p{line-height:1.5}</style></head>
<body><main>
<p>SUBSCRIBE</p>
<h1>Email updates aren't available here yet.</h1>
<p>This page can't take sign-ups. You can still read the numbers on the home page, or see how the figures are built on the methodology page.</p>
<p><a href="/">Home</a> · <a href="/methodology">Methodology</a></p>
</main></body></html>`;
  return {
    url: new URL("/subscribe", origin),
    body: new TextEncoder().encode(body),
    contentType: "text/html; charset=utf-8",
  };
}

export function buildStaticComparisonShell(origin: URL): PublicResource {
  const body = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Compare districts — NyaayWatch</title>
<style>body{margin:0;padding:40px 20px;background:#f4efe3;color:#0c0a08;font:16px system-ui,sans-serif}main{max-width:900px;margin:auto}article{border:1px solid #0c0a08;background:#fffaf0;padding:24px}h1{font-size:clamp(28px,5vw,52px);margin:0 0 24px}table{border-collapse:collapse;width:100%}th,td{border-top:1px solid #d8d0c2;padding:12px;text-align:left}th{width:40%;font-weight:600}</style></head>
<body><main><article><p>Loading comparison…</p></article></main>
<script>
(async function(){
  function escapeHtml(value){return String(value).replace(/[&<>\"]/g,function(character){return {"&":"&amp;","<":"&lt;",">":"&gt;","\\\"":"&quot;"}[character];});}
  function show(title, message){document.querySelector("article").innerHTML="<h1>"+escapeHtml(title)+"</h1><p>"+escapeHtml(message)+"</p>";}
  var pathname=window.location.pathname;
  var stateMatch=pathname.match(/^\\/states\\/([^/]+)\\/compare\\//);
  var compareMarker="/compare/";
  var markerIndex=pathname.indexOf(compareMarker);
  if(markerIndex<0){show("Comparison not found","Use a supported district comparison link.");return;}
  var slug=pathname.slice(markerIndex+compareMarker.length);
  var separator=slug.indexOf("-vs-");
  if(separator<1){show("Comparison not found","Use a supported district comparison link.");return;}
  var leftId=decodeURIComponent(slug.slice(0,separator));
  var rightId=decodeURIComponent(slug.slice(separator+4));
  var apiPath=stateMatch ? "/v1/states/"+stateMatch[1]+"/districts" : "/v1/districts";
  try{
    var response=await fetch(apiPath);
    if(!response.ok) throw new Error("data unavailable");
    var payload=await response.json();
    var left=payload.districts.find(function(district){return district.districtId===leftId;});
    var right=payload.districts.find(function(district){return district.districtId===rightId;});
    if(!left||!right){show("Comparison not found","One or both districts are not in this published snapshot.");return;}
    document.title=left.districtName+" vs "+right.districtName+" — NyaayWatch";
    var evidenceBase=stateMatch ? "/states/"+stateMatch[1]+"/data/evidence/districts/" : "/data/evidence/districts/";
    var methodologyPath=stateMatch ? "/states/"+stateMatch[1]+"/methodology" : "/methodology";
    var evidenceLinks="<a href=\\\""+evidenceBase+encodeURIComponent(leftId)+".json\\\">"+escapeHtml(left.districtName)+" evidence</a> · <a href=\\\""+evidenceBase+encodeURIComponent(rightId)+".json\\\">"+escapeHtml(right.districtName)+" evidence</a>";
    document.querySelector("article").innerHTML="<p>Published snapshot: "+escapeHtml(payload.snapshot.referenceDateAt.slice(0,10))+" · Quality: "+escapeHtml(payload.snapshot.qualityState)+"</p><h1>"+escapeHtml(left.districtName)+" vs "+escapeHtml(right.districtName)+"</h1><p>Source: "+escapeHtml(payload.snapshot.sourceAttribution)+" · Method: "+escapeHtml(payload.snapshot.methodologyVersion)+" · <a href=\\\""+methodologyPath+"\\\">methodology</a></p><p>These values are signals from the published snapshot, not findings about any court or official.</p><p>"+evidenceLinks+"</p><table><thead><tr><th>Metric</th><th>"+escapeHtml(left.districtName)+"</th><th>"+escapeHtml(right.districtName)+"</th></tr></thead><tbody>"+
      [
        ["Cases waiting",left.backlogCases,right.backlogCases],
        ["Cleared per 100",left.disposalRate,right.disposalRate],
        ["Typical wait (days)",left.medianAgeDays,right.medianAgeDays],
        ["File-clear gap",left.filingVsDisposalGap,right.filingVsDisposalGap],
        ["Watch rank",left.rank,right.rank]
      ].map(function(row){return "<tr><th>"+escapeHtml(row[0])+"</th><td>"+escapeHtml(row[1])+"</td><td>"+escapeHtml(row[2])+"</td></tr>";}).join("")+"</tbody></table>";
  }catch(error){show("Comparison unavailable","This published snapshot could not be loaded.");}
})();
</script></body></html>`;
  return {
    url: new URL("/compare", origin),
    body: new TextEncoder().encode(body),
    contentType: "text/html; charset=utf-8",
  };
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
  const disposableExportDirectory = relativeOutputRoot === "dist-public" || relativeOutputRoot.startsWith("dist-public/");
  if (
    !relativeOutputRoot ||
    relativeOutputRoot.startsWith("..") ||
    !disposableExportDirectory
  ) {
    throw new Error(`Refusing to clean unsafe export directory outside approved dist-public path: ${outputRoot}`);
  }
  await rm(resolvedOutputRoot, { recursive: true, force: true });
  await mkdir(resolvedOutputRoot, { recursive: true });
}

export function resourceRequiresPublicationIdentity(resource: PublicResource): boolean {
  const pathname = resource.url.pathname;
  if (
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/press" ||
    pathname === "/learn" ||
    pathname.startsWith("/press/") ||
    pathname.endsWith("/api")
  ) {
    return false;
  }

  const contentType = resource.contentType.toLowerCase();
  return contentType.includes("json") || contentType.includes("csv");
}

export function recordPublicationIdentities(
  recorded: Map<string, PublicationIdentity>,
  identities: PublicationIdentity[],
): void {
  for (const identity of identities) {
    const previous = recorded.get(identity.scope);
    if (previous && previous.publishedAt !== identity.publishedAt) {
      throw new Error(
        `Publication changed during crawl for ${identity.scope}: ${previous.publishedAt} -> ${identity.publishedAt}. Retry against one immutable publication.`,
      );
    }
    recorded.set(identity.scope, identity);
  }
}

export function assertExportResourceIdentities(
  recorded: Map<string, PublicationIdentity>,
  resource: PublicResource,
): PublicationIdentity[] {
  const identities = extractPublicationIdentities(resource);
  recordPublicationIdentities(recorded, identities);
  if (resourceRequiresPublicationIdentity(resource) && identities.length === 0) {
    throw new Error(
      `Publication identity missing for ${resource.url.pathname}. Refusing to publish an unverifiable resource.`,
    );
  }
  return identities;
}

export function extractPublicationIdentities(resource: PublicResource): PublicationIdentity[] {
  if (resource.publicationIdentities && resource.publicationIdentities.length > 0) {
    return resource.publicationIdentities;
  }
  const contentType = resource.contentType.toLowerCase();
  const text = new TextDecoder().decode(resource.body);
  if (contentType.includes("text/csv")) {
    return extractCsvPublicationIdentity(resource.url, text);
  }
  if (contentType.includes("text/html")) {
    const publishedAt = text.match(/"datePublished"\s*:\s*"([^"\\]+)"/)?.[1];
    const scope = scopeFromPath(resource.url.pathname);
    return publishedAt && scope ? [{ scope, publishedAt }] : [];
  }
  if (!contentType.includes("json")) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }

  const identities = new Map<string, PublicationIdentity>();
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") {
      return;
    }

    const record = value as Record<string, unknown>;
    if (typeof record.publishedAt === "string") {
      const scope =
        typeof record.stateCode === "string"
          ? `state:${record.stateCode}`
          : typeof record.courtCode === "string"
            ? `court:${record.courtCode}`
            : null;
      if (scope) {
        identities.set(scope, { scope, publishedAt: record.publishedAt });
      }
    }

    Object.values(record).forEach(visit);
  };
  visit(parsed);
  return [...identities.values()].sort((left, right) => left.scope.localeCompare(right.scope));
}

function extractCsvPublicationIdentity(url: URL, body: string): PublicationIdentity[] {
  const [headerLine = "", ...dataLines] = body.split(/\r?\n/);
  const nonEmptyDataLines = dataLines.filter((line) => line.length > 0);
  const rowLine = headersContainStateCode(headerLine) ? nonEmptyDataLines[0] : nonEmptyDataLines.at(-1);
  if (!headerLine || !rowLine) {
    return [];
  }
  const headers = headerLine.split(",");
  const values = rowLine.split(",");
  const publishedAt = values[headers.indexOf("published_at")]?.replace(/^"|"$/g, "");
  const stateCode = values[headers.indexOf("state_code")]?.replace(/^"|"$/g, "");
  const scope = stateCode ? `state:${stateCode}` : scopeFromPath(url.pathname);
  return publishedAt && scope ? [{ scope, publishedAt }] : [];
}

function headersContainStateCode(headerLine: string): boolean {
  return headerLine.split(",").includes("state_code");
}

function scopeFromPath(pathname: string): string | null {
  const stateMatch = pathname.match(/^\/states\/([^/]+)(?:\/|$)/);
  if (stateMatch?.[1]) {
    const profile = getPublicStateProfileBySlug(stateMatch[1]);
    return profile ? `state:${profile.stateCode}` : null;
  }
  if (
    pathname === "/districts" ||
    pathname.startsWith("/districts/") ||
    pathname.startsWith("/data/") ||
    pathname.startsWith("/v1/") ||
    pathname.startsWith("/embed/")
  ) {
    return "state:HP";
  }
  return null;
}

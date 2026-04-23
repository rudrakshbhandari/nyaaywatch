import { escapeHtml } from "../../lib/html.js";
import { renderRumSnippet } from "./rum.js";
import { BASE_CSS, FONTS_LINK } from "./styles.js";
import { infoIcon } from "./ui.js";

const FAVICON_DATA_URL = createFaviconDataUrl();

export interface OgMeta {
  /** Used for og:title, twitter:title, and (if og.title differs) the page title. */
  title: string;
  /** Used for meta description, og:description, twitter:description. */
  description: string;
  /** Absolute URL of the OG card image (1200×630 PNG). */
  image?: string;
  /** Alt text for the OG card image. */
  imageAlt?: string;
  /** Canonical URL for og:url. */
  url?: string;
}

export interface PageShellOptions {
  title: string;
  body: string;
  /** Which top-nav link should render as active. */
  activeNav?: string;
  /** Brand link for the current page scope. */
  brandHref?: string;
  /** Small brand tag shown in the footer. */
  brandTag?: string;
  /** State-aware nav links for the current public scope. */
  navLinks?: Array<{ id: string; href: string; label: string }>;
  /** Supported public states that currently have published snapshots. */
  stateLinks?: Array<{ label: string; href: string; active: boolean }>;
  /** Small meta strip directly under the masthead. Optional. */
  ticker?: string;
  /** Page-specific CSS appended after the base stylesheet. */
  pageCss?: string;
  /** Footer metadata (dates, source, methodology version). */
  footer: FooterMeta;
  /** Open Graph / Twitter Card meta. When omitted the page has no social preview. */
  og?: OgMeta;
}

export interface FooterMeta {
  sourceDateLabel: string | null;
  methodologyVersion: string | null;
  sourceAttribution: string | null;
}

/**
 * Canonical page shell. Every public HTML route should render through this —
 * it guarantees the masthead, ticker, colophon, font stack, and design tokens
 * are identical across the site. The page itself fills `body`; page-specific
 * CSS is passed in via `pageCss` rather than living as a separate stylesheet
 * because we ship HTML straight from the server with no asset pipeline.
 */
export function renderPageShell(options: PageShellOptions): string {
  const brandHref = "/";
  const nav = renderNav(options.activeNav ?? null, options.navLinks);
  const stateSwitcher = renderStateSwitcher(options.stateLinks ?? []);
  const ticker = options.ticker ? `<div class="ticker">${escapeHtml(options.ticker)}</div>` : "";
  const footer = renderColophon(options.footer, options.brandTag ?? "Court transparency, Himachal Pradesh", options.navLinks);

  const og = options.og;
  const ogMeta = og
    ? `
  <meta name="description" content="${escapeHtml(og.description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="NyaayWatch" />
  <meta property="og:title" content="${escapeHtml(og.title)}" />
  <meta property="og:description" content="${escapeHtml(og.description)}" />${og.url ? `\n  <meta property="og:url" content="${escapeHtml(og.url)}" />` : ""}${og.image ? `\n  <meta property="og:image" content="${escapeHtml(og.image)}" />\n  <meta property="og:image:width" content="1200" />\n  <meta property="og:image:height" content="630" />${og.imageAlt ? `\n  <meta property="og:image:alt" content="${escapeHtml(og.imageAlt)}" />` : ""}` : ""}
  <meta name="twitter:card" content="${og.image ? "summary_large_image" : "summary"}" />
  <meta name="twitter:title" content="${escapeHtml(og.title)}" />
  <meta name="twitter:description" content="${escapeHtml(og.description)}" />${og.image ? `\n  <meta name="twitter:image" content="${escapeHtml(og.image)}" />` : ""}`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(options.title)}</title>
  <link rel="icon" href="${FAVICON_DATA_URL}" type="image/svg+xml" />${ogMeta}
  ${FONTS_LINK}
  <style>${BASE_CSS}${options.pageCss ?? ""}</style>
  ${renderRumSnippet()}
</head>
<body>
  <header class="masthead">
    <a href="${brandHref}" class="masthead__brand">
      <span class="masthead__mark">NW</span>
      <span class="masthead__wordmark">NyaayWatch</span>
    </a>
    ${nav}
  </header>
  ${stateSwitcher}
  ${ticker}
  <main>${options.body}</main>
  ${footer}
</body>
</html>`;
}

function createFaviconDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="4" fill="#0c0a08" />
  <text x="32" y="36" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="900" letter-spacing="-1.6" fill="#f4efe3">NW</text>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function renderNav(
  active: PageShellOptions["activeNav"] | null,
  navLinks: PageShellOptions["navLinks"],
): string {
  const links: Array<{ id: string; href: string; label: string }> = navLinks ?? [
    { id: "districts", href: "/districts", label: "Districts" },
    { id: "data", href: "/data", label: "Data" },
    { id: "methodology", href: "/methodology", label: "Method" },
    { id: "api", href: "/api", label: "API" },
  ];
  return `<nav class="masthead__nav" aria-label="Primary">${links
    .map(
      (link) =>
        `<a href="${link.href}"${active === link.id ? ` class="is-active" aria-current="page"` : ""}>${escapeHtml(link.label)}</a>`,
    )
    .join("")}</nav>`;
}

/**
 * Above this count we render the switcher as a collapsed <details> dropdown
 * instead of a wall of pill chips. Empirically 9+ scopes (e.g. 14 High Courts)
 * becomes 3+ lines on desktop and eats the editorial fold. Eight or fewer
 * fit on a single row and stay visible.
 */
const STATE_SWITCHER_OVERFLOW_THRESHOLD = 8;

function renderStateSwitcher(stateLinks: Array<{ label: string; href: string; active: boolean }>) {
  if (stateLinks.length <= 1) {
    return "";
  }

  const links = stateLinks
    .map(
      (link) =>
        `<a href="${link.href}"${link.active ? ` class="is-active" aria-current="page"` : ""}>${escapeHtml(link.label)}</a>`,
    )
    .join("");

  if (stateLinks.length <= STATE_SWITCHER_OVERFLOW_THRESHOLD) {
    return `<nav class="state-switcher" aria-label="Switch scope">${links}</nav>`;
  }

  const active = stateLinks.find((link) => link.active);
  const summaryLabel = active
    ? `<span class="state-switcher__label">Viewing</span> <span class="state-switcher__current">${escapeHtml(active.label)}</span>`
    : `<span class="state-switcher__label">Switch scope</span>`;

  return `<details class="state-switcher">
    <summary aria-label="Switch scope">${summaryLabel}</summary>
    <div class="state-switcher__list">${links}</div>
  </details>`;
}

function renderColophon(
  footer: FooterMeta,
  brandTag: string,
  navLinks: PageShellOptions["navLinks"],
): string {
  const publishedLine = footer.sourceDateLabel
    ? `<p>Numbers published ${escapeHtml(footer.sourceDateLabel)}</p>`
    : "";
  // The info icons carry the plain-English source + methodology explanations
  // from the glossary. Keeping them in every page's colophon means the site
  // never shows a number without a click-reachable citation.
  const sourceLine = footer.sourceAttribution
    ? `<p>Source: ${escapeHtml(footer.sourceAttribution)} ${infoIcon("source")}</p>`
    : "";
  const methodLine = footer.methodologyVersion
    ? `<p>Method ${escapeHtml(footer.methodologyVersion)} ${infoIcon("methodology")}</p>`
    : "";
  const links = navLinks ?? [
    { href: "/districts", label: "Districts" },
    { href: "/data", label: "Data downloads" },
    { href: "/methodology", label: "Methodology" },
    { href: "/api", label: "API" },
  ];

  return `<footer class="colophon">
    <div class="colophon__col">
      <p class="colophon__brand">NyaayWatch</p>
      <p>${escapeHtml(brandTag)}</p>
    </div>
    <div class="colophon__col">
      ${publishedLine}
      ${sourceLine}
      ${methodLine}
    </div>
    <div class="colophon__col">
      ${links
        .map((link) => `<a href="${link.href}">${escapeHtml(link.label === "Data" ? "Data downloads" : link.label)}</a>`)
        .join("")}
    </div>
  </footer>`;
}

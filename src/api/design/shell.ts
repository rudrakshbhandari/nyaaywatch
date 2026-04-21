import { escapeHtml } from "../../lib/html.js";
import { BASE_CSS, FONTS_LINK } from "./styles.js";
import { infoIcon } from "./ui.js";

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

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(options.title)}</title>
  ${FONTS_LINK}
  <style>${BASE_CSS}${options.pageCss ?? ""}</style>
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
  return `<nav class="masthead__nav">${links
    .map(
      (link) =>
        `<a href="${link.href}"${active === link.id ? ` class="is-active"` : ""}>${escapeHtml(link.label)}</a>`,
    )
    .join("")}</nav>`;
}

function renderStateSwitcher(stateLinks: Array<{ label: string; href: string; active: boolean }>) {
  if (stateLinks.length <= 1) {
    return "";
  }

  return `<div class="state-switcher" aria-label="Supported states">${stateLinks
    .map(
      (link) =>
        `<a href="${link.href}"${link.active ? ` class="is-active"` : ""}>${escapeHtml(link.label)}</a>`,
    )
    .join("")}</div>`;
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

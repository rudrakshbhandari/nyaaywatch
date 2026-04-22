import { escapeHtml } from "../../lib/html.js";
import { GLOSSARY, type GlossaryKey } from "../home/copy.js";

/**
 * Circular "i" icon used site-wide next to technical terms. Clicking / hovering
 * reveals the GLOSSARY entry in a tooltip popover. Styles live in design/styles.ts
 * under the `.info` / `.info-popover` selectors.
 */
export function infoIcon(key: GlossaryKey): string {
  const entry = GLOSSARY[key];
  return `<details class="info" data-term="${key}">
    <summary aria-label="What does ${escapeHtml(entry.term)} mean?">i</summary>
    <div class="info-popover" role="tooltip">
      <strong>${escapeHtml(entry.term)}</strong>
      <p class="info-short">${escapeHtml(entry.short)}</p>
      <p class="info-long">${escapeHtml(entry.long)}</p>
    </div>
  </details>`;
}

export interface SectionHeadOptions {
  eyebrow?: string;
  headline: string;
  lede?: string;
  /** If true, renders as <h1>; otherwise <h2>. Default false. */
  isHero?: boolean;
}

/**
 * Uniform section header. Heroes use the larger .page-hero scale; section
 * heads inside a page use the smaller .section-head scale.
 */
export function renderSectionHead(options: SectionHeadOptions): string {
  const eyebrow = options.eyebrow
    ? `<p class="${options.isHero ? "page-hero__eyebrow" : "section-head__eyebrow"}">${escapeHtml(options.eyebrow)}</p>`
    : "";
  const lede = options.lede
    ? `<p class="${options.isHero ? "page-hero__lede" : "section-head__lede"}">${escapeHtml(options.lede)}</p>`
    : "";
  if (options.isHero) {
    return `<section class="page-hero">
      ${eyebrow}
      <h1 class="page-hero__hed">${escapeHtml(options.headline)}</h1>
      ${lede}
    </section>`;
  }
  return `<header class="section-head">
    ${eyebrow}
    <h2>${escapeHtml(options.headline)}</h2>
    ${lede}
  </header>`;
}

export interface StatTileOptions {
  label: string;
  value: string;
  unit?: string;
  note?: string;
  /** "accent" = red-dark label; "flag" = amber label. */
  tone?: "default" | "accent" | "flag";
  infoKey?: GlossaryKey;
  /**
   * When set, the label text becomes a link to the methodology page anchor
   * that explains the metric. The info-icon stays alongside for the
   * glossary popover so the reader has two affordances: hover for a blurb,
   * click the label to read the full method.
   */
  methodologyHref?: string;
  /**
   * Permalink id for the tile itself. Lets other pages deep-link directly
   * to this tile (e.g. /districts/:id#stat-backlog from a comparator row).
   */
  anchorId?: string;
}

export function renderStatTile(options: StatTileOptions): string {
  const tone = options.tone && options.tone !== "default" ? ` stat-tile--${options.tone}` : "";
  const unit = options.unit ? `<span class="stat-tile__unit">${escapeHtml(options.unit)}</span>` : "";
  const note = options.note ? `<p class="stat-tile__note">${escapeHtml(options.note)}</p>` : "";
  const info = options.infoKey ? ` ${infoIcon(options.infoKey)}` : "";
  const labelText = options.methodologyHref
    ? `<a class="stat-tile__link" href="${options.methodologyHref}">${escapeHtml(options.label)}</a>`
    : escapeHtml(options.label);
  const anchor = options.anchorId ? ` id="${options.anchorId}"` : "";
  return `<article class="stat-tile${tone}"${anchor}>
    <div class="stat-tile__label">${labelText}${info}</div>
    <div class="stat-tile__value">${escapeHtml(options.value)}${unit}</div>
    ${note}
  </article>`;
}

/**
 * Small "#" permalink shown in the corner of a card. It appears on hover or
 * focus and lets a reader grab a URL that jumps straight to this card — the
 * core move that turns the editorial surface into a navigable citation
 * graph. See the `.anchor-link` / `:target` rules in design/styles.ts.
 */
export function renderAnchorLink(targetId: string, label: string): string {
  return `<a class="anchor-link" href="#${targetId}" aria-label="Permalink to ${escapeHtml(label)}">#</a>`;
}

export interface BadgeOptions {
  label: string;
  tone?: "default" | "flag" | "accent" | "complete";
}

export function renderBadge(options: BadgeOptions): string {
  const tone = options.tone && options.tone !== "default" ? ` badge--${options.tone}` : "";
  return `<span class="badge${tone}">${escapeHtml(options.label)}</span>`;
}

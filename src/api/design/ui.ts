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
}

export function renderStatTile(options: StatTileOptions): string {
  const tone = options.tone && options.tone !== "default" ? ` stat-tile--${options.tone}` : "";
  const unit = options.unit ? `<span class="stat-tile__unit">${escapeHtml(options.unit)}</span>` : "";
  const note = options.note ? `<p class="stat-tile__note">${escapeHtml(options.note)}</p>` : "";
  const info = options.infoKey ? ` ${infoIcon(options.infoKey)}` : "";
  return `<article class="stat-tile${tone}">
    <div class="stat-tile__label">${escapeHtml(options.label)}${info}</div>
    <div class="stat-tile__value">${escapeHtml(options.value)}${unit}</div>
    ${note}
  </article>`;
}

export interface BadgeOptions {
  label: string;
  tone?: "default" | "flag" | "accent" | "complete";
}

export function renderBadge(options: BadgeOptions): string {
  const tone = options.tone && options.tone !== "default" ? ` badge--${options.tone}` : "";
  return `<span class="badge${tone}">${escapeHtml(options.label)}</span>`;
}

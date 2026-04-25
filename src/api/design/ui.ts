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
  /**
   * Hero size variant. `"default"` = full editorial hero (clamp to 56px).
   * `"compact"` = reference-doc scale (clamp to 34px). Use compact for API
   * reference, data downloads, and other pages where a 56px wall of text
   * would overpower the body content below. Ignored when isHero is false.
   */
  variant?: "default" | "compact";
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
    const variantClass = options.variant === "compact" ? " page-hero--compact" : "";
    return `<section class="page-hero${variantClass}">
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
  /**
   * Optional numeric series (oldest → newest) drawn as a small inline sparkline
   * next to the value, with a %-change chip. Used for the hero tiles on
   * renderNationalHome — the rest of the site can keep calling renderStatTile
   * without passing series.
   */
  series?: number[];
  /** Accessible label for the sparkline. */
  seriesLabel?: string;
  /**
   * Semantic coloring for the delta chip. "up-is-bad" means a rising series is
   * colored red (e.g. pending backlog); "up-is-good" means rising is green
   * (e.g. clearance rate).
   */
  deltaDirectionHint?: "up-is-good" | "up-is-bad";
  /** Optional short label rendered inside the delta chip before the value. */
  deltaLabel?: string;
  /** Use "neutral" when a short series is context, not a good/bad verdict. */
  deltaTone?: "semantic" | "neutral";
  /**
   * Optional small uppercase mono tag rendered under the value to flag
   * direction in plain language ("Falling behind", "Backlog growing").
   * Worsening renders in --accent, improving in --ink-muted, neutral
   * renders nothing.
   */
  trendSignal?: { tone: "worsening" | "improving" | "neutral"; label: string };
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

  // Only render a sparkline when we have ≥2 finite points *and* the series
  // actually moves (otherwise a flat horizontal line next to a "flat" chip
  // wastes attention without saying anything the big number doesn't already).
  const series = (options.series ?? []).filter((n) => Number.isFinite(n));
  const seriesMoves = series.length >= 2 && Math.min(...series) !== Math.max(...series);
  const sparkSvg = seriesMoves ? renderSparklineSvg(series, options.seriesLabel ?? options.label) : "";
  const deltaChip = seriesMoves
    ? renderDeltaChip(series, {
        hint: options.deltaDirectionHint ?? "up-is-bad",
        label: options.deltaLabel,
        tone: options.deltaTone ?? "semantic",
      })
    : "";
  const withSparkClass = seriesMoves ? " stat-tile--with-spark" : "";

  // Sparkline + delta live on a row *below* the value, left-aligned with it,
  // so tiles with different value widths (e.g. "94,158" vs "74.0") stay
  // visually consistent — the earlier right-edge layout made short numbers
  // feel detached from their chart.
  const sparkRow = seriesMoves
    ? `<div class="stat-tile__spark-row">${sparkSvg}${deltaChip}</div>`
    : "";

  const trend = options.trendSignal;
  const trendTag =
    trend && trend.tone !== "neutral"
      ? `<span class="stat-tile__signal stat-tile__signal--${trend.tone}">${escapeHtml(trend.label)}</span>`
      : "";

  return `<article class="stat-tile${tone}${withSparkClass}"${anchor}>
    <div class="stat-tile__label">${labelText}${info}</div>
    <div class="stat-tile__value">${escapeHtml(options.value)}${unit}</div>
    ${sparkRow}
    ${trendTag}
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

function renderSparklineSvg(series: number[], ariaLabel: string): string {
  const width = 96;
  const height = 28;
  const pad = 2;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const points = series.map((value, index) => {
    const x = pad + (index * (width - pad * 2)) / (series.length - 1);
    const y = height - pad - ((value - min) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const lastPoint = points[points.length - 1]?.split(",") ?? ["0", "0"];
  return `<svg class="sparkline" viewBox="0 0 ${width} ${height}" aria-label="${escapeHtml(ariaLabel)}" role="img">
    <polyline points="${points.join(" ")}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="${lastPoint[0]}" cy="${lastPoint[1]}" r="2" fill="currentColor" />
  </svg>`;
}

function renderDeltaChip(
  series: number[],
  options: { hint: "up-is-good" | "up-is-bad"; label?: string; tone: "semantic" | "neutral" },
): string {
  const first = series[0];
  const last = series[series.length - 1];
  if (first === undefined || last === undefined) return "";
  let display: string;
  let direction: "up" | "down" | "flat";
  if (first === 0) {
    const diff = last - first;
    if (diff === 0) {
      direction = "flat";
      display = "";
    } else if (diff > 0) {
      display = `+${formatCompactNumber(diff)}`;
      direction = "up";
    } else {
      display = `−${formatCompactNumber(Math.abs(diff))}`;
      direction = "down";
    }
  } else {
    const pct = ((last - first) / Math.abs(first)) * 100;
    const rounded = Math.round(pct * 10) / 10;
    if (rounded === 0) {
      direction = "flat";
      display = "";
    } else if (rounded > 0) {
      display = `+${rounded.toFixed(1)}%`;
      direction = "up";
    } else {
      display = `−${Math.abs(rounded).toFixed(1)}%`;
      direction = "down";
    }
  }
  // "Flat" = no chip. A row of "flat flat flat flat" chips across the hero
  // tiles read as noise, not signal; the sparkline itself already shows the
  // series going nowhere.
  if (direction === "flat") return "";
  const sentiment =
    options.tone === "neutral"
      ? "neutral"
      : options.hint === "up-is-bad"
      ? direction === "up"
        ? "bad"
        : "good"
      : direction === "up"
        ? "good"
        : "bad";
  const label = options.label ? `${options.label} ` : "";
  return `<span class="stat-tile__delta stat-tile__delta--${sentiment}">${escapeHtml(`${label}${display}`)}</span>`;
}

function formatCompactNumber(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_00_000) return `${(n / 1_00_000).toFixed(1)} L`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("en-IN");
}

export interface BadgeOptions {
  label: string;
  tone?: "default" | "flag" | "accent" | "complete";
}

export function renderBadge(options: BadgeOptions): string {
  const tone = options.tone && options.tone !== "default" ? ` badge--${options.tone}` : "";
  return `<span class="badge${tone}">${escapeHtml(options.label)}</span>`;
}

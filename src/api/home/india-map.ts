import type { PublishedSnapshot } from "../../domain/snapshot-schema.js";
import type { NjdgStateProfile, SupportedStateCode } from "../../geographies.js";
import { escapeHtml } from "./view-model.js";
import { INDIA_STATE_PATHS, INDIA_VIEWBOX } from "./india-geography.js";

/**
 * Per-geography input for the choropleth. Consumers assemble this by pairing each
 * live lower-court profile with its latest published snapshot; geographies without a
 * published snapshot are simply omitted and draw with the "no data" pattern.
 */
export interface IndiaMapStateEntry {
  profile: NjdgStateProfile;
  stats: PublishedSnapshot["stats"];
  districtCount: number;
}

export interface RankedIndiaMapStateEntry {
  entry: IndiaMapStateEntry;
  score: number;
}

/**
 * Composite "judicial pressure index" — weighted blend of four stress signals
 * normalized to [0, 1] across the live states. Weights lean on pending volume
 * and delay since those are the consequence-facing story; clearance shortfall
 * and flagged-district share are supporting signals.
 */
const WEIGHT_PENDING = 0.4;
const WEIGHT_AGE = 0.3;
const WEIGHT_CLEARANCE_SHORTFALL = 0.2;
const WEIGHT_FLAGGED_SHARE = 0.1;

interface PressureScales {
  minPending: number;
  maxPending: number;
  minAge: number;
  maxAge: number;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return clamp01((value - min) / (max - min));
}

function computePressure(entry: IndiaMapStateEntry, scales: PressureScales): number {
  const { stats, districtCount } = entry;
  const pendingN = normalize(stats.pendingCases, scales.minPending, scales.maxPending);
  const ageN = normalize(stats.medianCaseAgeDays, scales.minAge, scales.maxAge);
  const clearanceShortfallN = clamp01((100 - stats.disposalRate) / 100);
  const flaggedShareN = districtCount > 0 ? clamp01(stats.flaggedDistricts / districtCount) : 0;
  return (
    WEIGHT_PENDING * pendingN +
    WEIGHT_AGE * ageN +
    WEIGHT_CLEARANCE_SHORTFALL * clearanceShortfallN +
    WEIGHT_FLAGGED_SHARE * flaggedShareN
  );
}

// Sequential ramp from light amber through warm amber to accent-dark. Even the
// lowest bin carries a touch of warmth so low-pressure states are visually
// distinct from the "no data" diagonal-stripe pattern. Five bins keeps the map
// legible without a continuous-scale legend.
const RAMP = [
  { stop: "#f5ead0", label: "lowest" },
  { stop: "#ead2a0", label: "low" },
  { stop: "#de9c5c", label: "mid" },
  { stop: "#b94a1e", label: "high" },
  { stop: "#8a1408", label: "highest" },
] as const;

// Neutral taupe state-border stroke. Visible against both the paper-toned low
// bins and the dark accent high bins, so neighboring states always read as
// distinct shapes even when both fall in the same pressure bucket.
const STATE_STROKE = "#9b9179";
const NODATA_STROKE = "#b8ae97";

const INDIA_MAP_PROFILE_CODE_ALIASES: Record<string, SupportedStateCode> = {
  AN_UT: "AN",
  LD_UT: "LD",
  DL_UT: "DL",
  PY_UT: "PY",
  CH_UT: "CHD",
  DN_UT: "DNHDD",
  DD_UT: "DNHDD",
};

/**
 * Rank-based bin assignment. With fixed breakpoints the real score distribution
 * was compressed into the bottom two bins and the map looked almost uniformly
 * cream. Assigning colors by rank — lowest-pressure state gets bin 0, highest
 * gets the top bin, everything else linearly interpolated — guarantees the
 * full ramp is used every render and works cleanly even with only a handful
 * of published lower-court geographies. The map reads as a relative heatmap across the
 * currently-published cohort.
 */
function assignBinsByRank<T extends { score: number }>(
  scored: T[],
): Map<T, number> {
  const sorted = [...scored].sort((a, b) => a.score - b.score);
  const n = sorted.length;
  const map = new Map<T, number>();
  const topBin = RAMP.length - 1;
  for (let i = 0; i < n; i++) {
    const bin = n <= 1 ? topBin : Math.round((i / (n - 1)) * topBin);
    map.set(sorted[i], bin);
  }
  return map;
}

function formatInt(value: number): string {
  return value.toLocaleString("en-IN");
}

function deriveScales(entries: IndiaMapStateEntry[]): PressureScales {
  if (entries.length === 0) {
    return { minPending: 0, maxPending: 0, minAge: 0, maxAge: 0 };
  }
  const pending = entries.map((e) => e.stats.pendingCases);
  const ages = entries.map((e) => e.stats.medianCaseAgeDays);
  return {
    minPending: Math.min(...pending),
    maxPending: Math.max(...pending),
    minAge: Math.min(...ages),
    maxAge: Math.max(...ages),
  };
}

export function rankIndiaMapEntriesByPressure(entries: IndiaMapStateEntry[]): RankedIndiaMapStateEntry[] {
  const scales = deriveScales(entries);
  return entries
    .map((entry) => ({ entry, score: computePressure(entry, scales) }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.entry.profile.stateName.localeCompare(right.entry.profile.stateName, "en");
    });
}

export function renderIndiaMap(entries: IndiaMapStateEntry[]): string {
  const scored = rankIndiaMapEntriesByPressure(entries);
  const byCode = new Map(scored.map((s) => [s.entry.profile.stateCode, s]));
  const binByScored = assignBinsByRank(scored);

  const pathSvg = Object.keys(INDIA_STATE_PATHS)
    .map((code) => renderStatePath(code, byCode.get(resolveIndiaMapProfileCode(code)), binByScored))
    .join("\n");

  const topThree = scored.slice(0, 3);
  const topList = topThree
    .map(
      ({ entry, score }) => `<li>
        <a href="/states/${escapeHtml(entry.profile.stateSlug)}">
          <span class="india-choropleth__callout-rank" aria-hidden="true">${scoreLabel(score)}</span>
          <span class="india-choropleth__callout-name">${escapeHtml(entry.profile.stateName)}</span>
          <span class="india-choropleth__callout-meta">${formatInt(entry.stats.pendingCases)} pending · ${formatInt(entry.stats.medianCaseAgeDays)}d median age</span>
        </a>
      </li>`,
    )
    .join("");

  const stateList = [...scored]
    .sort((a, b) => a.entry.profile.stateName.localeCompare(b.entry.profile.stateName, "en"))
    .map(
      ({ entry }) =>
        `<li><a href="/states/${escapeHtml(entry.profile.stateSlug)}">${escapeHtml(entry.profile.stateName)}</a></li>`,
    )
    .join("");

  const legend = RAMP.map(
    (r) =>
      `<span class="india-choropleth__swatch" role="img" style="background:${r.stop}" aria-label="Pressure quintile: ${r.label}"></span>`,
  ).join("");

  return `
    <section class="india-choropleth" aria-label="India judicial pressure map">
      <header class="india-choropleth__head">
        <p class="india-choropleth__eyebrow">JUDICIAL PRESSURE INDEX</p>
        <h2 class="india-choropleth__hed">Where is delay piling up across India?</h2>
        <p class="india-choropleth__lede">Each published State or Union Territory is shaded by its rank on a composite index computed from published lower-court snapshots: 40% pending backlog, 30% median case age, 20% clearance shortfall, and 10% share of flagged districts. Published lower-court geographies are split into five pressure quintiles — darker red means higher pressure relative to the rest of the country. Click any shaded geography to open its published snapshot and methodology.</p>
      </header>
      <div class="india-choropleth__layout">
        <figure class="india-choropleth__frame" aria-labelledby="india-choropleth-title">
          <svg viewBox="0 0 ${INDIA_VIEWBOX.width} ${INDIA_VIEWBOX.height}" xmlns="http://www.w3.org/2000/svg" aria-labelledby="india-choropleth-title" class="india-choropleth__svg" preserveAspectRatio="xMidYMid meet">
            <title id="india-choropleth-title">India judicial pressure map — ${entries.length} lower-court geographies shaded by pressure index.</title>
            <defs>
              <pattern id="india-map-nodata" patternUnits="userSpaceOnUse" width="7" height="7">
                <rect width="7" height="7" fill="#efe9da" />
                <path d="M0,7 L7,0" stroke="#cfc8b7" stroke-width="0.8" />
              </pattern>
            </defs>
            <g class="india-choropleth__states">${pathSvg}</g>
          </svg>
          <figcaption class="india-choropleth__legend" aria-label="Legend">
            <span class="india-choropleth__legend-label">Less pressure</span>
            <span class="india-choropleth__legend-scale" role="presentation">${legend}</span>
            <span class="india-choropleth__legend-label">More pressure</span>
          </figcaption>
        </figure>
        <aside class="india-choropleth__callouts">
          <p class="india-choropleth__callouts-head">Highest pressure geographies</p>
          <ol class="india-choropleth__callouts-list">${topList}</ol>
          <details class="india-choropleth__list-toggle" id="lower-court-pages" open>
            <summary>All published lower-court geographies</summary>
            <ul class="india-choropleth__list">${stateList}</ul>
          </details>
        </aside>
      </div>
    </section>
${INDIA_MAP_CSS}
  `;
}

function resolveIndiaMapProfileCode(code: string): SupportedStateCode {
  return INDIA_MAP_PROFILE_CODE_ALIASES[code] ?? (code as SupportedStateCode);
}

function renderStatePath(
  code: string,
  scoredEntry: { entry: IndiaMapStateEntry; score: number } | undefined,
  binByScored: Map<{ entry: IndiaMapStateEntry; score: number }, number>,
): string {
  const d = INDIA_STATE_PATHS[code];
  if (!d) return "";

  if (!scoredEntry) {
    return `<path d="${d}" fill="url(#india-map-nodata)" stroke="${NODATA_STROKE}" stroke-width="0.7" class="india-choropleth__state india-choropleth__state--nodata">
      <title>No published snapshot yet.</title>
    </path>`;
  }

  const { entry, score } = scoredEntry;
  const bin = binByScored.get(scoredEntry) ?? 0;
  const fill = RAMP[bin].stop;
  const href = `/states/${entry.profile.stateSlug}`;
  const tooltip = `${entry.profile.stateName} — pressure ${scoreLabel(score)}. ${formatInt(entry.stats.pendingCases)} pending · ${formatInt(entry.stats.medianCaseAgeDays)}-day median age · ${entry.stats.disposalRate.toFixed(1)}% disposal.`;
  return `<a href="${escapeHtml(href)}" class="india-choropleth__state-link" aria-label="${escapeHtml(tooltip)}">
    <path d="${d}" fill="${fill}" stroke="${STATE_STROKE}" stroke-width="0.7" class="india-choropleth__state india-choropleth__state--live" data-pressure="${score.toFixed(2)}" />
    <title>${escapeHtml(tooltip)}</title>
  </a>`;
}

function scoreLabel(score: number): string {
  return `${Math.round(score * 100)}/100`;
}

const INDIA_MAP_CSS = `<style>
.india-choropleth {
  margin: 64px 0 80px;
}
.india-choropleth__head { margin-bottom: 28px; max-width: 72ch; }
.india-choropleth__eyebrow {
  margin: 0 0 10px;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.18em;
  color: var(--ink-muted);
}
.india-choropleth__hed {
  margin: 0 0 12px;
  font-size: clamp(26px, 3.4vw, 40px);
  letter-spacing: -0.028em;
  line-height: 1.08;
}
.india-choropleth__lede {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  color: var(--ink-soft);
  max-width: 64ch;
}

.india-choropleth__layout {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(260px, 1fr);
  gap: 40px;
  align-items: start;
}
.india-choropleth__frame {
  margin: 0;
  position: relative;
}
.india-choropleth__svg {
  display: block;
  width: 100%;
  height: auto;
  max-width: 720px;
}
.india-choropleth__state { transition: fill 140ms ease, stroke 140ms ease, filter 140ms ease; }
.india-choropleth__state-link { cursor: pointer; outline: none; }
.india-choropleth__state-link:hover .india-choropleth__state--live,
.india-choropleth__state-link:focus-visible .india-choropleth__state--live {
  stroke: var(--ink);
  stroke-width: 1.4;
  filter: brightness(1.04) saturate(1.08);
}
.india-choropleth__state-link:focus-visible {
  /* SVG focus ring is handled via stroke above; suppress the default dotted ring */
  outline: none;
}

.india-choropleth__legend {
  margin: 14px 0 0;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
.india-choropleth__legend-scale {
  display: inline-flex;
  border: 1px solid var(--rule);
}
.india-choropleth__swatch {
  display: inline-block;
  width: 28px;
  height: 14px;
}
.india-choropleth__swatch + .india-choropleth__swatch {
  border-left: 1px solid rgba(0,0,0,0.06);
}

.india-choropleth__callouts {
  border-top: 2px solid var(--ink);
  padding-top: 18px;
}
.india-choropleth__callouts-head {
  margin: 0 0 14px;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
.india-choropleth__callouts-list {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  counter-reset: pressure-rank;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.india-choropleth__callouts-list li {
  counter-increment: pressure-rank;
  border-top: 1px solid var(--rule);
}
.india-choropleth__callouts-list li:last-child { border-bottom: 1px solid var(--rule); }
.india-choropleth__callouts-list a {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 14px;
  row-gap: 2px;
  padding: 12px 2px;
  text-decoration: none;
  color: var(--ink);
  transition: background 120ms ease;
}
.india-choropleth__callouts-list a:hover { background: var(--paper-bright); }
.india-choropleth__callout-rank {
  grid-row: 1 / span 2;
  align-self: center;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
}
.india-choropleth__callout-name {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.india-choropleth__callout-meta {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px;
  color: var(--ink-muted);
  letter-spacing: 0.04em;
}

.india-choropleth__list-toggle {
  font-size: 13px;
  color: var(--ink-soft);
}
.india-choropleth__list-toggle summary {
  cursor: pointer;
  color: var(--ink-soft);
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  list-style: none;
  padding: 8px 0;
}
.india-choropleth__list-toggle summary::-webkit-details-marker { display: none; }
.india-choropleth__list {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 20px;
}
.india-choropleth__list a {
  font-size: 13.5px;
  color: var(--ink-soft);
}
.india-choropleth__list a:hover { color: var(--ink); }

@media (max-width: 900px) {
  .india-choropleth__layout {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  .india-choropleth__svg { max-width: 100%; margin-inline: auto; }
}
@media (max-width: 560px) {
  .india-choropleth__list { grid-template-columns: 1fr; }
  .india-choropleth__legend { font-size: 10px; gap: 8px; }
  .india-choropleth__swatch { width: 22px; }
}
</style>`;

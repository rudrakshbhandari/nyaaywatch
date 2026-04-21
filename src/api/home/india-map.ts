import type { NjdgStateProfile, SupportedStateCode } from "../../geographies.js";
import { escapeHtml } from "./view-model.js";

/**
 * Renders a schematic cartogram of India's states.
 * Each cell is positioned on an 11×9 CSS grid that approximates geographic
 * position. Live states (with a published NyaayWatch snapshot) are linked;
 * other states are shown as muted unlinkable cells.
 *
 * Grid is col/row oriented: [col, row], 1-indexed.
 * Columns run west→east, rows run north→south.
 */
interface StateCell {
  code: string;
  name: string;
  col: number;
  row: number;
  colSpan?: number;
}

const INDIA_CELLS: StateCell[] = [
  // Far north
  { code: "JK", name: "J&K / Ladakh", col: 3, row: 1, colSpan: 2 },
  { code: "HP", name: "Himachal Pradesh", col: 4, row: 2 },
  { code: "UK", name: "Uttarakhand", col: 5, row: 2 },
  // Northwest/North
  { code: "PB", name: "Punjab", col: 3, row: 3 },
  { code: "HR", name: "Haryana", col: 4, row: 3 },
  { code: "UP", name: "Uttar Pradesh", col: 5, row: 3, colSpan: 2 },
  // Rajasthan + Bihar belt
  { code: "RJ", name: "Rajasthan", col: 3, row: 4, colSpan: 1 },
  { code: "BR", name: "Bihar", col: 7, row: 4 },
  // Northeast cluster
  { code: "SK", name: "Sikkim", col: 8, row: 2 },
  { code: "AR", name: "Arunachal Pradesh", col: 9, row: 2, colSpan: 2 },
  { code: "AS", name: "Assam", col: 9, row: 3 },
  { code: "NL", name: "Nagaland", col: 10, row: 3 },
  { code: "ML", name: "Meghalaya", col: 8, row: 4 },
  { code: "MN", name: "Manipur", col: 10, row: 4 },
  { code: "TR", name: "Tripura", col: 9, row: 5 },
  { code: "MZ", name: "Mizoram", col: 9, row: 6 },
  // West + Central
  { code: "GJ", name: "Gujarat", col: 2, row: 5 },
  { code: "MP", name: "Madhya Pradesh", col: 4, row: 5, colSpan: 2 },
  { code: "JH", name: "Jharkhand", col: 7, row: 5 },
  { code: "WB", name: "West Bengal", col: 8, row: 5 },
  { code: "OD", name: "Odisha", col: 7, row: 6 },
  // South-central
  { code: "MH", name: "Maharashtra", col: 3, row: 6, colSpan: 2 },
  { code: "CG", name: "Chhattisgarh", col: 5, row: 6 },
  { code: "TS", name: "Telangana", col: 5, row: 7 },
  { code: "AP", name: "Andhra Pradesh", col: 6, row: 7 },
  // South
  { code: "GA", name: "Goa", col: 3, row: 7 },
  { code: "KA", name: "Karnataka", col: 4, row: 7 },
  { code: "KL", name: "Kerala", col: 3, row: 8 },
  { code: "TN", name: "Tamil Nadu", col: 4, row: 8, colSpan: 2 },
];

export function renderIndiaMap(availableStateProfiles: NjdgStateProfile[]): string {
  const liveByCode = new Map(
    availableStateProfiles.map((p) => [p.stateCode, p]),
  );

  const cells = INDIA_CELLS.map((cell) => {
    const profile = liveByCode.get(cell.code as SupportedStateCode);
    const isLive = Boolean(profile);
    const colSpan = cell.colSpan ?? 1;
    const gridColumn = colSpan > 1 ? `${cell.col} / span ${colSpan}` : String(cell.col);
    const href = profile ? `/states/${profile.stateSlug}` : null;
    const tag = href ? "a" : "span";
    const attrs = href ? ` href="${escapeHtml(href)}"` : "";
    const liveClass = isLive ? " map__cell--live" : " map__cell--dim";

    return `<${tag}${attrs} class="map__cell${liveClass}" style="grid-column:${gridColumn};grid-row:${cell.row}" ${href ? "" : 'tabindex="0" aria-label="' + escapeHtml(cell.name) + ' — not yet published"'}>
      <span class="map__cell-code">${escapeHtml(cell.code)}</span>
      <span class="map__cell-name">${escapeHtml(cell.name)}</span>
    </${tag}>`;
  }).join("\n");

  const liveList = availableStateProfiles
    .slice()
    .sort((a, b) => a.stateName.localeCompare(b.stateName, "en"))
    .map(
      (p) => `<li><a href="/states/${escapeHtml(p.stateSlug)}">${escapeHtml(p.stateName)}</a></li>`,
    )
    .join("");

  return `
    <section class="india-map" aria-label="India state map — live states are linked">
      <header class="india-map__head">
        <p class="india-map__eyebrow">BROWSE BY STATE</p>
        <h2 class="india-map__hed">Where has NyaayWatch published?</h2>
        <p class="india-map__lede">Shaded cells have a published snapshot. Click through to that state's district workspace.</p>
      </header>
      <div class="map__grid" role="group" aria-label="State cells">
        ${cells}
      </div>
      <details class="india-map__list-toggle">
        <summary>View as list</summary>
        <ul class="india-map__list">${liveList}</ul>
      </details>
    </section>
${INDIA_MAP_CSS}
  `;
}

const INDIA_MAP_CSS = `<style>
.india-map {
  margin: 64px 0 80px;
}
.india-map__head { margin-bottom: 28px; }
.india-map__eyebrow {
  margin: 0 0 10px;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.18em;
  color: var(--ink-muted);
}
.india-map__hed { margin: 0 0 10px; font-size: clamp(22px, 3vw, 34px); letter-spacing: -0.025em; }
.india-map__lede { margin: 0; font-size: 14px; color: var(--ink-soft); max-width: 56ch; }

.map__grid {
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  grid-template-rows: repeat(8, auto);
  gap: 4px;
  max-width: 780px;
}
.map__cell {
  display: flex; flex-direction: column; justify-content: center; align-items: flex-start;
  padding: 7px 8px 6px;
  border: 1px solid var(--rule);
  background: var(--paper);
  text-decoration: none;
  min-height: 52px;
  transition: background 120ms, border-color 120ms;
}
.map__cell--live {
  border-color: var(--ink);
  background: var(--paper-bright);
  cursor: pointer;
}
.map__cell--live:hover, .map__cell--live:focus-visible {
  background: var(--accent);
  border-color: var(--accent-dark);
}
.map__cell--live:hover .map__cell-code,
.map__cell--live:hover .map__cell-name,
.map__cell--live:focus-visible .map__cell-code,
.map__cell--live:focus-visible .map__cell-name {
  color: var(--paper);
}
.map__cell--dim { opacity: 0.35; cursor: default; }
.map__cell-code {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--ink);
  text-transform: uppercase;
}
.map__cell-name {
  font-size: 9px; font-weight: 500;
  color: var(--ink-muted);
  line-height: 1.2;
  margin-top: 2px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 100%;
}
.india-map__list-toggle {
  margin-top: 20px;
  font-size: 13px;
  color: var(--ink-soft);
}
.india-map__list-toggle summary {
  cursor: pointer; color: var(--ink-soft);
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.12em;
  list-style: none;
}
.india-map__list-toggle summary::-webkit-details-marker { display: none; }
.india-map__list {
  margin: 12px 0 0; padding: 0;
  list-style: none;
  display: flex; flex-wrap: wrap; gap: 8px 20px;
}
.india-map__list li a { font-size: 14px; color: var(--ink-soft); }
.india-map__list li a:hover { color: var(--ink); }

@media (max-width: 640px) {
  .map__grid { grid-template-columns: repeat(6, 1fr); max-width: 100%; }
  .map__cell { min-height: 44px; padding: 5px 6px; }
  .map__cell-code { font-size: 10px; }
  .map__cell-name { display: none; }
}
</style>`;

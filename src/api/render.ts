import type { DistrictSnapshot, PublishedSnapshot } from "../domain/snapshot-schema.js";
import type {
  DistrictHistoryPoint,
  SnapshotHistoryEntry,
} from "../services/published-snapshot-service.js";
import { escapeHtml } from "../lib/html.js";

type DistrictSort = "rank" | "backlog" | "disposal" | "age" | "gap";
type DistrictView = "all" | "flagged";

export interface DistrictsPageOptions {
  search: string;
  sort: DistrictSort;
  view: DistrictView;
}

const SORT_LABELS: Record<DistrictSort, string> = {
  rank: "Highest backlog rank",
  backlog: "Backlog volume",
  disposal: "Lowest disposal rate",
  age: "Oldest median age",
  gap: "Largest filing-disposal gap",
};

const VIEW_LABELS: Record<DistrictView, string> = {
  all: "All districts",
  flagged: "Flagged signals only",
};

export function renderLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f7f1e7;
        --ink: #1f2b24;
        --muted: #5b645e;
        --panel: #fffaf2;
        --panel-strong: #fff4df;
        --accent: #8c3d19;
        --accent-soft: rgba(140, 61, 25, 0.12);
        --line: #d7cab6;
        --warning: #9f5b00;
        --warning-bg: #fff1d6;
        --ok: #24553a;
        --ok-bg: #eaf6ee;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        background:
          radial-gradient(circle at top, rgba(140, 61, 25, 0.14), transparent 35%),
          linear-gradient(180deg, rgba(255, 250, 242, 0.8), rgba(247, 241, 231, 0.98)),
          var(--bg);
        color: var(--ink);
      }
      main {
        max-width: 1120px;
        margin: 0 auto;
        padding: 32px 16px 64px;
      }
      header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 24px;
      }
      nav {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      nav a, .action-links a, .pill-link {
        color: var(--accent);
        text-decoration: none;
      }
      h1, h2, h3, p {
        margin-top: 0;
      }
      .lede {
        font-size: 1.15rem;
        max-width: 720px;
        line-height: 1.55;
      }
      .trust-strip, .card, table, .callout, .controls, .status-banner {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 18px;
        box-shadow: 0 10px 30px rgba(31, 43, 36, 0.06);
      }
      .trust-strip, .card, .callout, .controls, .status-banner {
        padding: 18px;
      }
      .grid {
        display: grid;
        gap: 16px;
      }
      .stats {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        margin: 24px 0;
      }
      .split {
        grid-template-columns: 2fr 1fr;
        align-items: start;
      }
      .muted {
        color: var(--muted);
      }
      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.78rem;
        color: var(--muted);
        margin-bottom: 10px;
      }
      .badge-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 12px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 5px 10px;
        font-size: 0.85rem;
        background: var(--accent-soft);
        color: var(--accent);
      }
      .badge.complete {
        background: var(--ok-bg);
        color: var(--ok);
      }
      .badge.stale, .badge.partial {
        background: var(--warning-bg);
        color: var(--warning);
      }
      .status-banner {
        margin-top: 18px;
      }
      .status-banner.complete {
        background: var(--ok-bg);
        border-color: rgba(36, 85, 58, 0.18);
      }
      .status-banner.stale, .status-banner.partial {
        background: var(--warning-bg);
        border-color: rgba(159, 91, 0, 0.18);
      }
      .controls {
        margin: 20px 0 24px;
      }
      .controls form {
        display: grid;
        grid-template-columns: 1.3fr repeat(2, minmax(160px, 220px)) auto;
        gap: 12px;
        align-items: end;
      }
      label {
        display: grid;
        gap: 6px;
        font-size: 0.92rem;
      }
      input, select, button {
        font: inherit;
        border-radius: 12px;
        border: 1px solid var(--line);
        padding: 10px 12px;
        background: #fffdf9;
        color: var(--ink);
      }
      button {
        cursor: pointer;
        background: var(--accent);
        border-color: var(--accent);
        color: white;
      }
      .meta-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .meta-grid .card h3 {
        margin-bottom: 8px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        overflow: hidden;
      }
      th, td {
        text-align: left;
        padding: 14px 16px;
        border-bottom: 1px solid var(--line);
        vertical-align: top;
      }
      th {
        font-size: 0.78rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
      }
      td small {
        color: var(--muted);
        display: block;
        margin-top: 4px;
        line-height: 1.45;
      }
      .chart-list, .download-list, .citation-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .chart-list li, .download-list li, .citation-list li {
        padding: 10px 0;
        border-bottom: 1px solid var(--line);
      }
      .download-list a {
        font-weight: bold;
      }
      .history-bars {
        display: grid;
        gap: 10px;
      }
      .history-row {
        display: grid;
        gap: 6px;
      }
      .history-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .bar-track {
        width: 100%;
        height: 12px;
        border-radius: 999px;
        background: rgba(31, 43, 36, 0.08);
        overflow: hidden;
      }
      .bar-fill {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, #8c3d19, #bd6b3b);
      }
      .inline-note {
        font-size: 0.9rem;
        color: var(--muted);
      }
      .action-links {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 14px;
      }
      code {
        font-family: "SFMono-Regular", "SF Mono", Consolas, monospace;
        font-size: 0.95em;
      }
      @media (max-width: 860px) {
        .split {
          grid-template-columns: 1fr;
        }
        .controls form {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 720px) {
        table, thead, tbody, th, td, tr {
          display: block;
        }
        thead {
          display: none;
        }
        tr {
          border-bottom: 1px solid var(--line);
        }
        td {
          padding-top: 10px;
          padding-bottom: 10px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      ${body}
    </main>
  </body>
</html>`;
}

export function renderHomePage(snapshot: PublishedSnapshot): string {
  const stats = [
    ["Pending cases", snapshot.stats.pendingCases.toLocaleString("en-IN")],
    ["Disposal rate", `${snapshot.stats.disposalRate.toFixed(1)}%`],
    ["Median case age", `${snapshot.stats.medianCaseAgeDays} days`],
    ["Flagged districts", String(snapshot.stats.flaggedDistricts)],
  ];
  const flagged = snapshot.districts.slice(0, 3);

  return renderLayout(
    "NyaayWatch",
    `
      <header>
        <div>
          <h1>NyaayWatch</h1>
          <p class="lede">See how slow justice is, district by district, using a published Himachal Pradesh snapshot with stored evidence, visible caveats, and reproducible public exports.</p>
        </div>
        <nav>
          <a href="/districts">Districts</a>
          <a href="/data">Data</a>
          <a href="/methodology">Methodology</a>
          <a href="/api">API Docs</a>
        </nav>
      </header>
      ${renderTrustStrip(snapshot.snapshot)}
      ${renderTrustStatus(snapshot.snapshot)}
      <section class="grid stats">
        ${stats
          .map(
            ([label, value]) =>
              `<article class="card"><div class="muted">${escapeHtml(label)}</div><h2>${escapeHtml(value)}</h2><p class="inline-note">Published snapshot only. No partial run data is mixed into this view.</p></article>`,
          )
          .join("")}
      </section>
      <section class="grid split">
        <div class="grid">
          <article>
            <div class="eyebrow">District workspace preview</div>
            <h2>Scan the main Himachal ranking surface</h2>
            <p class="inline-note">The homepage only previews the ranking. Use the district workspace for full scanning, search, and alternate urgency sorts.</p>
            ${renderDistrictTable(snapshot.districts.slice(0, 6))}
            <p class="action-links">
              <a href="/districts">Open the full district index</a>
              <a href="/data/districts.csv">Download the statewide CSV</a>
            </p>
          </article>
        </div>
        <div class="grid">
          <article class="callout">
            <div class="eyebrow">Flagged signals</div>
            <h2>Districts that deserve closer inspection</h2>
            ${flagged
              .map(
                (district) => `<p><strong><a href="/districts/${escapeHtml(district.districtId)}">${escapeHtml(
                  district.districtName,
                )}</a></strong><br />${escapeHtml(district.summary)}</p>`,
              )
              .join("")}
          </article>
          <article class="callout">
            <div class="eyebrow">Statewide trend</div>
            <h2>Published backlog trend</h2>
            <ul class="chart-list">
              ${snapshot.trends
                .map(
                  (point) =>
                    `<li><strong>${escapeHtml(formatDate(point.snapshotDate))}</strong><br /><span class="muted">${point.pendingCases.toLocaleString(
                      "en-IN",
                    )} pending, ${point.disposalRate.toFixed(1)}% disposal rate</span></li>`,
                )
                .join("")}
            </ul>
          </article>
        </div>
      </section>
    `,
  );
}

export function renderDistrictsPage(snapshot: PublishedSnapshot, options: DistrictsPageOptions): string {
  const districts = filterAndSortDistricts(snapshot.districts, options, snapshot.stats.flaggedDistricts);
  const highestBacklog = [...snapshot.districts].sort((left, right) => right.backlogCases - left.backlogCases)[0];
  const lowestDisposal = [...snapshot.districts].sort((left, right) => left.disposalRate - right.disposalRate)[0];

  return renderLayout(
    "NyaayWatch Districts",
    `
      <header>
        <div>
          <h1>District workspace</h1>
          <p class="lede">Use this page as the main Himachal Pradesh district-browsing surface. Sort by urgency signal, search by district name, and open a district permalink for citation-ready detail.</p>
        </div>
        <nav>
          <a href="/">Overview</a>
          <a href="/data">Data</a>
          <a href="/methodology">Methodology</a>
        </nav>
      </header>
      ${renderTrustStrip(snapshot.snapshot)}
      ${renderTrustStatus(snapshot.snapshot)}
      <section class="meta-grid">
        <article class="card">
          <div class="muted">Showing</div>
          <h2>${districts.length} of ${snapshot.districts.length}</h2>
          <p class="inline-note">${escapeHtml(VIEW_LABELS[options.view])}${options.search ? ` matching "${escapeHtml(options.search)}"` : ""}.</p>
        </article>
        <article class="card">
          <div class="muted">Flagged districts</div>
          <h2>${snapshot.stats.flaggedDistricts}</h2>
          <p class="inline-note">These are the strongest current snapshot flags for closer inspection.</p>
        </article>
        <article class="card">
          <div class="muted">Highest backlog</div>
          <h2>${escapeHtml(highestBacklog?.districtName ?? "N/A")}</h2>
          <p class="inline-note">${highestBacklog ? `${highestBacklog.backlogCases.toLocaleString("en-IN")} pending cases.` : "No district data."}</p>
        </article>
        <article class="card">
          <div class="muted">Lowest disposal rate</div>
          <h2>${escapeHtml(lowestDisposal?.districtName ?? "N/A")}</h2>
          <p class="inline-note">${lowestDisposal ? `${lowestDisposal.disposalRate.toFixed(1)}% in this published snapshot.` : "No district data."}</p>
        </article>
      </section>
      ${renderDistrictControls(options)}
      <article class="callout">
        <div class="eyebrow">Current ranking mode</div>
        <h2>${escapeHtml(SORT_LABELS[options.sort])}</h2>
        <p class="inline-note">All rows come from the latest published snapshot. Historical context and citation surfaces live on the district permalink pages.</p>
      </article>
      ${districts.length > 0 ? renderDistrictTable(districts) : renderNoResults(options)}
    `,
  );
}

export function renderDistrictPage(
  snapshot: PublishedSnapshot["snapshot"],
  district: DistrictSnapshot,
  history: DistrictHistoryPoint[],
): string {
  const currentIndex = history.findIndex(
    (point) => point.snapshotDate === snapshot.sourceSnapshotAt && point.publishedAt === snapshot.publishedAt,
  );
  const currentPoint = currentIndex >= 0 ? history[currentIndex] : history[history.length - 1] ?? null;
  const previousPoint =
    currentIndex > 0 ? history[currentIndex - 1] : history.length > 1 ? history[history.length - 2] : null;
  const backlogDelta = currentPoint && previousPoint ? currentPoint.backlogCases - previousPoint.backlogCases : null;
  const disposalDelta = currentPoint && previousPoint ? roundDelta(currentPoint.disposalRate - previousPoint.disposalRate) : null;
  const rankDelta = currentPoint && previousPoint ? previousPoint.rank - currentPoint.rank : null;

  return renderLayout(
    `${district.districtName} | NyaayWatch`,
    `
      <header>
        <div>
          <h1>${escapeHtml(district.districtName)}</h1>
          <p class="lede">${escapeHtml(district.summary)}</p>
        </div>
        <nav>
          <a href="/">Overview</a>
          <a href="/districts">Districts</a>
          <a href="/data">Data</a>
        </nav>
      </header>
      ${renderTrustStrip(snapshot)}
      ${renderTrustStatus(snapshot)}
      <section class="grid stats">
        <article class="card"><div class="muted">Backlog rank</div><h2>#${district.rank}</h2><p class="inline-note">${formatRankDelta(rankDelta)}</p></article>
        <article class="card"><div class="muted">Backlog cases</div><h2>${district.backlogCases.toLocaleString("en-IN")}</h2><p class="inline-note">${formatNumericDelta(backlogDelta, "cases versus the prior published snapshot")}</p></article>
        <article class="card"><div class="muted">Disposal rate</div><h2>${district.disposalRate.toFixed(1)}%</h2><p class="inline-note">${formatDeltaWithUnit(disposalDelta, "percentage points versus the prior published snapshot")}</p></article>
        <article class="card"><div class="muted">Median age</div><h2>${district.medianAgeDays} days</h2><p class="inline-note">Estimated from published age-bucket totals, not case-level records.</p></article>
      </section>
      <section class="grid split">
        <div class="grid">
          <article class="callout">
            <div class="eyebrow">Flagged explanation</div>
            <h2>Why this district stands out</h2>
            <p>${escapeHtml(district.flagReason)}</p>
            <p class="muted">Filing versus disposal gap: ${district.filingVsDisposalGap.toFixed(1)} percentage points in the latest published snapshot.</p>
          </article>
          <article class="callout">
            <div class="eyebrow">Historical context</div>
            <h2>Published district history</h2>
            <p class="inline-note">This table only includes previously published snapshots, so it stays inside the public trust boundary.</p>
            ${renderDistrictHistoryBars(history)}
            ${renderDistrictHistoryTable(history)}
          </article>
        </div>
        <div class="grid">
          <article class="callout">
            <div class="eyebrow">Cite and export</div>
            <h2>Durable citation surface</h2>
            <ul class="citation-list">
              <li><strong>Permalink</strong><br /><code>/districts/${escapeHtml(district.districtId)}</code></li>
              <li><strong>Source snapshot date</strong><br />${escapeHtml(formatDate(snapshot.sourceSnapshotAt))}</li>
              <li><strong>Methodology version</strong><br />${escapeHtml(snapshot.methodologyVersion)}</li>
              <li><strong>Source attribution</strong><br />${escapeHtml(snapshot.sourceAttribution)}</li>
            </ul>
            <p class="action-links">
              <a href="/data/districts/${escapeHtml(district.districtId)}.csv">Download district history CSV</a>
              <a href="/data/districts.csv">Download statewide CSV</a>
            </p>
          </article>
          <article class="callout">
            <div class="eyebrow">Caveats</div>
            <h2>How to read this page</h2>
            <p>District signals are descriptive flags from the current published snapshot. They do not assign responsibility, explain intent, or guarantee that upstream court records have already refreshed.</p>
            <p class="muted">If the freshness state turns stale, this page continues serving the last operator-published snapshot rather than unpublished or partial data.</p>
          </article>
        </div>
      </section>
    `,
  );
}

export function renderDataPage(snapshot: PublishedSnapshot): string {
  return renderLayout(
    "Data | NyaayWatch",
    `
      <header>
        <div>
          <h1>Data downloads</h1>
          <p class="lede">Download the same published snapshot that powers the public UI, or reproduce it through the API. No export on this page reads unpublished run data.</p>
        </div>
        <nav>
          <a href="/">Overview</a>
          <a href="/districts">Districts</a>
          <a href="/methodology">Methodology</a>
          <a href="/api">API Docs</a>
        </nav>
      </header>
      ${renderTrustStrip(snapshot.snapshot)}
      ${renderTrustStatus(snapshot.snapshot)}
      <section class="meta-grid">
        <article class="card">
          <div class="muted">District rows</div>
          <h2>${snapshot.districts.length}</h2>
          <p class="inline-note">One row per district in the active Himachal published snapshot.</p>
        </article>
        <article class="card">
          <div class="muted">CSV/API parity</div>
          <h2>Aligned</h2>
          <p class="inline-note">The statewide CSV mirrors the district fields used by <code>GET /v1/districts</code>, plus snapshot metadata columns.</p>
        </article>
        <article class="card">
          <div class="muted">Public trust boundary</div>
          <h2>Published only</h2>
          <p class="inline-note">If a newer run is incomplete, these downloads remain pinned to the last safe publication.</p>
        </article>
      </section>
      <section class="grid split">
        <article class="callout">
          <div class="eyebrow">Downloads</div>
          <h2>Available files</h2>
          <ul class="download-list">
            <li><a href="/data/districts.csv">Statewide district CSV</a><br /><span class="muted">Includes per-district metrics plus source snapshot, methodology version, freshness, and source attribution columns.</span></li>
            <li><a href="/api">API reference</a><br /><span class="muted">Use <code>GET /v1/stats/himachal</code>, <code>GET /v1/districts</code>, and <code>GET /v1/trends</code> for machine-readable access.</span></li>
          </ul>
          <p class="inline-note">District-specific history CSVs are linked from each district permalink page.</p>
        </article>
        <article class="callout">
          <div class="eyebrow">Export caveats</div>
          <h2>What these files do and do not contain</h2>
          <p>These exports contain normalized snapshot read-model fields only. Raw capture bundles and operator evidence artifacts stay outside the public download boundary.</p>
          <p class="muted">Use the methodology page for formula details and the district pages for citation-ready narrative context.</p>
        </article>
      </section>
    `,
  );
}

export function renderMethodologyPage(
  snapshot: PublishedSnapshot["snapshot"] | null,
  history: SnapshotHistoryEntry[],
): string {
  return renderLayout(
    "Methodology | NyaayWatch",
    `
      <header>
        <div>
          <h1>Methodology</h1>
          <p class="lede">Every public number in NyaayWatch is served from a stored published snapshot. Operators may capture newer runs privately, but the public surface stays pinned to the latest safe publication until a publish action succeeds.</p>
        </div>
        <nav>
          <a href="/">Overview</a>
          <a href="/districts">Districts</a>
          <a href="/data">Data</a>
          <a href="/api">API Docs</a>
        </nav>
      </header>
      ${snapshot ? renderTrustStrip(snapshot) : ""}
      ${snapshot ? renderTrustStatus(snapshot) : ""}
      <section class="grid">
        <article class="callout">
          <div class="eyebrow">Scope and semantics</div>
          <h2>Alpha scope</h2>
          <p>Himachal Pradesh only. NyaayWatch is snapshot-based and evidence-first. It publishes dated aggregates after operator review and keeps unpublished run state private.</p>
          <p class="muted">Historical context is built from prior published snapshots, not from raw captured pages shown directly to the public.</p>
        </article>
        <article class="callout">
          <div class="eyebrow">Formulas</div>
          <h2>How the public metrics are derived</h2>
          <ul class="download-list">
            <li><strong>Pending cases</strong><br /><span class="muted">Taken from the NJDG aggregated total cases figure for the source snapshot date.</span></li>
            <li><strong>Disposal rate</strong><br /><span class="muted">Calculated as disposed last month divided by instituted last month, expressed as a percentage.</span></li>
            <li><strong>Median case age</strong><br /><span class="muted">Estimated from NJDG age-bucket totals by identifying the bucket containing the midpoint of pending cases and mapping that bucket to a representative day count.</span></li>
            <li><strong>Flagged district signals</strong><br /><span class="muted">Districts are ranked by backlog volume, with supporting age and filing-disposal gap context used to explain why a district is surfaced.</span></li>
          </ul>
        </article>
        <article class="callout">
          <div class="eyebrow">Quality and freshness</div>
          <h2>State meanings</h2>
          <ul class="download-list">
            <li><strong>Complete</strong><br /><span class="muted">All expected Himachal districts were captured and normalized for the source snapshot.</span></li>
            <li><strong>Stale</strong><br /><span class="muted">The latest published snapshot is older than the freshness threshold. It remains visible because it is safer than showing unpublished or partial data.</span></li>
            <li><strong>Partial</strong><br /><span class="muted">An incomplete run state. Partial runs are blocked from public publish and should not appear on public metric surfaces.</span></li>
          </ul>
        </article>
        <article class="callout">
          <div class="eyebrow">Storage and publish boundary</div>
          <h2>Why the public surface is reproducible</h2>
          <p>Canonical run state, publication history, and immutable published snapshot payloads are stored in PostgreSQL. Raw scrape inputs and replayable evidence artifacts are stored in S3. Public pages read only from the active publication pointer.</p>
          <p class="muted">This lets operators fetch, inspect, publish, replay, and rollback while keeping the public product pinned to a dated, auditable snapshot.</p>
        </article>
        <article class="callout">
          <div class="eyebrow">Change history</div>
          <h2>Published methodology and snapshot lineage</h2>
          ${history.length > 0 ? renderMethodologyHistoryTable(history) : "<p class=\"muted\">No published snapshot history is available yet.</p>"}
        </article>
      </section>
    `,
  );
}

export function renderApiPage(): string {
  return renderLayout(
    "API | NyaayWatch",
    `
      <header>
        <div>
          <h1>API</h1>
          <p class="lede">The API mirrors the latest published snapshot. There is no richer hidden state than the public trust surface supports.</p>
        </div>
        <nav>
          <a href="/">Overview</a>
          <a href="/data">Data</a>
          <a href="/methodology">Methodology</a>
        </nav>
      </header>
      <article class="callout">
        <h2>Endpoints</h2>
        <p><code>GET /v1/stats/himachal</code></p>
        <p><code>GET /v1/districts</code></p>
        <p><code>GET /v1/trends</code></p>
      </article>
    `,
  );
}

export function renderEmptyState(title: string, message: string): string {
  return renderLayout(
    title,
    `
      <header>
        <div>
          <h1>${escapeHtml(title)}</h1>
          <p class="lede">${escapeHtml(message)}</p>
        </div>
      </header>
    `,
  );
}

function renderTrustStrip(snapshot: PublishedSnapshot["snapshot"]): string {
  return `
    <section class="trust-strip">
      <div class="eyebrow">Published trust metadata</div>
      <strong>${escapeHtml(snapshot.stateName)} published snapshot</strong>
      <div class="muted">
        Source snapshot: ${escapeHtml(formatDate(snapshot.sourceSnapshotAt))} |
        Published: ${escapeHtml(formatDate(snapshot.publishedAt))} |
        Methodology: ${escapeHtml(snapshot.methodologyVersion)} |
        Freshness: ${snapshot.freshnessDays} day(s) |
        Source: ${escapeHtml(snapshot.sourceAttribution)}
      </div>
      <div class="badge-row">
        <span class="badge ${escapeHtml(snapshot.qualityState)}">${escapeHtml(snapshot.qualityState)} quality state</span>
        <span class="badge">Himachal only</span>
        <span class="badge">Published read model</span>
      </div>
    </section>
  `;
}

function renderTrustStatus(snapshot: PublishedSnapshot["snapshot"]): string {
  const message =
    snapshot.qualityState === "stale"
      ? `This public surface is serving a stale but previously published snapshot from ${escapeHtml(formatDate(snapshot.sourceSnapshotAt))}. It remains visible so the site never falls through to partial unpublished data.`
      : snapshot.qualityState === "partial"
        ? "This snapshot is marked partial. Public trust surfaces should treat it as incomplete until a full publish replaces it."
        : `This public surface is showing the latest safe published snapshot from ${escapeHtml(formatDate(snapshot.sourceSnapshotAt))} after operator review.`;

  return `
    <section class="status-banner ${escapeHtml(snapshot.qualityState)}">
      <strong>Freshness and quality state</strong>
      <p class="inline-note">${message}</p>
    </section>
  `;
}

function renderDistrictControls(options: DistrictsPageOptions): string {
  return `
    <section class="controls">
      <form method="get" action="/districts">
        <label>
          Search districts
          <input type="search" name="q" value="${escapeHtml(options.search)}" placeholder="Search district name or summary" />
        </label>
        <label>
          View
          <select name="view">
            ${renderSelectedOption("all", options.view, "All districts")}
            ${renderSelectedOption("flagged", options.view, "Flagged signals only")}
          </select>
        </label>
        <label>
          Sort by
          <select name="sort">
            ${renderSelectedOption("rank", options.sort, "Highest backlog rank")}
            ${renderSelectedOption("backlog", options.sort, "Backlog volume")}
            ${renderSelectedOption("disposal", options.sort, "Lowest disposal rate")}
            ${renderSelectedOption("age", options.sort, "Oldest median age")}
            ${renderSelectedOption("gap", options.sort, "Largest filing-disposal gap")}
          </select>
        </label>
        <button type="submit">Apply</button>
      </form>
      <p class="action-links">
        <a href="/districts">Reset filters</a>
        <a href="${escapeHtml(buildDistrictsHref({ ...options, view: "flagged" }))}">Flagged-only view</a>
        <a href="/data/districts.csv">Download statewide CSV</a>
      </p>
    </section>
  `;
}

function renderDistrictTable(districts: DistrictSnapshot[]): string {
  return `
    <table>
      <thead>
        <tr>
          <th>District</th>
          <th>Rank</th>
          <th>Backlog</th>
          <th>Disposal rate</th>
          <th>Median age</th>
          <th>Gap</th>
          <th>Flag signal</th>
        </tr>
      </thead>
      <tbody>
        ${districts
          .map(
            (district) => `
              <tr>
                <td><a href="/districts/${escapeHtml(district.districtId)}">${escapeHtml(district.districtName)}</a><small>${escapeHtml(
                  district.summary,
                )}</small></td>
                <td>#${district.rank}</td>
                <td>${district.backlogCases.toLocaleString("en-IN")}</td>
                <td>${district.disposalRate.toFixed(1)}%</td>
                <td>${district.medianAgeDays} days</td>
                <td>${district.filingVsDisposalGap.toFixed(1)} pp</td>
                <td>${escapeHtml(district.flagReason)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderDistrictHistoryBars(history: DistrictHistoryPoint[]): string {
  const maxBacklog = Math.max(...history.map((point) => point.backlogCases), 1);
  return `
    <div class="history-bars">
      ${history
        .map((point) => {
          const width = Math.max(6, Math.round((point.backlogCases / maxBacklog) * 100));
          return `
            <div class="history-row">
              <div class="history-head">
                <strong>${escapeHtml(formatDate(point.snapshotDate))}</strong>
                <span class="muted">${point.backlogCases.toLocaleString("en-IN")} pending | ${point.disposalRate.toFixed(1)}% disposal</span>
              </div>
              <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderDistrictHistoryTable(history: DistrictHistoryPoint[]): string {
  return `
    <table>
      <thead>
        <tr>
          <th>Snapshot</th>
          <th>Rank</th>
          <th>Backlog</th>
          <th>Disposal rate</th>
          <th>Median age</th>
          <th>Quality</th>
        </tr>
      </thead>
      <tbody>
        ${history
          .map(
            (point) => `
              <tr>
                <td>${escapeHtml(formatDate(point.snapshotDate))}<small>Published ${escapeHtml(
                  formatDate(point.publishedAt),
                )} | ${escapeHtml(point.methodologyVersion)}</small></td>
                <td>#${point.rank}</td>
                <td>${point.backlogCases.toLocaleString("en-IN")}</td>
                <td>${point.disposalRate.toFixed(1)}%</td>
                <td>${point.medianAgeDays} days</td>
                <td>${escapeHtml(point.qualityState)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderMethodologyHistoryTable(history: SnapshotHistoryEntry[]): string {
  return `
    <table>
      <thead>
        <tr>
          <th>Source snapshot</th>
          <th>Published</th>
          <th>Methodology</th>
          <th>Quality</th>
          <th>Pending cases</th>
          <th>Flagged districts</th>
        </tr>
      </thead>
      <tbody>
        ${history
          .map(
            (entry) => `
              <tr>
                <td>${escapeHtml(formatDate(entry.snapshot.sourceSnapshotAt))}</td>
                <td>${escapeHtml(formatDate(entry.snapshot.publishedAt))}</td>
                <td>${escapeHtml(entry.snapshot.methodologyVersion)}</td>
                <td>${escapeHtml(entry.snapshot.qualityState)}</td>
                <td>${entry.stats.pendingCases.toLocaleString("en-IN")}</td>
                <td>${entry.stats.flaggedDistricts}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderNoResults(options: DistrictsPageOptions): string {
  return `
    <article class="callout">
      <h2>No districts match this view</h2>
      <p class="inline-note">Try clearing the search term or switching back from ${escapeHtml(VIEW_LABELS[options.view].toLowerCase())}.</p>
      <p class="action-links"><a href="/districts">Reset the district workspace</a></p>
    </article>
  `;
}

function filterAndSortDistricts(
  districts: DistrictSnapshot[],
  options: DistrictsPageOptions,
  flaggedCount: number,
): DistrictSnapshot[] {
  const search = options.search.trim().toLowerCase();
  const filtered = districts.filter((district) => {
    const matchesView = options.view === "all" || district.rank <= flaggedCount;
    const matchesSearch =
      search.length === 0 ||
      district.districtName.toLowerCase().includes(search) ||
      district.summary.toLowerCase().includes(search);

    return matchesView && matchesSearch;
  });

  return filtered.sort((left, right) => compareDistricts(left, right, options.sort));
}

function compareDistricts(left: DistrictSnapshot, right: DistrictSnapshot, sort: DistrictSort) {
  if (sort === "backlog") {
    return right.backlogCases - left.backlogCases || left.rank - right.rank;
  }

  if (sort === "disposal") {
    return left.disposalRate - right.disposalRate || left.rank - right.rank;
  }

  if (sort === "age") {
    return right.medianAgeDays - left.medianAgeDays || left.rank - right.rank;
  }

  if (sort === "gap") {
    return right.filingVsDisposalGap - left.filingVsDisposalGap || left.rank - right.rank;
  }

  return left.rank - right.rank;
}

function renderSelectedOption(value: string, current: string, label: string) {
  return `<option value="${escapeHtml(value)}"${value === current ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

function buildDistrictsHref(options: DistrictsPageOptions): string {
  const params = new URLSearchParams();
  if (options.search) {
    params.set("q", options.search);
  }
  if (options.view !== "all") {
    params.set("view", options.view);
  }
  if (options.sort !== "rank") {
    params.set("sort", options.sort);
  }

  const query = params.toString();
  return query ? `/districts?${query}` : "/districts";
}

function formatDate(value: string) {
  return value.slice(0, 10);
}

function formatNumericDelta(value: number | null, suffix: string) {
  if (value === null) {
    return "No earlier published district snapshot is available yet.";
  }
  if (value === 0) {
    return `No change ${suffix}.`;
  }

  const direction = value > 0 ? "Up" : "Down";
  return `${direction} ${Math.abs(value).toLocaleString("en-IN")} ${suffix}.`;
}

function formatDeltaWithUnit(value: number | null, suffix: string) {
  if (value === null) {
    return "No earlier published district snapshot is available yet.";
  }
  if (value === 0) {
    return `No change ${suffix}.`;
  }

  const direction = value > 0 ? "Up" : "Down";
  return `${direction} ${Math.abs(value).toFixed(1)} ${suffix}.`;
}

function formatRankDelta(value: number | null) {
  if (value === null) {
    return "No earlier published district snapshot is available yet.";
  }
  if (value === 0) {
    return "Rank unchanged versus the prior published snapshot.";
  }

  return value > 0
    ? `Moved up ${value} place(s) versus the prior published snapshot.`
    : `Moved down ${Math.abs(value)} place(s) versus the prior published snapshot.`;
}

function roundDelta(value: number) {
  return Math.round(value * 10) / 10;
}

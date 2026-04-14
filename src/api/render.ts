import type { DistrictSnapshot, PublishedSnapshot } from "../domain/snapshot-schema.js";
import { escapeHtml } from "../lib/html.js";

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
        --accent: #8c3d19;
        --line: #d7cab6;
      }
      body {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        background:
          radial-gradient(circle at top, rgba(140, 61, 25, 0.12), transparent 40%),
          var(--bg);
        color: var(--ink);
      }
      main {
        max-width: 1080px;
        margin: 0 auto;
        padding: 32px 16px 56px;
      }
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 24px;
      }
      nav a, .action-links a {
        color: var(--accent);
        text-decoration: none;
        margin-right: 12px;
      }
      .lede {
        font-size: 1.2rem;
        max-width: 680px;
      }
      .trust-strip, .card, table, .callout {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 18px;
        box-shadow: 0 10px 30px rgba(31, 43, 36, 0.06);
      }
      .trust-strip, .card, .callout {
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
      table {
        width: 100%;
        border-collapse: collapse;
        overflow: hidden;
      }
      th, td {
        text-align: left;
        padding: 14px 16px;
        border-bottom: 1px solid var(--line);
      }
      th {
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
      }
      td small {
        color: var(--muted);
        display: block;
        margin-top: 4px;
      }
      .muted {
        color: var(--muted);
      }
      .chart-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .chart-list li {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 0;
        border-bottom: 1px solid var(--line);
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
          <p class="lede">See how slow justice is, district by district, using a published Himachal Pradesh snapshot with stored evidence and explicit caveats.</p>
        </div>
        <nav>
          <a href="/districts">Districts</a>
          <a href="/methodology">Methodology</a>
          <a href="/data/districts.csv">CSV Download</a>
          <a href="/api">API Docs</a>
        </nav>
      </header>
      ${renderTrustStrip(snapshot.snapshot)}
      <section class="grid stats">
        ${stats
          .map(
            ([label, value]) => `<article class="card"><div class="muted">${escapeHtml(label)}</div><h2>${escapeHtml(value)}</h2></article>`,
          )
          .join("")}
      </section>
      <section class="grid" style="grid-template-columns: 2fr 1fr;">
        <div>
          <h2>District ranking</h2>
          ${renderDistrictTable(snapshot.districts.slice(0, 6))}
          <p class="action-links"><a href="/districts">Open the full district index</a></p>
        </div>
        <div class="grid">
          <article class="callout">
            <h2>Flagged signals</h2>
            ${flagged
              .map(
                (district) => `<p><strong><a href="/districts/${escapeHtml(district.districtId)}">${escapeHtml(
                  district.districtName,
                )}</a></strong><br />${escapeHtml(district.summary)}</p>`,
              )
              .join("")}
          </article>
          <article class="callout">
            <h2>Backlog trend</h2>
            <ul class="chart-list">
              ${snapshot.trends
                .map(
                  (point) =>
                    `<li><span>${escapeHtml(point.snapshotDate.slice(0, 10))}</span><span>${point.pendingCases.toLocaleString("en-IN")} pending</span></li>`,
                )
                .join("")}
            </ul>
          </article>
        </div>
      </section>
    `,
  );
}

export function renderDistrictsPage(snapshot: PublishedSnapshot): string {
  return renderLayout(
    "NyaayWatch Districts",
    `
      <header>
        <div>
          <h1>District index</h1>
          <p class="lede">This index is derived from the latest published snapshot only. It does not expose partial run data.</p>
        </div>
        <nav>
          <a href="/">Overview</a>
          <a href="/methodology">Methodology</a>
          <a href="/data/districts.csv">CSV Download</a>
        </nav>
      </header>
      ${renderTrustStrip(snapshot.snapshot)}
      ${renderDistrictTable(snapshot.districts)}
    `,
  );
}

export function renderDistrictPage(snapshot: PublishedSnapshot, district: DistrictSnapshot): string {
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
          <a href="/data/districts.csv">CSV Download</a>
        </nav>
      </header>
      ${renderTrustStrip(snapshot.snapshot)}
      <section class="grid stats">
        <article class="card"><div class="muted">Backlog rank</div><h2>#${district.rank}</h2></article>
        <article class="card"><div class="muted">Backlog cases</div><h2>${district.backlogCases.toLocaleString("en-IN")}</h2></article>
        <article class="card"><div class="muted">Disposal rate</div><h2>${district.disposalRate.toFixed(1)}%</h2></article>
        <article class="card"><div class="muted">Median age</div><h2>${district.medianAgeDays} days</h2></article>
      </section>
      <article class="callout">
        <h2>Why this district is flagged</h2>
        <p>${escapeHtml(district.flagReason)}</p>
        <p class="muted">Filing vs disposal gap: ${district.filingVsDisposalGap.toFixed(1)} percentage points.</p>
      </article>
    `,
  );
}

export function renderMethodologyPage(snapshot: PublishedSnapshot["snapshot"] | null): string {
  return renderLayout(
    "Methodology | NyaayWatch",
    `
      <header>
        <div>
          <h1>Methodology</h1>
          <p class="lede">Every public number is served from a stored published snapshot. Run state and publish history live in PostgreSQL. Raw evidence inputs live in S3.</p>
        </div>
        <nav>
          <a href="/">Overview</a>
          <a href="/districts">Districts</a>
          <a href="/api">API Docs</a>
        </nav>
      </header>
      ${snapshot ? renderTrustStrip(snapshot) : ""}
      <section class="grid">
        <article class="callout">
          <h2>Scope</h2>
          <p>Himachal Pradesh only. NyaayWatch is snapshot-based and evidence-first. It does not make live, predictive, or legal-analysis claims.</p>
        </article>
        <article class="callout">
          <h2>Storage boundary</h2>
          <p>Canonical run state, published snapshots, and publication history are stored in PostgreSQL. Raw scrape inputs and replayable evidence artifacts are stored in S3 under isolated nyaaywatch-prefixed buckets in ap-south-1.</p>
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
      <strong>Published snapshot</strong>
      <div class="muted">
        Source snapshot: ${escapeHtml(snapshot.sourceSnapshotAt.slice(0, 10))} |
        Published: ${escapeHtml(snapshot.publishedAt.slice(0, 10))} |
        Methodology: ${escapeHtml(snapshot.methodologyVersion)} |
        Quality: ${escapeHtml(snapshot.qualityState)} |
        Freshness: ${snapshot.freshnessDays} day(s) |
        Source: ${escapeHtml(snapshot.sourceAttribution)}
      </div>
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
          <th>Flag</th>
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
                <td>${escapeHtml(district.flagReason)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

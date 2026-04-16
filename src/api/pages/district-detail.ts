import type { DistrictSnapshot, PublishedSnapshot } from "../../domain/snapshot-schema.js";
import type { DistrictHistoryPoint } from "../../services/published-snapshot-service.js";
import { escapeHtml } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";
import { infoIcon, renderBadge, renderSectionHead, renderStatTile } from "../design/ui.js";
import { formatDate } from "../home/view-model.js";

/**
 * /districts/:id — district evidence page. Pairs the headline stats with the
 * published history of the same district, citation metadata, and caveats so
 * the page stands on its own as a citeable unit. Every number here is also
 * available on the district CSV export linked in the sidebar.
 */
export function renderDistrictPage(
  snapshot: PublishedSnapshot["snapshot"],
  district: DistrictSnapshot,
  history: DistrictHistoryPoint[],
): string {
  const currentIndex = history.findIndex(
    (point) =>
      point.snapshotDate === snapshot.sourceSnapshotAt && point.publishedAt === snapshot.publishedAt,
  );
  const currentPoint = currentIndex >= 0 ? history[currentIndex] : history[history.length - 1] ?? null;
  const previousPoint =
    currentIndex > 0
      ? history[currentIndex - 1]
      : history.length > 1
        ? history[history.length - 2]
        : null;
  const backlogDelta = currentPoint && previousPoint ? currentPoint.backlogCases - previousPoint.backlogCases : null;
  const disposalDelta =
    currentPoint && previousPoint ? roundDelta(currentPoint.disposalRate - previousPoint.disposalRate) : null;
  const rankDelta = currentPoint && previousPoint ? previousPoint.rank - currentPoint.rank : null;

  const typicalWaitMonths = Math.round(district.medianAgeDays / 30);

  const body = `
    <section class="district-hero">
      <div class="district-hero__crumb">
        <a href="/districts">\u2190 All districts</a>
        ${renderBadge({ label: `Watch rank #${district.rank}`, tone: "accent" })}
      </div>
      <p class="district-hero__eyebrow">DISTRICT EVIDENCE</p>
      <h1 class="district-hero__hed">${escapeHtml(district.districtName)}</h1>
      <p class="district-hero__lede">${escapeHtml(district.summary)}</p>
    </section>

    <section class="stat-grid">
      ${renderStatTile({
        label: "Cases waiting",
        value: district.backlogCases.toLocaleString("en-IN"),
        infoKey: "backlog",
        note: formatNumericDelta(backlogDelta, "vs. prior published snapshot"),
        tone: "accent",
      })}
      ${renderStatTile({
        label: "Cleared per 100",
        value: district.disposalRate.toFixed(1),
        infoKey: "clearance",
        note: formatDeltaWithUnit(disposalDelta, "percentage points vs. prior snapshot"),
      })}
      ${renderStatTile({
        label: "Typical wait",
        value: `~${typicalWaitMonths}`,
        unit: "mo",
        infoKey: "typicalWait",
        note: "Middle of the local pile, estimated from published age buckets.",
      })}
      ${renderStatTile({
        label: "Watch rank",
        value: `#${district.rank}`,
        note: formatRankDelta(rankDelta),
        tone: "flag",
      })}
    </section>

    <section class="district-grid">
      <div class="district-col">
        <article class="card">
          <header class="card__head">
            <p class="card__eyebrow">WHY IT IS FLAGGED</p>
            <h3>What this district is telling us</h3>
          </header>
          <p>${escapeHtml(district.flagReason)}</p>
          <p class="card__meta">File-clear gap ${infoIcon("fileClearGap")}: <strong>${district.filingVsDisposalGap >= 0 ? "+" : "\u2212"}${Math.abs(district.filingVsDisposalGap).toFixed(1)}</strong> percentage points in the latest published snapshot.</p>
        </article>

        <article class="card">
          <header class="card__head">
            <p class="card__eyebrow">HISTORICAL CONTEXT</p>
            <h3>Published district history</h3>
          </header>
          <p>Every row is a previously published snapshot for ${escapeHtml(district.districtName)}. This page never shows unpublished or partial runs.</p>
          ${renderHistoryBars(history)}
          ${renderHistoryTable(history)}
        </article>
      </div>

      <aside class="district-col district-col--aside">
        <article class="card">
          <header class="card__head">
            <p class="card__eyebrow">CITE AND EXPORT</p>
            <h3>Durable citation surface</h3>
          </header>
          <dl class="citation-list">
            <div><dt>Permalink</dt><dd><code>/districts/${escapeHtml(district.districtId)}</code></dd></div>
            <div><dt>Source snapshot</dt><dd>${escapeHtml(formatDate(snapshot.sourceSnapshotAt))}</dd></div>
            <div><dt>Methodology</dt><dd><code>${escapeHtml(snapshot.methodologyVersion)}</code></dd></div>
            <div><dt>Source</dt><dd>${escapeHtml(snapshot.sourceAttribution)}</dd></div>
          </dl>
          <div class="district-col__cta">
            <a class="btn btn--primary btn--small" href="/data/districts/${escapeHtml(district.districtId)}.csv">Download district history CSV</a>
            <a class="btn btn--ghost btn--small" href="/data/districts.csv">Statewide CSV</a>
          </div>
        </article>

        <article class="card">
          <header class="card__head">
            <p class="card__eyebrow">HOW TO READ THIS PAGE</p>
            <h3>Caveats</h3>
          </header>
          <p>District signals are descriptive flags from the current published snapshot. They do not assign responsibility, explain intent, or guarantee that upstream court records have already refreshed.</p>
          <p>If freshness turns stale, this page stays pinned to the last operator-published snapshot instead of slipping into unpublished or partial data.</p>
        </article>
      </aside>
    </section>
  `;

  return renderPageShell({
    title: `${district.districtName} — NyaayWatch`,
    body,
    activeNav: "districts",
    ticker: `HIMACHAL PRADESH · ${escapeHtml(district.districtName.toUpperCase())} · ${escapeHtml(formatDate(snapshot.sourceSnapshotAt))}`,
    pageCss: DISTRICT_PAGE_CSS,
    footer: {
      sourceDateLabel: formatDate(snapshot.sourceSnapshotAt),
      methodologyVersion: snapshot.methodologyVersion,
      sourceAttribution: snapshot.sourceAttribution,
    },
  });
}

function renderHistoryBars(history: DistrictHistoryPoint[]): string {
  if (history.length === 0) {
    return "";
  }
  const max = Math.max(...history.map((point) => point.backlogCases), 1);
  const rows = history
    .map((point) => {
      const width = Math.max(6, Math.round((point.backlogCases / max) * 100));
      return `
        <li class="history-row">
          <span class="history-row__label">${escapeHtml(formatDate(point.snapshotDate))}</span>
          <span class="history-row__bar"><span style="width: ${width}%"></span></span>
          <span class="history-row__value">${point.backlogCases.toLocaleString("en-IN")}</span>
        </li>
      `;
    })
    .join("");
  return `<ol class="history-bars" aria-label="Published backlog history">${rows}</ol>`;
}

function renderHistoryTable(history: DistrictHistoryPoint[]): string {
  if (history.length === 0) {
    return `<p class="card__meta">No earlier published snapshots are available yet.</p>`;
  }
  const rows = history
    .map(
      (point) => `
        <tr>
          <td>
            <strong>${escapeHtml(formatDate(point.snapshotDate))}</strong>
            <small>Published ${escapeHtml(formatDate(point.publishedAt))} · <code>${escapeHtml(point.methodologyVersion)}</code></small>
          </td>
          <td class="num">#${point.rank}</td>
          <td class="num">${point.backlogCases.toLocaleString("en-IN")}</td>
          <td class="num">${point.disposalRate.toFixed(1)}</td>
          <td class="num">${Math.round(point.medianAgeDays / 30)} mo</td>
          <td>${escapeHtml(point.qualityState)}</td>
        </tr>
      `,
    )
    .join("");
  return `
    <div class="history-table-wrap">
      <table class="data-table history-table">
        <thead>
          <tr>
            <th>Snapshot</th>
            <th>Rank</th>
            <th>Cases waiting</th>
            <th>Cleared / 100</th>
            <th>Typical wait</th>
            <th>Quality</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function formatNumericDelta(value: number | null, suffix: string): string {
  if (value === null) {
    return "No earlier published snapshot yet.";
  }
  if (value === 0) {
    return `No change ${suffix}.`;
  }
  const direction = value > 0 ? "\u25B2" : "\u25BC";
  return `${direction} ${Math.abs(value).toLocaleString("en-IN")} ${suffix}.`;
}

function formatDeltaWithUnit(value: number | null, suffix: string): string {
  if (value === null) {
    return "No earlier published snapshot yet.";
  }
  if (value === 0) {
    return `No change ${suffix}.`;
  }
  const direction = value > 0 ? "\u25B2" : "\u25BC";
  return `${direction} ${Math.abs(value).toFixed(1)} ${suffix}.`;
}

function formatRankDelta(value: number | null): string {
  if (value === null) {
    return "No earlier published rank yet.";
  }
  if (value === 0) {
    return "Rank unchanged vs. prior snapshot.";
  }
  return value > 0
    ? `Moved up ${value} place${value === 1 ? "" : "s"} vs. prior.`
    : `Moved down ${Math.abs(value)} place${Math.abs(value) === 1 ? "" : "s"} vs. prior.`;
}

function roundDelta(value: number): number {
  return Math.round(value * 10) / 10;
}

const DISTRICT_PAGE_CSS = `
  .district-hero { padding: 32px 0 40px; max-width: 900px; }
  .district-hero__crumb {
    display: flex; align-items: center; gap: 14px;
    margin: 0 0 20px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px; font-weight: 600;
    letter-spacing: 0.1em;
  }
  .district-hero__crumb a { color: var(--ink-soft); text-decoration: none; text-transform: uppercase; }
  .district-hero__crumb a:hover { color: var(--accent); }
  .district-hero__eyebrow {
    margin: 0 0 12px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.18em;
    color: var(--accent);
  }
  .district-hero__hed {
    margin: 0 0 18px;
    font-size: clamp(44px, 6.2vw, 80px);
    line-height: 0.98; letter-spacing: -0.035em;
  }
  .district-hero__lede {
    margin: 0; font-size: clamp(17px, 1.6vw, 20px);
    color: var(--ink-soft); font-weight: 500; line-height: 1.5;
    max-width: 60ch;
  }

  .district-grid {
    display: grid; grid-template-columns: 1.6fr 1fr; gap: 28px;
    margin-bottom: 80px;
  }
  .district-col { display: flex; flex-direction: column; gap: 20px; }

  .card__head { margin: 0 0 12px; }
  .card__eyebrow {
    margin: 0 0 4px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--accent);
  }
  .card__meta { margin: 12px 0 0; font-size: 13px; color: var(--ink-muted); }
  .card__meta strong { color: var(--ink); font-variant-numeric: lining-nums tabular-nums; }

  .citation-list { margin: 0 0 18px; padding: 0; display: grid; gap: 10px; }
  .citation-list > div { display: grid; grid-template-columns: 120px 1fr; gap: 10px; align-items: baseline; border-top: 1px dashed var(--rule); padding-top: 8px; }
  .citation-list > div:first-child { border-top: none; padding-top: 0; }
  .citation-list dt {
    margin: 0;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.12em;
    color: var(--ink-muted);
  }
  .citation-list dd { margin: 0; font-size: 14px; color: var(--ink); word-break: break-word; }
  .district-col__cta { display: flex; flex-wrap: wrap; gap: 8px; }

  .history-bars { margin: 10px 0 18px; padding: 0; list-style: none; }
  .history-row {
    display: grid; grid-template-columns: 130px 1fr 100px;
    gap: 14px; align-items: center; padding: 8px 0;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px; font-weight: 500;
  }
  .history-row__label { color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.08em; }
  .history-row__bar { display: block; height: 10px; background: var(--rule-soft); position: relative; }
  .history-row__bar > span { display: block; height: 100%; background: var(--accent); }
  .history-row__value { text-align: right; font-variant-numeric: lining-nums tabular-nums; color: var(--ink); font-weight: 600; }

  .history-table-wrap { overflow-x: auto; }
  .history-table small { display: block; margin-top: 2px; color: var(--ink-muted); font-size: 11px; font-weight: 500; }

  @media (max-width: 960px) {
    .district-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 720px) {
    .history-row { grid-template-columns: 84px 1fr 72px; gap: 10px; font-size: 11px; }
  }
`;

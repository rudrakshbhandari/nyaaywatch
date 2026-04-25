import type { DistrictSnapshot, PublishedSnapshot } from "../../domain/snapshot-schema.js";
import type { DistrictHistoryPoint } from "../../services/published-snapshot-service.js";
import { escapeHtml, safeJsonForHtmlScript } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";
import type { PublicPageContext } from "../public-state.js";
import { infoIcon, renderBadge, renderSectionHead, renderStatTile } from "../design/ui.js";
import { formatDate } from "../home/view-model.js";
import { SITE_ORIGIN } from "../share/site-origin.js";

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
  context: PublicPageContext,
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
  const plainCitation = buildPlainCitation(
    district.districtName,
    snapshot.sourceAttribution,
    formatDate(snapshot.sourceSnapshotAt),
    `${SITE_ORIGIN}${context.routes.district(district.districtId)}`,
  );
  const citationsJson = safeJsonForHtmlScript({
    plain: plainCitation,
    apa: `NyaayWatch. (${new Date(snapshot.sourceSnapshotAt).getFullYear()}). ${district.districtName} district court backlog. ${snapshot.sourceAttribution}. ${SITE_ORIGIN}${context.routes.district(district.districtId)}`,
    mla: `NyaayWatch. "${district.districtName} District Court Backlog." ${snapshot.sourceAttribution}, ${formatDate(snapshot.sourceSnapshotAt)}, ${SITE_ORIGIN}${context.routes.district(district.districtId)}.`,
  });
  const structuredDataJson = safeJsonForHtmlScript({
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": `${district.districtName} District Court Backlog Data — NyaayWatch`,
    "description": `Published court backlog, disposal rate, and pending case data for ${district.districtName} district courts in ${snapshot.stateName}. Source: ${snapshot.sourceAttribution}. Methodology: ${snapshot.methodologyVersion}.`,
    "url": `${SITE_ORIGIN}${context.routes.district(district.districtId)}`,
    "creator": { "@type": "Organization", "name": "NyaayWatch", "url": SITE_ORIGIN },
    "datePublished": snapshot.publishedAt,
    "dateModified": snapshot.publishedAt,
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "isAccessibleForFree": true,
    "distribution": [
      {
        "@type": "DataDownload",
        "encodingFormat": "text/csv",
        "contentUrl": `${SITE_ORIGIN}${context.routes.districtCsv(district.districtId)}`,
      },
    ],
  });

  const body = `
    <section class="district-hero">
      <div class="district-hero__crumb">
        <a href="${context.routes.districts}">\u2190 All districts</a>
        ${renderBadge({ label: `Watch rank #${district.rank}`, tone: "accent" })}
      </div>
      <p class="district-hero__eyebrow">DISTRICT EVIDENCE</p>
      <h1 class="district-hero__hed">${escapeHtml(district.districtName)}</h1>
      <p class="district-hero__lede">${escapeHtml(district.summary)}</p>
    </section>

    <section class="stat-grid" id="district-overview">
      ${renderStatTile({
        label: "Cases waiting",
        value: district.backlogCases.toLocaleString("en-IN"),
        infoKey: "backlog",
        note: formatNumericDelta(backlogDelta, "vs. prior published snapshot"),
        tone: "accent",
        methodologyHref: `${context.routes.methodology}#metric-backlog`,
        anchorId: "stat-backlog",
      })}
      ${renderStatTile({
        label: "Cleared per 100",
        value: district.disposalRate.toFixed(1),
        infoKey: "clearance",
        note: formatDeltaWithUnit(disposalDelta, "percentage points vs. prior snapshot"),
        methodologyHref: `${context.routes.methodology}#metric-clearance`,
        anchorId: "stat-clearance",
      })}
      ${renderStatTile({
        label: "Typical wait",
        value: `~${typicalWaitMonths}`,
        unit: "mo",
        infoKey: "typicalWait",
        note: "Middle of the local backlog, estimated from published age buckets.",
        methodologyHref: `${context.routes.methodology}#metric-typical-wait`,
        anchorId: "stat-typical-wait",
      })}
      ${renderStatTile({
        label: "Watch rank",
        value: `#${district.rank}`,
        note: formatRankDelta(rankDelta),
        tone: "flag",
        methodologyHref: `${context.routes.methodology}#metric-watchlist`,
        anchorId: "stat-rank",
      })}
    </section>

    ${renderWaitingClock(typicalWaitMonths, district.districtName)}

    <section class="district-grid">
      <div class="district-col">
        <article class="card" id="district-flag">
          <header class="card__head">
            <p class="card__eyebrow">WHY IT IS FLAGGED</p>
            <h3>What this district is telling us</h3>
          </header>
          <p>${escapeHtml(district.flagReason)}</p>
          <p class="card__meta">File-clear gap ${infoIcon("fileClearGap")}: <strong>${district.filingVsDisposalGap >= 0 ? "+" : "\u2212"}${Math.abs(district.filingVsDisposalGap).toFixed(1)}</strong> percentage points in the latest data.</p>
        </article>

        <article class="card" id="district-history">
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
        <article class="card" id="district-citation">
          <header class="card__head">
            <p class="card__eyebrow">CITE AND EXPORT</p>
            <h3>A link you can cite</h3>
          </header>
          <dl class="citation-list">
            <div><dt>Permalink</dt><dd><code>${escapeHtml(context.routes.district(district.districtId))}</code></dd></div>
            <div><dt>Source snapshot</dt><dd>${escapeHtml(formatDate(snapshot.sourceSnapshotAt))}</dd></div>
            <div><dt>Methodology</dt><dd><code>${escapeHtml(snapshot.methodologyVersion)}</code></dd></div>
            <div><dt>Source</dt><dd>${escapeHtml(snapshot.sourceAttribution)}</dd></div>
          </dl>
          <div class="cite-block">
            <p class="cite-block__label">Cite this page</p>
            <div class="cite-block__row">
              <label class="cite-block__fmt-label" for="cite-select">Format</label>
              <select id="cite-select" class="cite-block__select" onchange="updateCite(this.value)">
                <option value="plain">Plain</option>
                <option value="apa">APA</option>
                <option value="mla">MLA</option>
              </select>
            </div>
            <pre id="cite-text" class="cite-block__pre">${escapeHtml(plainCitation)}</pre>
            <button class="btn btn--ghost btn--small cite-block__copy" onclick="copyCite()">Copy</button>
          </div>
          <div class="district-col__cta">
            <a class="btn btn--primary btn--small" href="${context.routes.districtCsv(district.districtId)}">Download district history CSV</a>
            <a class="btn btn--ghost btn--small" href="${context.routes.districtsCsv}">${escapeHtml(context.lowerCourtCopy.aggregateAdjectiveTitle)} CSV</a>
            <a class="btn btn--ghost btn--small" href="https://wa.me/?text=${encodeURIComponent(`${district.districtName} has ${district.backlogCases.toLocaleString("en-IN")} cases waiting. Typical wait: ~${typicalWaitMonths} months. Clearance rate: ${district.disposalRate.toFixed(0)} per 100 filed. — NyaayWatch ${SITE_ORIGIN}${context.routes.district(district.districtId)}`)}" rel="noopener noreferrer" target="_blank">Share on WhatsApp</a>
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

    <script>
    (function() {
      var CITES = ${citationsJson};
      window.updateCite = function(fmt) {
        var t = fmt === "apa" ? CITES.apa : fmt === "mla" ? CITES.mla : CITES.plain;
        document.getElementById("cite-text").textContent = t;
      };
      window.copyCite = function() {
        var btn = document.querySelector(".cite-block__copy");
        var reset = function() {
          setTimeout(function() {
            btn.textContent = "Copy";
            btn.classList.remove("is-copied");
            btn.classList.remove("is-error");
          }, 2000);
        };
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          btn.textContent = "Copy unavailable";
          btn.classList.add("is-error");
          reset();
          return;
        }
        navigator.clipboard.writeText(document.getElementById("cite-text").textContent).then(function() {
          btn.textContent = "Copied";
          btn.classList.add("is-copied");
          reset();
        }, function() {
          btn.textContent = "Copy failed";
          btn.classList.add("is-error");
          reset();
        });
      };
    })();
    </script>

    <div class="colophon-print">
      <strong>NyaayWatch</strong> · ${escapeHtml(district.districtName)} district evidence ·
      Source: ${escapeHtml(snapshot.sourceAttribution)} ·
      Snapshot: ${escapeHtml(formatDate(snapshot.sourceSnapshotAt))} ·
      Methodology: ${escapeHtml(snapshot.methodologyVersion)} ·
      nyaaywatch.in${escapeHtml(context.routes.district(district.districtId))}
    </div>

    <script type="application/ld+json">${structuredDataJson}</script>
  `;

  const ogDescription = `${district.districtName} has ${district.backlogCases.toLocaleString("en-IN")} cases waiting. The typical case has been waiting about ${typicalWaitMonths} months. Clearance rate: ${district.disposalRate.toFixed(0)} per 100 filed. — NyaayWatch`;

  return renderPageShell({
    title: `${district.districtName} — NyaayWatch`,
    body,
    activeNav: "districts",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    stateLinks: context.stateLinks,
    ticker: `${escapeHtml(snapshot.stateName.toUpperCase())} · SNAPSHOT ${escapeHtml(formatDate(snapshot.sourceSnapshotAt))} · ${escapeHtml(snapshot.methodologyVersion)}`,
    pageCss: DISTRICT_PAGE_CSS,
    footer: {
      sourceDateLabel: formatDate(snapshot.sourceSnapshotAt),
      methodologyVersion: snapshot.methodologyVersion,
      sourceAttribution: snapshot.sourceAttribution,
    },
    og: {
      title: `${district.districtName} — District Evidence`,
      description: ogDescription,
      image: `${SITE_ORIGIN}/og/district/${district.districtId}.png`,
      imageAlt: `NyaayWatch district evidence for ${district.districtName}`,
    },
  });
}

function renderWaitingClock(months: number, districtName: string): string {
  const capped = Math.min(months, 48);
  // Fit squares into a tight grid: single-row when ≤12 months so a district
  // with a 3-month wait doesn't show 3 dots lost in a 12-column sea of space.
  const gridCols = Math.min(capped, 12);
  const isSingleRow = capped <= 12;
  const squares = Array.from({ length: capped }, (_, i) =>
    `<span class="wc__sq" aria-hidden="true" style="animation-delay:${(i * 30)}ms"></span>`
  ).join("");
  const axisLabels = isSingleRow ? "" : `
        <div class="wc__label-col" aria-hidden="true">
          <span class="wc__axis-label">0</span>
          <span class="wc__axis-label wc__axis-label--mid">${Math.round(capped / 2)}</span>
          <span class="wc__axis-label wc__axis-label--end">${capped}</span>
        </div>`;
  return `
    <section class="waiting-clock" id="waiting-clock" aria-label="Waiting Clock for ${escapeHtml(districtName)}">
      <div class="waiting-clock__inner">${axisLabels}
        <div class="wc__grid" style="grid-template-columns: repeat(${gridCols}, 8px);">${squares}</div>
        <div class="wc__caption">
          <span class="wc__caption__value">~${months}</span>
          <span class="wc__caption__unit">months</span>
          <span class="wc__caption__label">Each square = one month the middle of the backlog has been waiting</span>
        </div>
      </div>
    </section>
  `;
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

function buildPlainCitation(
  districtName: string,
  sourceAttribution: string,
  snapshotDate: string,
  permalink: string,
): string {
  return `NyaayWatch. "${districtName} District Court Backlog." ${snapshotDate}. ${sourceAttribution}. ${permalink}`;
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

  .waiting-clock {
    margin: 0 0 40px;
    padding: 28px 0;
    border-top: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
  }
  .waiting-clock__inner { display: flex; align-items: flex-start; gap: 16px; }
  .wc__label-col {
    display: flex; flex-direction: column; justify-content: space-between;
    height: 100%; padding: 0; min-width: 24px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 9px; color: var(--ink-muted); font-weight: 500;
    text-align: right;
  }
  .wc__axis-label { line-height: 1; }
  .wc__axis-label--mid { margin: auto 0; }
  .wc__axis-label--end { }
  .wc__grid {
    display: grid;
    grid-template-columns: repeat(12, 8px);
    grid-auto-rows: 8px;
    gap: 2px;
    flex-shrink: 0;
  }
  .wc__sq {
    display: block;
    width: 8px; height: 8px;
    background: var(--accent);
    opacity: 0;
    animation: wc-fade-in 0.3s ease forwards;
  }
  @keyframes wc-fade-in {
    from { opacity: 0; transform: scale(0.6); }
    to { opacity: 1; transform: scale(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .wc__sq { animation: none; opacity: 1; }
  }
  .wc__caption {
    display: flex; flex-direction: column; gap: 4px; justify-content: flex-start;
    padding-top: 2px;
  }
  .wc__caption__value {
    font-size: 48px; font-weight: 800; line-height: 1; letter-spacing: -0.04em; color: var(--ink);
  }
  .wc__caption__unit {
    font-size: 14px; font-weight: 600; color: var(--ink-muted); font-family: "IBM Plex Mono", ui-monospace, monospace;
    text-transform: uppercase; letter-spacing: 0.1em;
  }
  .wc__caption__label {
    font-size: 12px; color: var(--ink-muted); font-weight: 500;
    max-width: 20ch; line-height: 1.45;
  }

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
  @media print {
    /* District-specific print: base print rules in styles.ts handle nav,
       colophon, button hiding, URL footnotes, and page-break behavior.
       Here we only collapse the aside (Caveats are already in the text)
       and re-flow the two-column district grid into one column. */
    .district-col--aside .card:last-child { display: none !important; }
    .district-hero { padding: 0 0 14pt; }
    .district-hero__hed { font-size: 30pt; line-height: 1; }
    .district-hero__lede { font-size: 12pt; }
    .district-grid { grid-template-columns: 1fr; gap: 10pt; }
    .history-table-wrap { overflow: visible; }
    .history-bars { page-break-inside: avoid; }
  }

  .cite-block { margin: 14px 0 18px; }
  .cite-block__label {
    margin: 0 0 8px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--accent);
  }
  .cite-block__row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .cite-block__fmt-label { font-size: 12px; color: var(--ink-muted); font-family: "IBM Plex Mono", ui-monospace, monospace; }
  .cite-block__select {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px; padding: 3px 8px;
    border: 1px solid var(--rule); background: var(--paper);
    color: var(--ink); border-radius: 2px;
  }
  .cite-block__pre {
    margin: 0 0 10px; padding: 12px;
    background: var(--rule-soft);
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px; color: var(--ink);
    white-space: pre-wrap; word-break: break-word;
    border: 1px solid var(--rule); border-radius: 2px;
    line-height: 1.6;
  }
  .cite-block__copy.is-copied { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  .cite-block__copy.is-error { color: var(--accent-dark); border-color: var(--accent-dark); }
`;

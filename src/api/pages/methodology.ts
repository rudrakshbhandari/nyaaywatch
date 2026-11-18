import type { PublishedSnapshot } from "../../domain/snapshot-schema.js";
import type { PublicationHistoryEntry } from "../../services/published-snapshot-service.js";
import { escapeHtml } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";
import type { PublicPageContext } from "../public-state.js";
import { renderAnchorLink, renderSectionHead } from "../design/ui.js";
import { formatDate } from "../home/view-model.js";
import { dedupeLineageByReferenceDate } from "./lineage-dedup.js";

/**
 * /methodology — the contract with the reader. Explains what the numbers
 * mean, where they come from, what is deliberately not shown (unpublished or
 * partial runs), and the chronological lineage of published snapshots.
 */
export function renderMethodologyPage(
  snapshot: PublishedSnapshot["snapshot"] | null,
  history: PublicationHistoryEntry[],
  context: PublicPageContext,
): string {
  const ticker = snapshot
    ? `${escapeHtml(snapshot.stateName.toUpperCase())} · METHODOLOGY ${escapeHtml(snapshot.methodologyVersion)}`
    : `${escapeHtml(context.profile.stateName.toUpperCase())} · METHODOLOGY`;

  const body = `
    ${renderSectionHead({
      eyebrow: "HOW THE NUMBERS ARE BUILT",
      headline: "Public figures come from reviewed snapshots.",
      lede:
        "The site shows the latest reviewed publication. Each number carries its reference date and methodology version. When NJDG does not provide a source date, the reference date is when the page was captured.",
      isHero: true,
    })}

    <section class="method">
      ${renderSectionHead({ headline: "What's covered" })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>Current public scope</h3>
          <p>${escapeHtml(context.publicScopeDescription)} The site publishes dated aggregates after review. Unpublished data stays private.</p>
          <p>Earlier published snapshots provide historical context. Raw source pages are not public.</p>
        </article>
        <article class="card">
          <h3>What the site does not do</h3>
          <p>The site reports aggregate counts. It does not predict outcomes, rank officials, or assign blame.</p>
          <p>If a newer run fails review, the site keeps showing the last reviewed publication.</p>
        </article>
      </div>
    </section>

    <section class="method" id="metric-contract">
      ${renderSectionHead({ headline: "How the public metrics are derived" })}
      <div class="card-grid card-grid--2">
        <article class="card" id="metric-backlog">
          ${renderAnchorLink("metric-backlog", "Cases waiting")}
          <h3>Cases waiting</h3>
          <p>Taken directly from the NJDG aggregate total for the source snapshot date. It counts everything still open, including both recently filed and long-pending cases.</p>
        </article>
        <article class="card" id="metric-clearance">
          ${renderAnchorLink("metric-clearance", "Cases cleared per 100 filed")}
          <h3>Cases cleared per 100 filed</h3>
          <p>Calculated as cases disposed last month divided by cases filed last month, expressed per 100. Above 100 means the system cleared more than it took in that month; below 100 means the backlog grew.</p>
        </article>
        <article class="card" id="metric-typical-wait">
          ${renderAnchorLink("metric-typical-wait", "Typical wait")}
          <h3>Typical wait</h3>
          <p>Estimated from NJDG age-bucket totals by finding the midpoint of pending cases and mapping that bucket to a representative day count. It is a district-level estimate of the middle of the backlog, not the age of any single case.</p>
        </article>
        <article class="card" id="metric-watchlist">
          ${renderAnchorLink("metric-watchlist", "Districts to watch")}
          <h3>Districts to watch</h3>
          <p>Districts are ranked by queue size, then annotated with waiting-time and file-clear-gap context so a reader can see why a district rose. This list is a signal for closer inspection, not a finding about any court or official.</p>
        </article>
        <article class="card" id="metric-old-case-burden">
          ${renderAnchorLink("metric-old-case-burden", "Old-case burden")}
          <h3>Old-case burden</h3>
          <p>Calculated from the same NJDG age buckets used for the typical-wait estimate. The 3-year, 5-year, and 10-year shares show how much of the pending load is already old.</p>
        </article>
        <article class="card" id="metric-backlog-movement">
          ${renderAnchorLink("metric-backlog-movement", "Backlog movement")}
          <h3>Backlog movement as share of pending load</h3>
          <p>Calculated as cases filed last month minus cases cleared last month, divided by pending cases. This makes monthly growth or shrinkage easier to read across differently sized districts and geographies.</p>
        </article>
        <article class="card" id="metric-break-even-clearances">
          ${renderAnchorLink("metric-break-even-clearances", "Break-even clearances")}
          <h3>Break-even clearances</h3>
          <p>Calculated as the extra clearances needed last month to keep the backlog from growing. If clearances already matched or exceeded filings, this value is zero.</p>
        </article>
        <article class="card" id="metric-catch-up-burden">
          ${renderAnchorLink("metric-catch-up-burden", "Catch-up burden")}
          <h3>10% reduction scenario</h3>
          <p>A scenario metric, not a forecast. It estimates the extra clearances per month needed to reduce the pending load by 10% over 12 months while also covering last month's filing-clearance gap.</p>
        </article>
        <article class="card" id="metric-watchlist-persistence">
          ${renderAnchorLink("metric-watchlist-persistence", "Watchlist persistence")}
          <h3>Watchlist persistence</h3>
          <p>Counts how often the same district appeared among the clearest pressure signals in the recent published snapshot history. Repeated pressure is more serious than a one-snapshot spike, but it remains a signal for inspection.</p>
        </article>
        <article class="card" id="metric-backlog-concentration">
          ${renderAnchorLink("metric-backlog-concentration", "Backlog concentration")}
          <h3>Backlog concentration</h3>
          <p>Shows how much of a geography's pending load sits in the largest district queues. A concentrated backlog points to a different public question than a backlog spread evenly across districts.</p>
        </article>
      </div>
    </section>

    <section class="method" id="quality-states">
      ${renderSectionHead({ headline: "Quality and freshness states" })}
      <div class="card-grid card-grid--3">
        <article class="card" id="quality-complete">
          ${renderAnchorLink("quality-complete", "Complete quality state")}
          <h3>Complete</h3>
          <p>All expected districts for this ${escapeHtml(context.lowerCourtCopy.geographyLabelLower)} were captured and normalized for the source snapshot.</p>
        </article>
        <article class="card" id="quality-stale">
          ${renderAnchorLink("quality-stale", "Stale quality state")}
          <h3>Stale</h3>
          <p>The latest published snapshot is older than the freshness threshold. It remains visible because it is safer than showing unpublished or partial data.</p>
        </article>
        <article class="card" id="quality-partial">
          ${renderAnchorLink("quality-partial", "Partial quality state")}
          <h3>Partial</h3>
          <p>An incomplete run state. Partial runs are blocked from public publish and should not appear on public metric surfaces.</p>
        </article>
      </div>
    </section>

    <section class="method" id="source-caveats">
      ${renderSectionHead({
        headline: "Source caveats",
        lede: "We add a caveat when a source issue changes how the numbers should be read.",
      })}
      <div class="card-grid card-grid--3">
        <article class="card" id="source-caveat-geography-labels">
          ${renderAnchorLink("source-caveat-geography-labels", "State and Union Territory labels")}
          <h3>State and Union Territory labels</h3>
          <p>The lower-court route family keeps the compatibility path <code>/states/:slug</code>, but public copy says whether the page covers a state or a Union Territory.</p>
        </article>
        <article class="card" id="source-caveat-review-status">
          ${renderAnchorLink("source-caveat-review-status", "Current review status")}
          <h3>Current review status</h3>
          <p>The April 2026 source review did not find a lower-court geography that needs an extra public caveat beyond the state or Union Territory label, reference date, and freshness or quality banner.</p>
        </article>
        <article class="card" id="source-caveat-future-changes">
          ${renderAnchorLink("source-caveat-future-changes", "Future source changes")}
          <h3>Future source changes</h3>
          <p>If a source changes its district list, date labels, or geography names, the affected page will explain what changed.</p>
        </article>
      </div>
    </section>

    <section class="method" id="snapshot-lineage">
      ${renderSectionHead({
        headline: "Published methodology and snapshot lineage",
        lede: "One row per reference date, newest first. The table shows the snapshot selected for each date. Rollbacks and same-day republishes appear in operator publication history.",
      })}
      ${history.length > 0 ? renderHistoryTable(dedupeLineageByReferenceDate(history, {
        referenceDateLabel: (entry) => formatDate(entry.snapshot.referenceDateAt),
        publicationTimestamp: (entry) => entry.publication.createdAt,
        referenceDateSortKey: (entry) => entry.snapshot.referenceDateAt,
      })) : emptyHistoryCallout()}
    </section>
  `;

  return renderPageShell({
    title: "Methodology — NyaayWatch",
    body,
    activeNav: "methodology",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    stateLinks: context.stateLinks,
    ticker,
    pageCss: METHODOLOGY_PAGE_CSS,
    footer: {
      sourceDateLabel: snapshot ? formatDate(snapshot.referenceDateAt) : null,
      methodologyVersion: snapshot?.methodologyVersion ?? null,
      sourceAttribution: snapshot?.sourceAttribution ?? null,
    },
  });
}

function renderHistoryTable(history: PublicationHistoryEntry[]): string {
  const rows = history
    .map(
      (entry) => `
        <tr>
          <td>${escapeHtml(formatDate(entry.snapshot.referenceDateAt))}</td>
          <td><code>${escapeHtml(entry.snapshot.methodologyVersion)}</code></td>
          <td>${escapeHtml(entry.snapshot.qualityState)}</td>
          <td class="num">${entry.stats.pendingCases.toLocaleString("en-IN")}</td>
          <td class="num">${entry.stats.flaggedDistricts.toLocaleString("en-IN")}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <div class="method__table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Reference date</th>
            <th>Methodology</th>
            <th>Quality</th>
            <th>Cases waiting</th>
            <th>On the list</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function emptyHistoryCallout(): string {
  return `<article class="card"><p>No published snapshot history is available yet.</p></article>`;
}

const METHODOLOGY_PAGE_CSS = `
  .method { margin-bottom: 64px; }
  .method__table-wrap { overflow-x: auto; }
`;

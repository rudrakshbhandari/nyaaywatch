import type { PublishedSnapshot } from "../../domain/snapshot-schema.js";
import type { SnapshotHistoryEntry } from "../../services/published-snapshot-service.js";
import { escapeHtml } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";
import type { PublicPageContext } from "../public-state.js";
import { renderAnchorLink, renderSectionHead } from "../design/ui.js";
import { formatDate } from "../home/view-model.js";

/**
 * /methodology — the contract with the reader. Explains what the numbers
 * mean, where they come from, what is deliberately not shown (unpublished or
 * partial runs), and the chronological lineage of published snapshots.
 */
export function renderMethodologyPage(
  snapshot: PublishedSnapshot["snapshot"] | null,
  history: SnapshotHistoryEntry[],
  context: PublicPageContext,
): string {
  const ticker = snapshot
    ? `${escapeHtml(snapshot.stateName.toUpperCase())} · METHODOLOGY ${escapeHtml(snapshot.methodologyVersion)}`
    : `${escapeHtml(context.profile.stateName.toUpperCase())} · METHODOLOGY`;

  const body = `
    ${renderSectionHead({
      eyebrow: "HOW THE NUMBERS ARE BUILT",
      headline: "Every public number comes from one stored published snapshot.",
      lede:
        "Operators can capture newer runs in private, but the public site stays pinned to the last reviewed publication until a publish succeeds. That keeps every public claim reproducible and auditable.",
      isHero: true,
    })}

    <section class="method">
      ${renderSectionHead({ headline: "Scope and posture" })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>Current public scope</h3>
          <p>${escapeHtml(context.publicScopeDescription)} NyaayWatch publishes dated aggregates after operator review and keeps unpublished run state private.</p>
          <p>Historical context comes from earlier published snapshots, not from raw captured pages shown directly to the public.</p>
        </article>
        <article class="card">
          <h3>What the site does not do</h3>
          <p>It does not predict outcomes, rank officials, or assign blame. The public surface is a descriptive, citeable view of court-published aggregates.</p>
          <p>If a newer source run is incomplete or fails review, the site remains on the last safe publication rather than slipping into partial data.</p>
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
          <p>Calculated as cases disposed last month divided by cases filed last month, expressed per 100. Above 100 means the system cleared more than it took in that month; below 100 means the pile grew.</p>
        </article>
        <article class="card" id="metric-typical-wait">
          ${renderAnchorLink("metric-typical-wait", "Typical wait")}
          <h3>Typical wait</h3>
          <p>Estimated from NJDG age-bucket totals by finding the midpoint of pending cases and mapping that bucket to a representative day count. It is a district-level estimate of the middle of the pile, not the age of any single case.</p>
        </article>
        <article class="card" id="metric-watchlist">
          ${renderAnchorLink("metric-watchlist", "Districts on the watchlist")}
          <h3>Districts on the watchlist</h3>
          <p>Districts are ranked by queue size, then annotated with waiting-time and file-clear-gap context so a reader can see why a district rose. The watchlist is a signal for closer inspection, not a judgment on any court or official.</p>
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

    <section class="method" id="snapshot-lineage">
      ${renderSectionHead({
        headline: "Published methodology and snapshot lineage",
        lede: "Every public publication is listed here with its source date, methodology version, and quality state.",
      })}
      ${history.length > 0 ? renderHistoryTable(history) : emptyHistoryCallout()}
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
      sourceDateLabel: snapshot ? formatDate(snapshot.sourceSnapshotAt) : null,
      methodologyVersion: snapshot?.methodologyVersion ?? null,
      sourceAttribution: snapshot?.sourceAttribution ?? null,
    },
  });
}

function renderHistoryTable(history: SnapshotHistoryEntry[]): string {
  const rows = history
    .map(
      (entry) => `
        <tr>
          <td>${escapeHtml(formatDate(entry.snapshot.sourceSnapshotAt))}</td>
          <td>${escapeHtml(formatDate(entry.snapshot.publishedAt))}</td>
          <td><code>${escapeHtml(entry.snapshot.methodologyVersion)}</code></td>
          <td>${escapeHtml(entry.snapshot.qualityState)}</td>
          <td class="num">${entry.stats.pendingCases.toLocaleString("en-IN")}</td>
          <td class="num">${entry.stats.flaggedDistricts}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <div class="method__table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Source snapshot</th>
            <th>Published</th>
            <th>Methodology</th>
            <th>Quality</th>
            <th>Cases waiting</th>
            <th>On watchlist</th>
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

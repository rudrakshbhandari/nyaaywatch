import type { SupremeCourtPublishedSnapshot } from "../../domain/supreme-court-snapshot-schema.js";
import type { SupremeCourtPublicationHistoryEntry } from "../../services/published-supreme-court-snapshot-service.js";
import { escapeHtml } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";
import { renderAnchorLink, renderSectionHead } from "../design/ui.js";
import type { PublicSupremeCourtPageContext } from "../public-supreme-court.js";
import { formatDate } from "../home/view-model.js";
import { dedupeLineageByReferenceDate } from "./lineage-dedup.js";

export function renderSupremeCourtMethodologyPage(
  snapshot: SupremeCourtPublishedSnapshot["snapshot"] | null,
  history: SupremeCourtPublicationHistoryEntry[],
  context: PublicSupremeCourtPageContext,
): string {
  const body = `
    ${renderSectionHead({
      eyebrow: "SUPREME COURT METHOD",
      headline: "Every public Supreme Court number comes from one published aggregate snapshot.",
      lede:
        "Only reviewed aggregate snapshots appear here. Each carries a methodology version; new captures stay private until reviewed and published.",
      isHero: true,
    })}

    <section class="method">
      ${renderSectionHead({ headline: "Scope" })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>What this page covers</h3>
          <p>Supreme Court aggregate figures: pending cases, registered and unregistered totals, cases filed and cleared last month, current-year totals, and published trend points.</p>
          <p>It is a Supreme Court module inside NyaayWatch, not a national all-courts summary alias and not a case-search surface.</p>
        </article>
        <article class="card">
          <h3>What it does not do</h3>
          <p>It does not predict outcomes, judge judges, or imply direct comparability with High Court or district/subordinate metrics in one ranking layer.</p>
          <p>When the source has no source date, the page shows when it was captured.</p>
        </article>
      </div>
    </section>

    <section class="method" id="metric-contract">
      ${renderSectionHead({ headline: "Metric contract" })}
      <div class="card-grid card-grid--2">
        <article class="card" id="metric-sourced">
          ${renderAnchorLink("metric-sourced", "Directly sourced metrics")}
          <h3>Directly sourced</h3>
          <p>Pending registered, pending unregistered, pending total, and the civil, criminal, or total institution and disposal counts come directly from the official Supreme Court NJDG aggregate dashboard.</p>
        </article>
        <article class="card" id="metric-framing">
          ${renderAnchorLink("metric-framing", "Fields added by NyaayWatch")}
          <h3>Fields added by NyaayWatch</h3>
          <p>NyaayWatch adds the publication date, freshness, methodology version, and date basis.</p>
        </article>
        <article class="card" id="metric-backlog-movement">
          ${renderAnchorLink("metric-backlog-movement", "Backlog movement")}
          <h3>Backlog movement as share of pending load</h3>
          <p>Calculated as cases filed this month minus cases cleared this month, divided by pending cases. A positive value means the backlog grew; a negative value means it shrank.</p>
        </article>
        <article class="card" id="metric-break-even-clearances">
          ${renderAnchorLink("metric-break-even-clearances", "Break-even clearances")}
          <h3>Break-even clearances</h3>
          <p>The number of extra clearances needed in the current monthly accumulator to keep the Supreme Court backlog from growing. It is zero when clearances matched or exceeded filings.</p>
        </article>
        <article class="card" id="metric-catch-up-burden">
          ${renderAnchorLink("metric-catch-up-burden", "Catch-up burden")}
          <h3>10% reduction scenario</h3>
          <p>A scenario metric, not a prediction. It estimates the extra monthly clearances needed to reduce the pending load by 10% over 12 months while covering the current filing-clearance gap.</p>
        </article>
        <article class="card" id="metric-civil-criminal-imbalance">
          ${renderAnchorLink("metric-civil-criminal-imbalance", "Civil-criminal imbalance")}
          <h3>Civil-criminal imbalance</h3>
          <p>Compares the criminal share of pending cases with the criminal share of current monthly clearances. This describes a difference in the published data; it does not explain why the difference exists.</p>
        </article>
      </div>
    </section>

    <section class="method" id="reference-date-contract">
      ${renderSectionHead({ headline: "Which date we show" })}
      <div class="card-grid card-grid--2">
        <article class="card" id="reference-date-source">
          ${renderAnchorLink("reference-date-source", "Source date available")}
          <h3>When Supreme Court NJDG provides a source date</h3>
          <p>The page can show a source snapshot date directly.</p>
        </article>
        <article class="card" id="reference-date-captured">
          ${renderAnchorLink("reference-date-captured", "Capture-time reference date")}
          <h3>When the source does not expose one</h3>
          <p>The page uses the capture time as <code>referenceDateAt</code> and labels it <code>captured_at</code>.</p>
          <p>Current Supreme Court pages use the capture time.</p>
        </article>
      </div>
    </section>

    <section class="method" id="trend-lines">
      ${renderSectionHead({ headline: "How trend lines are built" })}
      <div class="card-grid card-grid--2">
        <article class="card" id="trend-pending">
          ${renderAnchorLink("trend-pending", "Pending total trend")}
          <h3>Pending total</h3>
          <p>Pending total is measured at a point in time. The sparkline plots one point per published snapshot, in date order.</p>
        </article>
        <article class="card" id="trend-monthly-finalized">
          ${renderAnchorLink("trend-monthly-finalized", "Monthly finalized trend")}
          <h3>Cleared / 100 filed, disposed, and backlog change</h3>
          <p>The NJDG "instituted in last month" and "disposal in last month" fields are accumulators that reset at each calendar-month boundary (IST). The headline number on these tiles is the current month-to-date reading.</p>
          <p>The chart shows finalized months. When an accumulator drops between two captures, the earlier capture holds the last totals before the reset; those totals become the finalized values for that month. Months still in progress or without captures on both sides of month-end are omitted.</p>
          <p>A month appears after NyaayWatch captures the accumulator drop at the month boundary. If captures do not show both sides of a boundary, that month's totals are omitted.</p>
        </article>
      </div>
    </section>

    <section class="method" id="snapshot-lineage">
      ${renderSectionHead({
        headline: "Published snapshot lineage",
        lede: "One row per Supreme Court reference date, newest first. The table shows the snapshot selected for each date. Rollbacks and same-day republishes appear in operator publication history.",
      })}
      ${history.length > 0 ? renderHistoryTable(dedupeLineageByReferenceDate(history, {
        referenceDateLabel: (entry) => describeReferenceDate(entry.snapshot),
        publicationTimestamp: (entry) => entry.publication.createdAt,
        referenceDateSortKey: (entry) => entry.snapshot.referenceDateAt,
      })) : `<article class="card"><p>No published Supreme Court history is available yet.</p></article>`}
    </section>
  `;

  return renderPageShell({
    title: "Supreme Court Methodology — NyaayWatch",
    body,
    activeNav: "methodology",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    ticker: snapshot ? `SUPREME COURT · ${snapshot.methodologyVersion}` : "SUPREME COURT · METHOD",
    pageCss: SUPREME_COURT_METHODOLOGY_CSS,
    footer: {
      sourceDateLabel: snapshot ? describeReferenceDate(snapshot) : null,
      methodologyVersion: snapshot?.methodologyVersion ?? null,
      sourceAttribution: snapshot?.sourceAttribution ?? null,
    },
  });
}

function renderHistoryTable(history: SupremeCourtPublicationHistoryEntry[]) {
  const rows = history
    .map(
      (entry) => `
        <tr>
          <td>${escapeHtml(describeReferenceDate(entry.snapshot))}</td>
          <td><code>${escapeHtml(entry.snapshot.methodologyVersion)}</code></td>
          <td>${escapeHtml(entry.snapshot.qualityState)}</td>
          <td>${escapeHtml(entry.publication.action)}</td>
          <td class="num">${entry.stats.pendingTotalCases.toLocaleString("en-IN")}</td>
          <td class="num">${entry.stats.disposedLastMonthTotalCases.toLocaleString("en-IN")}</td>
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
            <th>Action</th>
            <th>Pending</th>
            <th>Disposed last month</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function describeReferenceDate(
  snapshot: Pick<SupremeCourtPublishedSnapshot["snapshot"], "referenceDateAt" | "referenceDateKind">,
) {
  return snapshot.referenceDateKind === "captured_at"
    ? `Captured ${formatDate(snapshot.referenceDateAt)}`
    : `Source snapshot ${formatDate(snapshot.referenceDateAt)}`;
}

const SUPREME_COURT_METHODOLOGY_CSS = `
  .method { margin-bottom: 64px; }
  .method__table-wrap { overflow-x: auto; }
`;

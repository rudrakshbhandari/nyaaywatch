import type { HighCourtPublishedSnapshot } from "../../domain/high-court-snapshot-schema.js";
import type { HighCourtProfile } from "../../high-courts.js";
import type { HighCourtPublicationHistoryEntry } from "../../services/published-high-court-snapshot-service.js";
import { escapeHtml } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";
import { renderAnchorLink, renderSectionHead } from "../design/ui.js";
import type { PublicHighCourtPageContext } from "../public-high-court.js";
import { formatDate } from "../home/view-model.js";
import { dedupeLineageByReferenceDate } from "./lineage-dedup.js";

export function renderHighCourtMethodologyPage(
  profile: HighCourtProfile,
  snapshot: HighCourtPublishedSnapshot["snapshot"] | null,
  history: HighCourtPublicationHistoryEntry[],
  context: PublicHighCourtPageContext,
): string {
  const body = `
    ${renderSectionHead({
      eyebrow: "HIGH COURT METHOD",
      headline: "Every public High Court number comes from one published aggregate snapshot.",
      lede:
        "The public High Court pages keep the same trust discipline as the rest of NyaayWatch: stored evidence, published snapshots, explicit methodology versioning, and no leakage from unpublished operator runs.",
      isHero: true,
    })}

    <section class="method">
      ${renderSectionHead({ headline: "Scope and posture" })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>What this page covers</h3>
          <p>${escapeHtml(context.coverageSentence)} Aggregate observability only: pending load, last-month institution and disposal, age buckets, and published trend points.</p>
          <p>It is a High Court module inside NyaayWatch, not a district ranking page and not a case-search surface.</p>
        </article>
        <article class="card">
          <h3>What it does not do</h3>
          <p>It does not predict outcomes, judge judges, or imply cross-tier comparability with district or Supreme Court surfaces.</p>
          <p>When the source does not expose a trustworthy source snapshot timestamp, the page says so directly and shows capture time instead.</p>
        </article>
      </div>
    </section>

    <section class="method">
      ${renderSectionHead({ headline: "Coverage boundary" })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>Explicit court-first coverage</h3>
          <p>Current coverage on this page: ${escapeHtml(context.coverageLabel)}.</p>
          <p>The public schema carries this boundary explicitly through <code>coveredGeographies[]</code>, so a High Court page can represent one court across multiple geographies without pretending it is a single-state surface.</p>
        </article>
        <article class="card">
          <h3>Separate from lower-court geography pages</h3>
          <p>A lower-court state page is a different scope from a High Court page. NyaayWatch does not reuse district-layer language to describe a High Court publication.</p>
          <p>That keeps the hierarchy honest: district and subordinate courts sit under High Courts, but this page still reports one High Court aggregate publication.</p>
        </article>
      </div>
    </section>

    <section class="method" id="metric-contract">
      ${renderSectionHead({ headline: "Metric contract" })}
      <div class="card-grid card-grid--2">
        <article class="card" id="metric-sourced">
          ${renderAnchorLink("metric-sourced", "Directly sourced metrics")}
          <h3>Directly sourced</h3>
          <p>Pending civil, pending criminal, pending total, instituted last month, disposed last month, and age buckets come directly from the official HC NJDG High Court dashboard.</p>
        </article>
        <article class="card" id="metric-framing">
          ${renderAnchorLink("metric-framing", "NyaayWatch framing")}
          <h3>NyaayWatch framing</h3>
          <p>NyaayWatch adds publication timestamps, freshness, methodology versioning, and an explicit rule for which date to show so the snapshot is citeable and auditable.</p>
        </article>
        <article class="card" id="metric-backlog-movement">
          ${renderAnchorLink("metric-backlog-movement", "Backlog movement")}
          <h3>Backlog movement as share of pending load</h3>
          <p>Calculated as cases filed last month minus cases cleared last month, divided by pending cases. It gives a scale-aware view of whether the pending pile grew or shrank.</p>
        </article>
        <article class="card" id="metric-break-even-clearances">
          ${renderAnchorLink("metric-break-even-clearances", "Break-even clearances")}
          <h3>Break-even clearances</h3>
          <p>The number of extra clearances needed last month to keep the High Court backlog from growing. It is zero when clearances matched or exceeded filings.</p>
        </article>
        <article class="card" id="metric-catch-up-burden">
          ${renderAnchorLink("metric-catch-up-burden", "Catch-up burden")}
          <h3>10% reduction scenario</h3>
          <p>A scenario metric, not a prediction. It estimates the extra monthly clearances needed to reduce the pending load by 10% over 12 months while covering last month's filing-clearance gap.</p>
        </article>
        <article class="card" id="metric-civil-criminal-imbalance">
          ${renderAnchorLink("metric-civil-criminal-imbalance", "Civil-criminal imbalance")}
          <h3>Civil-criminal imbalance</h3>
          <p>Compares the criminal share of pending cases with the criminal share of last-month clearances. The result is a docket signal for inspection, not a cause or blame claim.</p>
        </article>
        <article class="card" id="metric-backlog-concentration">
          ${renderAnchorLink("metric-backlog-concentration", "Backlog concentration")}
          <h3>Case-type concentration</h3>
          <p>When the source exposes case-type rows, NyaayWatch shows how much of the pending load sits in the five largest case types. It is omitted when the source does not provide a defensible case-type breakdown.</p>
        </article>
      </div>
    </section>

    <section class="method" id="reference-date-contract">
      ${renderSectionHead({ headline: "Which date we show" })}
      <div class="card-grid card-grid--2">
        <article class="card" id="reference-date-source">
          ${renderAnchorLink("reference-date-source", "Source-exposed reference date")}
          <h3>When HC NJDG exposes a source date</h3>
          <p>The page can show a source snapshot date directly.</p>
        </article>
        <article class="card" id="reference-date-captured">
          ${renderAnchorLink("reference-date-captured", "Captured-at reference date")}
          <h3>When HC NJDG does not expose one</h3>
          <p>The page uses the captured page timestamp as <code>referenceDateAt</code> and labels it as <code>captured_at</code> instead of inventing a source date.</p>
          <p>This is the current posture for the live public High Court pages.</p>
        </article>
      </div>
    </section>

    <section class="method" id="snapshot-lineage">
      ${renderSectionHead({
        headline: "Published snapshot lineage",
        lede: "One row per High Court reference date, sorted newest first, showing the publication that ended up live for that date. Operator events like rollbacks or same-day re-publishes are kept in the operator publication history, not duplicated here.",
      })}
      ${history.length > 0 ? renderHistoryTable(dedupeLineageByReferenceDate(history, {
        referenceDateLabel: (entry) => describeReferenceDate(entry.snapshot),
        publicationTimestamp: (entry) => entry.publication.createdAt,
        referenceDateSortKey: (entry) => entry.snapshot.referenceDateAt,
      })) : `<article class="card"><p>No published High Court history is available yet.</p></article>`}
    </section>
  `;

  return renderPageShell({
    title: `${profile.courtName} Methodology — NyaayWatch`,
    body,
    activeNav: "methodology",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    stateLinks: context.highCourtLinks,
    ticker: snapshot ? `${profile.courtName.toUpperCase()} · ${snapshot.methodologyVersion}` : `${profile.courtName.toUpperCase()} · METHOD`,
    pageCss: HIGH_COURT_METHODOLOGY_CSS,
    footer: {
      sourceDateLabel: snapshot ? describeReferenceDate(snapshot) : null,
      methodologyVersion: snapshot?.methodologyVersion ?? null,
      sourceAttribution: snapshot?.sourceAttribution ?? null,
    },
  });
}

function renderHistoryTable(history: HighCourtPublicationHistoryEntry[]) {
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

function describeReferenceDate(snapshot: Pick<HighCourtPublishedSnapshot["snapshot"], "referenceDateAt" | "referenceDateKind">) {
  return snapshot.referenceDateKind === "captured_at"
    ? `Captured ${formatDate(snapshot.referenceDateAt)}`
    : `Source snapshot ${formatDate(snapshot.referenceDateAt)}`;
}

const HIGH_COURT_METHODOLOGY_CSS = `
  .method { margin-bottom: 64px; }
  .method__table-wrap { overflow-x: auto; }
`;

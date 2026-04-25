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
        "The public Supreme Court page keeps the same trust discipline as the rest of NyaayWatch: stored evidence, published snapshots, explicit methodology versioning, and no leakage from unpublished operator runs.",
      isHero: true,
    })}

    <section class="method">
      ${renderSectionHead({ headline: "Scope and posture" })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>What this page covers</h3>
          <p>Supreme Court aggregate observability only: pending load, registered and unregistered treatment, last-month institution and disposal, current-year movement, and published trend points.</p>
          <p>It is a Supreme Court module inside NyaayWatch, not a national all-courts summary alias and not a case-search surface.</p>
        </article>
        <article class="card">
          <h3>What it does not do</h3>
          <p>It does not predict outcomes, judge judges, or imply direct comparability with High Court or district/subordinate metrics in one ranking layer.</p>
          <p>When the source does not expose a trustworthy source snapshot timestamp, the page says so directly and shows capture time instead.</p>
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
          ${renderAnchorLink("metric-framing", "NyaayWatch framing")}
          <h3>NyaayWatch framing</h3>
          <p>NyaayWatch adds publication timestamps, freshness, methodology versioning, and an explicit rule for which date to show so the snapshot is citeable and auditable.</p>
        </article>
      </div>
    </section>

    <section class="method" id="reference-date-contract">
      ${renderSectionHead({ headline: "Which date we show" })}
      <div class="card-grid card-grid--2">
        <article class="card" id="reference-date-source">
          ${renderAnchorLink("reference-date-source", "Source-exposed reference date")}
          <h3>When Supreme Court NJDG exposes a source date</h3>
          <p>The page can show a source snapshot date directly.</p>
        </article>
        <article class="card" id="reference-date-captured">
          ${renderAnchorLink("reference-date-captured", "Captured-at reference date")}
          <h3>When the source does not expose one</h3>
          <p>The page uses the captured page timestamp as <code>referenceDateAt</code> and labels it as <code>captured_at</code> instead of inventing a source date.</p>
          <p>This is the current public Supreme Court posture.</p>
        </article>
      </div>
    </section>

    <section class="method" id="trend-lines">
      ${renderSectionHead({ headline: "How trend lines are built" })}
      <div class="card-grid card-grid--2">
        <article class="card" id="trend-pending">
          ${renderAnchorLink("trend-pending", "Pending total trend")}
          <h3>Pending total</h3>
          <p>Pending total is a point-in-time stock — each published snapshot is one meaningful reading. The sparkline plots one dot per recent snapshot, in chronological order.</p>
        </article>
        <article class="card" id="trend-monthly-finalized">
          ${renderAnchorLink("trend-monthly-finalized", "Monthly finalized trend")}
          <h3>Cleared / 100 filed, disposed, and backlog change</h3>
          <p>The NJDG "instituted in last month" and "disposal in last month" fields are accumulators that reset at each calendar-month boundary (IST). The headline number on these tiles is the current month-to-date reading.</p>
          <p>For the trend line we keep only <em>finalized</em> months: when we observe the accumulator drop between two consecutive captures, the earlier capture holds the last-known pre-reset totals for its month, and those become that month's finalized values. Months still in progress, or months where we lack captures on both sides of the boundary, are deliberately omitted from the sparkline.</p>
          <p>This keeps each dot on the trend line directly comparable to the next. It also means the trend line will stay empty until at least two calendar-month boundaries have been observed in the capture history.</p>
        </article>
      </div>
    </section>

    <section class="method" id="snapshot-lineage">
      ${renderSectionHead({
        headline: "Published snapshot lineage",
        lede: "One row per Supreme Court reference date, showing the latest publication that ended up live for that date. Operator events like rollbacks or same-day re-publishes are kept in the operator publication history, not duplicated here.",
      })}
      ${history.length > 0 ? renderHistoryTable(dedupeLineageByReferenceDate(history, {
        referenceDateLabel: (entry) => describeReferenceDate(entry.snapshot),
        publicationTimestamp: (entry) => entry.publication.createdAt,
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
          <td>${escapeHtml(formatDate(entry.snapshot.publishedAt))}</td>
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
            <th>Published</th>
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

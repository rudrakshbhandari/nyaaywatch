import type { SupremeCourtPublishedSnapshot } from "../../domain/supreme-court-snapshot-schema.js";
import { renderPageShell } from "../design/shell.js";
import { renderSectionHead, renderStatTile } from "../design/ui.js";
import type { PublicSupremeCourtPageContext } from "../public-supreme-court.js";
import { formatDate } from "../home/view-model.js";

export function renderSupremeCourtDataPage(
  snapshot: SupremeCourtPublishedSnapshot,
  context: PublicSupremeCourtPageContext,
): string {
  const referenceLabel =
    snapshot.snapshot.referenceDateKind === "captured_at"
      ? `Captured ${formatDate(snapshot.snapshot.referenceDateAt)}`
      : `Source snapshot ${formatDate(snapshot.snapshot.referenceDateAt)}`;

  const body = `
    ${renderSectionHead({
      eyebrow: "SUPREME COURT DATA",
      headline: "Supreme Court data and history",
      lede:
        "Use the JSON links below for current figures and earlier snapshots. The archive contains Supreme Court-wide totals and has no district-level rows.",
      isHero: true,
    })}

    <section class="stat-grid">
      ${renderStatTile({
        label: "JSON routes",
        value: "3",
        note: "Stats, trends, and earlier Supreme Court snapshots.",
      })}
      ${renderStatTile({
        label: "Trend points",
        value: snapshot.trends.length.toLocaleString("en-IN"),
        note: "Each trend point matches a snapshot in the archive.",
      })}
      ${renderStatTile({
        label: "Date shown",
        value: snapshot.snapshot.referenceDateKind === "captured_at" ? "Captured page" : "Source date",
        note: referenceLabel,
      })}
      ${renderStatTile({
        label: "CSV downloads",
        value: "Unavailable",
        note: "CSV downloads are not available for the Supreme Court.",
        tone: "flag",
      })}
    </section>

    <section class="sc-section">
      ${renderSectionHead({ headline: "JSON routes" })}
      <div class="card-grid card-grid--3">
        <article class="card">
          <h3>Supreme Court stats</h3>
          <p><code>${context.routes.statsApi}</code></p>
          <p>Counts of registered and unregistered civil and criminal cases, with total pending cases and filing and clearance totals.</p>
          <p><a class="btn btn--primary btn--small" href="${context.routes.statsApi}">Open stats JSON</a></p>
        </article>
        <article class="card">
          <h3>Supreme Court trends</h3>
          <p><code>${context.routes.trendsApi}</code></p>
          <p>Trend points for pending cases and cases filed or cleared last month.</p>
          <p><a class="btn btn--primary btn--small" href="${context.routes.trendsApi}">Open trends JSON</a></p>
        </article>
        <article class="card">
          <h3>Earlier snapshots</h3>
          <p><code>${context.routes.archiveApi}?limit=20&amp;offset=0</code></p>
          <p>Each record has dates, a method version, and a quality status. These are Supreme Court-wide totals; there are no district rows. Use the archive URL to fetch more records.</p>
          <p><a class="btn btn--primary btn--small" href="${context.routes.archiveApi}?limit=20&amp;offset=0">Open archive JSON</a></p>
        </article>
      </div>
    </section>

    <section class="sc-section">
      ${renderSectionHead({ headline: "Other data" })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>Source files and review records</h3>
          <p>Stored HTML files, operator notes, and replay files are private.</p>
        </article>
        <article class="card">
          <h3>Case-level data</h3>
          <p>This page has no case-level data. Use the official Supreme Court site for case searches.</p>
          <p><a class="btn btn--ghost btn--small" href="${context.profile.sourceUrls.officialSite}">Open official Supreme Court site</a></p>
        </article>
      </div>
    </section>
  `;

  return renderPageShell({
    title: "Supreme Court Data — NyaayWatch",
    body,
    activeNav: "data",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    ticker: `SUPREME COURT · ${referenceLabel.toUpperCase()} · ${snapshot.snapshot.methodologyVersion}`,
    pageCss: SUPREME_COURT_DATA_CSS,
    footer: {
      sourceDateLabel: referenceLabel,
      methodologyVersion: snapshot.snapshot.methodologyVersion,
      sourceAttribution: snapshot.snapshot.sourceAttribution,
    },
  });
}

const SUPREME_COURT_DATA_CSS = `
  .sc-section { margin-bottom: 72px; }
`;

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
      headline: "Fetch the same published Supreme Court snapshot the page is showing.",
      lede:
        "This Supreme Court page is JSON-first. It exposes the current published stats and trend points, while raw captures, operator notes, and replay evidence stay private.",
      isHero: true,
    })}

    <section class="stat-grid">
      ${renderStatTile({
        label: "Public endpoints",
        value: "2",
        note: "Stats and trends for the active Supreme Court publication.",
      })}
      ${renderStatTile({
        label: "Trend points",
        value: snapshot.trends.length.toLocaleString("en-IN"),
        note: "Historical points are limited to published Supreme Court snapshots only.",
      })}
      ${renderStatTile({
        label: "Reference basis",
        value: snapshot.snapshot.referenceDateKind === "captured_at" ? "Captured page" : "Source date",
        note: referenceLabel,
      })}
      ${renderStatTile({
        label: "CSV posture",
        value: "Not yet",
        note: "This public Supreme Court page ships the JSON surface before adding download formats.",
        tone: "flag",
      })}
    </section>

    <section class="sc-section">
      ${renderSectionHead({ headline: "Available machine-readable routes" })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>Supreme Court stats</h3>
          <p><code>${context.routes.statsApi}</code></p>
          <p>Headline metadata plus registered, unregistered, civil, criminal, and total aggregate counts for the active publication.</p>
          <p><a class="btn btn--primary btn--small" href="${context.routes.statsApi}">Open stats JSON</a></p>
        </article>
        <article class="card">
          <h3>Supreme Court trends</h3>
          <p><code>${context.routes.trendsApi}</code></p>
          <p>Published trend points for pending load and last-month institution or disposal totals only.</p>
          <p><a class="btn btn--primary btn--small" href="${context.routes.trendsApi}">Open trends JSON</a></p>
        </article>
      </div>
    </section>

    <section class="sc-section">
      ${renderSectionHead({ headline: "What this page does not expose" })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>Raw artifacts stay private</h3>
          <p>Stored HTML captures, operator notes, and replay evidence remain inside the internal review boundary.</p>
        </article>
        <article class="card">
          <h3>No case-level export yet</h3>
          <p>NyaayWatch links to the official Supreme Court site instead of pretending this page is a case-search or judgment archive surface.</p>
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

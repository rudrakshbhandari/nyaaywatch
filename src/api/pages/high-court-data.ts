import type { HighCourtPublishedSnapshot } from "../../domain/high-court-snapshot-schema.js";
import type { HighCourtProfile } from "../../high-courts.js";
import { renderPageShell } from "../design/shell.js";
import { renderSectionHead, renderStatTile } from "../design/ui.js";
import type { PublicHighCourtPageContext } from "../public-high-court.js";
import { formatDate } from "../home/view-model.js";

export function renderHighCourtDataPage(
  profile: HighCourtProfile,
  snapshot: HighCourtPublishedSnapshot,
  context: PublicHighCourtPageContext,
): string {
  const referenceLabel =
    snapshot.snapshot.referenceDateKind === "captured_at"
      ? `Captured ${formatDate(snapshot.snapshot.referenceDateAt)}`
      : `Source snapshot ${formatDate(snapshot.snapshot.referenceDateAt)}`;

  const body = `
    ${renderSectionHead({
      eyebrow: "HIGH COURT DATA",
      headline: "Fetch the same published High Court snapshot the page is showing.",
      lede:
        `This first High Court beta is JSON-first. It exposes the current published stats and trend points for ${profile.courtName} across ${context.coverageLabel}, while raw captures and operator evidence stay private.`,
      isHero: true,
    })}

    <section class="stat-grid">
      ${renderStatTile({
        label: "Public endpoints",
        value: "2",
        note: `Stats and trends for the active ${profile.courtName} publication.`,
      })}
      ${renderStatTile({
        label: "Trend points",
        value: snapshot.trends.length.toLocaleString("en-IN"),
        note: "Historical points are limited to published High Court snapshots only.",
      })}
      ${renderStatTile({
        label: "Reference basis",
        value: snapshot.snapshot.referenceDateKind === "captured_at" ? "Captured page" : "Source date",
        note: referenceLabel,
      })}
      ${renderStatTile({
        label: "CSV posture",
        value: "Not yet",
        note: "This public High Court beta ships the JSON surface before adding download formats.",
        tone: "flag",
      })}
    </section>

    <section class="hc-section">
      ${renderSectionHead({ headline: "Available machine-readable routes" })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>High Court stats</h3>
          <p><code>${context.routes.statsApi}</code></p>
          <p>Headline metadata plus <code>coveredGeographies[]</code> and aggregate civil, criminal, and total pending / instituted / disposed values for this one High Court publication.</p>
          <p><a class="btn btn--primary btn--small" href="${context.routes.statsApi}">Open stats JSON</a></p>
        </article>
        <article class="card">
          <h3>High Court trends</h3>
          <p><code>${context.routes.trendsApi}</code></p>
          <p>Published court-wide trend points for pending load and last-month institution / disposal totals. This beta does not split trends by covered geography.</p>
          <p><a class="btn btn--primary btn--small" href="${context.routes.trendsApi}">Open trends JSON</a></p>
        </article>
      </div>
    </section>

    <section class="hc-section">
      ${renderSectionHead({ headline: "What this beta does not expose" })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>Raw artifacts stay private</h3>
          <p>Stored HTML captures, operator notes, and replay evidence remain inside the internal review boundary.</p>
        </article>
        <article class="card">
          <h3>No case-level export yet</h3>
          <p>NyaayWatch links to official High Court Services and the official court site instead of pretending this beta is a case-search system.</p>
          <p><a class="btn btn--ghost btn--small" href="${profile.sourceUrls.hcServices}">Open official High Court Services</a></p>
        </article>
      </div>
    </section>
  `;

  return renderPageShell({
    title: `${profile.courtName} Data — NyaayWatch`,
    body,
    activeNav: "data",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    stateLinks: context.highCourtLinks,
    ticker: `${profile.courtName.toUpperCase()} · ${referenceLabel.toUpperCase()} · ${snapshot.snapshot.methodologyVersion}`,
    pageCss: HIGH_COURT_DATA_CSS,
    footer: {
      sourceDateLabel: referenceLabel,
      methodologyVersion: snapshot.snapshot.methodologyVersion,
      sourceAttribution: snapshot.snapshot.sourceAttribution,
    },
  });
}

const HIGH_COURT_DATA_CSS = `
  .hc-section { margin-bottom: 72px; }
`;

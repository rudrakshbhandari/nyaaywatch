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
      headline: "High Court data and history",
      lede:
        `Use the JSON links below for current and earlier published snapshots for ${profile.courtName} across ${context.coverageLabel}.`,
      isHero: true,
    })}

    <section class="stat-grid">
      ${renderStatTile({
        label: "JSON routes",
        value: "3",
        note: `Stats, trends, and published snapshots for ${profile.courtName}.`,
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
        note: "CSV downloads are not available for this High Court.",
        tone: "flag",
      })}
    </section>

    <section class="hc-section">
      ${renderSectionHead({ headline: "JSON routes" })}
      <div class="card-grid card-grid--3">
        <article class="card">
          <h3>High Court stats</h3>
          <p><code>${context.routes.statsApi}</code></p>
          <p>Court details, covered geographies, and total pending, filed, and cleared cases.</p>
          <p><a class="btn btn--primary btn--small" href="${context.routes.statsApi}">Open stats JSON</a></p>
        </article>
        <article class="card">
          <h3>High Court trends</h3>
          <p><code>${context.routes.trendsApi}</code></p>
          <p>Court-wide trends for pending cases and cases filed or cleared last month. Trends are not split by geography.</p>
          <p><a class="btn btn--primary btn--small" href="${context.routes.trendsApi}">Open trends JSON</a></p>
        </article>
        <article class="card">
          <h3>Published snapshots, including current</h3>
          <p><code>${context.routes.archiveApi}?limit=20&amp;offset=0</code></p>
          <p>Each record includes its dates, method version, and quality status. Use the archive URL to fetch more records.</p>
          <p><a class="btn btn--primary btn--small" href="${context.routes.archiveApi}?limit=20&amp;offset=0">Open archive JSON</a></p>
        </article>
      </div>
    </section>

    <section class="hc-section">
      ${renderSectionHead({ headline: "Other data" })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>Source files and review records</h3>
          <p>Stored HTML files, operator notes, and replay files are private.</p>
        </article>
        <article class="card">
          <h3>Case-level data</h3>
          <p>This page has no case-level data. Use the official High Court Services for case searches.</p>
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

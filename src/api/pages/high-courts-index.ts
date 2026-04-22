import type { HighCourtPublishedSnapshot } from "../../domain/high-court-snapshot-schema.js";
import type { HighCourtProfile } from "../../high-courts.js";
import { renderPageShell } from "../design/shell.js";
import { renderSectionHead, renderStatTile } from "../design/ui.js";
import {
  buildPublicHighCourtRoutes,
  formatHighCourtCoverageLabel,
  type PublicHighCourtPageContext,
} from "../public-high-court.js";
import { compareHighCourtPressure } from "../home/national-view-model.js";
import { formatDate } from "../home/view-model.js";

export interface PublicHighCourtIndexEntry {
  profile: HighCourtProfile;
  snapshot: HighCourtPublishedSnapshot;
}

export function renderHighCourtsIndexPage(
  entries: PublicHighCourtIndexEntry[],
  context: PublicHighCourtPageContext,
): string {
  const sortedEntries = [...entries].sort(compareHighCourtPressure);
  const body = `
    ${renderSectionHead({
      eyebrow: "HIGH COURTS",
      headline: "Where is pressure building across India's High Courts?",
      lede:
        "This index links the published High Court snapshots now live on NyaayWatch. Cards are ordered by the clearest visible pressure signal first: latest pile growth, then clearance pace, then pending load.",
      isHero: true,
    })}

    <section class="card-grid card-grid--2">
      ${sortedEntries
        .map(
          ({ profile, snapshot }) => `
            <article class="card hc-card">
              <h2>${profile.courtName}</h2>
              <p>Latest reference: ${
                snapshot.snapshot.referenceDateKind === "captured_at"
                  ? `Captured ${formatDate(snapshot.snapshot.referenceDateAt)}`
                  : `Source snapshot ${formatDate(snapshot.snapshot.referenceDateAt)}`
              }</p>
              <p class="hc-card__coverage"><strong>Coverage:</strong> ${formatHighCourtCoverageLabel(profile)}</p>
              <div class="stat-grid stat-grid--compact">
                ${renderStatTile({
                  label: "Pending",
                  value: snapshot.stats.pendingTotalCases.toLocaleString("en-IN"),
                })}
                ${renderStatTile({
                  label: "Cleared / 100 filed",
                  value: formatClearanceRateDisplay(
                    snapshot.stats.disposedLastMonthTotalCases,
                    snapshot.stats.institutedLastMonthTotalCases,
                  ),
                })}
                ${renderStatTile({
                  label: "Last-month pile change",
                  value: formatPileChangeDisplay(
                    snapshot.stats.institutedLastMonthTotalCases,
                    snapshot.stats.disposedLastMonthTotalCases,
                  ),
                })}
              </div>
              <p><a class="btn btn--primary btn--small" href="${buildPublicHighCourtRoutes(profile).home}">Inspect High Court</a></p>
            </article>
          `,
        )
        .join("")}
    </section>
  `;

  return renderPageShell({
    title: "High Courts — NyaayWatch",
    body,
    brandHref: context.brandHref,
    brandTag: "High Court observability",
    navLinks: context.navLinks,
    stateLinks: context.highCourtLinks,
    footer: {
      sourceDateLabel: null,
      methodologyVersion: null,
      sourceAttribution: null,
    },
    pageCss: HIGH_COURTS_INDEX_CSS,
  });
}

const HIGH_COURTS_INDEX_CSS = `
  .hc-card__coverage {
    margin: 0 0 18px;
    color: var(--ink-soft);
  }
`;

function formatClearanceRateDisplay(disposedCases: number, institutedCases: number) {
  if (institutedCases <= 0) {
    return "—";
  }

  return ((disposedCases / institutedCases) * 100).toFixed(1);
}

function formatPileChangeDisplay(institutedCases: number, disposedCases: number) {
  const difference = institutedCases - disposedCases;
  if (difference === 0) {
    return "0";
  }

  return `${difference > 0 ? "+" : "−"}${Math.abs(difference).toLocaleString("en-IN")}`;
}

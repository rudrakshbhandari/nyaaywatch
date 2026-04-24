import type { HighCourtPublishedSnapshot } from "../../domain/high-court-snapshot-schema.js";
import type { HighCourtProfile } from "../../high-courts.js";
import { renderPageShell } from "../design/shell.js";
import { renderSectionHead, renderStatTile } from "../design/ui.js";
import {
  buildPublicHighCourtRoutes,
  formatHighCourtCoverageLabel,
  type PublicHighCourtPageContext,
} from "../public-high-court.js";
import { compareHighCourtPressure, describeClearanceTrend, describePileTrend } from "../home/national-view-model.js";
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
      headline: `India's High Courts, ranked by pressure`,
      lede:
        `${entries.length} published High Court snapshots, ordered by the clearest pressure signal first — latest pile growth, then clearance pace, then pending load. Select a court to read its detail page.`,
      isHero: true,
    })}

    <section class="card-grid hc-index-grid" aria-label="Published High Court snapshots">
      ${sortedEntries
        .map(
          ({ profile, snapshot }, index) => {
            const rank = index + 1;
            const isTop = rank <= 2;
            return `
            <article class="card hc-card${isTop ? " hc-card--top" : ""}">
              <div class="hc-card__rank">#${rank}${isTop ? ' <span class="hc-card__rank-note">highest pressure</span>' : ""}</div>
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
                  trendSignal: describeClearanceTrend(
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
                  tone: isTop ? "accent" : undefined,
                  trendSignal: describePileTrend(
                    snapshot.stats.institutedLastMonthTotalCases,
                    snapshot.stats.disposedLastMonthTotalCases,
                  ),
                })}
              </div>
              <p><a class="btn btn--primary btn--small" href="${buildPublicHighCourtRoutes(profile).home}">Inspect High Court</a></p>
            </article>
          `;
          },
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
    // Intentionally no stateLinks on the index itself: the card grid below
    // IS the court navigation, so a parallel chip row would just duplicate
    // it and eat the fold.
    footer: {
      sourceDateLabel: null,
      methodologyVersion: null,
      sourceAttribution: null,
    },
    pageCss: HIGH_COURTS_INDEX_CSS,
  });
}

const HIGH_COURTS_INDEX_CSS = `
  .hc-index-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
    align-items: stretch;
  }
  .hc-card {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .hc-card h2 {
    margin: 18px 0 14px;
    font-size: 24px;
    line-height: 1.12;
    letter-spacing: -0.02em;
  }
  .hc-card .stat-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin: 16px 0 28px;
    padding: 22px 0 24px;
  }
  .hc-card .stat-tile {
    min-width: 0;
    padding: 0 16px;
  }
  .hc-card .stat-tile:first-child { padding-left: 0; }
  .hc-card .stat-tile:last-child { padding-right: 0; }
  .hc-card .stat-tile__value {
    font-size: clamp(26px, 2.6vw, 36px);
  }
  .hc-card > p:last-child {
    margin-top: auto;
  }
  .hc-card__coverage {
    margin: 0 0 18px;
    color: var(--ink-soft);
  }
  .hc-card__rank {
    display: inline-flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 10px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  .hc-card__rank-note {
    color: var(--accent-dark);
    letter-spacing: 0.14em;
  }
  .hc-card--top {
    border-left: 4px solid var(--accent);
    padding-left: 25px;
  }
  .hc-card--top .hc-card__rank { color: var(--accent-dark); }
  @media (max-width: 900px) {
    .hc-index-grid {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 720px) {
    .hc-card .stat-grid {
      grid-template-columns: 1fr;
      margin-bottom: 32px;
    }
    .hc-card .stat-tile__value {
      font-size: clamp(28px, 8vw, 40px);
    }
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

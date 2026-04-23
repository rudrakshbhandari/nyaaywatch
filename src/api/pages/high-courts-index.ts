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
                })}
                ${renderStatTile({
                  label: "Last-month pile change",
                  value: formatPileChangeDisplay(
                    snapshot.stats.institutedLastMonthTotalCases,
                    snapshot.stats.disposedLastMonthTotalCases,
                  ),
                  tone: isTop ? "accent" : undefined,
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
  main,
  .masthead,
  .colophon {
    max-width: 1760px;
  }
  .page-hero {
    max-width: 980px;
  }
  .hc-index-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
    align-items: stretch;
  }
  .hc-card {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 460px;
  }
  .hc-card h2 {
    margin: 28px 0 22px;
    font-size: 32px;
    line-height: 1.06;
    letter-spacing: 0;
  }
  .hc-card .stat-grid {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.75fr) minmax(0, 1.1fr);
    margin: 20px 0 52px;
  }
  .hc-card .stat-tile {
    min-width: 0;
  }
  .hc-card .stat-tile__value {
    font-size: 52px;
    overflow-wrap: anywhere;
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
  @media (max-width: 1280px) {
    .hc-index-grid {
      grid-template-columns: 1fr;
    }
    .hc-card {
      min-height: 0;
    }
  }
  @media (max-width: 720px) {
    main,
    .masthead,
    .colophon {
      max-width: none;
    }
    .hc-card h2 {
      font-size: 26px;
    }
    .hc-card .stat-grid {
      grid-template-columns: 1fr;
      margin-bottom: 36px;
    }
    .hc-card .stat-tile__value {
      font-size: 42px;
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

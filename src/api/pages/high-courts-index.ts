import type { HighCourtPublishedSnapshot } from "../../domain/high-court-snapshot-schema.js";
import type { HighCourtProfile } from "../../high-courts.js";
import { renderPageShell } from "../design/shell.js";
import { renderSectionHead, renderStatTile } from "../design/ui.js";
import { buildPublicHighCourtRoutes, type PublicHighCourtPageContext } from "../public-high-court.js";
import { formatDate } from "../home/view-model.js";

export interface PublicHighCourtIndexEntry {
  profile: HighCourtProfile;
  snapshot: HighCourtPublishedSnapshot;
}

export function renderHighCourtsIndexPage(
  entries: PublicHighCourtIndexEntry[],
  context: PublicHighCourtPageContext,
): string {
  const body = `
    ${renderSectionHead({
      eyebrow: "HIGH COURTS",
      headline: "Public High Court observability is now live in a narrow beta.",
      lede:
        "This tier sits inside the same NyaayWatch trust model: published snapshots, explicit methodology, and official source links. It is still narrower than the district layer and does not claim national High Court comparability yet.",
      isHero: true,
    })}

    <section class="card-grid card-grid--2">
      ${entries
        .map(
          ({ profile, snapshot }) => `
            <article class="card hc-card">
              <h2>${profile.courtName}</h2>
              <p>Latest reference: ${
                snapshot.snapshot.referenceDateKind === "captured_at"
                  ? `Captured ${formatDate(snapshot.snapshot.referenceDateAt)}`
                  : `Source snapshot ${formatDate(snapshot.snapshot.referenceDateAt)}`
              }</p>
              <div class="stat-grid stat-grid--compact">
                ${renderStatTile({
                  label: "Pending",
                  value: snapshot.stats.pendingTotalCases.toLocaleString("en-IN"),
                })}
                ${renderStatTile({
                  label: "Disposed last month",
                  value: snapshot.stats.disposedLastMonthTotalCases.toLocaleString("en-IN"),
                })}
              </div>
              <p><a class="btn btn--primary btn--small" href="${buildPublicHighCourtRoutes(profile).home}">Open High Court page</a></p>
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
  });
}

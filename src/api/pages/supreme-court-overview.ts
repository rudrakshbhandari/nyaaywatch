import type { SupremeCourtPublishedSnapshot } from "../../domain/supreme-court-snapshot-schema.js";
import type { SupremeCourtProfile } from "../../supreme-court.js";
import { renderPageShell } from "../design/shell.js";
import { renderBadge, renderSectionHead, renderStatTile } from "../design/ui.js";
import type { PublicSupremeCourtPageContext } from "../public-supreme-court.js";
import { formatDate } from "../home/view-model.js";

export function renderSupremeCourtOverviewPage(
  profile: SupremeCourtProfile,
  snapshot: SupremeCourtPublishedSnapshot,
  context: PublicSupremeCourtPageContext,
): string {
  const referenceLabel = describeReferenceDate(snapshot.snapshot);
  const clearanceRateDisplay = formatClearanceRateDisplay(
    snapshot.stats.disposedLastMonthTotalCases,
    snapshot.stats.institutedLastMonthTotalCases,
  );
  const pileChange = describePileChange(
    snapshot.stats.institutedLastMonthTotalCases,
    snapshot.stats.disposedLastMonthTotalCases,
  );

  const body = `
    ${renderSectionHead({
      eyebrow: "SUPREME COURT",
      headline: "Where is pressure building at the apex court?",
      lede:
        "This page shows one published aggregate Supreme Court snapshot, but focuses the first view on backlog pressure, clearance pace, and monthly pile change so the current direction is obvious at a glance.",
      isHero: true,
    })}

    <section class="stat-grid">
      ${renderStatTile({
        label: "Pending total",
        value: snapshot.stats.pendingTotalCases.toLocaleString("en-IN"),
        note: "Registered and unregistered pending matters combined in the active publication.",
      })}
      ${renderStatTile({
        label: "Cleared / 100 filed",
        value: clearanceRateDisplay,
        note: "How quickly the apex court cleared incoming work in the latest monthly window.",
      })}
      ${renderStatTile({
        label: "Last-month pile change",
        value: pileChange.display,
        note: pileChange.note,
      })}
      ${renderStatTile({
        label: "Pending unregistered",
        value: snapshot.stats.pendingUnregisteredCases.toLocaleString("en-IN"),
        note: "Unregistered matters remain visible instead of being folded away.",
        tone: "accent",
      })}
    </section>

    <section class="sc-section">
      ${renderSectionHead({
        headline: "How to read this page",
        lede:
          "This Supreme Court page stays anchored to one published aggregate snapshot, with tier-specific caveats, clear reference dates, and no hidden leap into all-courts comparability.",
      })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>Snapshot basis</h3>
          <p>Supreme Court data is snapshot-based, not live. Every public number comes from a stored published artifact and stays pinned until a later reviewed publication replaces it.</p>
          <p>${renderBadge({ label: snapshot.snapshot.qualityState, tone: snapshot.snapshot.qualityState === "complete" ? "complete" : "flag" })}</p>
        </article>
        <article class="card">
          <h3>Reference date</h3>
          <p>${referenceLabel}</p>
          <p>${
            snapshot.snapshot.referenceDateKind === "captured_at"
              ? "The official aggregate page did not expose a defensible source snapshot timestamp, so NyaayWatch shows the page capture time instead of inventing one."
              : "The official source exposed a usable source snapshot timestamp, so that source date is shown directly."
          }</p>
        </article>
      </div>
    </section>

    <section class="sc-section">
      ${renderSectionHead({
        headline: "Movement in the current publication",
        lede:
          "This page keeps registered and unregistered backlog visible, while showing month and year movement directly from the aggregate source boundary.",
      })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>Last month</h3>
          <p><strong>Instituted:</strong> ${snapshot.stats.institutedLastMonthTotalCases.toLocaleString("en-IN")}</p>
          <p><strong>Disposed:</strong> ${snapshot.stats.disposedLastMonthTotalCases.toLocaleString("en-IN")}</p>
          <p>These totals come directly from the published aggregate source, not from reconstructed case records.</p>
        </article>
        <article class="card">
          <h3>Current year</h3>
          <p><strong>Instituted:</strong> ${snapshot.stats.institutedCurrentYearTotalCases.toLocaleString("en-IN")}</p>
          <p><strong>Disposed:</strong> ${snapshot.stats.disposedCurrentYearTotalCases.toLocaleString("en-IN")}</p>
          <p>This page exposes the year-to-date aggregate counts without implying long-range causal explanations.</p>
          <p>This page exposes the year-to-date aggregate counts without implying long-range causal explanations.</p>
        </article>
      </div>
    </section>

    <section class="sc-section">
      ${renderSectionHead({
        headline: "Official source links",
        lede:
          "Use these links to move from public accountability data to the official court systems and reference material behind it.",
      })}
      <div class="card-grid card-grid--4">
        <article class="card">
          <h3>Supreme Court NJDG</h3>
          <p>Official aggregate pendency, institution, and disposal surface for the apex court.</p>
          <p><a class="btn btn--ghost btn--small" href="${profile.sourceUrls.scNjdg}">Open Supreme Court NJDG</a></p>
        </article>
        <article class="card">
          <h3>Official court site</h3>
          <p>Case status, orders, judgments, cause lists, and institutional material remain on the official Supreme Court site.</p>
          <p><a class="btn btn--ghost btn--small" href="${profile.sourceUrls.officialSite}">Open official site</a></p>
        </article>
        <article class="card">
          <h3>Onboarding note</h3>
          <p>The court's own note on Supreme Court onboarding to NJDG and its three-tier position inside the wider system.</p>
          <p><a class="btn btn--ghost btn--small" href="${profile.sourceUrls.onboardingNote}">Open onboarding note</a></p>
        </article>
        <article class="card">
          <h3>FAQ / ready reckoner</h3>
          <p>Official guidance for obtaining Supreme Court information without pretending this page replaces those record-level workflows.</p>
          <p><a class="btn btn--ghost btn--small" href="${profile.sourceUrls.faq}">Open FAQ</a></p>
        </article>
      </div>
    </section>
  `;

  return renderPageShell({
    title: "Supreme Court — NyaayWatch",
    body,
    activeNav: "home",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    ticker: `SUPREME COURT · ${referenceLabel.toUpperCase()} · ${snapshot.snapshot.methodologyVersion}`,
    pageCss: SUPREME_COURT_OVERVIEW_CSS,
    footer: {
      sourceDateLabel: referenceLabel,
      methodologyVersion: snapshot.snapshot.methodologyVersion,
      sourceAttribution: snapshot.snapshot.sourceAttribution,
    },
  });
}

function formatClearanceRateDisplay(disposedCases: number, institutedCases: number) {
  if (institutedCases <= 0) {
    return "—";
  }

  return ((disposedCases / institutedCases) * 100).toFixed(1);
}

function describePileChange(institutedCases: number, disposedCases: number) {
  const difference = institutedCases - disposedCases;
  if (difference === 0) {
    return {
      display: "0",
      note: "Filed and cleared moved in lockstep in the latest monthly window.",
    };
  }

  if (difference > 0) {
    return {
      display: `+${difference.toLocaleString("en-IN")}`,
      note: "More matters were instituted than disposed in the latest monthly window.",
    };
  }

  return {
    display: `−${Math.abs(difference).toLocaleString("en-IN")}`,
    note: "More matters were disposed than instituted in the latest monthly window.",
  };
}

function describeReferenceDate(snapshot: SupremeCourtPublishedSnapshot["snapshot"]) {
  return snapshot.referenceDateKind === "captured_at"
    ? `Captured ${formatDate(snapshot.referenceDateAt)}`
    : `Source snapshot ${formatDate(snapshot.referenceDateAt)}`;
}

const SUPREME_COURT_OVERVIEW_CSS = `
  .sc-section { margin-bottom: 72px; }
  .card-grid--4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  @media (max-width: 1100px) {
    .card-grid--4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 720px) {
    .card-grid--4 { grid-template-columns: 1fr; }
  }
`;

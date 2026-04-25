import type { HighCourtPublishedSnapshot } from "../../domain/high-court-snapshot-schema.js";
import type { HighCourtProfile } from "../../high-courts.js";
import { escapeHtml } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";
import { renderBadge, renderSectionHead, renderStatTile } from "../design/ui.js";
import type { PublicHighCourtPageContext } from "../public-high-court.js";
import { describeClearanceTrend, describePileTrend } from "../home/national-view-model.js";
import { formatDate } from "../home/view-model.js";
import {
  calculateBacklogMovementShare,
  calculateBreakEvenClearancesNeeded,
  calculateCatchUpClearancesPerMonth,
  describeBacklogMovement,
  describeBreakEven,
  describeCatchUp,
  formatShare,
  summarizeHighCourtCaseTypeConcentration,
  summarizeHighCourtCivilCriminalImbalance,
} from "./metric-insights.js";

export function renderHighCourtOverviewPage(
  profile: HighCourtProfile,
  snapshot: HighCourtPublishedSnapshot,
  context: PublicHighCourtPageContext,
): string {
  const referenceLabel = describeReferenceDate(snapshot.snapshot);
  const ageTotal = Object.values(snapshot.ageBuckets).reduce((sum, value) => sum + value, 0);
  const clearanceRateDisplay = formatClearanceRateDisplay(
    snapshot.stats.disposedLastMonthTotalCases,
    snapshot.stats.institutedLastMonthTotalCases,
  );
  const pileChange = describePileChange(
    snapshot.stats.institutedLastMonthTotalCases,
    snapshot.stats.disposedLastMonthTotalCases,
  );
  const olderThanTenYearsShare = ageTotal > 0 ? `${((snapshot.ageBuckets.aboveTenYears / ageTotal) * 100).toFixed(1)}%` : "0.0%";
  const backlogMovement = calculateBacklogMovementShare(
    snapshot.stats.pendingTotalCases,
    snapshot.stats.institutedLastMonthTotalCases,
    snapshot.stats.disposedLastMonthTotalCases,
  );
  const breakEvenClearances = calculateBreakEvenClearancesNeeded(
    snapshot.stats.institutedLastMonthTotalCases,
    snapshot.stats.disposedLastMonthTotalCases,
  );
  const catchUpClearances = calculateCatchUpClearancesPerMonth(
    snapshot.stats.pendingTotalCases,
    snapshot.stats.institutedLastMonthTotalCases,
    snapshot.stats.disposedLastMonthTotalCases,
  );
  const civilCriminalImbalance = summarizeHighCourtCivilCriminalImbalance(snapshot);
  const caseTypeConcentration = summarizeHighCourtCaseTypeConcentration(snapshot);

  const body = `
    <div class="hero-rail">
      ${renderSectionHead({
        eyebrow: "HIGH COURT",
        headline: `What does the latest data show for ${profile.courtName}?`,
        lede:
          `${context.coverageSentence} This page highlights backlog pressure, clearance pace, monthly backlog change, and age-bucket burden from the latest High Court data. It stays court-first and explicit about what the source does and does not support.`,
        isHero: true,
      })}

      <section class="stat-grid">
        ${renderStatTile({
          label: "Pending cases",
          value: snapshot.stats.pendingTotalCases.toLocaleString("en-IN"),
          note: "Open civil and criminal matters combined in the active publication.",
        })}
        ${renderStatTile({
          label: "Cleared / 100 filed",
          value: clearanceRateDisplay,
          note: "How quickly this High Court cleared cases last month.",
          trendSignal: describeClearanceTrend(
            snapshot.stats.disposedLastMonthTotalCases,
            snapshot.stats.institutedLastMonthTotalCases,
          ),
        })}
        ${renderStatTile({
          label: "Last-month backlog change",
          value: pileChange.display,
          note: pileChange.note,
          trendSignal: describePileTrend(
            snapshot.stats.institutedLastMonthTotalCases,
            snapshot.stats.disposedLastMonthTotalCases,
          ),
        })}
        ${renderStatTile({
          label: "Older than 10 years",
          value: snapshot.ageBuckets.aboveTenYears.toLocaleString("en-IN"),
          note: `${olderThanTenYearsShare} of visible pendency is already older than 10 years.`,
          tone: "accent",
        })}
      </section>
    </div>

    <section class="hc-section">
      ${renderSectionHead({
        headline: "Scale-aware pressure signals",
        lede:
          "These derived metrics compare last month's movement against the size and shape of this High Court's pending load. They are descriptive signals, not forecasts.",
      })}
      <div class="stat-grid">
        ${renderStatTile({
          label: "Backlog movement",
          value: `${backlogMovement > 0 ? "+" : ""}${backlogMovement.toFixed(1)}%`,
          note: describeBacklogMovement(backlogMovement),
          methodologyHref: `${context.routes.methodology}#metric-backlog-movement`,
        })}
        ${renderStatTile({
          label: "Break-even clearances",
          value: breakEvenClearances.toLocaleString("en-IN"),
          note: describeBreakEven(breakEvenClearances),
          methodologyHref: `${context.routes.methodology}#metric-break-even-clearances`,
        })}
        ${renderStatTile({
          label: "10% reduction scenario",
          value: catchUpClearances.toLocaleString("en-IN"),
          note: describeCatchUp(catchUpClearances),
          tone: "flag",
          methodologyHref: `${context.routes.methodology}#metric-catch-up-burden`,
        })}
        ${renderStatTile({
          label: "Criminal imbalance",
          value: civilCriminalImbalance.value,
          note: civilCriminalImbalance.note,
          tone: "accent",
          methodologyHref: `${context.routes.methodology}#metric-civil-criminal-imbalance`,
        })}
      </div>
    </section>

    <section class="hc-section hc-section--compact">
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>Coverage</h3>
          <p><strong>Current coverage:</strong> ${escapeHtml(context.coverageLabel)}</p>
          <p>This page follows one High Court publication, even when the court serves more than one state or union territory.</p>
        </article>
        <article class="card">
          <h3>Page scope</h3>
          <p>${escapeHtml(context.publicScopeDescription)}</p>
          <p>The court itself stays explicit here, even when its jurisdiction spans more than one geography.</p>
        </article>
      </div>
    </section>

    <section class="hc-section">
      ${renderSectionHead({
        headline: "How to read this page",
        lede:
          "This High Court page stays anchored to one published aggregate snapshot, with explicit methodology and official source links.",
      })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>Snapshot basis</h3>
          <p>${escapeHtml(context.coverageSentence)} It is snapshot-based, not live, and every public number comes from a stored published artifact.</p>
          <p>${renderBadge({ label: snapshot.snapshot.qualityState, tone: snapshot.snapshot.qualityState === "complete" ? "complete" : "flag" })}</p>
        </article>
        <article class="card">
          <h3>Reference date</h3>
          <p>${escapeHtml(referenceLabel)}</p>
          <p>${
            snapshot.snapshot.referenceDateKind === "captured_at"
              ? "HC NJDG did not expose a trustworthy source snapshot timestamp, so NyaayWatch shows the page capture time instead of inventing one."
              : "The official source exposed a usable source snapshot timestamp, so that source date is shown directly."
          }</p>
        </article>
      </div>
    </section>

    <section class="hc-section">
      ${renderSectionHead({
        headline: "Age-bucket burden",
        lede:
          "These buckets come directly from the official High Court dashboard. They show where the pending load is sitting, not the story of any individual case.",
      })}
      <div class="stat-grid stat-grid--5">
        ${renderAgeBucket("Less than 1 year", snapshot.ageBuckets.lessThanOneYear, ageTotal)}
        ${renderAgeBucket("1 to 3 years", snapshot.ageBuckets.oneToThreeYears, ageTotal)}
        ${renderAgeBucket("3 to 5 years", snapshot.ageBuckets.threeToFiveYears, ageTotal)}
        ${renderAgeBucket("5 to 10 years", snapshot.ageBuckets.fiveToTenYears, ageTotal)}
        ${renderAgeBucket("Above 10 years", snapshot.ageBuckets.aboveTenYears, ageTotal, "accent")}
      </div>
      <p class="hc-section__note">${formatShare(calculateFivePlusShare(snapshot.ageBuckets, ageTotal))} of visible pendency is older than 5 years.</p>
    </section>

    ${caseTypeConcentration ? `
      <section class="hc-section">
        ${renderSectionHead({
          headline: "Case-type concentration",
          lede:
            "Where the source exposes a case-type breakdown, this shows whether pending cases are concentrated in a few categories or spread across the docket.",
        })}
        <div class="stat-grid">
          ${renderStatTile({
            label: "Top 5 case types",
            value: formatShare(caseTypeConcentration.topFiveShare),
            note: "Share of this High Court's pending cases held by the five largest source case-type rows.",
            methodologyHref: `${context.routes.methodology}#metric-backlog-concentration`,
          })}
          ${renderStatTile({
            label: "Largest case type",
            value: caseTypeConcentration.topCaseType ?? "—",
            note: `${formatShare(caseTypeConcentration.topCaseShare)} of pending cases in this publication.`,
          })}
        </div>
      </section>
    ` : ""}

    <section class="hc-section">
      ${renderSectionHead({
        headline: "Official source links",
        lede:
          "Use these links to go from public accountability data to the official court systems and institutional sources behind it.",
      })}
      <div class="card-grid card-grid--3">
        <article class="card">
          <h3>HC NJDG dashboard</h3>
          <p>Official aggregate pendency, institution, disposal, and age-bucket surface for this High Court.</p>
          <p><a class="btn btn--ghost btn--small" href="${profile.sourceUrls.hcNjdg}">Open HC NJDG</a></p>
        </article>
        <article class="card">
          <h3>High Court Services</h3>
          <p>Official case-status, cause-list, order, and court-record utilities for High Courts.</p>
          <p><a class="btn btn--ghost btn--small" href="${profile.sourceUrls.hcServices}">Open High Court Services</a></p>
        </article>
        <article class="card">
          <h3>Official court site</h3>
          <p>Institutional site for rules, notices, annual reports, and supporting public information.</p>
          <p><a class="btn btn--ghost btn--small" href="${profile.sourceUrls.officialSite ?? profile.sourceUrls.hcServices}">Open official site</a></p>
        </article>
      </div>
    </section>
  `;

  return renderPageShell({
    title: `${profile.courtName} — NyaayWatch`,
    body,
    activeNav: "home",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    stateLinks: context.highCourtLinks,
    ticker: `${profile.courtName.toUpperCase()} · ${referenceLabel.toUpperCase()} · ${snapshot.snapshot.methodologyVersion}`,
    pageCss: HIGH_COURT_OVERVIEW_CSS,
    footer: {
      sourceDateLabel: referenceLabel,
      methodologyVersion: snapshot.snapshot.methodologyVersion,
      sourceAttribution: snapshot.snapshot.sourceAttribution,
    },
  });
}

function describeReferenceDate(snapshot: HighCourtPublishedSnapshot["snapshot"]) {
  return snapshot.referenceDateKind === "captured_at"
    ? `Captured ${formatDate(snapshot.referenceDateAt)}`
    : `Source snapshot ${formatDate(snapshot.referenceDateAt)}`;
}

function renderAgeBucket(
  label: string,
  value: number,
  total: number,
  tone?: "accent" | "flag",
) {
  const share = total > 0 ? `${((value / total) * 100).toFixed(1)}% of visible pendency` : "No visible pendency";
  return renderStatTile({
    label,
    value: value.toLocaleString("en-IN"),
    note: share,
    tone,
  });
}

function calculateFivePlusShare(ageBuckets: HighCourtPublishedSnapshot["ageBuckets"], total: number) {
  if (total <= 0) {
    return 0;
  }
  return ((ageBuckets.fiveToTenYears + ageBuckets.aboveTenYears) / total) * 100;
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
      note: "Filings and clearances matched last month.",
    };
  }

  if (difference > 0) {
    return {
      display: `+${difference.toLocaleString("en-IN")}`,
      note: "More cases were filed than cleared last month.",
    };
  }

  return {
    display: `−${Math.abs(difference).toLocaleString("en-IN")}`,
    note: "More cases were cleared than filed last month.",
  };
}

const HIGH_COURT_OVERVIEW_CSS = `
  .hc-section { margin-bottom: 72px; }
  .hc-section--compact { margin-bottom: 28px; }
  .hc-section__note { margin-top: 18px; color: var(--ink-muted); font-size: 14px; }
  .stat-grid--5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
  .stat-grid--5 .stat-tile__value { font-size: clamp(40px, 4cqw, 52px); }
  @media (max-width: 1100px) {
    .stat-grid--5 { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 32px; }
    .stat-grid--5 > .stat-tile:nth-child(3) { border-left: none; padding-left: 0; }
  }
  @media (max-width: 720px) {
    .stat-grid--5 { grid-template-columns: 1fr; row-gap: 28px; }
    .stat-grid--5 > .stat-tile { border-left: none; padding: 0; }
  }
`;

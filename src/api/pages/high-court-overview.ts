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
import { INVESTIGATION_WORKFLOW_CSS, renderInvestigationWorkflow } from "./investigation-workflow.js";

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
          `${context.coverageSentence} This page shows backlog pressure, clearance pace, monthly backlog change, and the age of pending cases.`,
        isHero: true,
      })}

      <section class="stat-grid">
        ${renderStatTile({
          label: "Pending cases",
          value: snapshot.stats.pendingTotalCases.toLocaleString("en-IN"),
          note: "Open civil and criminal cases combined.",
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

    ${renderInvestigationWorkflow({
      headline: "Explore this High Court",
      lede:
        "Compare this court with other High Courts on their own pages. Lower-court pages report a different court tier.",
      steps: [
        {
          eyebrow: "01",
          title: "Start with this court",
          body: "Review pending cases, clearance pace, backlog change, and case ages for this High Court.",
          href: context.routes.methodology,
          cta: "Read methodology",
        },
        {
          eyebrow: "02",
          title: "Scan High Courts",
          body: "Compare High Court figures alongside each court's coverage and source notes.",
          href: "/high-courts",
          cta: "Open High Courts",
        },
        {
          eyebrow: "03",
          title: "Move to lower courts",
          body: "Use the map to open state, Union Territory, and district pages. They report lower-court figures.",
          href: "/#map",
          cta: "Open map",
        },
        {
          eyebrow: "04",
          title: "Cite or reuse",
          body: "Use the data and API pages for figures, or the press kit for citation wording.",
          href: context.routes.data,
          cta: "Open data",
        },
      ],
    })}

    <section class="hc-section">
      ${renderSectionHead({
        headline: "Filing and clearance measures",
        lede:
          "These metrics compare last month's filings and clearances with this High Court's pending cases. They describe recent changes, not future outcomes.",
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
          <p>This page reports one High Court's figures, including when its jurisdiction covers more than one state or Union Territory.</p>
        </article>
        <article class="card">
          <h3>Page scope</h3>
          <p>${escapeHtml(context.publicScopeDescription)}</p>
        </article>
      </div>
    </section>

    <section class="hc-section">
      ${renderSectionHead({
        headline: "Snapshot and source dates",
        lede:
          "The figures below come from one published aggregate snapshot. The methodology and source links are listed here.",
      })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>Snapshot</h3>
          <p>${escapeHtml(context.coverageSentence)} The figures are snapshot-based, not live. Each number comes from a stored publication.</p>
          <p>${renderBadge({ label: snapshot.snapshot.qualityState, tone: snapshot.snapshot.qualityState === "complete" ? "complete" : "flag" })}</p>
        </article>
        <article class="card">
          <h3>Reference date</h3>
          <p>${escapeHtml(referenceLabel)}</p>
          <p>${
            snapshot.snapshot.referenceDateKind === "captured_at"
              ? "HC NJDG does not provide a source date, so this page shows when it was captured."
              : "This page shows the date provided by the official source."
          }</p>
        </article>
      </div>
    </section>

    <section class="hc-section">
      ${renderSectionHead({
        headline: "Age of pending cases",
        lede:
          "The official High Court dashboard groups pending cases by age. These counts show age ranges, not individual cases.",
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
        headline: "Official High Court sources",
        lede:
          "Check these figures on HC NJDG or visit the official High Court sites.",
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
    pageCss: HIGH_COURT_OVERVIEW_CSS + INVESTIGATION_WORKFLOW_CSS,
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

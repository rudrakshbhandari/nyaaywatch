import type { DistrictMover, DistrictMoversResult } from "../../services/published-snapshot-service.js";
import { escapeHtml } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";
import type { PublicPageContext } from "../public-state.js";
import { renderSectionHead } from "../design/ui.js";
import { formatDate } from "../home/view-model.js";
import { SITE_ORIGIN } from "../share/site-origin.js";
import { describeWatchlistPersistence, formatClearancePer100, type MonthlyActivityInputs } from "./metric-insights.js";
import { EVIDENCE_ENTRY_POINTS_CSS, EVIDENCE_ENTRY_POINTS_SCRIPT, renderEvidenceEntryPoints } from "./evidence-entry-points.js";
import { INVESTIGATION_WORKFLOW_CSS, renderInvestigationWorkflow } from "./investigation-workflow.js";

export function renderMoversPage(result: DistrictMoversResult, context: PublicPageContext): string {
  const currentDate = formatDate(result.currentSnapshot.referenceDateAt);
  const previousDate = formatDate(result.previousSnapshot.referenceDateAt);

  const biggestJumps = [...result.movers]
    .sort((a, b) => b.backlogDelta - a.backlogDelta)
    .slice(0, 10);

  const fastestImproving = [...result.movers]
    .filter((m) => m.backlogDelta < 0)
    .sort((a, b) => a.backlogDelta - b.backlogDelta)
    .slice(0, 10);

  const biggestRankRises = [...result.movers]
    .filter((m) => m.rankDelta > 0)
    .sort((a, b) => b.rankDelta - a.rankDelta)
    .slice(0, 10);
  const comparisonHref =
    biggestJumps.length >= 2
      ? context.routes.compare(biggestJumps[0].districtId, biggestJumps[1].districtId)
      : context.routes.districts;
  const moversCitation = `NyaayWatch. "Snapshot Movers for ${result.currentSnapshot.stateName}." ${currentDate} compared with ${previousDate}. ${result.currentSnapshot.sourceAttribution}. ${SITE_ORIGIN}${context.routes.movers}`;
  const topMoverCitation = biggestJumps[0]
    ? buildDistrictCitation(biggestJumps[0].districtName, currentDate, result.currentSnapshot.sourceAttribution, `${SITE_ORIGIN}${context.routes.district(biggestJumps[0].districtId)}`)
    : moversCitation;

  const body = `
    <section class="movers-hero">
      <p class="movers-hero__eyebrow">SNAPSHOT MOVERS</p>
      <h1 class="movers-hero__hed">What moved between snapshots?</h1>
      <p class="movers-hero__lede">Comparing the ${escapeHtml(currentDate)} snapshot against ${escapeHtml(previousDate)}. Every row is citeable — both snapshots are published and archived.</p>
      <p class="movers-hero__meta">${escapeHtml(result.currentSnapshot.stateName)} · Source: ${escapeHtml(result.currentSnapshot.sourceAttribution)}</p>
    </section>

    ${renderInvestigationWorkflow({
      headline: "Read movement before making a claim.",
      lede:
        "Movers compare two published snapshots. Use them to choose what deserves closer inspection, then open the district evidence pages before citing the change.",
      steps: [
        {
          eyebrow: "01",
          title: "Start with increases",
          body: "Look for districts where the pending load grew most since the previous published snapshot.",
          href: "#biggest-backlog-increases",
          cta: "See increases",
        },
        {
          eyebrow: "02",
          title: "Compare two movers",
          body: "Put two high-movement districts side by side to separate scale, wait, clearance pace, and rank change.",
          href: comparisonHref,
          cta: "Open comparison",
        },
        {
          eyebrow: "03",
          title: "Inspect evidence",
          body: "Open the district page to see whether the signal persists across history or appears only in one snapshot window.",
          href: biggestJumps[0] ? context.routes.district(biggestJumps[0].districtId) : context.routes.districts,
          cta: "Open top mover",
        },
        {
          eyebrow: "04",
          title: "Cite the snapshot",
          body: "Use CSV and methodology links so the movement window and reference date remain visible beside the number.",
          href: context.routes.data,
          cta: "Open data",
        },
      ],
    })}

    ${renderEvidenceEntryPoints({
      headline: "Download the evidence behind these movers.",
      lede:
        "Use the state pack for the full movers list, then open district packs when you need a specific reference date, method, CSV link, citation text, and caveats together.",
      entries: [
        {
          title: "Movers citation",
          body: "Use this when citing the movement window itself.",
          href: context.routes.movers,
          cta: "Open movers",
          codeLabel: context.routes.movers,
          citationText: moversCitation,
        },
        {
          title: "State evidence pack",
          body: "Best for checking the overall geography, top districts, and links to reusable exports.",
          href: context.routes.stateEvidencePack,
          cta: "Download state JSON",
          codeLabel: context.routes.stateEvidencePack,
        },
        {
          title: "Top mover pack",
          body: biggestJumps[0]
            ? `Best for quoting ${biggestJumps[0].districtName} with its own evidence page, citation text, and CSV link.`
            : "Best for quoting a district with its own evidence page, citation text, and CSV link.",
          href: biggestJumps[0] ? context.routes.districtEvidencePack(biggestJumps[0].districtId) : context.routes.stateEvidencePack,
          cta: biggestJumps[0] ? "Download top mover JSON" : "Download JSON",
          codeLabel: biggestJumps[0] ? context.routes.districtEvidencePack(biggestJumps[0].districtId) : context.routes.stateEvidencePack,
          citationText: topMoverCitation,
        },
        {
          title: "Data download page",
          body: "Use this when you need CSV files, API paths, and the public-data boundary in one place.",
          href: context.routes.data,
          cta: "Open data downloads",
          codeLabel: context.routes.data,
        },
      ],
    })}

    <section class="movers-section" id="biggest-backlog-increases">
      ${renderSectionHead({
        headline: "Biggest backlog increases.",
        lede: "Districts where the backlog grew most since the previous published snapshot.",
      })}
      ${renderMoversTable(biggestJumps, "backlog-increase", context)}
    </section>

    <section class="movers-section">
      ${renderSectionHead({
        headline: "Fastest improving.",
        lede: "Districts where the backlog shrank most since the previous published snapshot.",
      })}
      ${fastestImproving.length > 0
        ? renderMoversTable(fastestImproving, "backlog-decrease", context)
        : `<p class="movers-empty">No districts showed a backlog decrease in this snapshot window.</p>`
      }
    </section>

    <section class="movers-section">
      ${renderSectionHead({
        headline: "Biggest rank declines.",
        lede: "Districts whose Watch rank worsened most — the pressure signal moved them up the list relative to their peers.",
      })}
      ${biggestRankRises.length > 0
        ? renderRankTable(biggestRankRises, context)
        : `<p class="movers-empty">No significant rank changes in this snapshot window.</p>`
      }
    </section>
    ${EVIDENCE_ENTRY_POINTS_SCRIPT}
  `;

  return renderPageShell({
    title: `Snapshot Movers — NyaayWatch`,
    body,
    activeNav: "districts",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    stateLinks: context.stateLinks,
    ticker: `${escapeHtml(result.currentSnapshot.stateName.toUpperCase())} · MOVERS · ${escapeHtml(currentDate)} vs ${escapeHtml(previousDate)}`,
    footer: {
      sourceDateLabel: currentDate,
      methodologyVersion: result.currentSnapshot.methodologyVersion,
      sourceAttribution: result.currentSnapshot.sourceAttribution,
    },
    pageCss: MOVERS_PAGE_CSS + INVESTIGATION_WORKFLOW_CSS + EVIDENCE_ENTRY_POINTS_CSS,
    og: {
      title: `Snapshot Movers — ${result.currentSnapshot.stateName} — NyaayWatch`,
      description: `Which districts moved most between the ${previousDate} and ${currentDate} published snapshots? Biggest backlog increases, fastest-improving, and biggest rank changes.`,
    },
  });
}

function buildDistrictCitation(districtName: string, snapshotDate: string, sourceAttribution: string, url: string): string {
  return `NyaayWatch. "${districtName} District Court Backlog." ${snapshotDate}. ${sourceAttribution}. ${url}`;
}

function renderMoversTable(movers: DistrictMover[], kind: "backlog-increase" | "backlog-decrease", context: PublicPageContext): string {
  if (movers.length === 0) return `<p class="movers-empty">No data available.</p>`;
  const rows = movers.map((m) => {
    const delta = m.backlogDelta;
    const magnitude = Math.abs(delta).toLocaleString("en-IN");
    // Red for worse (pile grew), green for improved (pile shrank). The arrow
    // carries the sign; the color carries the sentiment.
    const deltaStr = kind === "backlog-increase" ? `▲ ${magnitude} worse` : `▼ ${magnitude} better`;
    const tone = kind === "backlog-increase" ? "movers-delta--worse" : "movers-delta--better";
    return `<tr>
      <td><a href="${context.routes.district(m.districtId)}">${escapeHtml(m.districtName)}</a></td>
      <td class="num">#${m.rank}</td>
      <td class="num">${m.backlogCases.toLocaleString("en-IN")}</td>
      <td class="num movers-delta ${tone}">${deltaStr}</td>
      <td class="num">${formatClearancePer100(monthlyActivityInputs(m), 1)}</td>
      <td>${escapeHtml(describeWatchlistPersistence(m.watchlistFlaggedInLastSix, m.watchlistLastSixWindow))}</td>
      <td><a href="${context.routes.districtEvidencePack(m.districtId)}">Evidence JSON</a></td>
    </tr>`;
  }).join("");

  return `
    <div class="movers-table-wrap">
      <table class="data-table movers-table">
        <thead>
          <tr>
            <th>District</th>
            <th>Rank</th>
            <th>Cases waiting</th>
            <th>Change</th>
            <th>Cleared / 100</th>
            <th>Repeat signal</th>
            <th>Use</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderRankTable(movers: DistrictMover[], context: PublicPageContext): string {
  const rows = movers.map((m) => {
    const places = Math.abs(m.rankDelta);
    const previousRank = m.rank - m.rankDelta;
    return `<tr>
      <td><a href="${context.routes.district(m.districtId)}">${escapeHtml(m.districtName)}</a></td>
      <td class="num">#${previousRank} → #${m.rank}</td>
      <td class="num movers-delta movers-delta--worse">Worsened ${places} place${places === 1 ? "" : "s"}</td>
      <td class="num">${m.backlogCases.toLocaleString("en-IN")}</td>
      <td>${escapeHtml(describeWatchlistPersistence(m.watchlistFlaggedInLastSix, m.watchlistLastSixWindow))}</td>
      <td><a href="${context.routes.districtEvidencePack(m.districtId)}">Evidence JSON</a></td>
    </tr>`;
  }).join("");

  return `
    <div class="movers-table-wrap">
      <table class="data-table movers-table">
        <thead>
          <tr>
            <th>District</th>
            <th>Rank (prev → now)</th>
            <th>Rank change</th>
            <th>Cases waiting</th>
            <th>Repeat signal</th>
            <th>Use</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

export function renderMoversUnavailable(context: PublicPageContext): string {
  return renderPageShell({
    title: "Movers — NyaayWatch",
    body: `<section style="padding:60px 0"><h1>Movers not available yet</h1><p>Mover calculations require at least two published snapshots. Check back after the next publication.</p><p><a href="${context.routes.districts}">← All districts</a></p></section>`,
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    stateLinks: context.stateLinks,
    footer: { sourceDateLabel: null, methodologyVersion: null, sourceAttribution: null },
  });
}

const MOVERS_PAGE_CSS = `
  .movers-hero { padding: 36px 0 48px; max-width: 820px; }
  .movers-hero__eyebrow {
    margin: 0 0 14px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.18em;
    color: var(--accent);
  }
  .movers-hero__hed {
    margin: 0 0 16px;
    font-size: clamp(36px, 5vw, 60px);
    line-height: 0.98; letter-spacing: -0.04em;
  }
  .movers-hero__lede { margin: 0 0 10px; font-size: clamp(16px, 1.5vw, 19px); color: var(--ink-soft); font-weight: 500; line-height: 1.5; }
  .movers-hero__meta { margin: 0; font-size: 12px; color: var(--ink-muted); font-family: "IBM Plex Mono", ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.08em; }

  .movers-section { margin-bottom: 60px; }
  .movers-table-wrap { overflow-x: auto; }
  .movers-delta { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 12px; font-weight: 600; }
  .movers-delta--worse { color: var(--accent-dark); }
  .movers-delta--better { color: #2a7a3f; }
  .movers-empty { color: var(--ink-muted); font-size: 14px; margin: 0; }
`;

function monthlyActivityInputs(input: {
  backlogCases: number;
  filedLastMonthCases: number;
  clearedLastMonthCases: number;
}): MonthlyActivityInputs {
  return {
    pendingCases: input.backlogCases,
    filedLastMonthCases: input.filedLastMonthCases,
    clearedLastMonthCases: input.clearedLastMonthCases,
  };
}

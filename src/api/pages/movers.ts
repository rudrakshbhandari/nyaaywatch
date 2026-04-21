import type { DistrictMover, DistrictMoversResult } from "../../services/published-snapshot-service.js";
import { escapeHtml } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";
import type { PublicPageContext } from "../public-state.js";
import { renderSectionHead } from "../design/ui.js";
import { formatDate } from "../home/view-model.js";

export function renderMoversPage(result: DistrictMoversResult, context: PublicPageContext): string {
  const currentDate = formatDate(result.currentSnapshot.sourceSnapshotAt);
  const previousDate = formatDate(result.previousSnapshot.sourceSnapshotAt);

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

  const body = `
    <section class="movers-hero">
      <p class="movers-hero__eyebrow">SNAPSHOT MOVERS</p>
      <h1 class="movers-hero__hed">What moved between snapshots?</h1>
      <p class="movers-hero__lede">Comparing the ${escapeHtml(currentDate)} snapshot against ${escapeHtml(previousDate)}. Every row is citeable — both snapshots are published and archived.</p>
      <p class="movers-hero__meta">${escapeHtml(result.currentSnapshot.stateName)} · Source: ${escapeHtml(result.currentSnapshot.sourceAttribution)}</p>
    </section>

    <section class="movers-section">
      ${renderSectionHead({
        headline: "Biggest backlog increases.",
        lede: "Districts where the pile grew most since the previous published snapshot.",
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
        headline: "Biggest rank rises.",
        lede: "Districts whose Watch rank increased most — meaning the pressure signal worsened relative to other districts.",
      })}
      ${biggestRankRises.length > 0
        ? renderRankTable(biggestRankRises, context)
        : `<p class="movers-empty">No significant rank changes in this snapshot window.</p>`
      }
    </section>
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
    pageCss: MOVERS_PAGE_CSS,
    og: {
      title: `Snapshot Movers — ${result.currentSnapshot.stateName} — NyaayWatch`,
      description: `Which districts moved most between the ${previousDate} and ${currentDate} published snapshots? Biggest backlog increases, fastest-improving, and biggest rank changes.`,
    },
  });
}

function renderMoversTable(movers: DistrictMover[], kind: "backlog-increase" | "backlog-decrease", context: PublicPageContext): string {
  if (movers.length === 0) return `<p class="movers-empty">No data available.</p>`;
  const rows = movers.map((m) => {
    const delta = m.backlogDelta;
    const deltaStr = delta >= 0 ? `▲ ${Math.abs(delta).toLocaleString("en-IN")}` : `▼ ${Math.abs(delta).toLocaleString("en-IN")}`;
    const tone = kind === "backlog-increase" ? "movers-delta--up" : "movers-delta--down";
    return `<tr>
      <td><a href="${context.routes.district(m.districtId)}">${escapeHtml(m.districtName)}</a></td>
      <td class="num">#${m.rank}</td>
      <td class="num">${m.backlogCases.toLocaleString("en-IN")}</td>
      <td class="num movers-delta ${tone}">${deltaStr}</td>
      <td class="num">${m.disposalRate.toFixed(1)}</td>
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
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderRankTable(movers: DistrictMover[], context: PublicPageContext): string {
  const rows = movers.map((m) => {
    return `<tr>
      <td><a href="${context.routes.district(m.districtId)}">${escapeHtml(m.districtName)}</a></td>
      <td class="num">#${m.rank}</td>
      <td class="num movers-delta movers-delta--up">▲ ${Math.abs(m.rankDelta)} place${Math.abs(m.rankDelta) === 1 ? "" : "s"}</td>
      <td class="num">${m.backlogCases.toLocaleString("en-IN")}</td>
    </tr>`;
  }).join("");

  return `
    <div class="movers-table-wrap">
      <table class="data-table movers-table">
        <thead>
          <tr>
            <th>District</th>
            <th>Current rank</th>
            <th>Rank change</th>
            <th>Cases waiting</th>
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
  .movers-delta--up { color: var(--accent); }
  .movers-delta--down { color: var(--flag); }
  .movers-empty { color: var(--ink-muted); font-size: 14px; margin: 0; }
`;

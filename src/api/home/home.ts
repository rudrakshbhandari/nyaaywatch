import type { PublishedSnapshot } from "../../domain/snapshot-schema.js";
import { renderPageShell } from "../design/shell.js";
import type { PublicPageContext } from "../public-state.js";
import { infoIcon, renderSectionHead, renderStatTile } from "../design/ui.js";
import { buildCopy } from "./copy.js";
import {
  buildViewModel,
  escapeHtml,
  formatMonth,
  type HomeViewModel,
} from "./view-model.js";
import { SITE_ORIGIN } from "../share/site-origin.js";
import { computeWaitingRoomRates, renderWaitingRoom } from "../landing/waiting-room.js";
import {
  describeBacklogMovement,
  describeBreakEven,
  describeCatchUp,
  describeWatchlistPersistence,
  formatShare,
} from "../pages/metric-insights.js";

export function renderHome(snapshot: PublishedSnapshot, context: PublicPageContext): string {
  const model = buildViewModel(snapshot);
  const copy = buildCopy(model, context.publicScopeDescription, context.lowerCourtCopy);
  const n = copy.bigNumbers;

  const trendBars = renderTrendChart(model);
  const watchlistCards = model.topThree
    .map((district, index) => {
      const waitMonths = Math.round(district.medianAgeDays / 30);
      return `<article class="watch-card">
        <div class="watch-card__rank">No. ${index + 1}</div>
        <h3 class="watch-card__name"><a href="${context.routes.district(district.districtId)}">${escapeHtml(district.districtName)}</a></h3>
        <p class="watch-card__lede">${escapeHtml(district.summary)}</p>
        <dl class="watch-card__stats">
          <div>
            <dt>Cases waiting ${infoIcon("backlog")}</dt>
            <dd>${district.backlogCases.toLocaleString("en-IN")}</dd>
          </div>
          <div>
            <dt>Typical wait ${infoIcon("typicalWait")}</dt>
            <dd>~${waitMonths} mo</dd>
          </div>
          <div>
            <dt>Cleared per 100 ${infoIcon("clearance")}</dt>
            <dd>${district.disposalRate.toFixed(0)}</dd>
          </div>
        </dl>
        <p class="watch-card__reason"><span class="watch-card__reason-label">Why it is flagged</span>${escapeHtml(district.flagReason)}</p>
      </article>`;
    })
    .join("");

  const waitingRoom = renderWaitingRoom(computeWaitingRoomRates(snapshot));

  const body = `
    ${waitingRoom}
    <section class="hero">
      <p class="hero__eyebrow">${escapeHtml(copy.eyebrow)}</p>
      <h1 class="hero__hed">${escapeHtml(copy.headline)}</h1>
      <p class="hero__lede">${escapeHtml(copy.lede)}</p>
      <div class="hero__cta">
        <a class="btn btn--primary" href="${context.routes.districts}">${escapeHtml(copy.ctaPrimary)} \u2192</a>
        <a class="btn btn--ghost" href="${context.routes.methodology}">${escapeHtml(copy.ctaSecondary)}</a>
      </div>
    </section>

    <section class="numbers" aria-label="Headline numbers">
      <div class="numbers__grid">
        <article class="numbers__cell numbers__cell--reveal" id="stat-pending">
          <div class="numbers__value">${escapeHtml(extractLakhDigits(model.pendingLakh))}<span class="numbers__unit">${escapeHtml(extractLakhUnit(model.pendingLakh))}</span></div>
          <div class="numbers__label"><a href="${context.routes.methodology}#metric-backlog">${escapeHtml(n.pending.label)}</a> ${infoIcon("backlog")}</div>
          <p class="numbers__caption">${escapeHtml(n.pending.caption)}</p>
        </article>
        <article class="numbers__cell numbers__cell--reveal" id="stat-wait">
          <div class="numbers__value">~${model.typicalWaitMonths}<span class="numbers__unit">mo</span></div>
          <div class="numbers__label"><a href="${context.routes.methodology}#metric-typical-wait">${escapeHtml(n.wait.label)}</a> ${infoIcon("typicalWait")}</div>
          <p class="numbers__caption">${escapeHtml(n.wait.caption)}</p>
        </article>
        <article class="numbers__cell numbers__cell--reveal" id="stat-clearance">
          <div class="numbers__value">${model.clearanceRate.toFixed(0)}</div>
          <div class="numbers__label"><a href="${context.routes.methodology}#metric-clearance">${escapeHtml(n.clearance.label)}</a> ${infoIcon("clearance")}</div>
          <p class="numbers__caption">${escapeHtml(n.clearance.caption)}</p>
        </article>
        <article class="numbers__cell numbers__cell--reveal" id="stat-flagged">
          <div class="numbers__value">${model.flaggedCount.toLocaleString("en-IN")}</div>
          <div class="numbers__label"><a href="${context.routes.methodology}#metric-watchlist">${escapeHtml(n.flagged.label)}</a> ${infoIcon("watchlist")}</div>
          <p class="numbers__caption">${escapeHtml(n.flagged.caption)}</p>
        </article>
      </div>
    </section>

    <section class="metric-deepening">
      ${renderSectionHead({
        headline: "What the pressure means.",
        lede:
          "These numbers add scale and persistence to the headline backlog. They are scenarios and signals from the same published data, not predictions.",
      })}
      <div class="stat-grid">
        ${renderStatTile({
          label: "Older than 5 years",
          value: formatShare(snapshot.stats.oldCaseBurden.fivePlusYearsShare),
          note: `${snapshot.stats.oldCaseBurden.fivePlusYearsCases.toLocaleString("en-IN")} pending cases are already older than 5 years.`,
          tone: "accent",
          methodologyHref: `${context.routes.methodology}#metric-old-case-burden`,
        })}
        ${renderStatTile({
          label: "Backlog movement",
          value: `${snapshot.stats.backlogMovementShare > 0 ? "+" : ""}${snapshot.stats.backlogMovementShare.toFixed(1)}%`,
          note: describeBacklogMovement(snapshot.stats.backlogMovementShare),
          methodologyHref: `${context.routes.methodology}#metric-backlog-movement`,
        })}
        ${renderStatTile({
          label: "Break-even clearances",
          value: snapshot.stats.breakEvenClearancesNeeded.toLocaleString("en-IN"),
          note: describeBreakEven(snapshot.stats.breakEvenClearancesNeeded),
          methodologyHref: `${context.routes.methodology}#metric-break-even-clearances`,
        })}
        ${renderStatTile({
          label: "10% reduction scenario",
          value: snapshot.stats.catchUpClearancesPerMonth.toLocaleString("en-IN"),
          note: describeCatchUp(snapshot.stats.catchUpClearancesPerMonth),
          tone: "flag",
          methodologyHref: `${context.routes.methodology}#metric-catch-up-burden`,
        })}
      </div>
      <div class="stat-grid metric-deepening__secondary">
        ${renderStatTile({
          label: "Top 5 district share",
          value: formatShare(snapshot.stats.backlogConcentration.topFiveDistrictsShare),
          note: "Share of the pending load held by the five largest district backlogs.",
          methodologyHref: `${context.routes.methodology}#metric-backlog-concentration`,
        })}
        ${renderStatTile({
          label: "Top district persistence",
          value: `${model.topDistrict.watchlistPersistence.flaggedInLastSix}/${model.topDistrict.watchlistPersistence.lastSixWindow}`,
          note: describeWatchlistPersistence(
            model.topDistrict.watchlistPersistence.flaggedInLastSix,
            model.topDistrict.watchlistPersistence.lastSixWindow,
          ),
          methodologyHref: `${context.routes.methodology}#metric-watchlist-persistence`,
        })}
      </div>
    </section>

    <script>
    (function() {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      var cells = document.querySelectorAll(".numbers__cell--reveal");
      if (!cells.length || !window.IntersectionObserver) return;
      var triggered = false;
      var observer = new IntersectionObserver(function(entries) {
        if (triggered) return;
        var visible = entries.some(function(e) { return e.isIntersecting; });
        if (!visible) return;
        triggered = true;
        observer.disconnect();
        cells.forEach(function(cell, i) {
          setTimeout(function() { cell.classList.add("numbers__cell--visible"); }, i * 180);
        });
      }, { threshold: 0.2 });
      cells.forEach(function(cell) { observer.observe(cell); });
    })();
    </script>

    <section class="watchlist">
      <header class="section-head">
        <h2>${escapeHtml(copy.sectionWatchlist)}</h2>
        <p class="section-head__lede">${escapeHtml(copy.sectionWatchlistLede)}</p>
      </header>
      <div class="watchlist__grid">${watchlistCards}</div>
    </section>

    <section class="trend">
      <header class="section-head">
        <h2>${escapeHtml(copy.sectionTrend)}</h2>
        <p class="section-head__lede">${escapeHtml(copy.sectionTrendLede)}</p>
      </header>
      ${trendBars}
    </section>

    <section class="about">
      <header class="section-head">
        <h2>${escapeHtml(copy.sectionWhat)}</h2>
      </header>
      <p class="about__body">${escapeHtml(copy.sectionWhatBody)}</p>
    </section>
  `;

  const stateSlug = context.profile.stateSlug;
  const ogDescription = `${model.pendingLakh} cases are waiting in ${context.profile.stateName}'s courts. The typical case has been waiting about ${model.typicalWaitMonths} months. NyaayWatch — court transparency for India.`;

  return renderPageShell({
    title: `${copy.brand} \u2014 ${copy.headline}`,
    body,
    activeNav: "home",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    stateLinks: context.stateLinks,
    ticker: copy.ticker,
    pageCss: HOME_PAGE_CSS,
    footer: {
      sourceDateLabel: model.sourceDateLabel,
      methodologyVersion: model.methodologyVersion,
      sourceAttribution: model.sourceAttribution,
    },
    og: {
      title: copy.headline,
      description: ogDescription,
      image: `${SITE_ORIGIN}/og/state/${stateSlug}.png?v=2026-04-5`,
      imageAlt: `NyaayWatch — ${copy.headline}`,
    },
  });
}

function extractLakhDigits(formatted: string): string {
  const match = formatted.match(/^([\d.,]+)\s*(lakh|crore)?$/i);
  if (match && match[1]) return match[1];
  return formatted;
}

function extractLakhUnit(formatted: string): string {
  const match = formatted.match(/^[\d.,]+\s*(lakh|crore)$/i);
  if (match && match[1]) return match[1];
  return "";
}

function renderTrendChart(model: HomeViewModel): string {
  const max = Math.max(...model.trendsOldestFirst.map((point) => point.pendingCases));
  const rows = model.trendsOldestFirst
    .map((point) => {
      const width = max > 0 ? (point.pendingCases / max) * 100 : 0;
      return `<li class="trend-row">
        <span class="trend-row__label">${escapeHtml(formatMonth(point.snapshotDate))}</span>
        <span class="trend-row__bar"><span style="width: ${width.toFixed(1)}%"></span></span>
        <span class="trend-row__value">${point.pendingCases.toLocaleString("en-IN")}</span>
      </li>`;
    })
    .join("");
  return `<ol class="trend-list" aria-label="Backlog over time">${rows}</ol>`;
}

/**
 * Homepage-only CSS. Everything site-wide (tokens, masthead, colophon,
 * info-icon, buttons, section-head, stat-grid, data-table) lives in
 * src/api/design/styles.ts; this block only covers the hero + colossal-
 * numbers centerpiece + watchlist cards + trend list that exist on `/`.
 */
const HOME_PAGE_CSS = `
  .hero { padding: 40px 0 48px; }
  .hero__eyebrow {
    margin: 0 0 14px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.18em;
    color: var(--accent);
  }
  .hero__hed {
    margin: 0 0 22px;
    max-width: 18ch;
    font-size: clamp(36px, 5.6vw, 68px);
    line-height: 0.98;
    letter-spacing: -0.035em;
    text-wrap: balance;
  }
  .hero__lede {
    margin: 0 0 30px;
    font-size: clamp(17px, 1.7vw, 20px);
    line-height: 1.52;
    color: var(--ink-soft);
    max-width: 56ch;
    font-weight: 500;
  }
  .hero__cta { display: flex; gap: 12px; flex-wrap: wrap; }

  /* --- THE CENTERPIECE --- */
  .numbers {
    border-top: 2px solid var(--ink);
    border-bottom: 2px solid var(--ink);
    padding: 52px 0 60px;
    margin: 16px 0 104px;
    position: relative;
  }
  .numbers::before {
    content: "LOWER COURTS";
    position: absolute; top: -10px; left: 0;
    background: var(--paper);
    padding: 0 14px 0 0;
    font-family: "IBM Plex Mono", monospace;
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.18em;
    color: var(--ink-muted);
  }
  .numbers::after {
    content: "";
    position: absolute; top: -10px; right: 0;
    width: 10px; height: 10px;
    background: var(--accent);
    border-radius: 999px;
    box-shadow: 0 0 0 4px var(--paper);
  }
  .numbers__grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0; }
  .numbers__cell {
    position: relative;
    padding: 0 24px 0 28px;
    border-left: 1px solid var(--rule);
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-height: 280px;
    min-width: 0;
  }
  .numbers__cell:first-child { border-left: none; padding-left: 0; }
  .numbers__cell:last-child { padding-right: 0; }
  .numbers__value {
    font-family: "Inter Tight", sans-serif;
    font-weight: 900;
    font-size: clamp(72px, 8.6vw, 112px);
    line-height: 0.88;
    letter-spacing: -0.048em;
    font-variant-numeric: lining-nums tabular-nums;
    color: var(--ink);
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: -8px;
  }
  .numbers__unit {
    font-size: 0.26em;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--ink-muted);
    text-transform: lowercase;
    white-space: nowrap;
  }
  .numbers__label {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--ink-muted);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding-top: 4px;
    border-top: 1px solid var(--rule);
    align-self: flex-start;
    padding-right: 12px;
  }
  .numbers__caption {
    margin: 0;
    font-size: 15px;
    line-height: 1.48;
    color: var(--ink-soft);
    max-width: 32ch;
    font-weight: 500;
  }
  .numbers__cell:first-child .numbers__label {
    border-top: 2px solid var(--accent);
    color: var(--accent-dark);
  }
  .numbers__cell--reveal {
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }
  .numbers__cell--visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* --- watchlist cards --- */
  .watchlist { margin-bottom: 96px; }
  .metric-deepening { margin-bottom: 88px; }
  .metric-deepening__secondary { margin-top: 32px; }
  .watchlist__grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
    background: var(--ink); border: 1px solid var(--ink);
  }
  .watch-card {
    background: var(--paper-bright); padding: 32px 28px;
    display: flex; flex-direction: column; gap: 18px;
    position: relative;
    transition: transform 160ms ease;
  }
  .watch-card::before {
    content: "";
    position: absolute; inset: 0 0 auto 0;
    height: 3px; background: transparent;
    transition: background 160ms ease;
  }
  .watch-card:hover, .watch-card:focus-within { transform: translateY(-2px); }
  .watch-card:hover::before, .watch-card:focus-within::before { background: var(--accent); }
  .watch-card__rank {
    font-family: "IBM Plex Mono", monospace; font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.14em; color: var(--accent);
  }
  .watch-card__name { margin: 0; font-size: 30px; line-height: 1; letter-spacing: -0.03em; }
  .watch-card__name a { color: var(--ink); text-decoration: none; }
  .watch-card__name a:hover { color: var(--accent); }
  .watch-card__lede { margin: 0; color: var(--ink-soft); font-size: 14px; line-height: 1.5; }
  .watch-card__stats {
    margin: 0; padding: 18px 0 0; border-top: 1px solid var(--rule);
    display: grid; grid-template-columns: 1fr; gap: 12px;
  }
  .watch-card__stats div { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .watch-card__stats dt {
    margin: 0; font-family: "IBM Plex Mono", monospace; font-size: 11px; font-weight: 500;
    text-transform: uppercase; letter-spacing: 0.12em;
    color: var(--ink-muted); display: inline-flex; align-items: center; gap: 6px;
  }
  .watch-card__stats dd {
    margin: 0; font-family: "Inter Tight", sans-serif; font-weight: 800; font-size: 22px;
    font-variant-numeric: lining-nums tabular-nums; color: var(--ink);
    letter-spacing: -0.025em;
  }
  .watch-card__reason { margin: 0; font-size: 13px; color: var(--ink-soft); line-height: 1.5; border-top: 1px dashed var(--rule); padding-top: 14px; }
  .watch-card__reason-label {
    display: block; margin-bottom: 4px;
    font-family: "IBM Plex Mono", monospace;
    font-size: 10px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.14em; color: var(--flag);
  }

  /* --- trend list --- */
  .trend { margin-bottom: 96px; }
  .trend-list { margin: 0; padding: 24px 0; list-style: none; border-top: 1px solid var(--ink); border-bottom: 1px solid var(--ink); }
  .trend-row { display: grid; grid-template-columns: 90px 1fr 120px; gap: 16px; align-items: center; padding: 10px 0; font-family: "IBM Plex Mono", monospace; font-size: 13px; font-weight: 500; }
  .trend-row__label { color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.1em; }
  .trend-row__bar { display: block; height: 14px; background: var(--rule-soft); position: relative; overflow: hidden; }
  .trend-row__bar > span {
    display: block; height: 100%; background: var(--accent);
    transform-origin: left center;
    animation: trendBarGrow 700ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
  }
  .trend-row:nth-child(2) .trend-row__bar > span { animation-delay: 40ms; }
  .trend-row:nth-child(3) .trend-row__bar > span { animation-delay: 80ms; }
  .trend-row:nth-child(4) .trend-row__bar > span { animation-delay: 120ms; }
  .trend-row:nth-child(5) .trend-row__bar > span { animation-delay: 160ms; }
  .trend-row:nth-child(6) .trend-row__bar > span { animation-delay: 200ms; }
  .trend-row:nth-child(n+7) .trend-row__bar > span { animation-delay: 240ms; }
  @keyframes trendBarGrow {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  .trend-row__value { text-align: right; font-variant-numeric: lining-nums tabular-nums; color: var(--ink); font-weight: 600; }

  .about { max-width: 720px; margin-bottom: 80px; }
  .about__body { margin: 0; font-size: 18px; line-height: 1.55; color: var(--ink-soft); font-weight: 500; }

  @media (max-width: 1100px) {
    .numbers__grid { grid-template-columns: repeat(2, 1fr); row-gap: 56px; }
    .numbers__cell { min-height: 240px; }
    .numbers__cell:nth-child(3) { border-left: none; padding-left: 0; }
  }
  @media (max-width: 960px) {
    .watchlist__grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 720px) {
    .hero { padding: 32px 0 36px; }
    .numbers { padding: 36px 0 40px; margin-bottom: 72px; }
    .numbers__grid { grid-template-columns: 1fr; row-gap: 48px; }
    .numbers__cell { border-left: none; padding-left: 0; padding-right: 0; min-height: auto; }
    .numbers__value { font-size: clamp(88px, 22vw, 140px); }
    .trend-row { grid-template-columns: 64px 1fr 88px; gap: 12px; font-size: 11px; }
  }
`;

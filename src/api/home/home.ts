import type { PublishedSnapshot } from "../../domain/snapshot-schema.js";
import { buildCopy, GLOSSARY, type GlossaryKey } from "./copy.js";
import {
  buildViewModel,
  escapeHtml,
  formatMonth,
  type HomeViewModel,
} from "./view-model.js";

const FONTS_LINK = `
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />`;

function infoIcon(key: GlossaryKey): string {
  const entry = GLOSSARY[key];
  return `<details class="info" data-term="${key}">
    <summary aria-label="What does ${escapeHtml(entry.term)} mean?">i</summary>
    <div class="info-popover" role="tooltip">
      <strong>${escapeHtml(entry.term)}</strong>
      <p class="info-short">${escapeHtml(entry.short)}</p>
      <p class="info-long">${escapeHtml(entry.long)}</p>
    </div>
  </details>`;
}

export function renderHome(snapshot: PublishedSnapshot): string {
  const model = buildViewModel(snapshot);
  const copy = buildCopy(model);
  const n = copy.bigNumbers;

  const trendBars = renderTrendChart(model);
  const watchlistCards = model.topThree
    .map((district, index) => {
      const waitMonths = Math.round(district.medianAgeDays / 30);
      return `<article class="watch-card">
        <div class="watch-card__rank">No. ${index + 1}</div>
        <h3 class="watch-card__name"><a href="/districts/${escapeHtml(district.districtId)}">${escapeHtml(district.districtName)}</a></h3>
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

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(copy.brand)} \u2014 ${escapeHtml(copy.headline)}</title>
  ${FONTS_LINK}
  <style>${homeCss()}</style>
</head>
<body>
  <header class="masthead">
    <a href="/" class="masthead__brand">
      <span class="masthead__mark">NW</span>
      <span class="masthead__wordmark">NyaayWatch</span>
    </a>
    <nav class="masthead__nav">
      <a href="/districts">Districts</a>
      <a href="/data">Data</a>
      <a href="/methodology">Method</a>
      <a href="/api">API</a>
    </nav>
  </header>

  <div class="ticker">${escapeHtml(copy.ticker)}</div>

  <main>
    <section class="hero">
      <p class="hero__eyebrow">${escapeHtml(copy.eyebrow)}</p>
      <h1 class="hero__hed">${escapeHtml(copy.headline)}</h1>
      <p class="hero__lede">${escapeHtml(copy.lede)}</p>
      <div class="hero__cta">
        <a class="btn btn--primary" href="/districts">${escapeHtml(copy.ctaPrimary)} \u2192</a>
        <a class="btn btn--ghost" href="/methodology">${escapeHtml(copy.ctaSecondary)}</a>
      </div>
    </section>

    <section class="numbers" aria-label="Headline numbers">
      <div class="numbers__grid">
        <article class="numbers__cell">
          <div class="numbers__value">${escapeHtml(extractLakhDigits(model.pendingLakh))}<span class="numbers__unit">${escapeHtml(extractLakhUnit(model.pendingLakh))}</span></div>
          <div class="numbers__label">${escapeHtml(n.pending.label)} ${infoIcon("backlog")}</div>
          <p class="numbers__caption">${escapeHtml(n.pending.caption)}</p>
        </article>
        <article class="numbers__cell">
          <div class="numbers__value">~${model.typicalWaitMonths}<span class="numbers__unit">mo</span></div>
          <div class="numbers__label">${escapeHtml(n.wait.label)} ${infoIcon("typicalWait")}</div>
          <p class="numbers__caption">${escapeHtml(n.wait.caption)}</p>
        </article>
        <article class="numbers__cell">
          <div class="numbers__value">${model.clearanceRate.toFixed(0)}<span class="numbers__unit">/ 100</span></div>
          <div class="numbers__label">${escapeHtml(n.clearance.label)} ${infoIcon("clearance")}</div>
          <p class="numbers__caption">${escapeHtml(n.clearance.caption)}</p>
        </article>
        <article class="numbers__cell">
          <div class="numbers__value">${model.flaggedCount}</div>
          <div class="numbers__label">${escapeHtml(n.flagged.label)} ${infoIcon("watchlist")}</div>
          <p class="numbers__caption">${escapeHtml(n.flagged.caption)}</p>
        </article>
      </div>
    </section>

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
  </main>

  <footer class="colophon">
    <div class="colophon__col">
      <p class="colophon__brand">${escapeHtml(copy.brand)}</p>
      <p>${escapeHtml(copy.brandTag)}</p>
    </div>
    <div class="colophon__col">
      <p>Numbers published ${escapeHtml(model.sourceDateLabel)}</p>
      <p>Source: ${escapeHtml(model.sourceAttribution)} ${infoIcon("source")}</p>
      <p>Method ${escapeHtml(model.methodologyVersion)} ${infoIcon("methodology")}</p>
    </div>
    <div class="colophon__col">
      <a href="/districts">Districts</a>
      <a href="/data">Data downloads</a>
      <a href="/methodology">Methodology</a>
      <a href="/api">API</a>
    </div>
  </footer>
</body>
</html>`;
}

// formatLakh returns strings like "6.17 lakh" or "2.5 crore" or "12,345".
// For display we want the digit portion huge and the unit small, so we split.
function extractLakhDigits(formatted: string): string {
  const match = formatted.match(/^([\d.,]+)\s*(lakh|crore)?$/i);
  if (match && match[1]) {
    return match[1];
  }
  return formatted;
}

function extractLakhUnit(formatted: string): string {
  const match = formatted.match(/^[\d.,]+\s*(lakh|crore)$/i);
  if (match && match[1]) {
    return match[1];
  }
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
  return `<ol class="trend-list" aria-label="Statewide backlog over time">${rows}</ol>`;
}

function homeCss(): string {
  return `
    :root {
      --ink: #0c0a08;
      --ink-soft: #2f2b26;
      --ink-mid: #56514a;
      --ink-muted: #7a756d;
      --rule: #d9d3c8;
      --rule-soft: #e7e1d4;
      --paper: #f4efe3;
      --paper-bright: #fbf7ea;
      --accent: #bd2716;
      --accent-dark: #8a1408;
      --flag: #a0720a;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: "Inter Tight", "Inter", system-ui, -apple-system, sans-serif;
      background: var(--paper);
      color: var(--ink);
      font-size: 17px;
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      font-feature-settings: "ss01", "cv11";
    }
    a { color: var(--accent); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
    a:hover { color: var(--accent-dark); }
    h1, h2, h3 {
      font-family: "Inter Tight", "Inter", system-ui, sans-serif;
      font-weight: 800;
      letter-spacing: -0.025em;
    }

    main { max-width: 1280px; margin: 0 auto; padding: 0 32px 120px; }

    .masthead {
      max-width: 1280px; margin: 0 auto; padding: 32px 32px 22px;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 2px solid var(--ink);
    }
    .masthead__brand { display: flex; align-items: center; gap: 14px; text-decoration: none; color: var(--ink); }
    .masthead__mark {
      display: inline-flex; align-items: center; justify-content: center;
      width: 42px; height: 42px; background: var(--ink); color: var(--paper);
      font-family: "Inter Tight", sans-serif; font-weight: 900; font-size: 18px;
      letter-spacing: -0.03em;
      border-radius: 2px;
    }
    .masthead__wordmark { font-family: "Inter Tight", sans-serif; font-weight: 800; font-size: 26px; letter-spacing: -0.035em; }
    .masthead__nav { display: flex; gap: 22px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }
    .masthead__nav a { color: var(--ink-soft); text-decoration: none; }
    .masthead__nav a:hover { color: var(--accent); }

    .ticker {
      max-width: 1280px; margin: 0 auto; padding: 14px 32px 0;
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 11px; font-weight: 500;
      text-transform: uppercase; letter-spacing: 0.14em;
      color: var(--ink-muted);
    }

    .hero { padding: 40px 0 48px; max-width: 900px; }
    .hero__eyebrow {
      margin: 0 0 14px;
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 12px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.18em;
      color: var(--accent);
    }
    .hero__hed {
      margin: 0 0 22px;
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
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 22px; border-radius: 2px;
      font-weight: 600; font-size: 14px; text-decoration: none;
      letter-spacing: 0.01em;
      border: 1.5px solid var(--ink);
      transition: background 120ms ease, color 120ms ease;
    }
    .btn--primary { background: var(--ink); color: var(--paper); }
    .btn--primary:hover { background: var(--accent); border-color: var(--accent); color: #fff; }
    .btn--ghost { background: transparent; color: var(--ink); }
    .btn--ghost:hover { background: var(--ink); color: var(--paper); }

    /* --- THE CENTERPIECE --- */
    .numbers {
      border-top: 2px solid var(--ink);
      border-bottom: 2px solid var(--ink);
      padding: 52px 0 60px;
      margin: 16px 0 104px;
      position: relative;
    }
    .numbers::before {
      content: "STATEWIDE";
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
    .numbers__grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0;
    }
    .numbers__cell {
      position: relative;
      padding: 0 24px 0 28px;
      border-left: 1px solid var(--rule);
      display: flex;
      flex-direction: column;
      gap: 14px;
      min-height: 280px;
    }
    .numbers__cell:first-child { border-left: none; padding-left: 0; }
    .numbers__cell:last-child { padding-right: 0; }
    .numbers__value {
      font-family: "Inter Tight", sans-serif;
      font-weight: 900;
      font-size: clamp(74px, 10vw, 148px);
      line-height: 0.88;
      letter-spacing: -0.048em;
      font-variant-numeric: lining-nums tabular-nums;
      color: var(--ink);
      display: flex;
      align-items: baseline;
      gap: 6px;
      margin-top: -8px;
    }
    .numbers__unit {
      font-size: 0.26em;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--ink-muted);
      text-transform: lowercase;
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
    /* first cell gets an accent rule under the label to draw the eye */
    .numbers__cell:first-child .numbers__label {
      border-top: 2px solid var(--accent);
      color: var(--accent-dark);
    }
    .numbers__cell:first-child .numbers__value { color: var(--ink); }

    .section-head { margin: 0 0 32px; max-width: 720px; }
    .section-head h2 {
      margin: 0 0 12px;
      font-size: clamp(28px, 3.2vw, 40px); line-height: 1.05;
      letter-spacing: -0.028em;
    }
    .section-head__lede {
      margin: 0;
      color: var(--ink-soft); font-size: 16px; line-height: 1.55;
      font-weight: 500;
    }

    .watchlist { margin-bottom: 96px; }
    .watchlist__grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
      background: var(--ink); border: 1px solid var(--ink);
    }
    .watch-card {
      background: var(--paper-bright); padding: 32px 28px;
      display: flex; flex-direction: column; gap: 18px;
    }
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

    .trend { margin-bottom: 96px; }
    .trend-list { margin: 0; padding: 24px 0; list-style: none; border-top: 1px solid var(--ink); border-bottom: 1px solid var(--ink); }
    .trend-row { display: grid; grid-template-columns: 90px 1fr 120px; gap: 16px; align-items: center; padding: 10px 0; font-family: "IBM Plex Mono", monospace; font-size: 13px; font-weight: 500; }
    .trend-row__label { color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.1em; }
    .trend-row__bar { display: block; height: 14px; background: var(--rule-soft); position: relative; }
    .trend-row__bar > span { display: block; height: 100%; background: var(--accent); }
    .trend-row__value { text-align: right; font-variant-numeric: lining-nums tabular-nums; color: var(--ink); font-weight: 600; }

    .about { max-width: 720px; margin-bottom: 80px; }
    .about__body { margin: 0; font-size: 18px; line-height: 1.55; color: var(--ink-soft); font-weight: 500; }

    .colophon {
      max-width: 1280px; margin: 0 auto; padding: 48px 32px;
      border-top: 2px solid var(--ink);
      display: grid; grid-template-columns: 1.4fr 1.2fr 1fr; gap: 32px;
      font-size: 13px; color: var(--ink-soft);
    }
    .colophon p { margin: 0 0 6px; }
    .colophon__brand { font-family: "Inter Tight", sans-serif; font-weight: 800; font-size: 20px; color: var(--ink); letter-spacing: -0.03em; }
    .colophon__col a { display: block; color: var(--ink); }
    .colophon__col a + a { margin-top: 6px; }

    /* info icon */
    .info { display: inline-block; position: relative; }
    .info summary {
      list-style: none; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      width: 16px; height: 16px; border-radius: 999px;
      border: 1px solid currentColor; color: var(--ink-muted);
      font-family: "Inter Tight", sans-serif; font-weight: 700; font-size: 10px;
      line-height: 1; background: transparent;
      transition: background 120ms ease, color 120ms ease;
    }
    .info summary::-webkit-details-marker { display: none; }
    .info summary::marker { content: ""; }
    .info:hover summary, .info[open] summary, .info summary:focus-visible {
      background: var(--ink); color: var(--paper); border-color: var(--ink);
      outline: none;
    }
    .info-popover {
      position: absolute; z-index: 20; top: calc(100% + 10px); left: 50%;
      transform: translateX(-50%);
      min-width: 260px; max-width: 320px;
      padding: 16px 18px;
      background: var(--paper-bright); color: var(--ink);
      border: 1px solid var(--ink); border-radius: 2px;
      box-shadow: 4px 4px 0 var(--ink);
      font-family: "Inter Tight", sans-serif;
      text-transform: none; letter-spacing: 0;
    }
    .info:hover .info-popover, .info[open] .info-popover, .info:focus-within .info-popover {
      display: block;
    }
    .info .info-popover { display: none; }
    .info-popover strong { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent); }
    .info-popover p { margin: 0 0 8px; font-size: 13px; line-height: 1.5; color: var(--ink-soft); font-weight: 500; }
    .info-popover p:last-child { margin-bottom: 0; }
    .info-short { color: var(--ink) !important; font-weight: 600 !important; }

    @media (max-width: 1100px) {
      .numbers__grid { grid-template-columns: repeat(2, 1fr); row-gap: 56px; }
      .numbers__cell { min-height: 240px; }
      .numbers__cell:nth-child(3) { border-left: none; padding-left: 0; }
    }
    @media (max-width: 960px) {
      .watchlist__grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 720px) {
      .masthead { padding: 22px 18px 16px; flex-wrap: wrap; gap: 18px; }
      .masthead__nav { width: 100%; gap: 14px; overflow-x: auto; }
      .ticker { padding: 12px 18px 0; }
      main { padding: 0 18px 80px; }
      .hero { padding: 32px 0 36px; }
      .colophon { grid-template-columns: 1fr; padding: 36px 18px; }
      .numbers { padding: 36px 0 40px; margin-bottom: 72px; }
      .numbers__grid { grid-template-columns: 1fr; row-gap: 48px; }
      .numbers__cell { border-left: none; padding-left: 0; padding-right: 0; min-height: auto; }
      .numbers__value { font-size: clamp(88px, 22vw, 140px); }
      .trend-row { grid-template-columns: 64px 1fr 88px; gap: 12px; font-size: 11px; }
    }
  `;
}

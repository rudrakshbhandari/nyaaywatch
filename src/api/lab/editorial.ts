import type { PublishedSnapshot } from "../../domain/snapshot-schema.js";
import { buildCopy, GLOSSARY, type GlossaryKey } from "./copy.js";
import {
  buildViewModel,
  escapeHtml,
  formatDate,
  formatMonth,
  type LabViewModel,
} from "./shared.js";

const FONTS_LINK = `
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700;9..144,900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />`;

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

function renderVariantSwitcher(active: "editorial"): string {
  return `<div class="lab-switcher" aria-label="Design variants">
    <a href="/lab" class="lab-switcher__home">\u2190 Lab</a>
    <span class="lab-switcher__sep"></span>
    <span class="lab-switcher__label">Viewing</span>
    <strong>Editorial</strong>
    <nav class="lab-switcher__nav">
      <a href="/lab/editorial" class="${active === "editorial" ? "is-active" : ""}">Editorial</a>
      <a href="/lab/terminal">Terminal</a>
      <a href="/lab/product">Product</a>
      <a href="/lab/civic">Civic</a>
    </nav>
  </div>`;
}

export function renderEditorialHome(snapshot: PublishedSnapshot): string {
  const model = buildViewModel(snapshot);
  const copy = buildCopy(model);
  const e = copy.editorial;

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
            <dd>~${waitMonths} months</dd>
          </div>
          <div>
            <dt>Cleared per 100 filed ${infoIcon("clearance")}</dt>
            <dd>${district.disposalRate.toFixed(1)}</dd>
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
  <title>${escapeHtml(copy.brand)} \u2014 ${escapeHtml(e.headline)}</title>
  ${FONTS_LINK}
  <style>${editorialCss()}</style>
</head>
<body>
  ${renderVariantSwitcher("editorial")}
  <header class="masthead">
    <a href="/lab/editorial" class="masthead__brand">
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

  <main>
    <article class="lead-story">
      <p class="lead-story__eyebrow">${escapeHtml(e.eyebrow)}</p>
      <h1 class="lead-story__hed">${escapeHtml(e.headline)}</h1>
      <p class="lead-story__lede">${escapeHtml(e.lede)}</p>
      <div class="lead-story__cta">
        <a class="btn btn--primary" href="/districts">${escapeHtml(e.ctaPrimary)} \u2192</a>
        <a class="btn btn--ghost" href="/methodology">${escapeHtml(e.ctaSecondary)}</a>
      </div>
    </article>

    <section class="big-numbers" aria-label="Headline numbers">
      <div class="big-numbers__row">
        <div class="big-numbers__item">
          <div class="big-numbers__value">${escapeHtml(model.pendingLakh)}</div>
          <div class="big-numbers__label">cases waiting ${infoIcon("backlog")}</div>
        </div>
        <div class="big-numbers__item">
          <div class="big-numbers__value">~${model.typicalWaitMonths}<span class="big-numbers__unit">mo</span></div>
          <div class="big-numbers__label">typical wait ${infoIcon("typicalWait")}</div>
        </div>
        <div class="big-numbers__item">
          <div class="big-numbers__value">${model.clearanceRate.toFixed(0)}<span class="big-numbers__unit">/ 100</span></div>
          <div class="big-numbers__label">cleared per 100 filed ${infoIcon("clearance")}</div>
        </div>
        <div class="big-numbers__item">
          <div class="big-numbers__value">${model.flaggedCount}</div>
          <div class="big-numbers__label">districts on watchlist ${infoIcon("watchlist")}</div>
        </div>
      </div>
    </section>

    <blockquote class="pull-quote">
      <p>${escapeHtml(e.pullQuote)}</p>
    </blockquote>

    <section class="watchlist">
      <header class="section-head">
        <h2>${escapeHtml(e.sectionWatchlist)}</h2>
        <p class="section-head__lede">${escapeHtml(e.sectionWatchlistLede)}</p>
      </header>
      <div class="watchlist__grid">${watchlistCards}</div>
    </section>

    <section class="trend">
      <header class="section-head">
        <h2>${escapeHtml(e.sectionTrend)}</h2>
        <p class="section-head__lede">${escapeHtml(e.sectionTrendLede)}</p>
      </header>
      ${trendBars}
    </section>

    <section class="about">
      <header class="section-head">
        <h2>${escapeHtml(e.sectionWhat)}</h2>
      </header>
      <p class="about__body">${escapeHtml(e.sectionWhatBody)}</p>
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

function renderTrendChart(model: LabViewModel): string {
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

function editorialCss(): string {
  return `
    :root {
      --ink: #131211;
      --ink-soft: #3b3a36;
      --ink-muted: #7a7771;
      --rule: #dedad2;
      --rule-soft: #eae6dd;
      --paper: #f6f1e8;
      --paper-bright: #fbf7ef;
      --accent: #b3301a;
      --accent-dark: #7a1f0f;
      --flag: #ba8b00;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: "Inter", system-ui, sans-serif;
      background: var(--paper);
      color: var(--ink);
      font-size: 17px;
      line-height: 1.58;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    a { color: var(--accent); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
    a:hover { color: var(--accent-dark); }
    h1, h2, h3 { font-family: "Fraunces", "Times New Roman", serif; font-weight: 600; letter-spacing: -0.02em; }

    .lab-switcher {
      display: flex; align-items: center; gap: 14px;
      padding: 10px 28px; font-size: 12px;
      background: var(--ink); color: #ede8dd;
      border-bottom: 1px solid #000;
      font-family: "JetBrains Mono", ui-monospace, monospace;
      text-transform: uppercase; letter-spacing: 0.08em;
    }
    .lab-switcher a { color: #ede8dd; text-decoration: none; }
    .lab-switcher a:hover { color: #fff; }
    .lab-switcher__sep { width: 1px; height: 14px; background: #555; }
    .lab-switcher__label { opacity: 0.6; }
    .lab-switcher strong { color: #fff; letter-spacing: 0.08em; }
    .lab-switcher__nav { margin-left: auto; display: flex; gap: 14px; }
    .lab-switcher__nav .is-active { color: var(--paper); border-bottom: 1px solid var(--paper); }

    main { max-width: 1120px; margin: 0 auto; padding: 0 28px 120px; }

    .masthead {
      max-width: 1120px; margin: 0 auto; padding: 36px 28px 28px;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 2px solid var(--ink);
    }
    .masthead__brand { display: flex; align-items: center; gap: 14px; text-decoration: none; color: var(--ink); }
    .masthead__mark {
      display: inline-flex; align-items: center; justify-content: center;
      width: 44px; height: 44px; background: var(--ink); color: var(--paper);
      font-family: "Fraunces", serif; font-weight: 900; font-size: 20px;
      border-radius: 2px;
    }
    .masthead__wordmark { font-family: "Fraunces", serif; font-weight: 700; font-size: 28px; letter-spacing: -0.02em; }
    .masthead__nav { display: flex; gap: 22px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; }
    .masthead__nav a { color: var(--ink-soft); text-decoration: none; }
    .masthead__nav a:hover { color: var(--accent); }

    .lead-story { padding: 72px 0 56px; max-width: 900px; }
    .lead-story__eyebrow {
      margin: 0 0 18px;
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em;
      color: var(--accent);
    }
    .lead-story__hed {
      margin: 0 0 24px;
      font-size: clamp(44px, 7vw, 88px);
      line-height: 0.98;
      text-wrap: balance;
    }
    .lead-story__lede {
      margin: 0 0 32px;
      font-family: "Fraunces", serif; font-weight: 400;
      font-size: clamp(19px, 2vw, 23px);
      line-height: 1.5;
      color: var(--ink-soft);
      max-width: 64ch;
    }
    .lead-story__cta { display: flex; gap: 12px; flex-wrap: wrap; }
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 22px; border-radius: 2px;
      font-weight: 600; font-size: 15px; text-decoration: none;
      border: 1px solid var(--ink);
      transition: transform 120ms ease, background 120ms ease, color 120ms ease;
    }
    .btn--primary { background: var(--ink); color: var(--paper); }
    .btn--primary:hover { background: var(--accent); border-color: var(--accent); color: #fff; }
    .btn--ghost { background: transparent; color: var(--ink); }
    .btn--ghost:hover { background: var(--ink); color: var(--paper); }

    .big-numbers { border-top: 1px solid var(--ink); border-bottom: 1px solid var(--ink); padding: 36px 0; margin: 0 0 72px; }
    .big-numbers__row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; }
    .big-numbers__item { border-left: 1px solid var(--rule); padding-left: 20px; }
    .big-numbers__item:first-child { border-left: none; padding-left: 0; }
    .big-numbers__value {
      font-family: "Fraunces", serif; font-weight: 700;
      font-size: clamp(38px, 4.5vw, 64px); line-height: 1;
      font-variant-numeric: lining-nums tabular-nums;
      color: var(--ink);
    }
    .big-numbers__unit { font-size: 0.5em; margin-left: 4px; color: var(--ink-muted); }
    .big-numbers__label {
      margin-top: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em;
      color: var(--ink-muted);
      display: inline-flex; align-items: center; gap: 6px;
    }

    .pull-quote {
      margin: 0 0 80px; padding: 48px 56px;
      background: transparent;
      border-left: 4px solid var(--accent);
      max-width: 820px;
    }
    .pull-quote p {
      margin: 0;
      font-family: "Fraunces", serif; font-weight: 500; font-style: italic;
      font-size: clamp(26px, 3vw, 34px); line-height: 1.25;
      color: var(--ink);
    }

    .section-head { margin: 0 0 32px; max-width: 720px; }
    .section-head h2 {
      margin: 0 0 12px;
      font-size: clamp(30px, 3.5vw, 44px); line-height: 1.05;
    }
    .section-head__lede {
      margin: 0;
      color: var(--ink-soft); font-size: 17px; line-height: 1.55;
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
      font-family: "JetBrains Mono", monospace; font-size: 12px;
      text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent);
    }
    .watch-card__name { margin: 0; font-size: 32px; line-height: 1; }
    .watch-card__name a { color: var(--ink); text-decoration: none; }
    .watch-card__name a:hover { color: var(--accent); }
    .watch-card__lede { margin: 0; color: var(--ink-soft); font-size: 15px; line-height: 1.5; }
    .watch-card__stats {
      margin: 0; padding: 18px 0 0; border-top: 1px solid var(--rule);
      display: grid; grid-template-columns: 1fr; gap: 12px;
    }
    .watch-card__stats div { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .watch-card__stats dt {
      margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;
      color: var(--ink-muted); display: inline-flex; align-items: center; gap: 6px;
    }
    .watch-card__stats dd {
      margin: 0; font-family: "Fraunces", serif; font-weight: 600; font-size: 20px;
      font-variant-numeric: lining-nums tabular-nums; color: var(--ink);
    }
    .watch-card__reason { margin: 0; font-size: 14px; color: var(--ink-soft); line-height: 1.5; border-top: 1px dashed var(--rule); padding-top: 14px; }
    .watch-card__reason-label {
      display: block; margin-bottom: 4px;
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--flag);
      font-family: "JetBrains Mono", monospace;
    }

    .trend { margin-bottom: 96px; }
    .trend-list { margin: 0; padding: 24px 0; list-style: none; border-top: 1px solid var(--ink); border-bottom: 1px solid var(--ink); }
    .trend-row { display: grid; grid-template-columns: 90px 1fr 120px; gap: 16px; align-items: center; padding: 10px 0; font-family: "JetBrains Mono", monospace; font-size: 14px; }
    .trend-row__label { color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.08em; }
    .trend-row__bar { display: block; height: 14px; background: var(--rule-soft); position: relative; }
    .trend-row__bar > span { display: block; height: 100%; background: var(--accent); }
    .trend-row__value { text-align: right; font-variant-numeric: lining-nums tabular-nums; color: var(--ink); }

    .about { max-width: 720px; margin-bottom: 80px; }
    .about__body { margin: 0; font-family: "Fraunces", serif; font-size: 19px; line-height: 1.55; color: var(--ink-soft); }

    .colophon {
      max-width: 1120px; margin: 0 auto; padding: 48px 28px;
      border-top: 2px solid var(--ink);
      display: grid; grid-template-columns: 1.4fr 1.2fr 1fr; gap: 32px;
      font-size: 14px; color: var(--ink-soft);
    }
    .colophon p { margin: 0 0 6px; }
    .colophon__brand { font-family: "Fraunces", serif; font-weight: 700; font-size: 20px; color: var(--ink); }
    .colophon__col a { display: block; color: var(--ink); }
    .colophon__col a + a { margin-top: 6px; }

    /* info icon */
    .info { display: inline-block; position: relative; }
    .info summary {
      list-style: none; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      width: 18px; height: 18px; border-radius: 999px;
      border: 1px solid currentColor; color: var(--ink-muted);
      font-family: "Fraunces", serif; font-weight: 700; font-size: 12px;
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
      min-width: 280px; max-width: 320px;
      padding: 16px 18px;
      background: var(--paper-bright); color: var(--ink);
      border: 1px solid var(--ink); border-radius: 2px;
      box-shadow: 4px 4px 0 var(--ink);
      font-family: "Inter", sans-serif;
      text-transform: none; letter-spacing: 0;
    }
    .info:hover .info-popover, .info[open] .info-popover, .info:focus-within .info-popover {
      display: block;
    }
    .info .info-popover { display: none; }
    .info-popover strong { display: block; margin-bottom: 6px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); }
    .info-popover p { margin: 0 0 8px; font-size: 14px; line-height: 1.5; color: var(--ink-soft); }
    .info-popover p:last-child { margin-bottom: 0; }
    .info-short { font-weight: 600; color: var(--ink) !important; }

    @media (max-width: 960px) {
      .big-numbers__row { grid-template-columns: repeat(2, 1fr); gap: 28px 24px; }
      .big-numbers__item:nth-child(3) { border-left: none; padding-left: 0; }
      .watchlist__grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 720px) {
      .masthead { padding: 24px 18px 18px; flex-wrap: wrap; gap: 18px; }
      .masthead__nav { width: 100%; gap: 14px; overflow-x: auto; }
      main { padding: 0 18px 80px; }
      .lead-story { padding: 48px 0 40px; }
      .colophon { grid-template-columns: 1fr; }
      .pull-quote { padding: 32px 24px; margin-bottom: 56px; }
      .big-numbers { padding: 24px 0; margin-bottom: 56px; }
      .big-numbers__row { grid-template-columns: 1fr 1fr; gap: 24px; }
      .big-numbers__item { border-left: none; padding-left: 0; }
      .trend-row { grid-template-columns: 70px 1fr 90px; gap: 12px; font-size: 12px; }
    }
  `;
}

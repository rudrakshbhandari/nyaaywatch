import type { PublishedSnapshot } from "../../domain/snapshot-schema.js";
import { buildCopy, GLOSSARY, type GlossaryKey } from "./copy.js";
import {
  buildViewModel,
  escapeHtml,
  formatMonth,
  type LabViewModel,
} from "./shared.js";

const FONTS_LINK = `
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />`;

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

function renderVariantSwitcher(): string {
  return `<div class="lab-switcher">
    <a href="/lab" class="lab-switcher__home">
      <span class="lab-switcher__dot"></span> Lab
    </a>
    <span class="lab-switcher__label">Viewing</span>
    <strong>Product</strong>
    <nav class="lab-switcher__nav">
      <a href="/lab/editorial">Editorial</a>
      <a href="/lab/terminal">Terminal</a>
      <a href="/lab/product" class="is-active">Product</a>
      <a href="/lab/civic">Civic</a>
    </nav>
  </div>`;
}

function renderAreaChart(model: LabViewModel): string {
  const values = model.trendsOldestFirst.map((point) => point.pendingCases);
  if (values.length < 2) return "";
  const max = Math.max(...values) * 1.05;
  const min = Math.min(...values) * 0.95;
  const range = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return { x, y };
  });
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L100,100 L0,100 Z`;
  const dots = points
    .map(
      (point) =>
        `<circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="1.6" fill="#fff" stroke="url(#stroke)" stroke-width="1.2" />`,
    )
    .join("");
  return `<svg class="area" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#818cf8" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#818cf8" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#818cf8" />
        <stop offset="100%" stop-color="#c084fc" />
      </linearGradient>
    </defs>
    <path d="${areaPath}" fill="url(#fill)" />
    <path d="${linePath}" fill="none" stroke="url(#stroke)" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linecap="round" />
    ${dots}
  </svg>`;
}

export function renderProductHome(snapshot: PublishedSnapshot): string {
  const model = buildViewModel(snapshot);
  const copy = buildCopy(model);
  const p = copy.product;

  const areaChart = renderAreaChart(model);
  const districtRows = model.topThree
    .map((district, index) => {
      const waitMonths = Math.round(district.medianAgeDays / 30);
      return `<a class="top-row" href="/districts/${escapeHtml(district.districtId)}">
        <span class="top-row__rank">#${index + 1}</span>
        <span class="top-row__name">${escapeHtml(district.districtName)}</span>
        <span class="top-row__metric">
          <span class="top-row__metric-value">${district.backlogCases.toLocaleString("en-IN")}</span>
          <span class="top-row__metric-label">cases waiting</span>
        </span>
        <span class="top-row__metric">
          <span class="top-row__metric-value">~${waitMonths}mo</span>
          <span class="top-row__metric-label">typical wait</span>
        </span>
        <span class="top-row__arrow">\u2192</span>
      </a>`;
    })
    .join("");

  const featureCards = p.features
    .map(
      (feature, index) => `<article class="feature">
        <div class="feature__num">0${index + 1}</div>
        <h3 class="feature__title">${escapeHtml(feature.title)}</h3>
        <p class="feature__body">${escapeHtml(feature.body)}</p>
      </article>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(copy.brand)} \u2014 ${escapeHtml(p.headline)}</title>
  ${FONTS_LINK}
  <style>${productCss()}</style>
</head>
<body>
  ${renderVariantSwitcher()}
  <div class="glow" aria-hidden="true"></div>
  <header class="nav">
    <a href="/lab/product" class="nav__brand">
      <span class="nav__logo">
        <svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="url(#navg)" stroke-width="2" />
          <path d="M8 12L11 15L16 9" stroke="url(#navg)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <defs>
            <linearGradient id="navg" x1="0" y1="0" x2="24" y2="24">
              <stop offset="0%" stop-color="#818cf8" />
              <stop offset="100%" stop-color="#c084fc" />
            </linearGradient>
          </defs>
        </svg>
      </span>
      <span class="nav__brand-name">NyaayWatch</span>
    </a>
    <nav class="nav__links">
      <a href="/districts">Districts</a>
      <a href="/data">Data</a>
      <a href="/methodology">Methodology</a>
      <a href="/api">API</a>
    </nav>
    <a class="nav__cta" href="/districts">Open dashboard \u2192</a>
  </header>

  <main>
    <section class="hero">
      <span class="hero__kicker">
        <span class="hero__kicker-dot"></span>
        ${escapeHtml(p.kicker)}
      </span>
      <h1 class="hero__headline">${escapeHtml(p.headline)}</h1>
      <p class="hero__subline">${escapeHtml(p.subline)}</p>
      <div class="hero__cta">
        <a class="btn btn--primary" href="/districts">${escapeHtml(p.ctaPrimary)} \u2192</a>
        <a class="btn btn--ghost" href="/methodology">${escapeHtml(p.ctaSecondary)}</a>
      </div>

      <div class="dashboard">
        <div class="dashboard__bar">
          <span class="dashboard__dot"></span>
          <span class="dashboard__dot" style="background: #ffbd2e"></span>
          <span class="dashboard__dot" style="background: #27c93f"></span>
          <span class="dashboard__title">nyaaywatch \u00b7 himachal \u00b7 ${escapeHtml(model.sourceDateLabel)}</span>
        </div>
        <div class="dashboard__body">
          <div class="dashboard__stats">
            <article class="stat">
              <div class="stat__label">Cases waiting ${infoIcon("backlog")}</div>
              <div class="stat__value">${escapeHtml(model.pendingLakh)}</div>
              <div class="stat__delta stat__delta--up">\u2197 ${Math.round(model.backlogDeltaPct)}% since Dec</div>
            </article>
            <article class="stat">
              <div class="stat__label">Typical wait ${infoIcon("typicalWait")}</div>
              <div class="stat__value">~${model.typicalWaitMonths}<span class="stat__unit">months</span></div>
              <div class="stat__delta">Based on age buckets</div>
            </article>
            <article class="stat">
              <div class="stat__label">Cleared per 100 filed ${infoIcon("clearance")}</div>
              <div class="stat__value">${model.clearanceRate.toFixed(1)}</div>
              <div class="stat__delta stat__delta--down">Shortfall ${model.clearanceShortfall.toFixed(1)}</div>
            </article>
            <article class="stat">
              <div class="stat__label">Districts flagged ${infoIcon("watchlist")}</div>
              <div class="stat__value">${model.flaggedCount}<span class="stat__unit">of ${model.totalDistricts}</span></div>
              <div class="stat__delta">${escapeHtml(model.topDistrict.districtName)} is worst</div>
            </article>
          </div>

          <div class="dashboard__chart">
            <div class="dashboard__chart-head">
              <div>
                <div class="dashboard__chart-label">Statewide pending</div>
                <div class="dashboard__chart-value">${model.pendingCases.toLocaleString("en-IN")}</div>
              </div>
              <span class="chip chip--up">+${Math.round(model.backlogDeltaPct)}% \u00b7 last 5 months</span>
            </div>
            ${areaChart}
            <div class="dashboard__chart-legend">
              ${model.trendsOldestFirst
                .map((point) => `<span>${escapeHtml(formatMonth(point.snapshotDate))}</span>`)
                .join("")}
            </div>
          </div>

          <div class="dashboard__top">
            <div class="dashboard__top-head">
              <h3>Top of the watchlist</h3>
              <a href="/districts">See all ${model.totalDistricts} \u2192</a>
            </div>
            ${districtRows}
          </div>
        </div>
      </div>
    </section>

    <section class="features">
      <h2 class="features__title">${escapeHtml(p.featureTitle)}</h2>
      <div class="features__grid">${featureCards}</div>
    </section>

    <section class="cta">
      <div class="cta__inner">
        <h2>Start with the district table.</h2>
        <p>Every number is downloadable, every term has a plain-English explanation, and everything on the page is cited.</p>
        <a class="btn btn--primary" href="/districts">Open the district table \u2192</a>
      </div>
    </section>
  </main>

  <footer class="foot">
    <div class="foot__col">
      <span class="foot__brand">NyaayWatch</span>
      <p>${escapeHtml(copy.brandTag)}</p>
    </div>
    <div class="foot__col">
      <p>Published ${escapeHtml(model.sourceDateLabel)}</p>
      <p>Source: ${escapeHtml(model.sourceAttribution)} ${infoIcon("source")}</p>
      <p>Method: ${escapeHtml(model.methodologyVersion)} ${infoIcon("methodology")}</p>
    </div>
    <div class="foot__col foot__links">
      <a href="/districts">Districts</a>
      <a href="/data">Data</a>
      <a href="/methodology">Methodology</a>
      <a href="/api">API</a>
    </div>
  </footer>
</body>
</html>`;
}

function productCss(): string {
  return `
    :root {
      --bg: #0b0b13;
      --bg-2: #111120;
      --surface: rgba(255, 255, 255, 0.03);
      --surface-hi: rgba(255, 255, 255, 0.06);
      --border: rgba(255, 255, 255, 0.08);
      --border-hi: rgba(255, 255, 255, 0.14);
      --text: #f3f4f8;
      --text-dim: #a1a1b3;
      --text-muted: #6b6b7d;
      --indigo: #818cf8;
      --violet: #c084fc;
      --green: #22c55e;
      --rose: #f87171;
    }
    * { box-sizing: border-box; }
    html, body { background: var(--bg); }
    body {
      margin: 0;
      color: var(--text);
      font-family: "Inter", -apple-system, system-ui, sans-serif;
      font-size: 15px; line-height: 1.55;
      -webkit-font-smoothing: antialiased;
      font-feature-settings: "cv11", "ss01", "ss02";
      position: relative;
      overflow-x: hidden;
    }
    a { color: var(--indigo); text-decoration: none; }
    a:hover { color: var(--violet); }

    .glow {
      position: fixed; top: -200px; left: 50%; transform: translateX(-50%);
      width: 900px; height: 900px;
      background: radial-gradient(circle, rgba(129, 140, 248, 0.22) 0%, rgba(192, 132, 252, 0.08) 40%, transparent 70%);
      filter: blur(20px);
      pointer-events: none; z-index: 0;
    }

    .lab-switcher {
      position: relative; z-index: 5;
      display: flex; align-items: center; gap: 14px;
      padding: 10px 32px; font-size: 12px;
      background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      color: var(--text-dim);
    }
    .lab-switcher a { color: var(--text-dim); }
    .lab-switcher a:hover { color: var(--text); }
    .lab-switcher__home { display: inline-flex; align-items: center; gap: 8px; color: var(--text) !important; font-weight: 500; }
    .lab-switcher__dot { width: 6px; height: 6px; background: var(--indigo); border-radius: 999px; box-shadow: 0 0 10px var(--indigo); }
    .lab-switcher__label { color: var(--text-muted); }
    .lab-switcher strong { color: var(--text); font-weight: 600; }
    .lab-switcher__nav { margin-left: auto; display: flex; gap: 18px; }
    .lab-switcher__nav .is-active { color: var(--indigo); }

    .nav {
      position: relative; z-index: 5;
      max-width: 1200px; margin: 0 auto;
      display: flex; align-items: center; gap: 32px;
      padding: 22px 32px;
    }
    .nav__brand { display: flex; align-items: center; gap: 10px; color: var(--text); font-weight: 600; font-size: 16px; }
    .nav__logo { display: inline-flex; }
    .nav__links { display: flex; gap: 24px; margin-left: 12px; }
    .nav__links a { color: var(--text-dim); font-size: 14px; font-weight: 500; }
    .nav__links a:hover { color: var(--text); }
    .nav__cta {
      margin-left: auto;
      padding: 9px 16px; border-radius: 8px;
      background: var(--surface); border: 1px solid var(--border-hi);
      color: var(--text) !important; font-size: 14px; font-weight: 500;
      transition: background 140ms ease, border-color 140ms ease, transform 140ms ease;
    }
    .nav__cta:hover { background: var(--surface-hi); border-color: var(--border-hi); transform: translateY(-1px); }

    main { position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; padding: 0 32px 120px; }

    .hero { padding: 64px 0 80px; text-align: center; }
    .hero__kicker {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 14px; border-radius: 999px;
      background: var(--surface); border: 1px solid var(--border);
      font-size: 13px; color: var(--text-dim); font-weight: 500;
      margin-bottom: 24px;
    }
    .hero__kicker-dot { width: 6px; height: 6px; background: var(--green); border-radius: 999px; box-shadow: 0 0 8px var(--green); }
    .hero__headline {
      margin: 0 auto 20px; max-width: 14ch;
      font-size: clamp(44px, 6.5vw, 76px); font-weight: 700; line-height: 1.02;
      letter-spacing: -0.035em;
      background: linear-gradient(180deg, #ffffff 0%, #c7c9d8 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero__subline {
      margin: 0 auto 36px; max-width: 58ch;
      font-size: 18px; color: var(--text-dim); line-height: 1.55;
    }
    .hero__cta { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; margin-bottom: 64px; }
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 12px 20px; border-radius: 10px;
      font-size: 15px; font-weight: 500;
      transition: transform 140ms ease, background 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
    }
    .btn--primary {
      background: linear-gradient(180deg, #818cf8 0%, #6366f1 100%);
      color: #fff !important;
      box-shadow: 0 10px 30px -8px rgba(99, 102, 241, 0.6), inset 0 1px 0 rgba(255,255,255,0.25);
      border: 1px solid rgba(129, 140, 248, 0.5);
    }
    .btn--primary:hover { transform: translateY(-1px); box-shadow: 0 14px 32px -8px rgba(99, 102, 241, 0.7), inset 0 1px 0 rgba(255,255,255,0.3); }
    .btn--ghost {
      background: var(--surface); color: var(--text) !important;
      border: 1px solid var(--border-hi);
    }
    .btn--ghost:hover { background: var(--surface-hi); border-color: var(--border-hi); transform: translateY(-1px); }

    .dashboard {
      text-align: left;
      margin: 0 auto; max-width: 1080px;
      background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%);
      border: 1px solid var(--border-hi);
      border-radius: 16px;
      box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(129, 140, 248, 0.1);
      overflow: hidden;
      backdrop-filter: blur(20px);
    }
    .dashboard__bar {
      display: flex; align-items: center; gap: 8px;
      padding: 14px 18px;
      background: rgba(0, 0, 0, 0.3);
      border-bottom: 1px solid var(--border);
      font-family: "JetBrains Mono", monospace; font-size: 12px; color: var(--text-muted);
    }
    .dashboard__dot { width: 11px; height: 11px; border-radius: 999px; background: #ff5f57; }
    .dashboard__title { margin-left: 14px; }

    .dashboard__body { padding: 28px; display: grid; gap: 28px; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); }
    .dashboard__stats { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .stat {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 12px; padding: 16px;
    }
    .stat__label {
      font-size: 12px; color: var(--text-dim); font-weight: 500;
      display: inline-flex; align-items: center; gap: 6px; margin-bottom: 10px;
    }
    .stat__value {
      font-size: 28px; font-weight: 700; letter-spacing: -0.02em; color: var(--text);
      font-variant-numeric: tabular-nums;
    }
    .stat__unit { font-size: 14px; color: var(--text-muted); font-weight: 500; margin-left: 4px; }
    .stat__delta { margin-top: 6px; font-size: 12px; color: var(--text-muted); }
    .stat__delta--up { color: var(--rose); }
    .stat__delta--down { color: var(--rose); }

    .dashboard__chart {
      grid-column: 2; grid-row: 1;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 12px; padding: 20px;
      display: flex; flex-direction: column; min-height: 240px;
    }
    .dashboard__chart-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; gap: 12px; }
    .dashboard__chart-label { font-size: 12px; color: var(--text-dim); margin-bottom: 4px; }
    .dashboard__chart-value { font-size: 22px; font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; }
    .chip {
      display: inline-flex; padding: 4px 10px; border-radius: 999px;
      background: rgba(248, 113, 113, 0.12); color: var(--rose);
      font-size: 12px; font-weight: 500; border: 1px solid rgba(248, 113, 113, 0.2);
    }
    .chip--up { }
    .area { width: 100%; height: 120px; flex: 1; }
    .dashboard__chart-legend {
      display: flex; justify-content: space-between;
      font-family: "JetBrains Mono", monospace; font-size: 10px; color: var(--text-muted);
      padding-top: 8px;
    }

    .dashboard__top {
      grid-column: 1 / -1;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 12px; padding: 6px;
    }
    .dashboard__top-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px 4px;
    }
    .dashboard__top-head h3 { margin: 0; font-size: 13px; font-weight: 500; color: var(--text-dim); }
    .dashboard__top-head a { font-size: 12px; color: var(--indigo); }

    .top-row {
      display: grid; grid-template-columns: 42px 1fr 1fr 1fr 24px;
      gap: 16px; align-items: center;
      padding: 14px; border-radius: 8px;
      color: var(--text); transition: background 140ms ease;
    }
    .top-row:hover { background: var(--surface-hi); }
    .top-row__rank { font-family: "JetBrains Mono", monospace; font-size: 12px; color: var(--text-muted); }
    .top-row__name { font-weight: 600; }
    .top-row__metric { display: flex; flex-direction: column; gap: 2px; }
    .top-row__metric-value { font-size: 14px; font-variant-numeric: tabular-nums; color: var(--text); font-weight: 500; }
    .top-row__metric-label { font-size: 11px; color: var(--text-muted); }
    .top-row__arrow { color: var(--text-muted); text-align: right; }

    .features { padding: 96px 0 40px; }
    .features__title {
      margin: 0 0 40px;
      font-size: clamp(28px, 3.5vw, 40px); font-weight: 700; letter-spacing: -0.02em;
      text-align: center;
    }
    .features__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .feature {
      padding: 28px; border: 1px solid var(--border); border-radius: 14px;
      background: var(--surface);
    }
    .feature__num {
      font-family: "JetBrains Mono", monospace; font-size: 12px; color: var(--indigo); margin-bottom: 14px;
    }
    .feature__title { margin: 0 0 8px; font-size: 18px; font-weight: 600; letter-spacing: -0.01em; }
    .feature__body { margin: 0; font-size: 14px; color: var(--text-dim); line-height: 1.55; }

    .cta { margin: 80px 0 0; padding: 2px; background: linear-gradient(135deg, rgba(129, 140, 248, 0.4), rgba(192, 132, 252, 0.3)); border-radius: 20px; }
    .cta__inner {
      padding: 56px 48px; background: var(--bg-2); border-radius: 18px; text-align: center;
    }
    .cta__inner h2 { margin: 0 0 12px; font-size: clamp(28px, 3vw, 38px); font-weight: 700; letter-spacing: -0.02em; }
    .cta__inner p { margin: 0 auto 24px; max-width: 54ch; color: var(--text-dim); }

    .foot {
      max-width: 1200px; margin: 80px auto 0; padding: 40px 32px;
      border-top: 1px solid var(--border);
      display: grid; grid-template-columns: 1.2fr 1.2fr 1fr; gap: 32px;
      color: var(--text-muted); font-size: 13px;
    }
    .foot p { margin: 0 0 4px; }
    .foot__brand { font-size: 16px; font-weight: 600; color: var(--text); }
    .foot__links { display: flex; flex-direction: column; gap: 8px; }
    .foot__links a { color: var(--text-dim); }
    .foot__links a:hover { color: var(--text); }

    /* info icon */
    .info { display: inline-block; position: relative; }
    .info summary {
      list-style: none; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      width: 16px; height: 16px; border-radius: 999px;
      background: var(--surface); color: var(--text-muted);
      border: 1px solid var(--border-hi);
      font-size: 10px; font-weight: 700; font-style: italic;
      font-family: "Inter", sans-serif;
      transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
    }
    .info summary::-webkit-details-marker { display: none; }
    .info summary::marker { content: ""; }
    .info:hover summary, .info[open] summary, .info summary:focus-visible {
      color: #fff; background: var(--indigo); border-color: var(--indigo); outline: none;
    }
    .info-popover {
      position: absolute; z-index: 40; top: calc(100% + 10px); left: 50%;
      transform: translateX(-50%);
      min-width: 280px; max-width: 320px;
      padding: 16px; border-radius: 12px;
      background: #1a1a2a; border: 1px solid var(--border-hi);
      box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(129, 140, 248, 0.15);
    }
    .info:hover .info-popover, .info[open] .info-popover, .info:focus-within .info-popover { display: block; }
    .info .info-popover { display: none; }
    .info-popover strong { display: block; margin-bottom: 6px; font-size: 12px; color: var(--indigo); font-weight: 600; }
    .info-popover p { margin: 0 0 8px; font-size: 13px; line-height: 1.55; color: var(--text-dim); }
    .info-popover p:last-child { margin-bottom: 0; }
    .info-short { font-weight: 500; color: var(--text) !important; }

    @media (max-width: 1000px) {
      .dashboard__body { grid-template-columns: 1fr; }
      .dashboard__chart { grid-column: 1; grid-row: auto; }
      .dashboard__stats { grid-template-columns: 1fr 1fr; }
      .features__grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 720px) {
      .nav { flex-wrap: wrap; gap: 12px; padding: 18px; }
      .nav__links { width: 100%; order: 3; gap: 16px; }
      .nav__cta { margin-left: auto; }
      .hero { padding: 40px 0 60px; }
      .dashboard__body { padding: 18px; }
      .dashboard__stats { grid-template-columns: 1fr; }
      .top-row { grid-template-columns: 30px 1fr 24px; gap: 10px; }
      .top-row__metric { display: none; }
      .foot { grid-template-columns: 1fr; }
      main { padding: 0 18px 80px; }
      .cta__inner { padding: 40px 24px; }
    }
  `;
}

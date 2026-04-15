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
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />`;

function infoIcon(key: GlossaryKey): string {
  const entry = GLOSSARY[key];
  return `<details class="info" data-term="${key}">
    <summary aria-label="What does ${escapeHtml(entry.term)} mean?">?</summary>
    <div class="info-popover" role="tooltip">
      <strong>${escapeHtml(entry.term)}</strong>
      <p class="info-short">${escapeHtml(entry.short)}</p>
      <p class="info-long">${escapeHtml(entry.long)}</p>
    </div>
  </details>`;
}

function renderVariantSwitcher(): string {
  return `<div class="lab-switcher">
    <a href="/lab">[ LAB ]</a>
    <span class="lab-switcher__label">// viewing</span>
    <strong>TERMINAL.v1</strong>
    <nav class="lab-switcher__nav">
      <a href="/lab/editorial">editorial</a>
      <a href="/lab/terminal" class="is-active">terminal</a>
      <a href="/lab/product">product</a>
      <a href="/lab/civic">civic</a>
    </nav>
  </div>`;
}

function renderSparkline(values: readonly number[]): string {
  if (values.length === 0) return "";
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return `<svg class="spark" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <polyline fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke" points="${points}" />
  </svg>`;
}

export function renderTerminalHome(snapshot: PublishedSnapshot): string {
  const model = buildViewModel(snapshot);
  const copy = buildCopy(model);
  const t = copy.terminal;

  const trendValues = model.trendsOldestFirst.map((point) => point.pendingCases);
  const clearanceValues = model.trendsOldestFirst.map((point) => point.disposalRate);

  const districtRows = model.allDistricts
    .map((district, index) => {
      const waitMonths = Math.round(district.medianAgeDays / 30);
      const flagBadge = index < model.flaggedCount
        ? `<span class="badge badge--warn">WATCH</span>`
        : `<span class="badge badge--ok">OK</span>`;
      const gap = district.filingVsDisposalGap;
      const gapClass = gap > 0 ? "neg" : "pos";
      const gapSign = gap > 0 ? "+" : "\u2212";
      return `<tr>
        <td class="num">${String(district.rank).padStart(2, "0")}</td>
        <td><a href="/districts/${escapeHtml(district.districtId)}">${escapeHtml(district.districtName).toUpperCase()}</a></td>
        <td class="num">${district.backlogCases.toLocaleString("en-IN")}</td>
        <td class="num">${district.disposalRate.toFixed(1)}</td>
        <td class="num">${waitMonths}mo</td>
        <td class="num delta ${gapClass}">${gapSign}${Math.abs(gap).toFixed(1)}</td>
        <td>${flagBadge}</td>
      </tr>`;
    })
    .join("");

  const trendTableRows = model.trendsOldestFirst
    .map((point, index) => {
      const prior = index > 0 ? model.trendsOldestFirst[index - 1] : null;
      const delta = prior ? point.pendingCases - prior.pendingCases : 0;
      const deltaClass = delta > 0 ? "neg" : delta < 0 ? "pos" : "flat";
      const deltaSign = delta > 0 ? "+" : delta < 0 ? "\u2212" : "";
      return `<tr>
        <td>${escapeHtml(formatMonth(point.snapshotDate)).toUpperCase()}</td>
        <td class="num">${point.pendingCases.toLocaleString("en-IN")}</td>
        <td class="num delta ${deltaClass}">${prior ? `${deltaSign}${Math.abs(delta).toLocaleString("en-IN")}` : "\u2014"}</td>
        <td class="num">${point.disposalRate.toFixed(1)}</td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(copy.brand)} // HP // ${escapeHtml(model.sourceDateLabel)}</title>
  ${FONTS_LINK}
  <style>${terminalCss()}</style>
</head>
<body>
  ${renderVariantSwitcher()}
  <header class="topbar">
    <a href="/lab/terminal" class="topbar__brand">
      <span class="dot"></span>
      <span>NYAAYWATCH</span>
      <span class="topbar__state">// HP</span>
    </a>
    <div class="topbar__ticker" aria-hidden="true">${escapeHtml(t.systemLine)}</div>
    <nav class="topbar__nav">
      <a href="/districts">districts</a>
      <a href="/data">data</a>
      <a href="/methodology">method</a>
      <a href="/api">api</a>
    </nav>
  </header>

  <main>
    <section class="status">
      <div class="status__left">
        <p class="status__kicker">System status \u00b7 ${escapeHtml(model.sourceDateLabel)}</p>
        <h1 class="status__headline">${escapeHtml(t.statusHeadline)}</h1>
        <p class="status__sub">${escapeHtml(t.statusSubline)}</p>
        <div class="status__cta">
          <a class="btn" href="/districts">${escapeHtml(t.ctaPrimary)}</a>
          <a class="btn btn--ghost" href="/methodology">${escapeHtml(t.ctaSecondary)}</a>
        </div>
      </div>
      <div class="status__right">
        <div class="status__meta">
          <dl>
            <dt>source</dt><dd>NJDG district aggregates</dd>
            <dt>quality</dt><dd class="ok">${escapeHtml(model.snapshot.snapshot.qualityState).toUpperCase()}</dd>
            <dt>freshness</dt><dd>${model.freshnessDays} day(s)</dd>
            <dt>method</dt><dd>${escapeHtml(model.methodologyVersion)}</dd>
          </dl>
        </div>
      </div>
    </section>

    <section class="grid-metrics" aria-label="Headline metrics">
      <article class="metric">
        <p class="metric__label">PENDING ${infoIcon("backlog")}</p>
        <p class="metric__value num">${model.pendingCases.toLocaleString("en-IN")}</p>
        <p class="metric__sub">${escapeHtml(model.pendingLakh)}</p>
        <div class="metric__spark spark--neg">${renderSparkline(trendValues)}</div>
      </article>
      <article class="metric">
        <p class="metric__label">CLEARANCE ${infoIcon("clearance")}</p>
        <p class="metric__value num">${model.clearanceRate.toFixed(1)}<span class="metric__unit">/100</span></p>
        <p class="metric__sub">shortfall ${model.clearanceShortfall.toFixed(1)}</p>
        <div class="metric__spark spark--pos">${renderSparkline(clearanceValues)}</div>
      </article>
      <article class="metric">
        <p class="metric__label">TYPICAL WAIT ${infoIcon("typicalWait")}</p>
        <p class="metric__value num">${model.typicalWaitDays}<span class="metric__unit">d</span></p>
        <p class="metric__sub">~${model.typicalWaitMonths} months</p>
      </article>
      <article class="metric">
        <p class="metric__label">FLAGGED ${infoIcon("watchlist")}</p>
        <p class="metric__value num">${model.flaggedCount}<span class="metric__unit">/${model.totalDistricts}</span></p>
        <p class="metric__sub">districts on watch</p>
      </article>
    </section>

    <section class="panel">
      <header class="panel__head">
        <h2>&gt; districts.rank()</h2>
        <span class="panel__meta">${model.totalDistricts} rows \u00b7 sorted by watch rank</span>
      </header>
      <div class="panel__table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>DISTRICT</th>
              <th class="num">PENDING</th>
              <th class="num">CLEAR /100</th>
              <th class="num">WAIT</th>
              <th class="num">GAP</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>${districtRows}</tbody>
        </table>
      </div>
    </section>

    <section class="panel">
      <header class="panel__head">
        <h2>&gt; backlog.timeSeries()</h2>
        <span class="panel__meta">${model.trendsOldestFirst.length} points \u00b7 monthly</span>
      </header>
      <div class="panel__table">
        <table>
          <thead>
            <tr>
              <th>MONTH</th>
              <th class="num">PENDING</th>
              <th class="num">\u0394</th>
              <th class="num">CLEAR /100</th>
            </tr>
          </thead>
          <tbody>${trendTableRows}</tbody>
        </table>
      </div>
    </section>
  </main>

  <footer class="footbar">
    <span>// ${escapeHtml(copy.brand).toLowerCase()} \u00b7 ${escapeHtml(model.sourceAttribution).toLowerCase()} ${infoIcon("source")}</span>
    <span>method ${escapeHtml(model.methodologyVersion)} ${infoIcon("methodology")}</span>
    <span>&copy; himachal public data \u00b7 read-only view</span>
  </footer>
</body>
</html>`;
}

function terminalCss(): string {
  return `
    :root {
      --bg: #0a0d10;
      --bg-elev: #12161c;
      --bg-panel: #161b22;
      --rule: #262c36;
      --rule-soft: #1d2028;
      --text: #e4e8ec;
      --text-dim: #7a8693;
      --text-muted: #4b545f;
      --accent: #7cf0b7;
      --warn: #ffc857;
      --bad: #ff6a6a;
      --ok: #7cf0b7;
    }
    * { box-sizing: border-box; }
    html, body { background: var(--bg); }
    body {
      margin: 0;
      color: var(--text);
      font-family: "IBM Plex Sans", -apple-system, sans-serif;
      font-size: 14px; line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    a { color: var(--accent); text-decoration: none; }
    a:hover { color: #fff; text-decoration: underline; }
    .num { font-family: "IBM Plex Mono", ui-monospace, monospace; font-variant-numeric: tabular-nums; }

    .lab-switcher {
      display: flex; align-items: center; gap: 14px;
      padding: 8px 22px; font-size: 11px;
      background: #000; color: var(--text-dim);
      border-bottom: 1px solid var(--rule);
      font-family: "IBM Plex Mono", monospace;
      text-transform: uppercase; letter-spacing: 0.08em;
    }
    .lab-switcher a { color: var(--accent); }
    .lab-switcher__label { color: var(--text-muted); }
    .lab-switcher strong { color: #fff; }
    .lab-switcher__nav { margin-left: auto; display: flex; gap: 14px; }
    .lab-switcher__nav a { color: var(--text-dim); }
    .lab-switcher__nav .is-active { color: var(--accent); }

    .topbar {
      display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 20px;
      padding: 16px 22px; background: var(--bg-elev);
      border-bottom: 1px solid var(--rule);
      font-family: "IBM Plex Mono", monospace; font-size: 12px;
      text-transform: uppercase; letter-spacing: 0.08em;
    }
    .topbar__brand { display: flex; align-items: center; gap: 10px; color: #fff; font-weight: 600; }
    .topbar__state { color: var(--text-dim); }
    .dot { width: 8px; height: 8px; background: var(--accent); border-radius: 999px; box-shadow: 0 0 12px var(--accent); animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 50% { opacity: 0.4; } }
    .topbar__ticker { color: var(--text-dim); text-align: center; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .topbar__nav { display: flex; gap: 18px; }
    .topbar__nav a { color: var(--text-dim); }
    .topbar__nav a:hover { color: var(--accent); text-decoration: none; }

    main { max-width: 1280px; margin: 0 auto; padding: 0 22px 80px; }

    .status {
      display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 0.9fr);
      gap: 24px; padding: 40px 0;
      border-bottom: 1px solid var(--rule);
    }
    .status__kicker {
      margin: 0 0 16px; font-family: "IBM Plex Mono", monospace;
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em;
      color: var(--accent);
    }
    .status__headline {
      margin: 0 0 16px;
      font-family: "IBM Plex Sans", sans-serif;
      font-size: clamp(36px, 5vw, 62px); font-weight: 600;
      letter-spacing: -0.02em; line-height: 1;
      color: #fff;
    }
    .status__sub { margin: 0 0 24px; color: var(--text-dim); font-size: 15px; }
    .status__cta { display: flex; gap: 10px; flex-wrap: wrap; }
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 12px 18px; font-family: "IBM Plex Mono", monospace;
      font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;
      background: var(--accent); color: #05140d; border: 1px solid var(--accent);
      transition: background 120ms ease, color 120ms ease;
    }
    .btn:hover { background: #fff; color: #000; border-color: #fff; text-decoration: none; }
    .btn--ghost { background: transparent; color: var(--text); border-color: var(--rule); }
    .btn--ghost:hover { background: var(--rule); color: #fff; border-color: var(--rule); }

    .status__meta {
      border: 1px solid var(--rule); background: var(--bg-panel);
      padding: 22px; font-family: "IBM Plex Mono", monospace; font-size: 12px;
    }
    .status__meta dl { margin: 0; display: grid; grid-template-columns: 90px 1fr; gap: 10px 16px; }
    .status__meta dt { color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
    .status__meta dd { margin: 0; color: var(--text); }
    .status__meta dd.ok { color: var(--accent); }

    .grid-metrics {
      display: grid; grid-template-columns: repeat(4, 1fr);
      border: 1px solid var(--rule); border-bottom: none;
      margin: 40px 0 0;
    }
    .metric {
      padding: 22px 22px 22px; border-right: 1px solid var(--rule); border-bottom: 1px solid var(--rule);
      background: var(--bg-panel);
    }
    .metric:last-child { border-right: none; }
    .metric__label {
      margin: 0 0 12px; font-family: "IBM Plex Mono", monospace;
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em;
      color: var(--text-dim);
      display: inline-flex; align-items: center; gap: 6px;
    }
    .metric__value {
      margin: 0; font-size: clamp(30px, 3.6vw, 46px); font-weight: 600;
      line-height: 1; color: #fff;
    }
    .metric__unit { font-size: 0.5em; color: var(--text-dim); margin-left: 4px; font-weight: 500; }
    .metric__sub { margin: 8px 0 0; font-family: "IBM Plex Mono", monospace; font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
    .metric__spark { margin-top: 14px; height: 42px; color: var(--accent); opacity: 0.9; }
    .spark--neg { color: var(--bad); }
    .spark--pos { color: var(--accent); }
    .spark { width: 100%; height: 100%; }

    .panel { border: 1px solid var(--rule); margin-top: 28px; background: var(--bg-panel); }
    .panel__head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 22px; border-bottom: 1px solid var(--rule);
      font-family: "IBM Plex Mono", monospace;
    }
    .panel__head h2 { margin: 0; font-size: 13px; font-weight: 500; color: var(--accent); text-transform: lowercase; }
    .panel__meta { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); }
    .panel__table { overflow-x: auto; }

    table { width: 100%; border-collapse: collapse; font-family: "IBM Plex Mono", monospace; font-size: 13px; }
    th, td { padding: 12px 22px; text-align: left; border-bottom: 1px solid var(--rule-soft); }
    tr:last-child td { border-bottom: none; }
    th {
      font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em;
      color: var(--text-muted); font-weight: 500; background: var(--bg);
    }
    .num { text-align: right; }
    td.num { color: #fff; font-variant-numeric: tabular-nums; }
    th.num { text-align: right; }
    tbody tr:hover td { background: var(--rule-soft); }
    tbody a { color: #fff; font-weight: 500; }
    tbody a:hover { color: var(--accent); }

    .delta.pos { color: var(--accent); }
    .delta.neg { color: var(--bad); }
    .delta.flat { color: var(--text-muted); }

    .badge {
      display: inline-block; padding: 4px 8px;
      font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em;
      font-weight: 600;
      border: 1px solid currentColor;
    }
    .badge--warn { color: var(--warn); }
    .badge--ok { color: var(--text-muted); }

    .footbar {
      margin-top: 48px; padding: 18px 22px;
      display: flex; flex-wrap: wrap; gap: 24px; justify-content: space-between;
      border-top: 1px solid var(--rule);
      font-family: "IBM Plex Mono", monospace; font-size: 11px;
      color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em;
    }
    .footbar .info summary { color: var(--text-muted); }

    /* info icon */
    .info { display: inline-block; position: relative; text-transform: none; letter-spacing: 0; }
    .info summary {
      list-style: none; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      width: 16px; height: 16px; border: 1px solid currentColor;
      font-family: "IBM Plex Mono", monospace; font-size: 10px; font-weight: 700;
      color: var(--text-dim); background: transparent;
      transition: color 120ms ease, border-color 120ms ease;
    }
    .info summary::-webkit-details-marker { display: none; }
    .info summary::marker { content: ""; }
    .info:hover summary, .info[open] summary, .info summary:focus-visible {
      color: var(--accent); border-color: var(--accent); outline: none;
    }
    .info-popover {
      position: absolute; z-index: 20; top: calc(100% + 8px); left: 50%;
      transform: translateX(-50%);
      min-width: 280px; max-width: 320px;
      padding: 16px 18px;
      background: #000; color: var(--text);
      border: 1px solid var(--accent);
      box-shadow: 0 0 24px rgba(124, 240, 183, 0.15);
      font-family: "IBM Plex Sans", sans-serif;
      text-transform: none; letter-spacing: 0;
    }
    .info:hover .info-popover, .info[open] .info-popover, .info:focus-within .info-popover { display: block; }
    .info .info-popover { display: none; }
    .info-popover strong { display: block; margin-bottom: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent); font-family: "IBM Plex Mono", monospace; }
    .info-popover p { margin: 0 0 8px; font-size: 13px; line-height: 1.55; color: var(--text-dim); }
    .info-popover p:last-child { margin-bottom: 0; }
    .info-short { font-weight: 600; color: #fff !important; }

    @media (max-width: 1000px) {
      .grid-metrics { grid-template-columns: repeat(2, 1fr); }
      .metric:nth-child(2) { border-right: none; }
      .metric:nth-child(3) { border-right: 1px solid var(--rule); }
      .status { grid-template-columns: 1fr; }
    }
    @media (max-width: 720px) {
      .topbar { grid-template-columns: 1fr; text-align: left; }
      .topbar__ticker { display: none; }
      .topbar__nav { gap: 14px; flex-wrap: wrap; }
      .grid-metrics { grid-template-columns: 1fr; }
      .metric { border-right: none; }
      main { padding: 0 16px 60px; }
    }
  `;
}

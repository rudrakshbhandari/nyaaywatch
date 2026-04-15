import type { PublishedSnapshot } from "../../domain/snapshot-schema.js";
import { buildCopy, GLOSSARY, type GlossaryKey } from "./copy.js";
import { buildViewModel, escapeHtml, formatMonth } from "./shared.js";

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
  return `<div class="lab-switcher" role="region" aria-label="Design variant switcher">
    <a href="/lab" class="lab-switcher__home">\u2190 Back to Lab</a>
    <span class="lab-switcher__label">Viewing:</span>
    <strong>Civic</strong>
    <nav class="lab-switcher__nav" aria-label="Variants">
      <a href="/lab/editorial">Editorial</a>
      <a href="/lab/terminal">Terminal</a>
      <a href="/lab/product">Product</a>
      <a href="/lab/civic" class="is-active" aria-current="page">Civic</a>
    </nav>
  </div>`;
}

export function renderCivicHome(snapshot: PublishedSnapshot): string {
  const model = buildViewModel(snapshot);
  const copy = buildCopy(model);
  const c = copy.civic;

  const districtRows = model.allDistricts
    .map((district, index) => {
      const waitMonths = Math.round(district.medianAgeDays / 30);
      const onWatch = index < model.flaggedCount;
      return `<tr${onWatch ? ' class="is-watch"' : ""}>
        <td>${onWatch ? '<span class="tag tag--watch">On watchlist</span>' : '<span class="tag">OK</span>'}</td>
        <td><a href="/districts/${escapeHtml(district.districtId)}">${escapeHtml(district.districtName)}</a></td>
        <td class="num">${district.backlogCases.toLocaleString("en-IN")}</td>
        <td class="num">${district.disposalRate.toFixed(1)}</td>
        <td class="num">${waitMonths}</td>
      </tr>`;
    })
    .join("");

  const trendRows = model.trendsOldestFirst
    .map((point) => {
      return `<tr>
        <td>${escapeHtml(formatMonth(point.snapshotDate))}</td>
        <td class="num">${point.pendingCases.toLocaleString("en-IN")}</td>
        <td class="num">${point.disposalRate.toFixed(1)}</td>
      </tr>`;
    })
    .join("");

  const startOptions = c.startOptions
    .map(
      (option) => `<li>
        <a href="${escapeHtml(option.href)}" class="start-card">
          <span class="start-card__arrow" aria-hidden="true">\u2192</span>
          <span class="start-card__label">${escapeHtml(option.label)}</span>
          <span class="start-card__description">${escapeHtml(option.description)}</span>
        </a>
      </li>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(c.h1)} \u2014 ${escapeHtml(copy.brand)}</title>
  <style>${civicCss()}</style>
</head>
<body>
  <a class="skip-link" href="#main">Skip to main content</a>
  ${renderVariantSwitcher()}
  <header class="site-header">
    <div class="site-header__inner">
      <a href="/lab/civic" class="site-header__brand">
        <span class="site-header__crest" aria-hidden="true"></span>
        <span>
          <span class="site-header__title">NyaayWatch</span>
          <span class="site-header__tagline">${escapeHtml(copy.brandTag)}</span>
        </span>
      </a>
      <nav class="site-header__nav" aria-label="Primary">
        <a href="/districts">Districts</a>
        <a href="/data">Data</a>
        <a href="/methodology">Methodology</a>
        <a href="/api">API</a>
      </nav>
    </div>
  </header>

  <div class="notice-bar" role="note">
    <div class="notice-bar__inner">
      <strong>Published ${escapeHtml(model.sourceDateLabel)}.</strong>
      Source numbers from the National Judicial Data Grid. ${infoIcon("source")}
    </div>
  </div>

  <main id="main">
    <section class="intro">
      <div class="intro__content">
        <h1>${escapeHtml(c.h1)}</h1>
        <p class="intro__body">${escapeHtml(c.intro)}</p>
      </div>
    </section>

    <section class="headline-numbers" aria-label="Headline numbers">
      <div class="headline-numbers__grid">
        <div class="headline-number">
          <p class="headline-number__value">${escapeHtml(model.pendingLakh)}</p>
          <p class="headline-number__label">cases waiting ${infoIcon("backlog")}</p>
        </div>
        <div class="headline-number">
          <p class="headline-number__value">${model.clearanceRate.toFixed(1)}<span class="headline-number__unit">per 100</span></p>
          <p class="headline-number__label">cases cleared for every 100 filed ${infoIcon("clearance")}</p>
        </div>
        <div class="headline-number">
          <p class="headline-number__value">~${model.typicalWaitMonths}<span class="headline-number__unit">months</span></p>
          <p class="headline-number__label">typical wait ${infoIcon("typicalWait")}</p>
        </div>
        <div class="headline-number">
          <p class="headline-number__value">${model.flaggedCount}<span class="headline-number__unit">of ${model.totalDistricts}</span></p>
          <p class="headline-number__label">districts on the watchlist ${infoIcon("watchlist")}</p>
        </div>
      </div>
    </section>

    <section class="start">
      <h2>${escapeHtml(c.start)}</h2>
      <ul class="start__list">${startOptions}</ul>
    </section>

    <section class="districts">
      <h2>All districts in the latest publication</h2>
      <p class="districts__lede">Sorted by watch rank. Cases waiting is the total pile. Cleared per 100 filed shows whether courts are catching up (above 100) or falling behind (below 100) on new work. Typical wait is an estimate of how long the pile has been waiting, in months.</p>
      <div class="table-wrap">
        <table>
          <caption class="visually-hidden">District-level court data for Himachal Pradesh, as of ${escapeHtml(model.sourceDateLabel)}</caption>
          <thead>
            <tr>
              <th scope="col">Status</th>
              <th scope="col">District</th>
              <th scope="col" class="num">Cases waiting</th>
              <th scope="col" class="num">Cleared / 100 filed</th>
              <th scope="col" class="num">Typical wait (months)</th>
            </tr>
          </thead>
          <tbody>${districtRows}</tbody>
        </table>
      </div>
    </section>

    <section class="trend">
      <h2>How the total has moved</h2>
      <p class="districts__lede">Each row is one month's published number. Comparing month to month gives a more useful picture than any single figure on its own.</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col" class="num">Cases waiting</th>
              <th scope="col" class="num">Cleared / 100 filed</th>
            </tr>
          </thead>
          <tbody>${trendRows}</tbody>
        </table>
      </div>
    </section>

    <section class="about">
      <h2>About this site</h2>
      <p>NyaayWatch is an independent, reader-first view of publicly available court numbers. Everything on the site comes from public government sources. We do not add, estimate, or adjust the underlying figures \u2014 we re-organize them so they are easier to read, and we explain every technical term in plain English. Click any ${infoIcon("methodology")} icon on the page to see what a term means.</p>
      <p>If you are a journalist, civic group, researcher, or citizen, you are free to use, quote, and download everything on this site. All data is available on the <a href="/data">data downloads page</a>.</p>
    </section>
  </main>

  <footer class="site-footer">
    <div class="site-footer__inner">
      <div>
        <p class="site-footer__brand">NyaayWatch</p>
        <p>${escapeHtml(copy.brandTag)}</p>
      </div>
      <div>
        <p>Latest publication: ${escapeHtml(model.sourceDateLabel)}</p>
        <p>Methodology version: ${escapeHtml(model.methodologyVersion)} ${infoIcon("methodology")}</p>
        <p>Freshness: ${model.freshnessDays} day(s) ${infoIcon("freshness")}</p>
      </div>
      <div>
        <ul class="site-footer__links">
          <li><a href="/districts">Districts</a></li>
          <li><a href="/data">Data downloads</a></li>
          <li><a href="/methodology">Methodology</a></li>
          <li><a href="/api">API</a></li>
        </ul>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

function civicCss(): string {
  return `
    :root {
      --ink: #0b0c0c;
      --ink-soft: #383f43;
      --ink-muted: #626a6e;
      --rule: #b1b4b6;
      --rule-soft: #dcdfe0;
      --bg: #ffffff;
      --bg-soft: #f3f2f1;
      --link: #1d4ed8;
      --link-visited: #4c2c92;
      --accent: #ffdd00;
      --watch: #d4351c;
    }
    * { box-sizing: border-box; }
    html { font-size: 18px; }
    body {
      margin: 0;
      font-family: "GDS Transport", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      color: var(--ink); background: var(--bg);
      font-size: 1rem; line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    a { color: var(--link); text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 1px; }
    a:hover { color: #0a2dad; text-decoration-thickness: 3px; }
    a:visited { color: var(--link-visited); }
    a:focus, button:focus {
      outline: 3px solid transparent;
      color: var(--ink);
      background: var(--accent);
      box-shadow: 0 -2px var(--accent), 0 4px var(--ink);
      text-decoration: none;
    }
    h1, h2, h3 { font-weight: 700; letter-spacing: -0.01em; color: var(--ink); }
    .num { font-variant-numeric: tabular-nums lining-nums; }
    .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
    .skip-link {
      position: absolute; top: -40px; left: 0;
      background: var(--accent); color: var(--ink);
      padding: 10px 16px; z-index: 100; font-weight: 700;
    }
    .skip-link:focus { top: 0; }

    .lab-switcher {
      background: var(--ink); color: var(--bg);
      padding: 10px 24px;
      font-size: 0.78rem;
      display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
    }
    .lab-switcher a { color: var(--bg); }
    .lab-switcher a:visited { color: var(--bg); }
    .lab-switcher__label { opacity: 0.7; }
    .lab-switcher strong { font-weight: 700; }
    .lab-switcher__nav { margin-left: auto; display: flex; gap: 16px; }
    .lab-switcher__nav .is-active { font-weight: 700; text-decoration-thickness: 2px; }

    .site-header { border-bottom: 10px solid var(--ink); background: var(--bg); }
    .site-header__inner {
      max-width: 1080px; margin: 0 auto;
      padding: 18px 24px;
      display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap;
    }
    .site-header__brand { display: flex; align-items: center; gap: 14px; text-decoration: none; color: var(--ink); }
    .site-header__brand:visited { color: var(--ink); }
    .site-header__crest {
      display: inline-block; width: 40px; height: 40px;
      background: var(--ink); position: relative;
    }
    .site-header__crest::before, .site-header__crest::after {
      content: ""; position: absolute; background: var(--accent);
    }
    .site-header__crest::before { top: 6px; left: 6px; right: 6px; height: 4px; }
    .site-header__crest::after { bottom: 6px; left: 6px; right: 6px; height: 4px; }
    .site-header__title { display: block; font-size: 1.45rem; font-weight: 700; line-height: 1; }
    .site-header__tagline { display: block; font-size: 0.85rem; color: var(--ink-muted); margin-top: 2px; }
    .site-header__nav { display: flex; gap: 22px; font-size: 0.95rem; }
    .site-header__nav a { text-decoration: none; font-weight: 500; }
    .site-header__nav a:hover { text-decoration: underline; text-decoration-thickness: 3px; }

    .notice-bar { background: var(--bg-soft); border-bottom: 1px solid var(--rule-soft); }
    .notice-bar__inner {
      max-width: 1080px; margin: 0 auto; padding: 14px 24px;
      font-size: 0.95rem; color: var(--ink-soft);
    }

    main { max-width: 1080px; margin: 0 auto; padding: 48px 24px 120px; }

    .intro { margin-bottom: 48px; }
    .intro__content { max-width: 40em; }
    h1 { margin: 0 0 20px; font-size: clamp(2.2rem, 4vw, 3.4rem); line-height: 1.1; }
    .intro__body { margin: 0; font-size: 1.22rem; line-height: 1.55; color: var(--ink-soft); }

    .headline-numbers { margin: 0 0 64px; }
    .headline-numbers__grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      border-top: 4px solid var(--ink);
    }
    .headline-number {
      padding: 24px 24px 24px 0;
      border-top: none; border-right: 1px solid var(--rule-soft);
    }
    .headline-number:last-child { border-right: none; padding-right: 0; }
    .headline-numbers__grid > .headline-number:not(:first-child) { padding-left: 24px; }
    .headline-number__value {
      margin: 0; font-size: clamp(2.2rem, 3.6vw, 3.2rem); font-weight: 700; line-height: 1;
      font-variant-numeric: tabular-nums lining-nums;
    }
    .headline-number__unit { font-size: 0.45em; color: var(--ink-muted); font-weight: 500; margin-left: 6px; }
    .headline-number__label { margin: 12px 0 0; font-size: 0.95rem; color: var(--ink-soft); display: inline-flex; align-items: center; gap: 6px; }

    h2 { margin: 0 0 16px; font-size: clamp(1.5rem, 2.4vw, 2rem); line-height: 1.15; }

    .start { margin-bottom: 64px; }
    .start__list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid var(--rule); }
    .start__list > li + li { }
    .start__list > li:nth-child(1), .start__list > li:nth-child(2) { border-bottom: 1px solid var(--rule); }
    .start__list > li:nth-child(odd) { border-right: 1px solid var(--rule); }
    .start-card {
      display: grid; grid-template-columns: 28px 1fr; grid-template-rows: auto auto;
      gap: 4px 14px;
      padding: 22px 24px;
      text-decoration: none; color: var(--ink);
      background: var(--bg);
      transition: background 120ms ease;
    }
    .start-card:visited { color: var(--ink); }
    .start-card:hover { background: var(--bg-soft); text-decoration: none; }
    .start-card:hover .start-card__label { text-decoration: underline; text-decoration-thickness: 3px; color: var(--link); }
    .start-card__arrow { grid-row: 1 / 3; align-self: center; color: var(--link); font-size: 1.4rem; font-weight: 700; }
    .start-card__label { font-size: 1.12rem; font-weight: 700; color: var(--link); }
    .start-card__description { font-size: 0.95rem; color: var(--ink-soft); }

    .districts, .trend { margin-bottom: 56px; }
    .districts__lede { margin: 0 0 20px; font-size: 1.05rem; line-height: 1.55; color: var(--ink-soft); max-width: 62ch; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 14px 16px; border-bottom: 1px solid var(--rule-soft); vertical-align: top; }
    th { border-bottom: 2px solid var(--ink); font-size: 0.9rem; }
    .num { text-align: right; }
    tbody tr.is-watch td { background: #fff5f3; }
    tbody tr.is-watch a { color: var(--watch); font-weight: 700; }

    .tag { display: inline-block; padding: 3px 10px; font-size: 0.78rem; font-weight: 700; background: var(--bg-soft); color: var(--ink-soft); border: 1px solid var(--rule); }
    .tag--watch { background: var(--watch); color: #fff; border-color: var(--watch); }

    .about { max-width: 40em; font-size: 1.05rem; }
    .about p { margin: 0 0 16px; }

    .site-footer { border-top: 4px solid var(--ink); background: var(--bg-soft); margin-top: 80px; }
    .site-footer__inner {
      max-width: 1080px; margin: 0 auto; padding: 40px 24px;
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px;
      font-size: 0.95rem; color: var(--ink-soft);
    }
    .site-footer p { margin: 0 0 4px; }
    .site-footer__brand { font-size: 1.1rem; font-weight: 700; color: var(--ink); }
    .site-footer__links { list-style: none; margin: 0; padding: 0; }
    .site-footer__links li { margin-bottom: 6px; }

    /* info icon */
    .info { display: inline-block; position: relative; vertical-align: middle; }
    .info summary {
      list-style: none; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      width: 20px; height: 20px; border-radius: 999px;
      background: var(--ink); color: #fff;
      font-size: 11px; font-weight: 700; font-family: inherit;
      border: 2px solid var(--ink);
      transition: background 100ms ease;
    }
    .info summary::-webkit-details-marker { display: none; }
    .info summary::marker { content: ""; }
    .info:hover summary, .info[open] summary {
      background: var(--link); border-color: var(--link);
    }
    .info summary:focus-visible {
      outline: 3px solid var(--accent); outline-offset: 0;
      box-shadow: 0 0 0 4px var(--ink);
      background: var(--accent); color: var(--ink); border-color: var(--ink);
    }
    .info-popover {
      position: absolute; z-index: 30; top: calc(100% + 8px); left: 50%;
      transform: translateX(-50%);
      min-width: 280px; max-width: 320px;
      padding: 16px 18px;
      background: var(--bg); color: var(--ink);
      border: 2px solid var(--ink);
      box-shadow: 4px 4px 0 var(--ink);
      font-size: 0.92rem;
    }
    .info:hover .info-popover, .info[open] .info-popover, .info:focus-within .info-popover { display: block; }
    .info .info-popover { display: none; }
    .info-popover strong { display: block; margin-bottom: 6px; font-size: 0.88rem; color: var(--ink); }
    .info-popover p { margin: 0 0 8px; line-height: 1.5; color: var(--ink-soft); }
    .info-popover p:last-child { margin-bottom: 0; }
    .info-short { font-weight: 700; color: var(--ink) !important; }

    @media (max-width: 960px) {
      .headline-numbers__grid { grid-template-columns: 1fr 1fr; }
      .headline-number:nth-child(2) { border-right: none; }
      .headline-number:nth-child(3) { padding-left: 0; padding-top: 24px; border-top: 1px solid var(--rule-soft); }
      .headline-number:nth-child(4) { padding-top: 24px; border-top: 1px solid var(--rule-soft); }
      .start__list { grid-template-columns: 1fr; }
      .start__list > li:nth-child(odd) { border-right: none; }
      .start__list > li + li { border-top: 1px solid var(--rule); border-bottom: none; }
      .site-footer__inner { grid-template-columns: 1fr; }
    }
    @media (max-width: 680px) {
      .headline-numbers__grid { grid-template-columns: 1fr; }
      .headline-number { border-right: none; padding-left: 0 !important; border-top: 1px solid var(--rule-soft); }
      .headline-number:first-child { border-top: none; }
      .site-header__inner { flex-direction: column; align-items: flex-start; }
    }
  `;
}

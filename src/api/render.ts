import type { DistrictSnapshot, PublishedSnapshot } from "../domain/snapshot-schema.js";
import type {
  DistrictHistoryPoint,
  SnapshotHistoryEntry,
} from "../services/published-snapshot-service.js";
import { escapeHtml } from "../lib/html.js";

type DistrictSort = "rank" | "backlog" | "disposal" | "age" | "gap";
type DistrictView = "all" | "flagged";
type TermKey =
  | "casesWaiting"
  | "clearanceRate"
  | "typicalWait"
  | "districtsToWatch"
  | "fileClearGap"
  | "freshness"
  | "qualityState";

export interface DistrictsPageOptions {
  search: string;
  sort: DistrictSort;
  view: DistrictView;
}

const SORT_LABELS: Record<DistrictSort, string> = {
  rank: "Biggest public pressure signal",
  backlog: "Most cases waiting",
  disposal: "Slowest case-clear pace",
  age: "Longest typical wait",
  gap: "Biggest file-clear gap",
};

const VIEW_LABELS: Record<DistrictView, string> = {
  all: "All districts",
  flagged: "Watchlist only",
};

const TERM_DEFINITIONS: Record<TermKey, { title: string; body: string }> = {
  casesWaiting: {
    title: "Cases waiting",
    body: "This is the total number of pending cases in the published snapshot. It is a dated aggregate for the district or state, not a live counter.",
  },
  clearanceRate: {
    title: "Cases cleared for every 100 filed",
    body: "Formula: cases disposed last month divided by cases filed last month, multiplied by 100. A value above 100 means the system cleared more cases than it received that month.",
  },
  typicalWait: {
    title: "Typical wait",
    body: "This is an estimate built from NJDG age buckets. It points to the middle of the pending queue, so it is a district-level waiting-time estimate, not the age of one specific case.",
  },
  districtsToWatch: {
    title: "Districts to watch",
    body: "These districts combine a large queue with slower clearing or longer waits. They are signals for closer inspection, not final judgments about one court or official.",
  },
  fileClearGap: {
    title: "File-clear gap",
    body: "Positive means new cases came in faster than cases were cleared last month. Negative means the district cleared cases faster than new ones came in.",
  },
  freshness: {
    title: "Freshness",
    body: "Freshness counts how many days old the source snapshot is. NyaayWatch stays pinned to the last safe publication until a newer run passes review.",
  },
  qualityState: {
    title: "Quality state",
    body: "Complete means all 12 Himachal districts were captured. Partial runs stay private. Stale means the latest safe publication is older than the freshness threshold.",
  },
};

export function renderLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Cormorant+Garamond:wght@600;700&display=swap" rel="stylesheet" />
    <style>
      :root {
        color-scheme: light;
        --paper: #f6efe6;
        --paper-strong: #fff8ef;
        --panel: rgba(255, 251, 245, 0.9);
        --panel-strong: rgba(255, 252, 247, 0.96);
        --ink: #102033;
        --muted: #5b6577;
        --line: rgba(16, 32, 51, 0.12);
        --accent: #c45d2f;
        --accent-deep: #8e3e1e;
        --accent-soft: rgba(196, 93, 47, 0.1);
        --teal: #0d7c75;
        --teal-soft: rgba(13, 124, 117, 0.1);
        --warning: #8d5c13;
        --warning-bg: #fff2d8;
        --ok: #114737;
        --ok-bg: #dff3ec;
        --shadow: 0 18px 40px rgba(16, 32, 51, 0.06);
      }
      * {
        box-sizing: border-box;
      }
      html {
        scroll-behavior: smooth;
      }
      body {
        margin: 0;
        font-family: "Instrument Sans", sans-serif;
        line-height: 1.5;
        background:
          radial-gradient(circle at top left, rgba(196, 93, 47, 0.12), transparent 24%),
          radial-gradient(circle at top right, rgba(13, 124, 117, 0.1), transparent 22%),
          linear-gradient(180deg, #fbf5ee 0%, #f4ecdf 100%);
        color: var(--ink);
        text-rendering: optimizeLegibility;
      }
      main {
        max-width: 1220px;
        margin: 0 auto;
        padding: 28px 18px 80px;
      }
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 24px;
        flex-wrap: wrap;
        margin-bottom: 24px;
      }
      nav {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
      }
      a {
        color: inherit;
      }
      nav a, .action-links a, .pill-link {
        color: var(--ink);
        text-decoration: none;
        position: relative;
      }
      nav a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 0 14px;
        border-radius: 999px;
        border: 1px solid rgba(16, 32, 51, 0.08);
        background: rgba(255, 251, 245, 0.72);
        font-weight: 600;
        transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
      }
      nav a::after, .action-links a::after {
        content: "";
        position: absolute;
        left: 0;
        bottom: -3px;
        width: 100%;
        height: 1px;
        background: currentColor;
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 160ms ease;
      }
      nav a:hover::after, nav a:focus-visible::after, .action-links a:hover::after, .action-links a:focus-visible::after {
        transform: scaleX(1);
      }
      nav a:hover,
      nav a:focus-visible {
        background: var(--panel-strong);
        border-color: rgba(16, 32, 51, 0.14);
        transform: translateY(-1px);
      }
      h1, h2, h3, p {
        margin-top: 0;
      }
      h1, h2, h3 {
        font-family: "Cormorant Garamond", serif;
        letter-spacing: -0.02em;
        line-height: 0.95;
      }
      h1 {
        font-size: clamp(2.85rem, 5vw, 4.8rem);
        margin-bottom: 16px;
        text-wrap: balance;
        line-height: 0.98;
      }
      h2 {
        font-size: clamp(2rem, 3.4vw, 3rem);
        margin-bottom: 12px;
      }
      h3 {
        font-size: 1.4rem;
        margin-bottom: 8px;
      }
      .lede {
        font-size: 1.12rem;
        max-width: 62ch;
        color: var(--muted);
      }
      .display-title {
        font-size: clamp(4rem, 7vw, 6rem);
        letter-spacing: -0.035em;
      }
      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.95fr);
        gap: 26px;
        align-items: stretch;
        margin-bottom: 24px;
      }
      .hero-single {
        grid-template-columns: minmax(0, 1fr);
        max-width: 980px;
      }
      .hero > :only-child {
        grid-column: 1 / -1;
      }
      .hero-copy, .hero-panel, .trust-strip, .card, table, .callout, .controls, .status-banner {
        background: var(--panel);
        backdrop-filter: blur(10px);
        border: 1px solid var(--line);
        box-shadow: var(--shadow);
      }
      .hero-copy {
        padding: 26px;
        border-radius: 26px;
      }
      .hero-panel {
        border-radius: 24px;
        padding: 22px;
        display: grid;
        gap: 18px;
        align-content: start;
      }
      .hero-single .hero-copy {
        max-width: 980px;
      }
      .hero-copy > :last-child {
        margin-bottom: 0;
      }
      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 0.74rem;
        font-weight: 700;
        color: var(--accent-deep);
        margin-bottom: 12px;
      }
      .kicker {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(16, 32, 51, 0.06);
        color: var(--ink);
        font-size: 0.82rem;
        font-weight: 600;
        margin-bottom: 16px;
      }
      .kicker strong {
        color: var(--accent-deep);
      }
      .trust-strip, .card, .callout, .controls, .status-banner {
        border-radius: 22px;
        padding: 18px;
      }
      .hero-panel .meta-value {
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--ink);
      }
      .hero-panel .meta-note {
        color: var(--muted);
        font-size: 0.95rem;
      }
      .grid {
        display: grid;
        gap: 18px;
      }
      .stats {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        margin: 24px 0 30px;
      }
      .split {
        grid-template-columns: minmax(0, 1.7fr) minmax(300px, 0.95fr);
        align-items: start;
      }
      .muted {
        color: var(--muted);
      }
      .brand-lockup {
        font-family: "Cormorant Garamond", serif;
        font-size: 2.1rem;
        font-weight: 700;
        letter-spacing: -0.03em;
      }
      .badge-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 12px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 12px;
        padding: 7px 10px;
        font-size: 0.82rem;
        font-weight: 600;
        background: var(--accent-soft);
        color: var(--accent-deep);
        border: 1px solid rgba(196, 93, 47, 0.08);
      }
      .badge.complete {
        background: #d5ece4;
        color: #0c3b2e;
      }
      .badge.stale, .badge.partial {
        background: var(--warning-bg);
        color: var(--warning);
      }
      .status-banner {
        margin-top: 18px;
      }
      .status-banner.complete {
        background: var(--ok-bg);
        border-color: rgba(20, 102, 81, 0.18);
      }
      .status-banner.stale, .status-banner.partial {
        background: var(--warning-bg);
        border-color: rgba(141, 92, 19, 0.18);
      }
      .controls {
        margin: 20px 0 24px;
      }
      .controls form {
        display: grid;
        grid-template-columns: 1.3fr repeat(2, minmax(160px, 220px)) auto;
        gap: 12px;
        align-items: end;
      }
      label {
        display: grid;
        gap: 6px;
        font-size: 0.92rem;
      }
      input, select, button {
        font: inherit;
        border-radius: 14px;
        border: 1px solid var(--line);
        padding: 12px 14px;
        background: rgba(255, 253, 249, 0.92);
        color: var(--ink);
      }
      button {
        cursor: pointer;
        background: var(--accent-deep);
        border-color: var(--accent-deep);
        color: white;
        transition: transform 180ms ease, box-shadow 180ms ease;
      }
      button:hover, button:focus-visible {
        transform: translateY(-1px);
        box-shadow: 0 14px 30px rgba(142, 62, 30, 0.2);
      }
      .meta-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .metric-card {
        position: relative;
        overflow: hidden;
      }
      .metric-card::before {
        content: "";
        position: absolute;
        inset: 0 auto auto 0;
        width: 100%;
        height: 4px;
        background: linear-gradient(90deg, var(--accent) 0%, rgba(13, 124, 117, 0.95) 100%);
      }
      .metric-card h2 {
        font-family: "Instrument Sans", sans-serif;
        font-size: clamp(2rem, 4vw, 3.6rem);
        font-weight: 700;
        line-height: 1;
        margin-bottom: 10px;
      }
      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        overflow: hidden;
        border-radius: 26px;
      }
      th, td {
        text-align: left;
        padding: 14px 16px;
        border-bottom: 1px solid rgba(16, 32, 51, 0.08);
        vertical-align: top;
      }
      th {
        font-size: 0.74rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--muted);
        background: rgba(16, 32, 51, 0.04);
      }
      td small {
        color: var(--muted);
        display: block;
        margin-top: 4px;
        line-height: 1.45;
      }
      tbody tr:hover td {
        background: rgba(255, 255, 255, 0.45);
      }
      .numeric {
        font-variant-numeric: tabular-nums lining-nums;
        font-feature-settings: "tnum" 1, "lnum" 1;
      }
      .chart-list, .download-list, .citation-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .chart-list li, .download-list li, .citation-list li {
        padding: 10px 0;
        border-bottom: 1px solid var(--line);
      }
      .download-list a {
        font-weight: bold;
      }
      .history-bars {
        display: grid;
        gap: 10px;
      }
      .preview-list {
        display: grid;
        gap: 12px;
      }
      .preview-row {
        display: grid;
        gap: 10px;
        padding: 16px 0;
        border-bottom: 1px solid rgba(16, 32, 51, 0.08);
      }
      .preview-top {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
      }
      .preview-name {
        font-size: 1.2rem;
        font-weight: 700;
        text-decoration: none;
      }
      .preview-metrics {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        color: var(--muted);
        font-size: 0.92rem;
      }
      .preview-metrics strong {
        color: var(--ink);
        font-weight: 700;
      }
      .history-row {
        display: grid;
        gap: 6px;
      }
      .history-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .bar-track {
        width: 100%;
        height: 12px;
        border-radius: 999px;
        background: rgba(31, 43, 36, 0.08);
        overflow: hidden;
      }
      .bar-fill {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, var(--accent-deep), #d98a4c);
      }
      .inline-note {
        font-size: 0.9rem;
        color: var(--muted);
      }
      .action-links {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 16px;
      }
      .button-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 48px;
        padding: 12px 18px;
        border-radius: 999px;
        border: 1px solid var(--line);
        text-decoration: none;
        font-weight: 600;
        transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
      }
      .button-link.primary {
        background: var(--ink);
        color: #fff;
        border-color: var(--ink);
      }
      .button-link.secondary {
        background: rgba(255, 255, 255, 0.72);
      }
      .button-link:hover, .button-link:focus-visible {
        transform: translateY(-1px);
      }
      .term {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .term-help {
        position: relative;
        display: inline-flex;
      }
      .term-help-wrap {
        display: inline-flex;
        vertical-align: middle;
        margin-left: 6px;
      }
      .term-help summary {
        list-style: none;
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 999px;
        border: 1px solid rgba(16, 32, 51, 0.18);
        background: rgba(255, 255, 255, 0.8);
        color: var(--ink);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 0.78rem;
        font-weight: 700;
      }
      .term-help summary:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
      .term-help summary::-webkit-details-marker {
        display: none;
      }
      .term-help[open] summary {
        background: var(--ink);
        color: white;
      }
      .term-popover {
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        width: min(290px, 72vw);
        padding: 14px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: rgba(255, 251, 245, 0.98);
        box-shadow: 0 18px 40px rgba(16, 32, 51, 0.12);
        color: var(--ink);
        z-index: 10;
      }
      .term-popover strong {
        display: block;
        margin-bottom: 6px;
      }
      .section-stack {
        display: grid;
        gap: 24px;
      }
      .rail-note {
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid rgba(196, 93, 47, 0.12);
        background: rgba(196, 93, 47, 0.08);
      }
      .hero-copy,
      .hero-panel,
      .trust-strip,
      .status-banner,
      .metric-card,
      .callout,
      .controls,
      table {
        animation: rise 420ms ease;
      }
      code {
        font-family: "SFMono-Regular", "SF Mono", Consolas, monospace;
        font-size: 0.95em;
        word-break: break-word;
      }
      @keyframes rise {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @media (max-width: 860px) {
        .hero,
        .split {
          grid-template-columns: 1fr;
        }
        .controls form {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 720px) {
        h1 {
          font-size: clamp(2.7rem, 13vw, 4.25rem);
        }
        .display-title {
          font-size: clamp(3.35rem, 17vw, 5rem);
        }
        .lede {
          font-size: 1rem;
        }
        header {
          align-items: flex-start;
        }
        nav {
          width: 100%;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 2px;
        }
        nav a {
          min-height: 42px;
          padding: 0 12px;
        }
        table, thead, tbody, th, td, tr {
          display: block;
        }
        thead {
          display: none;
        }
        tr {
          border-bottom: 1px solid var(--line);
        }
        td {
          padding-top: 10px;
          padding-bottom: 10px;
          padding-left: 0;
          padding-right: 0;
        }
        td::before {
          content: attr(data-label);
          display: block;
          margin-bottom: 4px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .hero-copy, .hero-panel, .trust-strip, .card, .callout, .controls, .status-banner {
          padding: 18px;
        }
        .preview-top, .preview-metrics {
          display: grid;
          gap: 6px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      ${body}
    </main>
  </body>
</html>`;
}

export function renderHomePage(snapshot: PublishedSnapshot): string {
  const stats = [
    {
      label: "Cases waiting",
      value: snapshot.stats.pendingCases.toLocaleString("en-IN"),
      term: "casesWaiting" as const,
      note: "Across the active Himachal published snapshot.",
    },
    {
      label: "Cases cleared for every 100 filed",
      value: `${snapshot.stats.disposalRate.toFixed(1)}%`,
      term: "clearanceRate" as const,
      note: "A quick view of whether the system is clearing cases faster than new ones are arriving.",
    },
    {
      label: "Typical wait",
      value: `${snapshot.stats.medianCaseAgeDays} days`,
      term: "typicalWait" as const,
      note: "An estimate based on published age buckets, not case-level records.",
    },
    {
      label: "Districts to watch",
      value: String(snapshot.stats.flaggedDistricts),
      term: "districtsToWatch" as const,
      note: "Signals for closer public inspection in this snapshot.",
    },
  ];
  const flagged = snapshot.districts.slice(0, 3);

  return renderLayout(
    "NyaayWatch",
    `
      <header>
        <div>
          <div class="brand-lockup">NyaayWatch</div>
        </div>
        <nav>
          <a href="/districts">Districts</a>
          <a href="/data">Data</a>
          <a href="/methodology">Methodology</a>
          <a href="/api">API Docs</a>
        </nav>
      </header>
      <section class="hero">
        <article class="hero-copy">
          <div class="kicker"><strong>Public alpha</strong><span>Himachal Pradesh only</span></div>
          <div class="eyebrow">Common-language justice tracking</div>
          <h1 class="display-title">See where cases are getting stuck in Himachal Pradesh.</h1>
          <p class="lede">NyaayWatch turns one published court snapshot into a calm public briefing. You can see the size of the queue, which districts need a closer look, and what the numbers actually mean before you share them.</p>
          <p class="rail-note">This is a dated public snapshot with stored evidence behind it, not a live court feed.</p>
          <div class="action-links">
            <a class="button-link primary" href="/districts">Explore districts</a>
            <a class="button-link secondary" href="/methodology">How we calculate this</a>
          </div>
        </article>
        <aside class="hero-panel">
          <div>
            <div class="eyebrow">Latest publication</div>
            <div class="meta-value numeric">${escapeHtml(formatDate(snapshot.snapshot.sourceSnapshotAt))}</div>
            <div class="meta-note">Source snapshot date</div>
          </div>
          <div>
            <div class="meta-value">${escapeHtml(snapshot.snapshot.methodologyVersion)}</div>
            <div class="meta-note">Methodology version now visible on every trust-critical surface.</div>
          </div>
          <div>
            <div class="meta-value numeric">${snapshot.snapshot.freshnessDays} day(s)</div>
            <div class="meta-note">Freshness tells you how old the published source snapshot is.</div>
          </div>
          <div class="badge-row">
            <span class="badge">Plain-language public view</span>
            <span class="badge">Stored evidence</span>
            <span class="badge">Shareable district pages</span>
          </div>
        </aside>
      </section>
      ${renderTrustStrip(snapshot.snapshot)}
      ${renderTrustStatus(snapshot.snapshot)}
      <section class="grid stats">
        ${stats
          .map(
            (stat) =>
              `<article class="card metric-card"><div class="term">${escapeHtml(stat.label)}${renderTermHelp(stat.term)}</div><h2 class="numeric">${escapeHtml(stat.value)}</h2><p class="inline-note">${escapeHtml(stat.note)}</p></article>`,
          )
          .join("")}
      </section>
      <section class="grid split">
        <div class="section-stack">
          <article class="callout">
            <div class="eyebrow">District workspace preview</div>
            <h2>Start with the districts carrying the heaviest load.</h2>
            <p class="inline-note">The homepage shows only a short list. Open the district workspace for search, alternate sorts, and shareable district pages.</p>
            ${renderDistrictPreviewList(snapshot.districts.slice(0, 5))}
            <p class="action-links">
              <a href="/districts">Open the full district index</a>
              <a href="/data/districts.csv">Download the statewide CSV</a>
            </p>
          </article>
        </div>
        <div class="section-stack">
          <article class="callout">
            <div class="eyebrow">Flagged signals</div>
            <h2>Where a closer look is worth your time</h2>
            <p class="inline-note">These districts stand out because of queue size, slower clearing, or longer waiting times in the latest published snapshot.</p>
            ${flagged
              .map(
                (district) => `<p><strong><a href="/districts/${escapeHtml(district.districtId)}">${escapeHtml(
                  district.districtName,
                )}</a></strong><br />${escapeHtml(district.summary)}</p>`,
              )
              .join("")}
          </article>
          <article class="callout">
            <div class="eyebrow">Statewide trend</div>
            <h2>Statewide backlog trend</h2>
            <ul class="chart-list">
              ${snapshot.trends
                .map(
                  (point) =>
                    `<li><strong>${escapeHtml(formatDate(point.snapshotDate))}</strong><br /><span class="muted">${point.pendingCases.toLocaleString(
                      "en-IN",
                    )} cases waiting, ${point.disposalRate.toFixed(1)} cleared for every 100 filed</span></li>`,
                )
                .join("")}
            </ul>
          </article>
        </div>
      </section>
    `,
  );
}

export function renderDistrictsPage(snapshot: PublishedSnapshot, options: DistrictsPageOptions): string {
  const districts = filterAndSortDistricts(snapshot.districts, options, snapshot.stats.flaggedDistricts);
  const highestBacklog = [...snapshot.districts].sort((left, right) => right.backlogCases - left.backlogCases)[0];
  const lowestDisposal = [...snapshot.districts].sort((left, right) => left.disposalRate - right.disposalRate)[0];

  return renderLayout(
    "NyaayWatch Districts",
    `
      <header>
        <div>
          <div class="brand-lockup">NyaayWatch</div>
        </div>
        <nav>
          <a href="/">Overview</a>
          <a href="/data">Data</a>
          <a href="/methodology">Methodology</a>
        </nav>
      </header>
      <section class="hero">
        <article class="hero-copy">
          <div class="kicker"><strong>District workspace</strong><span>Browse, compare, inspect</span></div>
          <div class="eyebrow">District-by-district scan</div>
          <h1 class="display-title">Find the districts under the most pressure.</h1>
          <p class="lede">Sort by queue size, case-clearing pace, waiting time, or file-clear gap. Open any district row for the shareable evidence page.</p>
        </article>
        <aside class="hero-panel">
          <div>
            <div class="meta-value numeric">${districts.length} of ${snapshot.districts.length}</div>
            <div class="meta-note">${escapeHtml(VIEW_LABELS[options.view])}${options.search ? ` matching "${escapeHtml(options.search)}"` : ""}.</div>
          </div>
          <div>
            <div class="meta-value numeric">${snapshot.stats.flaggedDistricts}</div>
            <div class="meta-note">Districts currently on the watchlist in the published snapshot.</div>
          </div>
          <div class="badge-row">
            <span class="badge">Search by district</span>
            <span class="badge">Switch urgency sort</span>
          </div>
        </aside>
      </section>
      ${renderTrustStrip(snapshot.snapshot)}
      ${renderTrustStatus(snapshot.snapshot)}
      <section class="meta-grid">
        <article class="card metric-card">
          <div class="term">Cases waiting leader${renderTermHelp("casesWaiting")}</div>
          <h2>${escapeHtml(highestBacklog?.districtName ?? "N/A")}</h2>
          <p class="inline-note">${highestBacklog ? `${highestBacklog.backlogCases.toLocaleString("en-IN")} cases waiting.` : "No district data."}</p>
        </article>
        <article class="card metric-card">
          <div class="term">Slowest case-clear pace${renderTermHelp("clearanceRate")}</div>
          <h2>${escapeHtml(lowestDisposal?.districtName ?? "N/A")}</h2>
          <p class="inline-note">${lowestDisposal ? `${lowestDisposal.disposalRate.toFixed(1)} cleared for every 100 filed.` : "No district data."}</p>
        </article>
        <article class="card metric-card">
          <div class="term">Watchlist size${renderTermHelp("districtsToWatch")}</div>
          <h2 class="numeric">${snapshot.stats.flaggedDistricts}</h2>
          <p class="inline-note">These are the clearest districts to inspect first, not final calls on any court or official.</p>
        </article>
      </section>
      ${renderDistrictControls(options)}
      <article class="callout">
        <div class="eyebrow">Current ranking mode</div>
        <h2>${escapeHtml(SORT_LABELS[options.sort])}</h2>
        <p class="inline-note">All rows come from the latest published snapshot. Historical context and export links live on each district page.</p>
      </article>
      ${districts.length > 0 ? renderDistrictTable(districts) : renderNoResults(options)}
    `,
  );
}

export function renderDistrictPage(
  snapshot: PublishedSnapshot["snapshot"],
  district: DistrictSnapshot,
  history: DistrictHistoryPoint[],
): string {
  const currentIndex = history.findIndex(
    (point) => point.snapshotDate === snapshot.sourceSnapshotAt && point.publishedAt === snapshot.publishedAt,
  );
  const currentPoint = currentIndex >= 0 ? history[currentIndex] : history[history.length - 1] ?? null;
  const previousPoint =
    currentIndex > 0 ? history[currentIndex - 1] : history.length > 1 ? history[history.length - 2] : null;
  const backlogDelta = currentPoint && previousPoint ? currentPoint.backlogCases - previousPoint.backlogCases : null;
  const disposalDelta = currentPoint && previousPoint ? roundDelta(currentPoint.disposalRate - previousPoint.disposalRate) : null;
  const rankDelta = currentPoint && previousPoint ? previousPoint.rank - currentPoint.rank : null;

  return renderLayout(
    `${district.districtName} | NyaayWatch`,
    `
      <header>
        <div>
          <div class="brand-lockup">NyaayWatch</div>
        </div>
        <nav>
          <a href="/">Overview</a>
          <a href="/districts">Districts</a>
          <a href="/data">Data</a>
        </nav>
      </header>
      <section class="hero">
        <article class="hero-copy">
          <div class="kicker"><strong>${escapeHtml(district.districtName)}</strong><span>District evidence page</span></div>
          <div class="eyebrow">District snapshot</div>
          <h1>${escapeHtml(district.districtName)}</h1>
          <p class="lede">${escapeHtml(district.summary)}</p>
        </article>
        <aside class="hero-panel">
          <div>
            <div class="meta-value">Watch rank #${district.rank}</div>
            <div class="meta-note">Higher ranks mean the district appears closer to the front of the current statewide queue-pressure list.</div>
          </div>
          <div>
            <div class="meta-value">${escapeHtml(snapshot.methodologyVersion)}</div>
            <div class="meta-note">The same methodology version is shown on the homepage, exports, and API.</div>
          </div>
          <div class="badge-row">
            <span class="badge">Shareable permalink</span>
            <span class="badge">Published history only</span>
          </div>
        </aside>
      </section>
      ${renderTrustStrip(snapshot)}
      ${renderTrustStatus(snapshot)}
      <section class="grid stats">
        <article class="card metric-card"><div class="muted">Watch rank</div><h2 class="numeric">#${district.rank}</h2><p class="inline-note">${formatRankDelta(rankDelta)}</p></article>
        <article class="card metric-card"><div class="term">Cases waiting${renderTermHelp("casesWaiting")}</div><h2 class="numeric">${district.backlogCases.toLocaleString("en-IN")}</h2><p class="inline-note">${formatNumericDelta(backlogDelta, "cases versus the prior published snapshot")}</p></article>
        <article class="card metric-card"><div class="term">Cases cleared for every 100 filed${renderTermHelp("clearanceRate")}</div><h2 class="numeric">${district.disposalRate.toFixed(1)}%</h2><p class="inline-note">${formatDeltaWithUnit(disposalDelta, "percentage points versus the prior published snapshot")}</p></article>
        <article class="card metric-card"><div class="term">Typical wait${renderTermHelp("typicalWait")}</div><h2 class="numeric">${district.medianAgeDays} days</h2><p class="inline-note">Estimated from published age buckets, not case-level records.</p></article>
      </section>
      <section class="grid split">
        <div class="section-stack">
          <article class="callout">
            <div class="eyebrow">Flagged explanation</div>
            <h2>Why this district stands out</h2>
            <p>${escapeHtml(district.flagReason)}</p>
            <p class="muted">File-clear gap: <span class="numeric">${district.filingVsDisposalGap.toFixed(1)}</span> percentage points in the latest published snapshot.</p>
          </article>
          <article class="callout">
            <div class="eyebrow">Historical context</div>
            <h2>Published district history</h2>
            <p class="inline-note">This table only includes previously published snapshots, so it stays inside the public trust boundary.</p>
            ${renderDistrictHistoryBars(history)}
            ${renderDistrictHistoryTable(history)}
          </article>
        </div>
        <div class="section-stack">
          <article class="callout">
            <div class="eyebrow">Cite and export</div>
            <h2>Durable citation surface</h2>
            <ul class="citation-list">
              <li><strong>Permalink</strong><br /><code>/districts/${escapeHtml(district.districtId)}</code></li>
              <li><strong>Source snapshot date</strong><br />${escapeHtml(formatDate(snapshot.sourceSnapshotAt))}</li>
              <li><strong>Methodology version</strong><br />${escapeHtml(snapshot.methodologyVersion)}</li>
              <li><strong>Source attribution</strong><br />${escapeHtml(snapshot.sourceAttribution)}</li>
            </ul>
            <p class="action-links">
              <a href="/data/districts/${escapeHtml(district.districtId)}.csv">Download district history CSV</a>
              <a href="/data/districts.csv">Download statewide CSV</a>
            </p>
          </article>
          <article class="callout">
            <div class="eyebrow">Caveats</div>
            <h2>How to read this page</h2>
            <p>District signals are descriptive flags from the current published snapshot. They do not assign responsibility, explain intent, or guarantee that upstream court records have already refreshed.</p>
            <p class="muted">If freshness turns stale, this page stays pinned to the last operator-published snapshot instead of slipping into unpublished or partial data.</p>
          </article>
        </div>
      </section>
    `,
  );
}

export function renderDataPage(snapshot: PublishedSnapshot): string {
  return renderLayout(
    "Data | NyaayWatch",
    `
      <header>
        <div>
          <div class="brand-lockup">NyaayWatch</div>
        </div>
        <nav>
          <a href="/">Overview</a>
          <a href="/districts">Districts</a>
          <a href="/methodology">Methodology</a>
          <a href="/api">API Docs</a>
        </nav>
      </header>
      <section class="hero hero-single">
        <article class="hero-copy">
          <div class="kicker"><strong>Data access</strong><span>Published snapshot only</span></div>
          <div class="eyebrow">CSV and API</div>
          <h1>Download exactly what the public site is showing.</h1>
          <p class="lede">These files and endpoints stay pinned to the active published snapshot. If a newer run is incomplete, it stays private until an operator publishes it.</p>
        </article>
      </section>
      ${renderTrustStrip(snapshot.snapshot)}
      ${renderTrustStatus(snapshot.snapshot)}
      <section class="meta-grid">
        <article class="card metric-card">
          <div class="muted">District rows</div>
          <h2 class="numeric">${snapshot.districts.length}</h2>
          <p class="inline-note">One row per district in the active Himachal published snapshot.</p>
        </article>
        <article class="card metric-card">
          <div class="muted">CSV/API parity</div>
          <h2>Aligned</h2>
          <p class="inline-note">The statewide CSV mirrors the district fields used by <code>GET /v1/districts</code>, plus snapshot metadata columns.</p>
        </article>
        <article class="card metric-card">
          <div class="muted">Public trust boundary</div>
          <h2>Published only</h2>
          <p class="inline-note">If a newer run is incomplete, these downloads remain pinned to the last safe publication.</p>
        </article>
      </section>
      <section class="grid split">
        <article class="callout">
          <div class="eyebrow">Downloads</div>
          <h2>Available files</h2>
          <ul class="download-list">
            <li><a href="/data/districts.csv">Statewide district CSV</a><br /><span class="muted">Includes per-district metrics plus source snapshot, methodology version, freshness, and source attribution columns.</span></li>
            <li><a href="/api">API reference</a><br /><span class="muted">Use <code>GET /v1/stats/himachal</code>, <code>GET /v1/districts</code>, and <code>GET /v1/trends</code> for machine-readable access.</span></li>
          </ul>
          <p class="inline-note">District-specific history CSVs are linked from each district permalink page.</p>
        </article>
        <article class="callout">
          <div class="eyebrow">Export caveats</div>
          <h2>What these files do and do not contain</h2>
          <p>These exports contain normalized snapshot read-model fields only. Raw capture bundles and operator evidence artifacts stay outside the public download boundary.</p>
          <p class="muted">Use the methodology page for formula details and the district pages for citation-ready narrative context.</p>
        </article>
      </section>
    `,
  );
}

export function renderMethodologyPage(
  snapshot: PublishedSnapshot["snapshot"] | null,
  history: SnapshotHistoryEntry[],
): string {
  return renderLayout(
    "Methodology | NyaayWatch",
    `
      <header>
        <div>
          <div class="brand-lockup">NyaayWatch</div>
        </div>
        <nav>
          <a href="/">Overview</a>
          <a href="/districts">Districts</a>
          <a href="/data">Data</a>
          <a href="/api">API Docs</a>
        </nav>
      </header>
      <section class="hero hero-single">
        <article class="hero-copy">
          <div class="kicker"><strong>Methodology</strong><span>How every public number is built</span></div>
          <div class="eyebrow">Trust and reproducibility</div>
          <h1>Every public number comes from one stored published snapshot.</h1>
          <p class="lede">Operators can capture newer runs in private, but the public surface stays on the last safe publication until a publish action succeeds. That keeps the product reproducible and auditable.</p>
        </article>
      </section>
      ${snapshot ? renderTrustStrip(snapshot) : ""}
      ${snapshot ? renderTrustStatus(snapshot) : ""}
      <section class="grid">
        <article class="callout">
          <div class="eyebrow">Scope and semantics</div>
          <h2>Alpha scope</h2>
          <p>Himachal Pradesh only. NyaayWatch is snapshot-based and evidence-first. It publishes dated aggregates after operator review and keeps unpublished run state private.</p>
          <p class="muted">Historical context is built from prior published snapshots, not from raw captured pages shown directly to the public.</p>
        </article>
        <article class="callout">
          <div class="eyebrow">Formulas</div>
          <h2>How the public metrics are derived</h2>
          <ul class="download-list">
            <li><strong>Cases waiting</strong><br /><span class="muted">Taken from the NJDG aggregate total for the source snapshot date.</span></li>
            <li><strong>Cases cleared for every 100 filed</strong><br /><span class="muted">Calculated as cases disposed last month divided by cases filed last month, expressed as a percentage.</span></li>
            <li><strong>Typical wait</strong><br /><span class="muted">Estimated from NJDG age-bucket totals by finding the midpoint of pending cases and mapping that bucket to a representative day count.</span></li>
            <li><strong>Districts to watch</strong><br /><span class="muted">Districts are ranked by queue size, then explained with waiting-time and file-clear-gap context.</span></li>
          </ul>
        </article>
        <article class="callout">
          <div class="eyebrow">Quality and freshness</div>
          <h2>State meanings</h2>
          <ul class="download-list">
            <li><strong>Complete</strong><br /><span class="muted">All expected Himachal districts were captured and normalized for the source snapshot.</span></li>
            <li><strong>Stale</strong><br /><span class="muted">The latest published snapshot is older than the freshness threshold. It remains visible because it is safer than showing unpublished or partial data.</span></li>
            <li><strong>Partial</strong><br /><span class="muted">An incomplete run state. Partial runs are blocked from public publish and should not appear on public metric surfaces.</span></li>
          </ul>
        </article>
        <article class="callout">
          <div class="eyebrow">Storage and publish boundary</div>
          <h2>Why the public surface is reproducible</h2>
          <p>Canonical run state, publication history, and immutable published snapshot payloads are stored in PostgreSQL. Raw scrape inputs and replayable evidence artifacts are stored in S3. Public pages read only from the active publication pointer.</p>
          <p class="muted">This lets operators fetch, inspect, publish, replay, and rollback while keeping the public product pinned to a dated, auditable snapshot.</p>
        </article>
        <article class="callout">
          <div class="eyebrow">Change history</div>
          <h2>Published methodology and snapshot lineage</h2>
          ${history.length > 0 ? renderMethodologyHistoryTable(history) : "<p class=\"muted\">No published snapshot history is available yet.</p>"}
        </article>
      </section>
    `,
  );
}

export function renderApiPage(): string {
  return renderLayout(
    "API | NyaayWatch",
    `
      <header>
        <div>
          <div class="brand-lockup">NyaayWatch</div>
        </div>
        <nav>
          <a href="/">Overview</a>
          <a href="/data">Data</a>
          <a href="/methodology">Methodology</a>
        </nav>
      </header>
      <section class="hero hero-single">
        <article class="hero-copy">
          <div class="kicker"><strong>API</strong><span>Published read model</span></div>
          <div class="eyebrow">Developer access</div>
          <h1>The API mirrors the latest published snapshot.</h1>
          <p class="lede">There is no richer hidden state than the public trust surface supports.</p>
        </article>
      </section>
      <article class="callout">
        <h2>Endpoints</h2>
        <p><code>GET /v1/stats/himachal</code></p>
        <p><code>GET /v1/districts</code></p>
        <p><code>GET /v1/trends</code></p>
      </article>
    `,
  );
}

export function renderEmptyState(title: string, message: string): string {
  return renderLayout(
    title,
    `
      <header>
        <div>
          <h1>${escapeHtml(title)}</h1>
          <p class="lede">${escapeHtml(message)}</p>
        </div>
      </header>
    `,
  );
}

function renderTrustStrip(snapshot: PublishedSnapshot["snapshot"]): string {
  return `
    <section class="trust-strip">
      <div class="eyebrow">Published trust metadata</div>
      <strong>${escapeHtml(snapshot.stateName)} published snapshot</strong>
      <div class="muted">
        Source snapshot: <span class="numeric">${escapeHtml(formatDate(snapshot.sourceSnapshotAt))}</span> |
        Published: <span class="numeric">${escapeHtml(formatDate(snapshot.publishedAt))}</span> |
        Methodology: ${escapeHtml(snapshot.methodologyVersion)} |
        Freshness: <span class="term"><span class="numeric">${snapshot.freshnessDays} day(s)</span>${renderTermHelp("freshness")}</span> |
        Source: ${escapeHtml(snapshot.sourceAttribution)}
      </div>
      <div class="badge-row">
        <span class="badge ${escapeHtml(snapshot.qualityState)}">${escapeHtml(snapshot.qualityState)} quality state</span>
        <span class="badge">Himachal only</span>
        <span class="badge">Published read model</span>
      </div>
    </section>
  `;
}

function renderTrustStatus(snapshot: PublishedSnapshot["snapshot"]): string {
  const message =
    snapshot.qualityState === "stale"
      ? `This public surface is serving a stale but previously published snapshot from ${escapeHtml(formatDate(snapshot.sourceSnapshotAt))}. It remains visible so the site never falls through to partial unpublished data.`
      : snapshot.qualityState === "partial"
        ? "This snapshot is marked partial. Public trust surfaces should treat it as incomplete until a full publish replaces it."
        : `This public surface is showing the latest safe published snapshot from ${escapeHtml(formatDate(snapshot.sourceSnapshotAt))} after operator review.`;

  return `
    <section class="status-banner ${escapeHtml(snapshot.qualityState)}">
      <strong>Freshness and quality state ${renderInlineTermHelp("qualityState")}</strong>
      <p class="inline-note">${message}</p>
    </section>
  `;
}

function renderDistrictControls(options: DistrictsPageOptions): string {
  return `
    <section class="controls">
      <form method="get" action="/districts">
        <label>
          Search districts
          <input type="search" name="q" value="${escapeHtml(options.search)}" placeholder="Search district name or summary" />
        </label>
        <label>
          View
          <select name="view">
            ${renderSelectedOption("all", options.view, "All districts")}
            ${renderSelectedOption("flagged", options.view, "Watchlist only")}
          </select>
        </label>
        <label>
          Sort by
          <select name="sort">
            ${renderSelectedOption("rank", options.sort, "Biggest public pressure signal")}
            ${renderSelectedOption("backlog", options.sort, "Most cases waiting")}
            ${renderSelectedOption("disposal", options.sort, "Slowest case-clear pace")}
            ${renderSelectedOption("age", options.sort, "Longest typical wait")}
            ${renderSelectedOption("gap", options.sort, "Biggest file-clear gap")}
          </select>
        </label>
        <button type="submit">Apply</button>
      </form>
      <p class="action-links">
        <a href="/districts">Reset filters</a>
        <a href="${escapeHtml(buildDistrictsHref({ ...options, view: "flagged" }))}">Watchlist-only view</a>
        <a href="/data/districts.csv">Download statewide CSV</a>
      </p>
    </section>
  `;
}

function renderDistrictTable(districts: DistrictSnapshot[]): string {
  return `
    <table>
      <thead>
        <tr>
          <th>District</th>
          <th>Watch rank</th>
          <th>Cases waiting ${renderInlineTermHelp("casesWaiting")}</th>
          <th>Cleared / filed ${renderInlineTermHelp("clearanceRate")}</th>
          <th>Typical wait ${renderInlineTermHelp("typicalWait")}</th>
          <th>File-clear gap ${renderInlineTermHelp("fileClearGap")}</th>
          <th>Why it stands out</th>
        </tr>
      </thead>
      <tbody>
        ${districts
          .map(
            (district) => `
              <tr>
                <td data-label="District"><a href="/districts/${escapeHtml(district.districtId)}">${escapeHtml(district.districtName)}</a><small>${escapeHtml(
                  district.summary,
                )}</small></td>
                <td class="numeric" data-label="Watch rank">#${district.rank}</td>
                <td class="numeric" data-label="Cases waiting">${district.backlogCases.toLocaleString("en-IN")}</td>
                <td class="numeric" data-label="Cleared / filed">${district.disposalRate.toFixed(1)}%</td>
                <td class="numeric" data-label="Typical wait">${district.medianAgeDays} days</td>
                <td class="numeric" data-label="Gap">${district.filingVsDisposalGap.toFixed(1)} pp</td>
                <td data-label="Why it stands out">${escapeHtml(district.flagReason)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderDistrictPreviewList(districts: DistrictSnapshot[]) {
  return `
    <div class="preview-list">
      ${districts
        .map(
          (district) => `
            <article class="preview-row">
              <div class="preview-top">
                <a class="preview-name" href="/districts/${escapeHtml(district.districtId)}">${escapeHtml(district.districtName)}</a>
                <span class="badge">Watch rank #${district.rank}</span>
              </div>
              <div class="preview-metrics">
                <span><strong class="numeric">${district.backlogCases.toLocaleString("en-IN")}</strong> cases waiting</span>
                <span><strong class="numeric">${district.disposalRate.toFixed(1)}%</strong> cleared / filed</span>
                <span><strong class="numeric">${district.medianAgeDays} days</strong> typical wait</span>
              </div>
              <p class="inline-note">${escapeHtml(district.flagReason)}</p>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderDistrictHistoryBars(history: DistrictHistoryPoint[]): string {
  const maxBacklog = Math.max(...history.map((point) => point.backlogCases), 1);
  return `
    <div class="history-bars">
      ${history
        .map((point) => {
          const width = Math.max(6, Math.round((point.backlogCases / maxBacklog) * 100));
          return `
            <div class="history-row">
              <div class="history-head">
                <strong>${escapeHtml(formatDate(point.snapshotDate))}</strong>
                <span class="muted"><span class="numeric">${point.backlogCases.toLocaleString("en-IN")}</span> cases waiting | <span class="numeric">${point.disposalRate.toFixed(1)}%</span> cleared / filed</span>
              </div>
              <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderDistrictHistoryTable(history: DistrictHistoryPoint[]): string {
  return `
    <table>
      <thead>
        <tr>
          <th>Snapshot</th>
          <th>Watch rank</th>
          <th>Cases waiting ${renderInlineTermHelp("casesWaiting")}</th>
          <th>Cleared / filed ${renderInlineTermHelp("clearanceRate")}</th>
          <th>Typical wait ${renderInlineTermHelp("typicalWait")}</th>
          <th>Quality</th>
        </tr>
      </thead>
      <tbody>
        ${history
          .map(
            (point) => `
              <tr>
                <td data-label="Snapshot">${escapeHtml(formatDate(point.snapshotDate))}<small>Published ${escapeHtml(
                  formatDate(point.publishedAt),
                )} | ${escapeHtml(point.methodologyVersion)}</small></td>
                <td class="numeric" data-label="Watch rank">#${point.rank}</td>
                <td class="numeric" data-label="Cases waiting">${point.backlogCases.toLocaleString("en-IN")}</td>
                <td class="numeric" data-label="Cleared / filed">${point.disposalRate.toFixed(1)}%</td>
                <td class="numeric" data-label="Typical wait">${point.medianAgeDays} days</td>
                <td data-label="Quality">${escapeHtml(point.qualityState)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderMethodologyHistoryTable(history: SnapshotHistoryEntry[]): string {
  return `
    <table>
      <thead>
        <tr>
          <th>Source snapshot</th>
          <th>Published</th>
          <th>Methodology</th>
          <th>Quality</th>
          <th>Cases waiting</th>
          <th>Districts to watch</th>
        </tr>
      </thead>
      <tbody>
        ${history
          .map(
            (entry) => `
              <tr>
                <td data-label="Source snapshot">${escapeHtml(formatDate(entry.snapshot.sourceSnapshotAt))}</td>
                <td data-label="Published">${escapeHtml(formatDate(entry.snapshot.publishedAt))}</td>
                <td data-label="Methodology">${escapeHtml(entry.snapshot.methodologyVersion)}</td>
                <td data-label="Quality">${escapeHtml(entry.snapshot.qualityState)}</td>
                <td class="numeric" data-label="Cases waiting">${entry.stats.pendingCases.toLocaleString("en-IN")}</td>
                <td class="numeric" data-label="Districts to watch">${entry.stats.flaggedDistricts}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderNoResults(options: DistrictsPageOptions): string {
  return `
    <article class="callout">
      <h2>No districts match this view</h2>
      <p class="inline-note">Try clearing the search term or switching back from ${escapeHtml(VIEW_LABELS[options.view].toLowerCase())}.</p>
      <p class="action-links"><a href="/districts">Reset the district workspace</a></p>
    </article>
  `;
}

function renderTermHelp(termKey: TermKey) {
  const definition = TERM_DEFINITIONS[termKey];
  return `
    <details class="term-help">
      <summary aria-label="Explain ${escapeHtml(definition.title)}">i</summary>
      <div class="term-popover">
        <strong>${escapeHtml(definition.title)}</strong>
        <span>${escapeHtml(definition.body)}</span>
      </div>
    </details>
  `;
}

function renderInlineTermHelp(termKey: TermKey) {
  return `<span class="term-help-wrap">${renderTermHelp(termKey)}</span>`;
}

function filterAndSortDistricts(
  districts: DistrictSnapshot[],
  options: DistrictsPageOptions,
  flaggedCount: number,
): DistrictSnapshot[] {
  const search = options.search.trim().toLowerCase();
  const filtered = districts.filter((district) => {
    const matchesView = options.view === "all" || district.rank <= flaggedCount;
    const matchesSearch =
      search.length === 0 ||
      district.districtName.toLowerCase().includes(search) ||
      district.summary.toLowerCase().includes(search);

    return matchesView && matchesSearch;
  });

  return filtered.sort((left, right) => compareDistricts(left, right, options.sort));
}

function compareDistricts(left: DistrictSnapshot, right: DistrictSnapshot, sort: DistrictSort) {
  if (sort === "backlog") {
    return right.backlogCases - left.backlogCases || left.rank - right.rank;
  }

  if (sort === "disposal") {
    return left.disposalRate - right.disposalRate || left.rank - right.rank;
  }

  if (sort === "age") {
    return right.medianAgeDays - left.medianAgeDays || left.rank - right.rank;
  }

  if (sort === "gap") {
    return right.filingVsDisposalGap - left.filingVsDisposalGap || left.rank - right.rank;
  }

  return left.rank - right.rank;
}

function renderSelectedOption(value: string, current: string, label: string) {
  return `<option value="${escapeHtml(value)}"${value === current ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

function buildDistrictsHref(options: DistrictsPageOptions): string {
  const params = new URLSearchParams();
  if (options.search) {
    params.set("q", options.search);
  }
  if (options.view !== "all") {
    params.set("view", options.view);
  }
  if (options.sort !== "rank") {
    params.set("sort", options.sort);
  }

  const query = params.toString();
  return query ? `/districts?${query}` : "/districts";
}

function formatDate(value: string) {
  return value.slice(0, 10);
}

function formatNumericDelta(value: number | null, suffix: string) {
  if (value === null) {
    return "No earlier published district snapshot is available yet.";
  }
  if (value === 0) {
    return `No change ${suffix}.`;
  }

  const direction = value > 0 ? "Up" : "Down";
  return `${direction} ${Math.abs(value).toLocaleString("en-IN")} ${suffix}.`;
}

function formatDeltaWithUnit(value: number | null, suffix: string) {
  if (value === null) {
    return "No earlier published district snapshot is available yet.";
  }
  if (value === 0) {
    return `No change ${suffix}.`;
  }

  const direction = value > 0 ? "Up" : "Down";
  return `${direction} ${Math.abs(value).toFixed(1)} ${suffix}.`;
}

function formatRankDelta(value: number | null) {
  if (value === null) {
    return "No earlier published district snapshot is available yet.";
  }
  if (value === 0) {
    return "Rank unchanged versus the prior published snapshot.";
  }

  return value > 0
    ? `Moved up ${value} place(s) versus the prior published snapshot.`
    : `Moved down ${Math.abs(value)} place(s) versus the prior published snapshot.`;
}

function roundDelta(value: number) {
  return Math.round(value * 10) / 10;
}

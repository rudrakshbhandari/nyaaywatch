import type { NjdgStateProfile } from "../../geographies.js";
import { buildPublicHighCourtRoutes, formatHighCourtCoverageLabel } from "../public-high-court.js";
import { buildPublicSupremeCourtRoutes } from "../public-supreme-court.js";
import { buildPublicStateRoutes, type PublicPageContext } from "../public-state.js";
import { renderPageShell } from "../design/shell.js";
import { renderSectionHead, renderStatTile } from "../design/ui.js";
import { escapeHtml, formatDate } from "./view-model.js";
import { buildNationalHomeViewModel, type NationalHighCourtEntry } from "./national-view-model.js";
import { SITE_ORIGIN } from "../share/site-origin.js";
import { renderIndiaMap, type IndiaMapStateEntry } from "./india-map.js";

export function renderNationalHome(input: {
  supremeCourtSnapshot: import("../../domain/supreme-court-snapshot-schema.js").SupremeCourtPublishedSnapshot | null;
  highCourtEntries: NationalHighCourtEntry[];
  lowerCourtSnapshot: import("../../domain/snapshot-schema.js").PublishedSnapshot;
  lowerCourtContext: PublicPageContext;
  availableStateProfiles: NjdgStateProfile[];
  stateMapEntries: IndiaMapStateEntry[];
}): string {
  const model = buildNationalHomeViewModel({
    supremeCourtSnapshot: input.supremeCourtSnapshot,
    highCourtEntries: input.highCourtEntries,
    lowerCourtSnapshot: input.lowerCourtSnapshot,
    lowerCourtProfile: input.lowerCourtContext.profile,
    stateMapEntries: input.stateMapEntries,
    publicStateCount: input.availableStateProfiles.length,
  });
  const supremeRoutes = buildPublicSupremeCourtRoutes();

  const HIGH_COURT_TEASER_LIMIT = 6;
  const highCourtCards =
    model.highCourts.entries.length > 0
      ? model.highCourts.entries
          .slice(0, HIGH_COURT_TEASER_LIMIT)
          .map(({ profile, referenceLabel, pendingDisplay, clearanceRateDisplay, clearanceTrend, monthlyGapDisplay, monthlyGapNote, pileTrend }) => {
            const routes = buildPublicHighCourtRoutes(profile);
            const renderSignal = (signal: { tone: string; label: string }) =>
              signal.tone !== "neutral"
                ? `<span class="tier-card__signal tier-card__signal--${signal.tone}">${escapeHtml(signal.label)}</span>`
                : "";
            return `<article class="card tier-card">
              <p class="tier-card__eyebrow">HIGH COURT</p>
              <h3>${escapeHtml(profile.courtName)}</h3>
              <p>${escapeHtml(referenceLabel)}</p>
              <p class="tier-card__coverage">Coverage: ${escapeHtml(formatHighCourtCoverageLabel(profile))}</p>
              <dl class="tier-card__metrics">
                <div>
                  <dt>Pending</dt>
                  <dd>${escapeHtml(pendingDisplay)}</dd>
                </div>
                <div>
                  <dt>Cleared / 100 filed</dt>
                  <dd>${escapeHtml(clearanceRateDisplay)}${renderSignal(clearanceTrend)}</dd>
                </div>
                <div>
                  <dt>Last-month backlog change</dt>
                  <dd>${escapeHtml(monthlyGapDisplay)}${renderSignal(pileTrend)}</dd>
                </div>
              </dl>
              <p class="tier-card__note">${escapeHtml(monthlyGapNote)}</p>
              <p><a class="btn btn--ghost btn--small" href="${routes.home}">Open High Court page</a></p>
            </article>`;
          })
          .join("")
      : `<article class="card tier-card">
          <p class="tier-card__eyebrow">HIGH COURTS</p>
          <h3>High Court pages will sit here</h3>
          <p>The homepage keeps this tier in the structure even when a local test runtime has not seeded any public High Court pages yet.</p>
        </article>`;

  const stateDirectory = [...input.availableStateProfiles]
    .sort((left, right) => left.stateName.localeCompare(right.stateName, "en"))
    .map(
      (profile) => `<li><a href="${buildPublicStateRoutes(profile).home}">${escapeHtml(profile.stateName)}</a></li>`,
    )
    .join("");

  // Single-line provenance strip. Earlier version had four separate pills
  // (captured, freshness, method, source) which wrapped to 3+ lines on the
  // narrow hero copy column. The freshness pill ("Same-day source window")
  // is dropped because the capture date already tells the reader how fresh
  // the snapshot is; method + source live in the colophon anyway, so here
  // we keep just what the reader needs at hero glance.
  const accountabilityLine = model.supremeCourt.snapshot
    ? `<p class="national-hero__accountability">
        <span>${escapeHtml(model.supremeCourt.referenceLabel ?? "")}</span>
        <span class="national-hero__accountability-sep" aria-hidden="true">·</span>
        <span>Method ${escapeHtml(model.supremeCourt.snapshot.snapshot.methodologyVersion)}</span>
        <span class="national-hero__accountability-sep" aria-hidden="true">·</span>
        <span>${escapeHtml(model.supremeCourt.snapshot.snapshot.sourceAttribution)}</span>
      </p>`
    : `<p class="national-hero__accountability">
        <span>Snapshot-based publication only</span>
        <span class="national-hero__accountability-sep" aria-hidden="true">·</span>
        <span>Methodology and source links stay available on every tier page</span>
      </p>`;

  // Pending total is a point-in-time stock — one snapshot = one meaningful
  // reading — so its sparkline draws directly from the capture history
  // (`trends`). Clearance, disposed, and gap all derive from NJDG accumulator
  // fields that reset each calendar month; those sparklines draw from
  // `monthlyFinalized`, one entry per month whose reset we observed. Months in
  // progress are deliberately absent — they are not yet comparable.
  const scTrends = input.supremeCourtSnapshot?.trends ?? [];
  const scFinalized = input.supremeCourtSnapshot?.monthlyFinalized ?? [];
  const lcTrends = input.lowerCourtSnapshot.trends;
  const scPendingSeries = scTrends.map((point) => point.pendingTotalCases);
  const scClearanceSeries = scFinalized.map((entry) =>
    entry.institutedTotalCases > 0
      ? (entry.disposedTotalCases / entry.institutedTotalCases) * 100
      : 0,
  );
  const scDisposedSeries = scFinalized.map((entry) => entry.disposedTotalCases);
  const scGapSeries = scFinalized.map((entry) => entry.institutedTotalCases - entry.disposedTotalCases);
  const lcPendingSeries = lcTrends.map((point) => point.pendingCases);

  // In-progress-month qualifier for the three flow tiles. The headline number
  // on those tiles is the current month-to-date accumulator, so the reader
  // needs to know which date that "so far" ends on. Falls back to the generic
  // "so far this month" when we somehow lack a reference date.
  const scReferenceIso = input.supremeCourtSnapshot?.snapshot.referenceDateAt ?? null;
  const scThroughLabel = scReferenceIso ? `through ${formatDate(scReferenceIso)}` : "so far this month";
  const scGapDirectionNote = describeMtdGapDirection(input.supremeCourtSnapshot);
  const scGapSignal = describeMtdGapSignal(input.supremeCourtSnapshot);
  const scTrendLineSuffix = scFinalized.length >= 2 ? " Trend line compares finalized months." : "";

  const tocItems = [
    { id: "hero", index: "01", label: "At a glance" },
    { id: "high-courts", index: "02", label: "High Courts" },
    { id: "lower-courts", index: "03", label: "Lower courts" },
    { id: "map", index: "04", label: "Pressure map" },
    { id: "accountability", index: "05", label: "Methodology" },
  ]
    .map(
      (item) => `<li>
        <a href="#${item.id}" data-target="${item.id}">
          <span class="toc__index">${item.index}</span>
          <span class="toc__label">${escapeHtml(item.label)}</span>
        </a>
      </li>`,
    )
    .join("");

  const body = `
    <div class="scrollspy-layout">
      <aside class="toc" aria-label="On this page">
        <p class="toc__heading">On this page</p>
        <ol class="toc__list">${tocItems}</ol>
      </aside>
      <div class="scrollspy-content">
    <section class="national-hero" id="hero" data-section="hero">${/* section id + data-section drive the scroll-spy rail */ ""}
      <div class="national-hero__copy">
        <p class="national-hero__eyebrow">INDIA'S COURT SYSTEM</p>
        <h1 class="national-hero__hed">${
          model.supremeCourt.snapshot
            ? "How long is India waiting for justice?"
            : "Where is delay building in India's court system?"
        }</h1>
        <p class="national-hero__lede">${
          model.supremeCourt.snapshot
            ? "NyaayWatch tracks backlog pressure, clearance pace, and monthly backlog change across the Supreme Court, High Courts, and lower courts so citizens, reporters, and civic groups can see where delay is building and where scrutiny is most needed."
            : "NyaayWatch publishes reviewed court snapshots so the public can track delay in India's court system without pretending these numbers are live or predictive."
        }</p>
        <div class="national-hero__cta">
          <a class="btn btn--primary" href="${model.supremeCourt.snapshot ? supremeRoutes.home : input.lowerCourtContext.routes.home}">${
            model.supremeCourt.snapshot ? "Track the Supreme Court" : "Track lower courts"
          }</a>
          <a class="btn btn--ghost" href="/high-courts">Browse High Courts</a>
        </div>
        ${accountabilityLine}
      </div>
      <div class="national-hero__stats">
        ${
          model.supremeCourt.snapshot
            ? `
              ${renderStatTile({
                label: "Pending total",
                value: model.supremeCourt.pendingTotalDisplay ?? "—",
                note: "Cases still pending at the Supreme Court. Recent change is separate from this month's clearance pace.",
                series: scPendingSeries,
                seriesLabel: "Pending total across recent readings",
                deltaDirectionHint: "up-is-bad",
                deltaLabel: "Recent change",
                deltaTone: "neutral",
              })}
              ${renderStatTile({
                label: "Cleared / 100 filed this month",
                value: model.supremeCourt.clearanceRateDisplay ?? "—",
                note: `How quickly the Supreme Court is clearing cases this month, ${scThroughLabel}. 100 means it is keeping pace with filings.${scTrendLineSuffix}`,
                tone: "accent",
                series: scClearanceSeries,
                seriesLabel: "Clearance rate across finalized months",
                deltaDirectionHint: "up-is-good",
              })}
              ${renderStatTile({
                label: "Disposed this month",
                value: model.supremeCourt.disposedLastMonthDisplay ?? "—",
                note: `Cases the Supreme Court has cleared this month, ${scThroughLabel}.${scTrendLineSuffix}`,
                series: scDisposedSeries,
                seriesLabel: "Disposed across finalized months",
                deltaDirectionHint: "up-is-good",
              })}
              ${renderStatTile({
                label: "Backlog change this month",
                value: model.supremeCourt.monthlyGapDisplay ?? "—",
                note: `${scGapDirectionNote} ${scThroughLabel}.${scTrendLineSuffix}`,
                series: scGapSeries,
                seriesLabel: "Backlog change across finalized months",
                deltaDirectionHint: "up-is-bad",
                trendSignal: scGapSignal,
              })}
            `
            : `
              ${renderStatTile({
                label: "Lower-court pending",
                value: model.lowerCourts.pendingDisplay,
                note: "Most of the public case volume on the site still sits in the lower courts.",
                series: lcPendingSeries,
                seriesLabel: "Lower-court pending over recent months",
                deltaDirectionHint: "up-is-bad",
              })}
              ${renderStatTile({
                label: "Public lower-court geographies",
                value: model.lowerCourts.publicStateCount.toLocaleString("en-IN"),
                note: "Each State or Union Territory page stays tied to its own published snapshot and supporting notes.",
                tone: "accent",
              })}
            `
        }
      </div>
    </section>

    <section class="national-section" id="high-courts" data-section="high-courts">
      ${renderSectionHead({
        headline: "High Courts across India.",
        lede:
          "Each court keeps its own source semantics and explicit coverage label. Cards are ordered by last-month backlog change first, then clearance pace, then pending load so readers can see where backlog pressure is worsening fastest.",
      })}
      <div class="card-grid card-grid--2">${highCourtCards}</div>
      <p class="national-section__linkline"><a href="/high-courts">See all High Courts</a></p>
    </section>

    <section class="national-section" id="lower-courts" data-section="lower-courts">
      ${renderSectionHead({
        headline: "Lower courts show the broadest pressure.",
        lede:
          "This lower-court view spans the currently published State and Union Territory snapshots. Start with the pressure map for relative lower-court pressure, then open any geography page for the underlying snapshot and district drilldown.",
      })}
      <div class="stat-grid">
        ${renderStatTile({
          label: "Pending across public geographies",
          value: model.lowerCourts.pendingDisplay,
          note: "Combined lower-court backlog across the currently published State and Union Territory snapshots.",
        })}
        ${renderStatTile({
          label: "Public lower-court geographies",
          value: model.lowerCourts.publicStateCount.toLocaleString("en-IN"),
          note: "Each State or Union Territory page stays tied to its own published snapshot and supporting notes.",
        })}
        ${renderStatTile({
          label: "Flagged districts",
          value: model.lowerCourts.flaggedDistricts.toLocaleString("en-IN"),
          note: "Combined count of districts flagged for closer inspection across the public lower-court cohort.",
          tone: "flag",
        })}
        ${renderStatTile({
          label: "Highest-pressure geography",
          value: model.lowerCourts.topStateName,
          note: model.lowerCourts.topStateSummary,
          tone: "accent",
        })}
      </div>
      <div class="national-section__actions">
        <a class="btn btn--primary" href="#map">Browse lower-court pages</a>
        <a class="btn btn--ghost" href="${model.lowerCourts.topStateHref}">Open top geography</a>
      </div>
    </section>

    <div id="map" data-section="map">${renderIndiaMap(input.stateMapEntries)}</div>

    <section class="national-section national-section--accountability" id="accountability" data-section="accountability">
      ${renderSectionHead({
        headline: "Methodology, data, and API.",
        lede:
          "The evidence is here if you want to verify, cite, or reuse the numbers.",
      })}
      <div class="card-grid card-grid--3">
        <article class="card">
          <h3>Supreme Court</h3>
          <p>The Supreme Court layer carries its own methodology, API, and data surface.</p>
          <p><a href="${supremeRoutes.methodology}">Methodology</a></p>
          <p><a href="${supremeRoutes.data}">Data</a></p>
          <p><a href="${supremeRoutes.api}">API</a></p>
        </article>
        <article class="card">
          <h3>High Courts</h3>
          <p>The High Court layer stays explicit about court-specific source semantics and covered geographies.</p>
          <p><a href="/high-courts">High Courts index</a></p>
        </article>
        <article class="card">
          <h3>District and subordinate courts</h3>
          <p>The lower-court layer remains the deepest public drilldown anywhere on the site.</p>
          <p><a href="${input.lowerCourtContext.routes.methodology}">Methodology</a></p>
          <p><a href="${input.lowerCourtContext.routes.data}">Data</a></p>
          <p><a href="${input.lowerCourtContext.routes.api}">API</a></p>
        </article>
      </div>
    </section>
      </div>
    </div>
    <script>${SCROLLSPY_SCRIPT}</script>
  `;

  return renderPageShell({
    title: "NyaayWatch — Supreme Court First",
    body,
    brandHref: "/",
    brandTag: "Judicial observability across tiers",
    navLinks: [
      { id: "supreme-court", href: "/supreme-court", label: "Supreme Court" },
      { id: "high-courts", href: "/high-courts", label: "High Courts" },
      { id: "districts", href: input.lowerCourtContext.routes.districts, label: "Districts" },
    ],
    footer: {
      sourceDateLabel: model.supremeCourt.referenceLabel ?? formatDate(input.lowerCourtSnapshot.snapshot.sourceSnapshotAt),
      methodologyVersion:
        model.supremeCourt.snapshot?.snapshot.methodologyVersion ?? input.lowerCourtSnapshot.snapshot.methodologyVersion,
      sourceAttribution:
        model.supremeCourt.snapshot?.snapshot.sourceAttribution ?? input.lowerCourtSnapshot.snapshot.sourceAttribution,
    },
    pageCss: NATIONAL_HOME_CSS,
    og: {
      title: "How long is India waiting for justice?",
      description: "NyaayWatch tracks court backlogs and wait times across India's judiciary — Supreme Court, High Courts, and district courts — from public NJDG data.",
      image: `${SITE_ORIGIN}/og/national.png`,
      imageAlt: "NyaayWatch — India's court system at a glance",
    },
  });
}

function describeMtdGapDirection(
  snapshot: import("../../domain/supreme-court-snapshot-schema.js").SupremeCourtPublishedSnapshot | null,
): string {
  if (!snapshot) {
    return "Filed minus cleared,";
  }
  const gap = snapshot.stats.institutedLastMonthTotalCases - snapshot.stats.disposedLastMonthTotalCases;
  if (gap > 0) {
    return "More cases have been filed than cleared,";
  }
  if (gap < 0) {
    return "More cases have been cleared than filed,";
  }
  return "Filings and clearances matched,";
}

function describeMtdGapSignal(
  snapshot: import("../../domain/supreme-court-snapshot-schema.js").SupremeCourtPublishedSnapshot | null,
) {
  if (!snapshot) {
    return { tone: "neutral" as const, label: "Steady" };
  }
  const gap = snapshot.stats.institutedLastMonthTotalCases - snapshot.stats.disposedLastMonthTotalCases;
  if (gap > 0) {
    return { tone: "worsening" as const, label: "Backlog growing" };
  }
  if (gap < 0) {
    return { tone: "improving" as const, label: "Backlog shrinking" };
  }
  return { tone: "neutral" as const, label: "Steady" };
}

// Inline scroll-spy: IntersectionObserver keeps the TOC rail's active entry in
// sync with whichever section is currently dominating the viewport. Smooth
// scrolling + hash update on click. No external JS — the site ships HTML
// straight from the server with no asset pipeline.
const SCROLLSPY_SCRIPT = `
(function () {
  var links = document.querySelectorAll('.toc a[data-target]');
  if (!links.length || typeof IntersectionObserver === 'undefined') return;
  var linkById = {};
  links.forEach(function (link) { linkById[link.getAttribute('data-target')] = link; });
  function setActive(id) {
    links.forEach(function (l) { l.classList.remove('is-active'); });
    if (id && linkById[id]) linkById[id].classList.add('is-active');
  }
  var sections = document.querySelectorAll('[data-section]');
  var visible = new Map();
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
      else visible.delete(entry.target.id);
    });
    var best = null; var bestRatio = -1;
    visible.forEach(function (ratio, id) { if (ratio > bestRatio) { bestRatio = ratio; best = id; } });
    if (best) setActive(best);
  }, { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });
  sections.forEach(function (s) { observer.observe(s); });
  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('data-target');
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
    });
  });
})();
`;

const NATIONAL_HOME_CSS = `
  /* --- scroll-spy two-column layout + left-rail TOC --- */
  .scrollspy-layout {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 48px;
    align-items: start;
  }
  .scrollspy-content { min-width: 0; }
  .toc {
    position: sticky;
    top: 24px;
    padding: 20px 0 20px 4px;
    border-left: 1px solid var(--rule);
  }
  .toc__heading {
    margin: 0 0 14px 14px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 10.5px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ink-muted);
    font-weight: 600;
  }
  .toc__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .toc__list a {
    display: flex;
    gap: 10px;
    align-items: baseline;
    padding: 8px 12px 8px 14px;
    margin-left: -1px;
    border-left: 2px solid transparent;
    color: var(--ink-muted);
    text-decoration: none;
    transition: color 160ms ease, border-color 160ms ease, transform 160ms ease;
  }
  .toc__list a:hover { color: var(--ink-soft); }
  .toc__list a.is-active {
    color: var(--ink);
    border-left-color: var(--accent);
    transform: translateX(2px);
  }
  .toc__index {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--ink-muted);
  }
  .toc__list a.is-active .toc__index { color: var(--accent); }
  .toc__label {
    font-family: "Inter Tight", system-ui, sans-serif;
    font-size: 14px;
    font-weight: 600;
  }
  .scrollspy-content [data-section] { scroll-margin-top: 20px; }

  .national-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.95fr);
    gap: 28px;
    padding: 42px 0 76px;
    align-items: end;
  }
  .national-hero__eyebrow {
    margin: 0 0 12px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .national-hero__hed {
    margin: 0 0 18px;
    font-size: clamp(46px, 7vw, 86px);
    line-height: 1.02;
    letter-spacing: -0.05em;
    text-wrap: balance;
    max-width: 10ch;
    padding-bottom: 0.06em;
  }
  .national-hero__lede {
    margin: 0 0 24px;
    max-width: 60ch;
    font-size: clamp(17px, 1.8vw, 21px);
    line-height: 1.52;
    color: var(--ink-soft);
    font-weight: 500;
  }
  .national-hero__cta {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }
  .national-hero__accountability {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    align-items: baseline;
    color: var(--ink-muted);
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    line-height: 1.5;
  }
  .national-hero__accountability > span { white-space: nowrap; }
  .national-hero__accountability-sep { opacity: 0.5; }
  .national-hero__stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 32px;
    row-gap: 28px;
    border-top: 2px solid var(--ink);
    border-bottom: 2px solid var(--ink);
    padding: 24px 0 28px;
  }
  .national-hero__stats .stat-tile {
    padding: 0;
    border-left: none;
    min-height: 100%;
  }
  .national-hero__stats .stat-tile:nth-child(n + 3) {
    border-top: 1px solid var(--rule);
    padding-top: 24px;
  }
  .national-section {
    margin-bottom: 84px;
  }
  .national-section__actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 24px;
  }
  .national-section__linkline {
    margin: 20px 0 0;
  }
  .tier-card__eyebrow {
    margin: 0 0 10px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  .tier-card__metrics {
    display: grid;
    gap: 10px;
    margin: 18px 0 18px;
  }
  .tier-card__coverage {
    margin: 0;
    color: var(--ink-soft);
    font-weight: 500;
  }
  .tier-card__metrics div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    border-top: 1px solid var(--rule);
    padding-top: 10px;
  }
  .tier-card__metrics dt {
    color: var(--ink-soft);
    font-size: 14px;
    font-weight: 500;
  }
  .tier-card__metrics dd {
    margin: 0;
    font-weight: 700;
    font-variant-numeric: lining-nums tabular-nums;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }
  .tier-card__signal {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .tier-card__signal--worsening { color: var(--accent); }
  .tier-card__signal--improving { color: var(--ink-muted); }
  .tier-card__note {
    margin: 0 0 18px;
    color: var(--ink-soft);
  }
  .state-directory {
    border-top: 1px solid var(--rule);
    padding-top: 18px;
  }
  .state-directory__summary {
    margin: 0 0 18px;
    color: var(--ink-soft);
    font-weight: 500;
  }
  .state-directory__list {
    list-style: none;
    padding: 0;
    margin: 0;
    columns: 3;
    column-gap: 28px;
  }
  .state-directory__list li {
    break-inside: avoid;
    margin: 0 0 10px;
  }
  .national-section--accountability .card p + p {
    margin-top: 8px;
  }
  @media (max-width: 1100px) {
    .scrollspy-layout { grid-template-columns: 1fr; gap: 20px; }
    .toc {
      position: static;
      border-left: none;
      border-top: 1px solid var(--rule);
      padding: 12px 0 0;
    }
    .toc__heading { margin-left: 0; }
    .toc__list { flex-direction: row; flex-wrap: wrap; gap: 6px 14px; }
    .toc__list a {
      padding: 12px 10px;
      min-height: 44px;
      border-left: none;
      border-bottom: 2px solid transparent;
      margin-left: 0;
    }
    .toc__list a.is-active {
      border-left: none;
      border-bottom-color: var(--accent);
      transform: none;
    }
  }
  @media (max-width: 1000px) {
    .national-hero {
      grid-template-columns: 1fr;
      gap: 24px;
    }
    .national-hero__hed {
      max-width: 12ch;
    }
  }
  @media (max-width: 720px) {
    .national-hero {
      padding: 28px 0 52px;
    }
    .national-hero > * {
      min-width: 0;
    }
    .national-hero__accountability > span {
      white-space: normal;
    }
    .national-hero__stats {
      grid-template-columns: 1fr;
    }
    .state-directory__list {
      columns: 1;
    }
  }
`;

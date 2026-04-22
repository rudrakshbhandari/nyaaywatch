import type { NjdgStateProfile } from "../../geographies.js";
import { buildPublicHighCourtRoutes, formatHighCourtCoverageLabel } from "../public-high-court.js";
import { buildPublicSupremeCourtRoutes } from "../public-supreme-court.js";
import { buildPublicStateRoutes, type PublicPageContext } from "../public-state.js";
import { renderPageShell } from "../design/shell.js";
import { renderSectionHead, renderStatTile } from "../design/ui.js";
import { escapeHtml, formatDate } from "./view-model.js";
import { buildNationalHomeViewModel, type NationalHighCourtEntry } from "./national-view-model.js";
import { SITE_ORIGIN } from "../share/site-origin.js";
import { renderIndiaMap } from "./india-map.js";

export function renderNationalHome(input: {
  supremeCourtSnapshot: import("../../domain/supreme-court-snapshot-schema.js").SupremeCourtPublishedSnapshot | null;
  highCourtEntries: NationalHighCourtEntry[];
  lowerCourtSnapshot: import("../../domain/snapshot-schema.js").PublishedSnapshot;
  lowerCourtContext: PublicPageContext;
  availableStateProfiles: NjdgStateProfile[];
}): string {
  const model = buildNationalHomeViewModel({
    supremeCourtSnapshot: input.supremeCourtSnapshot,
    highCourtEntries: input.highCourtEntries,
    lowerCourtSnapshot: input.lowerCourtSnapshot,
    lowerCourtProfile: input.lowerCourtContext.profile,
    publicStateCount: input.availableStateProfiles.length,
  });
  const supremeRoutes = buildPublicSupremeCourtRoutes();

  const highCourtCards =
    model.highCourts.entries.length > 0
      ? model.highCourts.entries
          .map(({ profile, referenceLabel, pendingDisplay, clearanceRateDisplay, monthlyGapDisplay, monthlyGapNote }) => {
            const routes = buildPublicHighCourtRoutes(profile);
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
                  <dd>${escapeHtml(clearanceRateDisplay)}</dd>
                </div>
                <div>
                  <dt>Last-month pile change</dt>
                  <dd>${escapeHtml(monthlyGapDisplay)}</dd>
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

  const accountabilityLine = model.supremeCourt.snapshot
    ? `<div class="national-hero__accountability">
        <span>${escapeHtml(model.supremeCourt.referenceLabel ?? "")}</span>
        <span>${escapeHtml(model.supremeCourt.freshnessLabel ?? "")}</span>
        <span>Method ${escapeHtml(model.supremeCourt.snapshot.snapshot.methodologyVersion)}</span>
        <span>${escapeHtml(model.supremeCourt.snapshot.snapshot.sourceAttribution)}</span>
      </div>`
    : `<div class="national-hero__accountability">
        <span>Snapshot-based publication only</span>
        <span>No live feed</span>
        <span>Methodology and source links stay available on every tier page</span>
      </div>`;

  const body = `
    <section class="national-hero">
      <div class="national-hero__copy">
        <p class="national-hero__eyebrow">INDIA'S COURT SYSTEM</p>
        <h1 class="national-hero__hed">${
          model.supremeCourt.snapshot
            ? "How long is India waiting for justice?"
            : "Where is delay building in India's court system?"
        }</h1>
        <p class="national-hero__lede">${
          model.supremeCourt.snapshot
            ? "NyaayWatch tracks backlog pressure, clearance pace, and monthly pile change across the Supreme Court, High Courts, and lower courts so citizens, reporters, and civic groups can see where delay is building and where scrutiny is most needed."
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
                note: "Backlog at the top of the court system in the latest published snapshot.",
              })}
              ${renderStatTile({
                label: "Cleared / 100 filed",
                value: model.supremeCourt.clearanceRateDisplay ?? "—",
                note: "How quickly the apex court is clearing incoming work in the latest monthly window.",
                tone: "accent",
              })}
              ${renderStatTile({
                label: "Disposed last month",
                value: model.supremeCourt.disposedLastMonthDisplay ?? "—",
                note: "How many matters the Court cleared in the latest published month.",
              })}
              ${renderStatTile({
                label: "Last-month pile change",
                value: model.supremeCourt.monthlyGapDisplay ?? "—",
                note: model.supremeCourt.monthlyGapNote ?? "Monthly incoming and outgoing work are both visible.",
              })}
            `
            : `
              ${renderStatTile({
                label: "Lower-court pending",
                value: model.lowerCourts.pendingDisplay,
                note: "Most of the public case volume on the site still sits in the lower courts.",
              })}
              ${renderStatTile({
                label: "Public states live",
                value: model.lowerCourts.publicStateCount.toString(),
                note: "Each state page stays tied to its own published snapshot and supporting notes.",
                tone: "accent",
              })}
            `
        }
      </div>
    </section>

    <section class="national-section">
      ${renderSectionHead({
        headline: "High Courts across India.",
        lede:
          "Each court keeps its own source semantics and explicit coverage label, but the cards below surface backlog, clearance pace, and monthly pile change with the highest-pressure courts shown first.",
      })}
      <div class="card-grid card-grid--2">${highCourtCards}</div>
      <p class="national-section__linkline"><a href="/high-courts">See all High Courts</a></p>
    </section>

    <section class="national-section">
      ${renderSectionHead({
        headline: "Most delay sits in the lower courts.",
        lede:
          "District and subordinate courts remain the clearest public window into scale, delay, and local pressure. The lower-court workspace opens directly into the featured published snapshot, with district pages built for close inspection.",
      })}
      <div class="stat-grid">
        ${renderStatTile({
          label: "Featured lower-court backlog",
          value: model.lowerCourts.pendingDisplay,
          note: "Lower-court backlog in the currently featured published snapshot.",
        })}
        ${renderStatTile({
          label: "Flagged districts",
          value: model.lowerCourts.flaggedDistricts.toString(),
          note: "Signals for closer inspection, not final conclusions.",
          tone: "flag",
        })}
        ${renderStatTile({
          label: "Typical wait",
          value: model.lowerCourts.typicalWaitMonths.toString(),
          unit: "mo",
          note: "A lower-court wait estimate derived from published district age buckets.",
        })}
        ${renderStatTile({
          label: "Inspect first",
          value: model.lowerCourts.topDistrictName,
          note: model.lowerCourts.topDistrictSummary,
          tone: "accent",
        })}
      </div>
      <div class="national-section__actions">
        <a class="btn btn--primary" href="${input.lowerCourtContext.routes.home}">Browse lower courts</a>
        <a class="btn btn--ghost" href="${input.lowerCourtContext.routes.districts}">Inspect districts</a>
      </div>
    </section>

    ${renderIndiaMap(input.availableStateProfiles)}

    <section class="national-section national-section--accountability">
      ${renderSectionHead({
        headline: "Methodology, data, and API.",
        lede:
          "The evidence is here if you want to verify, cite, or reuse the numbers.",
      })}
      <div class="card-grid card-grid--3">
        <article class="card">
          <h3>Supreme Court</h3>
          <p>The apex-court layer carries its own methodology, API, and data surface.</p>
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
      sourceDateLabel: model.supremeCourt.referenceLabel ?? formatDate(model.lowerCourts.snapshot.snapshot.sourceSnapshotAt),
      methodologyVersion:
        model.supremeCourt.snapshot?.snapshot.methodologyVersion ?? model.lowerCourts.snapshot.snapshot.methodologyVersion,
      sourceAttribution:
        model.supremeCourt.snapshot?.snapshot.sourceAttribution ?? model.lowerCourts.snapshot.snapshot.sourceAttribution,
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

const NATIONAL_HOME_CSS = `
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
    display: flex;
    gap: 10px 18px;
    flex-wrap: wrap;
    color: var(--ink-muted);
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
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
  }
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
    .national-hero__stats {
      grid-template-columns: 1fr;
    }
    .state-directory__list {
      columns: 1;
    }
  }
`;

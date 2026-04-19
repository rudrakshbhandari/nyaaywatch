import type { NjdgStateProfile } from "../../geographies.js";
import { buildPublicHighCourtRoutes } from "../public-high-court.js";
import { buildPublicSupremeCourtRoutes } from "../public-supreme-court.js";
import { buildPublicStateRoutes, type PublicPageContext } from "../public-state.js";
import { renderPageShell } from "../design/shell.js";
import { renderSectionHead, renderStatTile } from "../design/ui.js";
import { escapeHtml, formatDate } from "./view-model.js";
import { buildNationalHomeViewModel, type NationalHighCourtEntry } from "./national-view-model.js";

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
          .map(({ profile, referenceLabel, pendingDisplay, disposedLastMonthDisplay }) => {
            const routes = buildPublicHighCourtRoutes(profile);
            return `<article class="card tier-card">
              <p class="tier-card__eyebrow">HIGH COURT BETA</p>
              <h3>${escapeHtml(profile.courtName)}</h3>
              <p>${escapeHtml(referenceLabel)}</p>
              <dl class="tier-card__metrics">
                <div>
                  <dt>Pending</dt>
                  <dd>${escapeHtml(pendingDisplay)}</dd>
                </div>
                <div>
                  <dt>Disposed last month</dt>
                  <dd>${escapeHtml(disposedLastMonthDisplay)}</dd>
                </div>
              </dl>
              <p><a class="btn btn--ghost btn--small" href="${routes.home}">Open High Court page</a></p>
            </article>`;
          })
          .join("")
      : `<article class="card tier-card">
          <p class="tier-card__eyebrow">HIGH COURTS</p>
          <h3>High Court pages will sit here</h3>
          <p>The homepage keeps this tier in the structure even when a local test runtime has not seeded any public High Court pages yet.</p>
        </article>`;

  const stateDirectory = input.availableStateProfiles
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
        <span>Methodology stays visible on the tier pages</span>
      </div>`;

  const body = `
    <section class="national-hero">
      <div class="national-hero__copy">
        <p class="national-hero__eyebrow">NATIONAL FRONT DOOR</p>
        <h1 class="national-hero__hed">${
          model.supremeCourt.snapshot
            ? "Start at the Supreme Court. Then move down the system."
            : "Open the judiciary from the top, then follow it downward."
        }</h1>
        <p class="national-hero__lede">${
          model.supremeCourt.snapshot
            ? "NyaayWatch now opens with the Supreme Court, then stages High Courts and district/subordinate courts below it. The point is not to flatten the tiers into one fake ranking system. It is to make each tier legible, inspectable, and accountable from one front door."
            : "NyaayWatch is structured as one judicial observability product across tiers. When a tier snapshot is public, it appears here as a dated, accountable surface rather than a live or predictive feed."
        }</p>
        <div class="national-hero__cta">
          <a class="btn btn--primary" href="${model.supremeCourt.snapshot ? supremeRoutes.home : input.lowerCourtContext.routes.home}">${
            model.supremeCourt.snapshot ? "Open Supreme Court beta" : "Open lower-court layer"
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
                note: "Apex-court backlog in the latest published snapshot.",
              })}
              ${renderStatTile({
                label: "Pending registered",
                value: model.supremeCourt.pendingRegisteredDisplay ?? "—",
                note: "Registered matters stay visible rather than being folded into one opaque total.",
                tone: "accent",
              })}
              ${renderStatTile({
                label: "Disposed last month",
                value: model.supremeCourt.disposedLastMonthDisplay ?? "—",
                note: "Published movement at the apex in the current source window.",
              })}
              ${renderStatTile({
                label: "Instituted last month",
                value: model.supremeCourt.institutedLastMonthDisplay ?? "—",
                note: "Monthly incoming work shown without pretending it explains the whole system.",
              })}
            `
            : `
              ${renderStatTile({
                label: "Lower-court pending",
                value: model.lowerCourts.pendingDisplay,
                note: "District and subordinate courts remain the heaviest public layer on the site right now.",
              })}
              ${renderStatTile({
                label: "Public states live",
                value: model.lowerCourts.publicStateCount.toString(),
                note: "Each state page stays explicit about its own published snapshot and caveats.",
                tone: "accent",
              })}
            `
        }
      </div>
    </section>

    <section class="national-section">
      ${renderSectionHead({
        headline: "High Courts come next, without pretending they are one national leaderboard.",
        lede:
          "The homepage uses the already-live High Court beta pages as real entry points. It does not invent a single cross-court score or pretend the tiers are directly comparable just because they sit in one product shell.",
      })}
      <div class="card-grid card-grid--2">${highCourtCards}</div>
      <p class="national-section__linkline"><a href="/high-courts">Open the High Courts index</a></p>
    </section>

    <section class="national-section">
      ${renderSectionHead({
        headline: "Most public case volume still sits below the apex court.",
        lede:
          "District and subordinate courts remain the main proof surface for scale, delay, and district-level pressure. Himachal stays the default lower-court lens, but it no longer has to carry the whole homepage alone.",
      })}
      <div class="stat-grid">
        ${renderStatTile({
          label: "Himachal pending",
          value: model.lowerCourts.pendingDisplay,
          note: "Lower-court backlog in the current Himachal published snapshot.",
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
        <a class="btn btn--primary" href="${input.lowerCourtContext.routes.home}">Open Himachal lower-court overview</a>
        <a class="btn btn--ghost" href="${input.lowerCourtContext.routes.districts}">Inspect districts</a>
      </div>
    </section>

    <section class="national-section">
      ${renderSectionHead({
        headline: "State lower-court pages stay visible, but later in the scroll.",
        lede:
          "This is the calmer directory layer for the public state pages. It replaces the current top-of-page chip wall so the homepage can open with the Supreme Court story instead of a geography switcher.",
      })}
      <div class="state-directory">
        <p class="state-directory__summary">${model.lowerCourts.publicStateCount} public lower-court state pages are currently live.</p>
        <ul class="state-directory__list">${stateDirectory}</ul>
      </div>
    </section>

    <section class="national-section national-section--accountability">
      ${renderSectionHead({
        headline: "Methodology, data, and API links stay easy to find.",
        lede:
          "These links are here for accountability, reproduction, and citation. They support the story; they do not have to dominate the first screen to remain reachable.",
      })}
      <div class="card-grid card-grid--3">
        <article class="card">
          <h3>Supreme Court</h3>
          <p>The apex-court beta carries its own methodology, API, and data surface.</p>
          <p><a href="${supremeRoutes.methodology}">Methodology</a></p>
          <p><a href="${supremeRoutes.data}">Data</a></p>
          <p><a href="${supremeRoutes.api}">API</a></p>
        </article>
        <article class="card">
          <h3>High Courts</h3>
          <p>The High Court layer stays explicit about court-specific source semantics and beta scope.</p>
          <p><a href="/high-courts">High Courts index</a></p>
        </article>
        <article class="card">
          <h3>District and subordinate courts</h3>
          <p>The lower-court layer remains the deepest public drilldown on the site.</p>
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
    line-height: 0.92;
    letter-spacing: -0.05em;
    text-wrap: balance;
    max-width: 10ch;
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
    gap: 0;
    border-top: 2px solid var(--ink);
    border-bottom: 2px solid var(--ink);
    padding: 18px 0 20px;
  }
  .national-hero__stats .stat-tile {
    min-height: 100%;
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

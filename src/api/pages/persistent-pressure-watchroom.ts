import type { DistrictSnapshot, PublishedSnapshot } from "../../domain/snapshot-schema.js";
import type { NjdgStateProfile } from "../../geographies.js";
import { escapeHtml } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";
import { renderStatTile } from "../design/ui.js";
import { buildPublicStateRoutes } from "../public-state.js";
import { SITE_ORIGIN } from "../share/site-origin.js";
import { formatDate } from "../home/view-model.js";
import { EVIDENCE_ENTRY_POINTS_CSS, EVIDENCE_ENTRY_POINTS_SCRIPT, renderEvidenceEntryPoints } from "./evidence-entry-points.js";
import { INVESTIGATION_WORKFLOW_CSS, renderInvestigationWorkflow } from "./investigation-workflow.js";
import { WATCHROOM_PAGE_CSS } from "./watchroom-shared.js";

export interface PersistentPressureWatchroomEntry {
  profile: NjdgStateProfile;
  snapshot: PublishedSnapshot;
}

interface RankedDistrictEntry {
  entry: PersistentPressureWatchroomEntry;
  district: DistrictSnapshot;
}

interface RankedGeographyEntry {
  entry: PersistentPressureWatchroomEntry;
  flaggedDistricts: DistrictSnapshot[];
  topDistrict: DistrictSnapshot;
}

export function renderPersistentPressureWatchroomPage(entries: PersistentPressureWatchroomEntry[]): string {
  const rankedDistricts = entries
    .flatMap((entry) =>
      entry.snapshot.districts
        .filter((district) => district.watchlistPersistence.lastSixWindow > 0 && district.watchlistPersistence.flaggedInLastSix > 0)
        .map((district) => ({ entry, district })),
    )
    .sort(comparePersistentDistricts)
    .slice(0, 15);

  const rankedGeographies = entries
    .flatMap((entry) => {
      const flaggedDistricts = entry.snapshot.districts
        .filter((district) => district.watchlistPersistence.lastSixWindow > 0 && district.watchlistPersistence.flaggedInLastSix > 0)
        .sort(compareDistrictsByPersistence);
      const topDistrict = flaggedDistricts[0];
      return topDistrict ? [{ entry, flaggedDistricts, topDistrict }] : [];
    })
    .sort(
      (a, b) =>
        b.flaggedDistricts.length - a.flaggedDistricts.length ||
        persistenceRate(b.topDistrict) - persistenceRate(a.topDistrict) ||
        b.topDistrict.backlogCases - a.topDistrict.backlogCases,
    );

  const topDistrict = rankedDistricts[0] ?? null;
  const topGeography = rankedGeographies[0] ?? null;
  const latestReferenceDate = entries
    .map((entry) => entry.snapshot.snapshot.referenceDateAt)
    .sort()
    .at(-1);
  const sourceDateLabel = latestReferenceDate ? formatDate(latestReferenceDate) : null;
  const topDistrictRoutes = topDistrict ? buildPublicStateRoutes(topDistrict.entry.profile) : null;
  const citation = `NyaayWatch. "Persistent Pressure Watchroom." Lower-court public data currently on NyaayWatch. ${SITE_ORIGIN}/watch/persistent-pressure`;

  const body = `
    <section class="watchroom-hero">
      <p class="watchroom-hero__eyebrow">ISSUE WATCHROOM</p>
      <h1>Persistent pressure watchroom</h1>
      <p class="watchroom-hero__lede">Which districts keep appearing under pressure?</p>
      <p class="watchroom-hero__body">This page follows lower-court districts that were flagged repeatedly across recent published snapshots. It helps separate repeated pressure from a one-snapshot spike.</p>
      <p class="watchroom-hero__meta">${entries.length.toLocaleString("en-IN")} lower-court geographies checked · ${rankedDistricts.length.toLocaleString("en-IN")} district signals shown · Source: National Judicial Data Grid public district dashboards</p>
    </section>

    <section class="watchroom-toplines" aria-label="Persistent pressure toplines">
      ${renderStatTile({
        label: "Districts with repeat signals",
        value: rankedDistricts.length.toLocaleString("en-IN"),
        note: "Top districts shown by recent flagged-window persistence",
        tone: "accent",
      })}
      ${renderStatTile({
        label: "Most persistent signal",
        value: topDistrict ? formatPersistence(topDistrict.district.watchlistPersistence.flaggedInLastSix, topDistrict.district.watchlistPersistence.lastSixWindow) : "N/A",
        note: topDistrict ? `${topDistrict.district.districtName}, ${topDistrict.entry.profile.stateName}` : "No repeat signals available",
      })}
      ${renderStatTile({
        label: "Geography with most flagged districts",
        value: topGeography ? topGeography.flaggedDistricts.length.toLocaleString("en-IN") : "N/A",
        note: topGeography ? topGeography.entry.profile.stateName : "No repeat signals available",
      })}
    </section>

    ${renderInvestigationWorkflow({
      headline: "Use persistence before treating pressure as a story.",
      lede:
        "A repeated flag is a stronger inspection prompt than a one-month movement. It still needs district evidence, scale, and caveats before it becomes a public claim.",
      steps: [
        {
          eyebrow: "01",
          title: "Start with persistence",
          body: "Read how many recent snapshots flagged the district. A full window is stronger than a short one.",
          href: "#district-table",
          cta: "See districts",
        },
        {
          eyebrow: "02",
          title: "Check pending load",
          body: "Use the case count beside the repeat signal so scale is visible.",
          href: "#district-table",
          cta: "Check scale",
        },
        {
          eyebrow: "03",
          title: "Open the district",
          body: "Read the district page for rank, change, old-case burden, and caveats in one place.",
          href: topDistrictRoutes && topDistrict ? topDistrictRoutes.district(topDistrict.district.districtId) : "/districts",
          cta: "Open top district",
        },
        {
          eyebrow: "04",
          title: "Cite evidence",
          body: "Use the evidence pack so the source date, method, and public-data boundary travel with the signal.",
          href: "#evidence",
          cta: "Use evidence",
        },
      ],
    })}

    <div id="evidence">
    ${renderEvidenceEntryPoints({
      headline: "Carry the evidence with the repeat signal.",
      lede:
        "Use these links when a repeated pressure signal needs to be checked, cited, or exported. Raw captures and operator notes stay outside the public boundary.",
      entries: [
        {
          title: "Watchroom citation",
          body: "Use this for the persistent-pressure page itself.",
          href: "/watch/persistent-pressure",
          cta: "Open watchroom",
          codeLabel: "/watch/persistent-pressure",
          citationText: citation,
        },
        {
          title: "Top district pack",
          body: topDistrict
            ? `Use this before quoting ${topDistrict.district.districtName}'s repeated pressure signal.`
            : "Use district evidence packs when repeat signals are available.",
          href: topDistrict && topDistrictRoutes ? topDistrictRoutes.districtEvidencePack(topDistrict.district.districtId) : "/districts",
          cta: topDistrict ? "Download district JSON" : "Open districts",
          codeLabel: topDistrict && topDistrictRoutes ? topDistrictRoutes.districtEvidencePack(topDistrict.district.districtId) : "/districts",
        },
        {
          title: "Top geography pack",
          body: topGeography
            ? `Use this to check ${topGeography.entry.profile.stateName} with source date, method, links, and caveats.`
            : "Use state evidence packs when repeat signals are available.",
          href: topGeography ? buildPublicStateRoutes(topGeography.entry.profile).stateEvidencePack : "/data",
          cta: topGeography ? "Download state JSON" : "Open data",
          codeLabel: topGeography ? buildPublicStateRoutes(topGeography.entry.profile).stateEvidencePack : "/data",
        },
      ],
    })}
    </div>

    <section class="watchroom-section" id="district-table">
      <header class="watchroom-section__head">
        <p class="watchroom-section__eyebrow">DISTRICTS TO INSPECT</p>
        <h2>Repeated pressure signals.</h2>
        <p>Ranked by how often the district was flagged in the recent window, then by pending cases. The table does not explain why a district was flagged.</p>
      </header>
      ${renderDistrictTable(rankedDistricts)}
    </section>

    <section class="watchroom-section" id="geography-table">
      <header class="watchroom-section__head">
        <p class="watchroom-section__eyebrow">LOWER-COURT GEOGRAPHIES</p>
        <h2>Where repeated district signals cluster.</h2>
        <p>This table shows where multiple districts inside the same geography have recent repeat signals.</p>
      </header>
      ${renderGeographyTable(rankedGeographies)}
    </section>

    <section class="watchroom-section watchroom-caveat">
      <header class="watchroom-section__head">
        <p class="watchroom-section__eyebrow">CAVEATS</p>
        <h2>Repeated flags still need context.</h2>
      </header>
      <div class="watchroom-caveat__grid">
        <article>
          <h3>Persistence is not blame.</h3>
          <p>The signal says a district kept meeting NyaayWatch's pressure criteria. It does not identify a cause.</p>
        </article>
        <article>
          <h3>Window size matters.</h3>
          <p>Read the flagged count with its window. A district flagged in 2 of 2 snapshots is different from 5 of 6.</p>
        </article>
        <article>
          <h3>Open the evidence pack.</h3>
          <p>The district pack carries the source date, public metrics, method version, links, and caveats for citation.</p>
        </article>
      </div>
    </section>

    ${EVIDENCE_ENTRY_POINTS_SCRIPT}
  `;

  return renderPageShell({
    title: "Persistent Pressure Watchroom — NyaayWatch",
    body,
    activeNav: "watch",
    navLinks: [
      { id: "districts", href: "/districts", label: "Districts" },
      { id: "watch", href: "/watch", label: "Watch" },
      { id: "data", href: "/data", label: "Data" },
      { id: "methodology", href: "/methodology", label: "Method" },
      { id: "api", href: "/api", label: "API" },
      { id: "learn", href: "/learn", label: "Learn" },
    ],
    ticker: `PERSISTENT PRESSURE · LOWER COURTS · ${rankedDistricts.length.toLocaleString("en-IN")} DISTRICT SIGNALS`,
    footer: {
      sourceDateLabel,
      methodologyVersion: entries[0]?.snapshot.snapshot.methodologyVersion ?? null,
      sourceAttribution: "National Judicial Data Grid public district dashboards",
    },
    pageCss: WATCHROOM_PAGE_CSS + INVESTIGATION_WORKFLOW_CSS + EVIDENCE_ENTRY_POINTS_CSS,
    og: {
      title: "Persistent Pressure Watchroom — NyaayWatch",
      description: "A lower-court issue watchroom for finding districts repeatedly flagged across recent published snapshots.",
      url: `${SITE_ORIGIN}/watch/persistent-pressure`,
    },
  });
}

function renderDistrictTable(entries: RankedDistrictEntry[]): string {
  if (entries.length === 0) {
    return `<p class="watchroom-empty">No repeated district pressure signals are available on the public site right now.</p>`;
  }

  const rows = entries
    .map(({ entry, district }) => {
      const routes = buildPublicStateRoutes(entry.profile);
      return `<tr>
        <td><a href="${routes.district(district.districtId)}">${escapeHtml(district.districtName)}</a></td>
        <td><a href="${routes.home}">${escapeHtml(entry.profile.stateName)}</a></td>
        <td class="num">${formatPersistence(district.watchlistPersistence.flaggedInLastSix, district.watchlistPersistence.lastSixWindow)}</td>
        <td class="num">${formatPersistenceShare(district)}</td>
        <td class="num">${district.backlogCases.toLocaleString("en-IN")}</td>
        <td class="num">#${district.rank}</td>
        <td><a href="${routes.districtEvidencePack(district.districtId)}">Evidence JSON</a></td>
      </tr>`;
    })
    .join("");

  return `
    <div class="watchroom-table-wrap">
      <table class="data-table watchroom-table">
        <thead>
          <tr>
            <th>District</th>
            <th>Geography</th>
            <th>Flagged window</th>
            <th>Window share (%)</th>
            <th>Cases waiting</th>
            <th>Rank</th>
            <th>Use</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderGeographyTable(entries: RankedGeographyEntry[]): string {
  if (entries.length === 0) {
    return `<p class="watchroom-empty">No lower-court geographies have repeated district pressure signals right now.</p>`;
  }

  const rows = entries.map(({ entry, flaggedDistricts, topDistrict }) => {
    const routes = buildPublicStateRoutes(entry.profile);
    return `<tr>
      <td><a href="${routes.home}">${escapeHtml(entry.profile.stateName)}</a></td>
      <td class="num">${flaggedDistricts.length.toLocaleString("en-IN")}</td>
      <td><a href="${routes.district(topDistrict.districtId)}">${escapeHtml(topDistrict.districtName)}</a></td>
      <td class="num">${formatPersistence(topDistrict.watchlistPersistence.flaggedInLastSix, topDistrict.watchlistPersistence.lastSixWindow)}</td>
      <td class="num">${topDistrict.backlogCases.toLocaleString("en-IN")}</td>
      <td><a href="${routes.stateEvidencePack}">Evidence JSON</a></td>
    </tr>`;
  }).join("");

  return `
    <div class="watchroom-table-wrap">
      <table class="data-table watchroom-table">
        <thead>
          <tr>
            <th>Geography</th>
            <th>Repeat-signal districts</th>
            <th>Most persistent district</th>
            <th>Flagged window</th>
            <th>District cases waiting</th>
            <th>Use</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function comparePersistentDistricts(a: RankedDistrictEntry, b: RankedDistrictEntry): number {
  return compareDistrictsByPersistence(a.district, b.district);
}

function compareDistrictsByPersistence(a: DistrictSnapshot, b: DistrictSnapshot): number {
  return (
    persistenceRate(b) - persistenceRate(a) ||
    b.watchlistPersistence.flaggedInLastSix - a.watchlistPersistence.flaggedInLastSix ||
    b.watchlistPersistence.lastSixWindow - a.watchlistPersistence.lastSixWindow ||
    b.backlogCases - a.backlogCases ||
    a.districtName.localeCompare(b.districtName, "en")
  );
}

function persistenceRate(district: DistrictSnapshot): number {
  const { flaggedInLastSix, lastSixWindow } = district.watchlistPersistence;
  return lastSixWindow > 0 ? flaggedInLastSix / lastSixWindow : 0;
}

function formatPersistence(flagged: number, window: number): string {
  return window > 0 ? `${flagged.toLocaleString("en-IN")} of ${window.toLocaleString("en-IN")}` : "N/A";
}

function formatPersistenceShare(district: DistrictSnapshot): string {
  const rate = persistenceRate(district) * 100;
  return `${Math.round(rate * 10) / 10}%`;
}

import type { BacklogConcentration, DistrictSnapshot, PublishedSnapshot } from "../../domain/snapshot-schema.js";
import type { NjdgStateProfile } from "../../geographies.js";
import { escapeHtml } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";
import { renderStatTile } from "../design/ui.js";
import { formatDate } from "../home/view-model.js";
import { buildPublicStateRoutes } from "../public-state.js";
import { SITE_ORIGIN } from "../share/site-origin.js";
import { EVIDENCE_ENTRY_POINTS_CSS, EVIDENCE_ENTRY_POINTS_SCRIPT, renderEvidenceEntryPoints } from "./evidence-entry-points.js";
import { INVESTIGATION_WORKFLOW_CSS, renderInvestigationWorkflow } from "./investigation-workflow.js";
import { WATCHROOM_PAGE_CSS } from "./watchroom-shared.js";

export interface BacklogConcentrationWatchroomEntry {
  profile: NjdgStateProfile;
  snapshot: PublishedSnapshot;
}

interface RankedGeographyEntry {
  entry: BacklogConcentrationWatchroomEntry;
  concentration: BacklogConcentration;
  topDistricts: DistrictSnapshot[];
}

interface RankedDistrictEntry {
  entry: BacklogConcentrationWatchroomEntry;
  district: DistrictSnapshot;
  districtShare: number;
}

export function renderBacklogConcentrationWatchroomPage(entries: BacklogConcentrationWatchroomEntry[]): string {
  const rankedGeographies = entries
    .flatMap((entry) =>
      entry.snapshot.stats.backlogConcentration.state === "ok"
        ? [
            {
              entry,
              concentration: entry.snapshot.stats.backlogConcentration.value,
              topDistricts: [...entry.snapshot.districts].sort((a, b) => b.backlogCases - a.backlogCases).slice(0, 5),
            },
          ]
        : [],
    )
    .sort(
      (a, b) =>
        b.concentration.topFiveDistrictsShare - a.concentration.topFiveDistrictsShare ||
        b.concentration.topTenDistrictsShare - a.concentration.topTenDistrictsShare,
    );

  const rankedDistricts = rankedGeographies
    .flatMap(({ entry }) =>
      entry.snapshot.districts
        .filter((district) => entry.snapshot.stats.pendingCases > 0 && district.backlogCases > 0)
        .map((district) => ({
          entry,
          district,
          districtShare: (district.backlogCases / entry.snapshot.stats.pendingCases) * 100,
        })),
    )
    .sort((a, b) => b.districtShare - a.districtShare || b.district.backlogCases - a.district.backlogCases)
    .slice(0, 15);

  const comparableGeographies = rankedGeographies.filter(({ entry }) => hasComparableTopFive(entry.snapshot));
  const comparableDistricts = rankedDistricts.filter(({ entry }) => hasComparableLargestDistrict(entry.snapshot));
  const missingEntries = entries.filter((entry) => entry.snapshot.stats.backlogConcentration.state === "missing");
  const smallGeographyCount = rankedGeographies.length - comparableGeographies.length;
  const singleDistrictGeographyCount = rankedGeographies.filter(({ entry }) => !hasComparableLargestDistrict(entry.snapshot)).length;
  const topGeography = comparableGeographies[0] ?? null;
  const topDistrict = comparableDistricts[0] ?? null;
  const topGeographyRoutes = topGeography ? buildPublicStateRoutes(topGeography.entry.profile) : null;
  const topDistrictRoutes = topDistrict ? buildPublicStateRoutes(topDistrict.entry.profile) : null;
  const latestReferenceDate = entries
    .map((entry) => entry.snapshot.snapshot.referenceDateAt)
    .sort()
    .at(-1);
  const sourceDateLabel = latestReferenceDate ? formatDate(latestReferenceDate) : null;
  const citation = `NyaayWatch. "Backlog Concentration Watchroom." Lower-court public data currently on NyaayWatch. ${SITE_ORIGIN}/watch/backlog-concentration`;

  const body = `
    <section class="watchroom-hero">
      <p class="watchroom-hero__eyebrow">ISSUE WATCHROOM</p>
      <h1>Backlog concentration watchroom</h1>
      <p class="watchroom-hero__lede">Where is the pending pile concentrated in a few districts?</p>
      <p class="watchroom-hero__body">This page follows lower-court geographies where district-level pending-case counts can show whether the backlog is concentrated in the largest districts or spread more broadly.</p>
      <p class="watchroom-hero__meta">${entries.length.toLocaleString("en-IN")} lower-court geographies checked · ${rankedGeographies.length.toLocaleString("en-IN")} with concentration signals · Source: National Judicial Data Grid public district dashboards</p>
    </section>

    <section class="watchroom-toplines" aria-label="Backlog concentration toplines">
      ${renderStatTile({
        label: "Geographies with concentration",
        value: rankedGeographies.length.toLocaleString("en-IN"),
        unit: `/ ${entries.length.toLocaleString("en-IN")}`,
        tone: "accent",
      })}
      ${renderStatTile({
        label: "Highest comparable top-5 share (%)",
        value: topGeography ? formatShare(topGeography.concentration.topFiveDistrictsShare) : "N/A",
        note: topGeography ? topGeography.entry.profile.stateName : "Needs more than five district rows",
      })}
      ${renderStatTile({
        label: "Largest comparable district share (%)",
        value: topDistrict ? formatShare(topDistrict.districtShare) : "N/A",
        note: topDistrict ? `${topDistrict.district.districtName}, ${topDistrict.entry.profile.stateName}` : "Needs more than one district row",
      })}
    </section>
    <p class="watchroom-toplines-note">
      Small geographies can show 100% top-5 share because the top five districts cover the whole geography. They stay visible in the tables, but the headline cards use comparable geographies with enough district rows.
    </p>

    ${renderInvestigationWorkflow({
      headline: "Use concentration to choose the right scale of inspection.",
      lede:
        "A concentrated backlog can point to a few districts that need closer reading. A broad backlog can point to pressure spread across the geography.",
      steps: [
        {
          eyebrow: "01",
          title: "Start with top-5 share",
          body: "Read how much of the geography's pending pile is held by the five largest district backlogs.",
          href: "#geography-table",
          cta: "See geographies",
        },
        {
          eyebrow: "02",
          title: "Open the largest districts",
          body: "Use district shares to see whether one place dominates the signal or several districts share it.",
          href: "#district-table",
          cta: "See districts",
        },
        {
          eyebrow: "03",
          title: "Check the state page",
          body: "Open the geography page to read concentration beside old-case burden, clearance pace, and caveats.",
          href: topGeographyRoutes?.home ?? "/districts",
          cta: "Open top geography",
        },
        {
          eyebrow: "04",
          title: "Cite evidence",
          body: "Use the evidence pack so the source date, method, and public-data boundary travel with the concentration signal.",
          href: "#evidence",
          cta: "Use evidence",
        },
      ],
    })}

    <div id="evidence">
    ${renderEvidenceEntryPoints({
      headline: "Carry the evidence with the concentration signal.",
      lede:
        "Use these links when a concentration signal needs to be checked, cited, or exported. Raw captures and operator notes stay outside the public boundary.",
      entries: [
        {
          title: "Watchroom citation",
          body: "Use this for the backlog-concentration page itself.",
          href: "/watch/backlog-concentration",
          cta: "Open watchroom",
          codeLabel: "/watch/backlog-concentration",
          citationText: citation,
        },
        {
          title: "Top geography pack",
          body: topGeography
            ? `Use this to check ${topGeography.entry.profile.stateName} with source date, method, links, and caveats.`
            : "Use state evidence packs when concentration signals are available.",
          href: topGeographyRoutes?.stateEvidencePack ?? "/data",
          cta: topGeography ? "Download state JSON" : "Open data",
          codeLabel: topGeographyRoutes?.stateEvidencePack ?? "/data",
        },
        {
          title: "Top district pack",
          body: topDistrict
            ? `Use this before quoting ${topDistrict.district.districtName}'s share of the pending pile.`
            : "Use district evidence packs when district shares are available.",
          href: topDistrict && topDistrictRoutes ? topDistrictRoutes.districtEvidencePack(topDistrict.district.districtId) : "/districts",
          cta: topDistrict ? "Download district JSON" : "Open districts",
          codeLabel: topDistrict && topDistrictRoutes ? topDistrictRoutes.districtEvidencePack(topDistrict.district.districtId) : "/districts",
        },
      ],
    })}
    </div>

    <section class="watchroom-section" id="geography-table">
      <header class="watchroom-section__head">
        <p class="watchroom-section__eyebrow">LOWER-COURT GEOGRAPHIES</p>
        <h2>Where pending cases are most concentrated.</h2>
        <p>Ranked by the share of pending cases held by the five largest district backlogs in that geography.</p>
      </header>
      ${renderGeographyTable(rankedGeographies)}
    </section>

    <section class="watchroom-section" id="district-table">
      <header class="watchroom-section__head">
        <p class="watchroom-section__eyebrow">DISTRICTS TO INSPECT</p>
        <h2>Districts holding the largest local shares.</h2>
        <p>These district shares are measured inside their own lower-court geography. They are not a national district ranking.</p>
      </header>
      ${renderDistrictTable(rankedDistricts)}
    </section>

    <section class="watchroom-section watchroom-caveat">
      <header class="watchroom-section__head">
        <p class="watchroom-section__eyebrow">CAVEATS</p>
        <h2>Concentration is a geography signal.</h2>
      </header>
      <div class="watchroom-caveat__grid">
        <article>
          <h3>It does not explain cause.</h3>
          <p>The signal says where pending cases sit. It does not show staffing, case mix, transfers, or local administrative reasons.</p>
        </article>
        <article>
          <h3>It is not cross-tier ranking.</h3>
          <p>This page stays inside lower-court district data. It does not compare districts with High Courts or the Supreme Court.</p>
        </article>
        <article>
          <h3>Missing stays missing.</h3>
          <p>Geographies without usable district pending-case counts stay out of the ranking rather than being estimated.</p>
        </article>
        <article>
          <h3>Small geographies need care.</h3>
          <p>${smallGeographyCount.toLocaleString("en-IN")} geographies with five or fewer district rows can show 100% top-5 share because the top five covers the whole geography. ${singleDistrictGeographyCount.toLocaleString("en-IN")} single-district geographies can also show 100% largest-district share.</p>
        </article>
      </div>
      ${missingEntries.length > 0 ? renderMissingList(missingEntries) : ""}
    </section>

    ${EVIDENCE_ENTRY_POINTS_SCRIPT}
  `;

  return renderPageShell({
    title: "Backlog Concentration Watchroom — NyaayWatch",
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
    ticker: `BACKLOG CONCENTRATION · LOWER COURTS · ${rankedGeographies.length.toLocaleString("en-IN")} GEOGRAPHIES WITH SIGNALS`,
    footer: {
      sourceDateLabel,
      methodologyVersion: entries[0]?.snapshot.snapshot.methodologyVersion ?? null,
      sourceAttribution: "National Judicial Data Grid public district dashboards",
    },
    pageCss: WATCHROOM_PAGE_CSS + INVESTIGATION_WORKFLOW_CSS + EVIDENCE_ENTRY_POINTS_CSS,
    og: {
      title: "Backlog Concentration Watchroom — NyaayWatch",
      description: "A lower-court issue watchroom for finding where pending cases are concentrated in a few districts.",
      url: `${SITE_ORIGIN}/watch/backlog-concentration`,
    },
  });
}

function renderGeographyTable(entries: RankedGeographyEntry[]): string {
  if (entries.length === 0) {
    return `<p class="watchroom-empty">No lower-court backlog concentration signals are available on the public site right now.</p>`;
  }

  const rows = entries.map(({ entry, concentration, topDistricts }) => {
    const routes = buildPublicStateRoutes(entry.profile);
    const topDistrict = topDistricts[0] ?? null;
    return `<tr>
      <td><a href="${routes.home}">${escapeHtml(entry.profile.stateName)}</a></td>
      <td class="num">${entry.snapshot.stats.pendingCases.toLocaleString("en-IN")}</td>
      <td class="num">${formatShare(concentration.topFiveDistrictsShare)}</td>
      <td class="num">${formatShare(concentration.topTenDistrictsShare)}</td>
      <td>${topDistrict ? `<a href="${routes.district(topDistrict.districtId)}">${escapeHtml(topDistrict.districtName)}</a>` : "N/A"}</td>
      <td class="num">${topDistrict ? formatShare(districtShare(topDistrict, entry.snapshot.stats.pendingCases)) : "N/A"}</td>
      <td><a href="${routes.stateEvidencePack}">Evidence JSON</a></td>
    </tr>`;
  }).join("");

  return `
    <div class="watchroom-table-wrap">
      <table class="data-table watchroom-table">
        <thead>
          <tr>
            <th>Geography</th>
            <th>Cases waiting</th>
            <th>Top-5 share (%)</th>
            <th>Top-10 share (%)</th>
            <th>Largest district</th>
            <th>District share (%)</th>
            <th>Use</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderDistrictTable(entries: RankedDistrictEntry[]): string {
  if (entries.length === 0) {
    return `<p class="watchroom-empty">No district-level backlog concentration signals are available on the public site right now.</p>`;
  }

  const rows = entries.map(({ entry, district, districtShare }) => {
    const routes = buildPublicStateRoutes(entry.profile);
    return `<tr>
      <td><a href="${routes.district(district.districtId)}">${escapeHtml(district.districtName)}</a></td>
      <td><a href="${routes.home}">${escapeHtml(entry.profile.stateName)}</a></td>
      <td class="num">${formatShare(districtShare)}</td>
      <td class="num">${district.backlogCases.toLocaleString("en-IN")}</td>
      <td class="num">#${district.rank}</td>
      <td><a href="${routes.districtEvidencePack(district.districtId)}">Evidence JSON</a></td>
    </tr>`;
  }).join("");

  return `
    <div class="watchroom-table-wrap">
      <table class="data-table watchroom-table">
        <thead>
          <tr>
            <th>District</th>
            <th>Geography</th>
            <th>Geography share (%)</th>
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

function renderMissingList(entries: BacklogConcentrationWatchroomEntry[]): string {
  const names = entries
    .map((entry) => entry.profile.stateName)
    .sort((a, b) => a.localeCompare(b, "en"))
    .slice(0, 12);

  return `
    <div class="watchroom-missing">
      <h3>Concentration not available for ${entries.length.toLocaleString("en-IN")} lower-court geographies.</h3>
      <p>${escapeHtml(names.join(", "))}${entries.length > names.length ? ", and others" : ""} stay out of the ranking until district pending-case counts are usable.</p>
    </div>
  `;
}

function districtShare(district: DistrictSnapshot, pendingCases: number): number {
  return pendingCases > 0 ? (district.backlogCases / pendingCases) * 100 : 0;
}

function hasComparableTopFive(snapshot: PublishedSnapshot): boolean {
  return snapshot.districts.length > 5;
}

function hasComparableLargestDistrict(snapshot: PublishedSnapshot): boolean {
  return snapshot.districts.length > 1;
}

function formatShare(value: number): string {
  return `${(Math.round(value * 10) / 10).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

import type { DistrictSnapshot, OldCaseBurden, PublishedSnapshot } from "../../domain/snapshot-schema.js";
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

export interface OldCaseWatchroomEntry {
  profile: NjdgStateProfile;
  snapshot: PublishedSnapshot;
}

interface RankedStateEntry {
  entry: OldCaseWatchroomEntry;
  burden: OldCaseBurden;
}

interface RankedDistrictEntry {
  entry: OldCaseWatchroomEntry;
  district: DistrictSnapshot;
  burden: OldCaseBurden;
}

export function renderOldCaseWatchroomPage(entries: OldCaseWatchroomEntry[]): string {
  const rankedStates = entries
    .flatMap((entry) =>
      entry.snapshot.stats.oldCaseBurden.state === "ok"
        ? [{ entry, burden: entry.snapshot.stats.oldCaseBurden.value }]
        : [],
    )
    .sort((a, b) => b.burden.threePlusYearsShare - a.burden.threePlusYearsShare || b.burden.threePlusYearsCases - a.burden.threePlusYearsCases);

  const rankedDistricts = rankedStates
    .flatMap(({ entry }) =>
      entry.snapshot.districts
        .filter((district) => district.oldCaseBurden.threePlusYearsCases > 0)
        .map((district) => ({ entry, district, burden: district.oldCaseBurden })),
    )
    .sort((a, b) => b.burden.threePlusYearsShare - a.burden.threePlusYearsShare || b.burden.threePlusYearsCases - a.burden.threePlusYearsCases)
    .slice(0, 12);

  const missingEntries = entries.filter((entry) => entry.snapshot.stats.oldCaseBurden.state === "missing");
  const topState = rankedStates[0] ?? null;
  const topDistrict = rankedDistricts[0] ?? null;
  const latestReferenceDate = entries
    .map((entry) => entry.snapshot.snapshot.referenceDateAt)
    .sort()
    .at(-1);
  const sourceDateLabel = latestReferenceDate ? formatDate(latestReferenceDate) : null;
  const topStateRoutes = topState ? buildPublicStateRoutes(topState.entry.profile) : null;
  const topDistrictRoutes = topDistrict ? buildPublicStateRoutes(topDistrict.entry.profile) : null;
  const citation = `NyaayWatch. "Old-Case Burden Watchroom." Lower-court public data currently on NyaayWatch. ${SITE_ORIGIN}/watch/old-case-burden`;

  const body = `
    <section class="watchroom-hero">
      <p class="watchroom-hero__eyebrow">ISSUE WATCHROOM</p>
      <h1>Old-case burden watchroom</h1>
      <p class="watchroom-hero__lede">Where are long waits concentrated in lower courts?</p>
      <p class="watchroom-hero__body">This page follows lower-court states and Union Territories where the public source gives age buckets for pending cases. It highlights the share of cases waiting more than three, five, and ten years.</p>
      <p class="watchroom-hero__meta">${entries.length.toLocaleString("en-IN")} lower-court geographies checked · ${rankedStates.length.toLocaleString("en-IN")} with old-case age buckets · Source: National Judicial Data Grid public district dashboards</p>
    </section>

    <section class="watchroom-toplines" aria-label="Old-case burden toplines">
      ${renderStatTile({
        label: "Geographies with age buckets",
        value: rankedStates.length.toLocaleString("en-IN"),
        unit: `/ ${entries.length.toLocaleString("en-IN")}`,
        tone: "accent",
      })}
      ${renderStatTile({
        label: "Highest 3+ year share (%)",
        value: topState ? formatPercent(topState.burden.threePlusYearsShare) : "N/A",
        note: topState ? topState.entry.profile.stateName : "Age buckets not available",
      })}
      ${renderStatTile({
        label: "Largest district signal",
        value: topDistrict ? formatPercent(topDistrict.burden.threePlusYearsShare) : "N/A",
        note: topDistrict ? `${topDistrict.district.districtName}, ${topDistrict.entry.profile.stateName}` : "District age buckets not available",
      })}
    </section>

    ${renderInvestigationWorkflow({
      headline: "Use the watchroom to choose what to inspect.",
      lede:
        "A high old-case share is a flagged signal. It asks for closer reading of the state page, district page, source date, and caveats before anyone turns it into a public claim.",
      steps: [
        {
          eyebrow: "01",
          title: "Start with share",
          body: "Look at the 3+ year share first. It shows where long waits are concentrated, not just where the pending pile is large.",
          href: "#geography-table",
          cta: "See geographies",
        },
        {
          eyebrow: "02",
          title: "Check scale",
          body: "Read the case count beside the share so a small court does not look the same as a large lower-court geography.",
          href: "#geography-table",
          cta: "Check counts",
        },
        {
          eyebrow: "03",
          title: "Open districts",
          body: "Use the district table to find where the signal is concentrated inside the geography.",
          href: "#district-table",
          cta: "See districts",
        },
        {
          eyebrow: "04",
          title: "Cite evidence",
          body: "Use the evidence pack, CSV, and methodology links so the date, source, and caveat travel with the number.",
          href: "#evidence",
          cta: "Use evidence",
        },
      ],
    })}

    <div id="evidence">
    ${renderEvidenceEntryPoints({
      headline: "Carry the evidence with the claim.",
      lede:
        "Use these links when the old-case signal needs to be checked, cited, or exported. Raw captures and operator notes stay outside the public boundary.",
      entries: [
        {
          title: "Watchroom citation",
          body: "Use this for the old-case burden page itself.",
          href: "/watch/old-case-burden",
          cta: "Open watchroom",
          codeLabel: "/watch/old-case-burden",
          citationText: citation,
        },
        {
          title: "Top geography pack",
          body: topState
            ? `Use this to check ${topState.entry.profile.stateName} with source date, method, links, and caveats.`
            : "Use state evidence packs when old-case age buckets are available.",
          href: topStateRoutes?.stateEvidencePack ?? "/data",
          cta: topState ? "Download state JSON" : "Open data",
          codeLabel: topStateRoutes?.stateEvidencePack ?? "/data",
        },
        {
          title: "Top district pack",
          body: topDistrict
            ? `Use this before quoting ${topDistrict.district.districtName}'s old-case signal.`
            : "Use district evidence packs when district-level age buckets are available.",
          href: topDistrictRoutes?.districtEvidencePack(topDistrict?.district.districtId ?? "") ?? "/districts",
          cta: topDistrict ? "Download district JSON" : "Open districts",
          codeLabel: topDistrictRoutes?.districtEvidencePack(topDistrict?.district.districtId ?? "") ?? "/districts",
        },
      ],
    })}
    </div>

    <section class="watchroom-section" id="geography-table">
      <header class="watchroom-section__head">
        <p class="watchroom-section__eyebrow">LOWER-COURT GEOGRAPHIES</p>
        <h2>Where old cases form the largest share.</h2>
        <p>Ranked only among lower-court geographies where the public source gives age buckets.</p>
      </header>
      ${renderStateTable(rankedStates)}
    </section>

    <section class="watchroom-section" id="district-table">
      <header class="watchroom-section__head">
        <p class="watchroom-section__eyebrow">DISTRICTS TO INSPECT</p>
        <h2>Districts with the clearest old-case signal.</h2>
        <p>This table stays inside the lower-court age-bucket source family. It does not rank judges, lawyers, litigants, or case outcomes.</p>
      </header>
      ${renderDistrictTable(rankedDistricts)}
    </section>

    <section class="watchroom-section watchroom-caveat">
      <header class="watchroom-section__head">
        <p class="watchroom-section__eyebrow">CAVEATS</p>
        <h2>Read this as a signal, not a finding of fault.</h2>
      </header>
      <div class="watchroom-caveat__grid">
        <article>
          <h3>Age buckets are source-dependent.</h3>
          <p>Some public pages do not publish the age-bucket fields needed for this watchroom. Those geographies stay visible as missing rather than being estimated.</p>
        </article>
        <article>
          <h3>Share and scale both matter.</h3>
          <p>A high percentage can come from a smaller pending pile. Check the case count and the district evidence page before quoting the signal.</p>
        </article>
        <article>
          <h3>It does not explain why cases waited.</h3>
          <p>The public aggregate does not show case type, hearing history, party behaviour, staffing, or local administrative reasons.</p>
        </article>
      </div>
      ${missingEntries.length > 0 ? renderMissingList(missingEntries) : ""}
    </section>

    ${EVIDENCE_ENTRY_POINTS_SCRIPT}
  `;

  return renderPageShell({
    title: "Old-Case Burden Watchroom — NyaayWatch",
    body,
    activeNav: "watch",
    navLinks: [
      { id: "districts", href: "/districts", label: "Districts" },
      { id: "watch", href: "/watch/old-case-burden", label: "Watch" },
      { id: "data", href: "/data", label: "Data" },
      { id: "methodology", href: "/methodology", label: "Method" },
      { id: "api", href: "/api", label: "API" },
      { id: "learn", href: "/learn", label: "Learn" },
    ],
    ticker: `OLD-CASE BURDEN · LOWER COURTS · ${rankedStates.length}/${entries.length} GEOGRAPHIES WITH AGE BUCKETS`,
    footer: {
      sourceDateLabel,
      methodologyVersion: entries[0]?.snapshot.snapshot.methodologyVersion ?? null,
      sourceAttribution: "National Judicial Data Grid public district dashboards",
    },
    pageCss: WATCHROOM_PAGE_CSS + INVESTIGATION_WORKFLOW_CSS + EVIDENCE_ENTRY_POINTS_CSS,
    og: {
      title: "Old-Case Burden Watchroom — NyaayWatch",
      description: "A lower-court issue watchroom for finding where cases waiting more than three, five, and ten years are concentrated.",
      url: `${SITE_ORIGIN}/watch/old-case-burden`,
    },
  });
}

function renderStateTable(entries: RankedStateEntry[]): string {
  if (entries.length === 0) {
    return `<p class="watchroom-empty">No lower-court age-bucket data is available on the public site right now.</p>`;
  }

  const rows = entries
    .map(({ entry, burden }) => {
      const routes = buildPublicStateRoutes(entry.profile);
      return `<tr>
        <td><a href="${routes.home}">${escapeHtml(entry.profile.stateName)}</a></td>
        <td class="num">${entry.snapshot.stats.pendingCases.toLocaleString("en-IN")}</td>
        <td class="num">${burden.threePlusYearsCases.toLocaleString("en-IN")}</td>
        <td class="num">${formatPercent(burden.threePlusYearsShare)}</td>
        <td class="num">${formatPercent(burden.fivePlusYearsShare)}</td>
        <td class="num">${formatPercent(burden.tenPlusYearsShare)}</td>
        <td>${escapeHtml(formatDate(entry.snapshot.snapshot.referenceDateAt))}</td>
        <td><a href="${routes.stateEvidencePack}">Evidence JSON</a></td>
      </tr>`;
    })
    .join("");

  return `
    <div class="watchroom-table-wrap">
      <table class="data-table watchroom-table">
        <thead>
          <tr>
            <th>Geography</th>
            <th>Cases waiting</th>
            <th>3+ year cases</th>
            <th>3+ year share (%)</th>
            <th>5+ year share (%)</th>
            <th>10+ year share (%)</th>
            <th>Data date</th>
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
    return `<p class="watchroom-empty">No district-level old-case age buckets are available on the public site right now.</p>`;
  }

  const rows = entries
    .map(({ entry, district, burden }) => {
      const routes = buildPublicStateRoutes(entry.profile);
      return `<tr>
        <td><a href="${routes.district(district.districtId)}">${escapeHtml(district.districtName)}</a></td>
        <td><a href="${routes.home}">${escapeHtml(entry.profile.stateName)}</a></td>
        <td class="num">${district.backlogCases.toLocaleString("en-IN")}</td>
        <td class="num">${burden.threePlusYearsCases.toLocaleString("en-IN")}</td>
        <td class="num">${formatPercent(burden.threePlusYearsShare)}</td>
        <td class="num">${formatPercent(burden.fivePlusYearsShare)}</td>
        <td class="num">${formatPercent(burden.tenPlusYearsShare)}</td>
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
            <th>Cases waiting</th>
            <th>3+ year cases</th>
            <th>3+ year share (%)</th>
            <th>5+ year share (%)</th>
            <th>10+ year share (%)</th>
            <th>Use</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderMissingList(entries: OldCaseWatchroomEntry[]): string {
  const names = entries
    .map((entry) => entry.profile.stateName)
    .sort((a, b) => a.localeCompare(b, "en"))
    .slice(0, 12);

  return `
    <div class="watchroom-missing">
      <h3>Age buckets not available for ${entries.length.toLocaleString("en-IN")} lower-court geographies.</h3>
      <p>${escapeHtml(names.join(", "))}${entries.length > names.length ? ", and others" : ""} stay out of the ranking until the source publishes usable age buckets.</p>
    </div>
  `;
}

function formatPercent(value: number): string {
  return `${roundTo1(value).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function roundTo1(value: number): number {
  return Math.round(value * 10) / 10;
}

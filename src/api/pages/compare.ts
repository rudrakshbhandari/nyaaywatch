import type { DistrictSnapshot, PublishedSnapshot } from "../../domain/snapshot-schema.js";
import { escapeHtml } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";
import type { PublicPageContext } from "../public-state.js";
import { renderStatTile } from "../design/ui.js";
import { formatDate } from "../home/view-model.js";
import { SITE_ORIGIN } from "../share/site-origin.js";
import { EVIDENCE_ENTRY_POINTS_CSS, EVIDENCE_ENTRY_POINTS_SCRIPT, renderEvidenceEntryPoints } from "./evidence-entry-points.js";
import { INVESTIGATION_WORKFLOW_CSS, renderInvestigationWorkflow } from "./investigation-workflow.js";

export function renderComparePage(
  snapshot: PublishedSnapshot,
  a: DistrictSnapshot,
  b: DistrictSnapshot,
  context: PublicPageContext,
): string {
  const waitA = Math.round(a.medianAgeDays / 30);
  const waitB = Math.round(b.medianAgeDays / 30);
  const snapshotDate = formatDate(snapshot.snapshot.sourceSnapshotAt);
  const comparePath = context.routes.compare(a.districtId, b.districtId);
  const compareUrl = `${SITE_ORIGIN}${comparePath}`;
  const compareCitation = `NyaayWatch. "${a.districtName} vs. ${b.districtName} District Comparison." ${snapshotDate}. ${snapshot.snapshot.sourceAttribution}. ${compareUrl}`;
  const aCitation = buildDistrictCitation(a.districtName, snapshotDate, snapshot.snapshot.sourceAttribution, `${SITE_ORIGIN}${context.routes.district(a.districtId)}`);
  const bCitation = buildDistrictCitation(b.districtName, snapshotDate, snapshot.snapshot.sourceAttribution, `${SITE_ORIGIN}${context.routes.district(b.districtId)}`);

  const ogTitle = `${a.districtName} vs. ${b.districtName} — NyaayWatch`;
  const ogDesc = `${a.districtName}: ${a.backlogCases.toLocaleString("en-IN")} cases waiting, ~${waitA} mo typical wait. ${b.districtName}: ${b.backlogCases.toLocaleString("en-IN")} cases waiting, ~${waitB} mo typical wait. Source: NyaayWatch ${snapshotDate}.`;

  const body = `
    <section class="compare-hero">
      <p class="compare-hero__eyebrow">DISTRICT COMPARISON</p>
      <h1 class="compare-hero__hed">
        <a href="${context.routes.district(a.districtId)}" class="compare-hero__name">${escapeHtml(a.districtName)}</a>
        <span class="compare-hero__vs">vs.</span>
        <a href="${context.routes.district(b.districtId)}" class="compare-hero__name">${escapeHtml(b.districtName)}</a>
      </h1>
      <p class="compare-hero__meta">
        ${escapeHtml(snapshot.snapshot.stateName)} · ${escapeHtml(snapshotDate)} · ${escapeHtml(snapshot.snapshot.sourceAttribution)}
      </p>
    </section>

    <div class="compare-grid">
      ${renderDistrictPanel(a, waitA, context)}
      <div class="compare-divider">
        <span>vs</span>
      </div>
      ${renderDistrictPanel(b, waitB, context)}
    </div>

    <section class="compare-table-section">
      <h2 class="compare-table__hed">Side-by-side</h2>
      <div class="compare-table-wrap">
        <table class="data-table compare-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>${escapeHtml(a.districtName)}</th>
              <th>${escapeHtml(b.districtName)}</th>
              <th>Difference</th>
            </tr>
          </thead>
          <tbody>
            ${compareRow("Watch rank", `#${a.rank}`, `#${b.rank}`, null)}
            ${compareRow("Cases waiting", a.backlogCases.toLocaleString("en-IN"), b.backlogCases.toLocaleString("en-IN"), a.backlogCases - b.backlogCases, "cases")}
            ${compareRow("Cleared / 100 filed", a.disposalRate.toFixed(1), b.disposalRate.toFixed(1), roundTo1(a.disposalRate - b.disposalRate), "pp")}
            ${compareRow("Typical wait", `~${waitA} mo`, `~${waitB} mo`, waitA - waitB, "months")}
            ${compareRow("File-clear gap", formatGap(a.filingVsDisposalGap), formatGap(b.filingVsDisposalGap), null)}
          </tbody>
        </table>
      </div>
    </section>

    <section class="compare-share-section">
      <h2 class="compare-share__hed">Share this comparison</h2>
      <p class="compare-share__lede">This route keeps the same two districts and reflects the current published snapshot for this geography.</p>
      <div class="compare-share__actions">
        <code class="compare-share__url">${escapeHtml(compareUrl)}</code>
        <a class="btn btn--ghost btn--small" href="https://wa.me/?text=${encodeURIComponent(`${a.districtName} vs ${b.districtName} — backlog, wait times, and clearance rates compared. ${compareUrl}`)}" rel="noopener noreferrer" target="_blank">Share on WhatsApp</a>
      </div>
    </section>

    ${renderEvidenceEntryPoints({
      headline: "Download both evidence packs.",
      lede:
        "Use these packs when the comparison needs to travel with source dates, methodology version, CSV links, citation text, and caveats for each district.",
      entries: [
        {
          title: "Comparison citation",
          body: "Use this when citing the side-by-side comparison route.",
          href: comparePath,
          cta: "Open comparison",
          codeLabel: comparePath,
          citationText: compareCitation,
        },
        {
          title: `${a.districtName} pack`,
          body: "Use this for the first district's metrics, history, citation text, and public-data links.",
          href: context.routes.districtEvidencePack(a.districtId),
          cta: "Download JSON",
          codeLabel: context.routes.districtEvidencePack(a.districtId),
          citationText: aCitation,
        },
        {
          title: `${b.districtName} pack`,
          body: "Use this for the second district's metrics, history, citation text, and public-data links.",
          href: context.routes.districtEvidencePack(b.districtId),
          cta: "Download JSON",
          codeLabel: context.routes.districtEvidencePack(b.districtId),
          citationText: bCitation,
        },
        {
          title: "State pack",
          body: "Use this to place the two districts inside the full lower-court geography.",
          href: context.routes.stateEvidencePack,
          cta: "Download state JSON",
          codeLabel: context.routes.stateEvidencePack,
        },
      ],
    })}

    ${renderInvestigationWorkflow({
      headline: "Use this comparison as a starting point.",
      lede:
        "The comparison shows differences inside one lower-court geography. Open the evidence pages and methodology before turning the contrast into a public claim.",
      steps: [
        {
          eyebrow: "01",
          title: `${a.districtName} evidence`,
          body: "Open the full district page for history, caveats, citation text, and CSV export.",
          href: context.routes.district(a.districtId),
          cta: "Open evidence",
        },
        {
          eyebrow: "02",
          title: `${b.districtName} evidence`,
          body: "Check the same fields for the second district before quoting the side-by-side gap.",
          href: context.routes.district(b.districtId),
          cta: "Open evidence",
        },
        {
          eyebrow: "03",
          title: "Check movement",
          body: "Use movers to see whether either district changed between the two most recent published snapshots.",
          href: context.routes.movers,
          cta: "Open movers",
        },
        {
          eyebrow: "04",
          title: "Cite the method",
          body: "Use the methodology and data pages to explain which snapshot and metric definition support the comparison.",
          href: context.routes.methodology,
          cta: "Open methodology",
        },
      ],
    })}

    <section class="compare-more-section">
      <a class="btn btn--ghost" href="${context.routes.districts}">← All districts</a>
      <a class="btn btn--ghost" href="${context.routes.district(a.districtId)}">${escapeHtml(a.districtName)} full evidence</a>
      <a class="btn btn--ghost" href="${context.routes.district(b.districtId)}">${escapeHtml(b.districtName)} full evidence</a>
    </section>
    ${EVIDENCE_ENTRY_POINTS_SCRIPT}
  `;

  return renderPageShell({
    title: ogTitle,
    body,
    activeNav: "districts",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    stateLinks: context.stateLinks,
    footer: {
      sourceDateLabel: snapshotDate,
      methodologyVersion: snapshot.snapshot.methodologyVersion,
      sourceAttribution: snapshot.snapshot.sourceAttribution,
    },
    pageCss: COMPARE_PAGE_CSS + INVESTIGATION_WORKFLOW_CSS + EVIDENCE_ENTRY_POINTS_CSS,
    og: {
      title: ogTitle,
      description: ogDesc,
      url: compareUrl,
    },
  });
}

function buildDistrictCitation(districtName: string, snapshotDate: string, sourceAttribution: string, url: string): string {
  return `NyaayWatch. "${districtName} District Court Backlog." ${snapshotDate}. ${sourceAttribution}. ${url}`;
}

function renderDistrictPanel(d: DistrictSnapshot, waitMonths: number, context: PublicPageContext): string {
  return `
    <div class="compare-panel">
      <p class="compare-panel__eyebrow">RANK #${d.rank}</p>
      <h2 class="compare-panel__name"><a href="${context.routes.district(d.districtId)}">${escapeHtml(d.districtName)}</a></h2>
      <p class="compare-panel__summary">${escapeHtml(d.summary)}</p>
      <div class="compare-panel__stats">
        ${renderStatTile({ label: "Cases waiting", value: d.backlogCases.toLocaleString("en-IN"), tone: "accent" })}
        ${renderStatTile({ label: "Typical wait", value: `~${waitMonths}`, unit: "mo" })}
        ${renderStatTile({ label: "Cleared / 100", value: d.disposalRate.toFixed(1) })}
      </div>
    </div>
  `;
}

function compareRow(
  label: string,
  valA: string,
  valB: string,
  diff: number | null,
  unit = "",
): string {
  let diffCell = "—";
  if (diff !== null) {
    const abs = Math.abs(diff);
    const dir = diff > 0 ? "▲" : diff < 0 ? "▼" : "";
    diffCell = diff === 0 ? "Equal" : `${dir} ${abs.toLocaleString("en-IN")}${unit ? " " + unit : ""}`;
  }
  return `<tr><td>${escapeHtml(label)}</td><td class="num">${escapeHtml(valA)}</td><td class="num">${escapeHtml(valB)}</td><td class="num">${diffCell}</td></tr>`;
}

function formatGap(gap: number): string {
  return `${gap >= 0 ? "+" : "−"}${Math.abs(gap).toFixed(1)} pp`;
}

function roundTo1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function renderCompareNotFound(context: PublicPageContext): string {
  return renderPageShell({
    title: "District Not Found — NyaayWatch",
    body: `<section style="padding:60px 0"><h1>District not found</h1><p>One or both of the districts in this comparison could not be found in the current published snapshot.</p><p><a href="${context.routes.districts}">← Back to all districts</a></p></section>`,
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    stateLinks: context.stateLinks,
    footer: { sourceDateLabel: null, methodologyVersion: null, sourceAttribution: null },
  });
}

const COMPARE_PAGE_CSS = `
  .compare-hero { padding: 36px 0 40px; }
  .compare-hero__eyebrow {
    margin: 0 0 14px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.18em;
    color: var(--accent);
  }
  .compare-hero__hed {
    margin: 0 0 12px;
    font-size: clamp(32px, 4.5vw, 58px);
    line-height: 1.0; letter-spacing: -0.035em;
    display: flex; align-items: baseline; gap: 18px; flex-wrap: wrap;
  }
  .compare-hero__name { color: var(--ink); text-decoration: none; }
  .compare-hero__name:hover { color: var(--accent); }
  .compare-hero__vs { color: var(--ink-muted); font-weight: 600; }
  .compare-hero__meta { margin: 0; font-size: 13px; color: var(--ink-muted); font-family: "IBM Plex Mono", ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.08em; }

  .compare-grid {
    display: grid; grid-template-columns: 1fr 48px 1fr;
    gap: 0; margin-bottom: 60px; align-items: start;
  }
  .compare-panel { padding: 28px 24px; border: 1px solid var(--rule); }
  .compare-panel__eyebrow {
    margin: 0 0 6px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--accent);
  }
  .compare-panel__name { margin: 0 0 10px; font-size: clamp(22px, 2.8vw, 36px); line-height: 1.0; letter-spacing: -0.03em; }
  .compare-panel__name a { color: var(--ink); text-decoration: none; }
  .compare-panel__name a:hover { color: var(--accent); }
  .compare-panel__summary { margin: 0 0 18px; font-size: 14px; color: var(--ink-soft); line-height: 1.55; }
  .compare-panel__stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border-top: 1px solid var(--rule); }

  .compare-divider {
    display: flex; align-items: center; justify-content: center;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px; font-weight: 600; color: var(--ink-muted);
    text-transform: uppercase; letter-spacing: 0.1em;
    border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule);
    padding: 28px 0;
  }

  .compare-table-section { margin-bottom: 48px; }
  .compare-table__hed { margin: 0 0 16px; font-size: 20px; letter-spacing: -0.02em; }
  .compare-table-wrap { overflow-x: auto; }
  .compare-table td:first-child { font-weight: 500; color: var(--ink-soft); }

  .compare-share-section { margin-bottom: 32px; padding: 20px 0; border-top: 1px solid var(--rule); }
  .compare-share__hed { margin: 0 0 6px; font-size: 16px; }
  .compare-share__lede { margin: 0 0 14px; font-size: 13px; color: var(--ink-muted); }
  .compare-share__actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .compare-share__url {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px; color: var(--ink-soft);
    background: var(--rule-soft); padding: 6px 10px; border-radius: 2px;
  }
  .compare-more-section { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 60px; }

  @media (max-width: 720px) {
    .compare-grid { grid-template-columns: 1fr; }
    .compare-divider { padding: 12px 0; }
  }
`;

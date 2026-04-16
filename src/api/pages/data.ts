import type { PublishedSnapshot } from "../../domain/snapshot-schema.js";
import { escapeHtml } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";
import type { PublicPageContext } from "../public-state.js";
import { renderSectionHead, renderStatTile } from "../design/ui.js";
import { formatDate } from "../home/view-model.js";

/**
 * /data — machine-readable access. Lists the CSV downloads that mirror what's
 * on the public site, plus a reminder that raw capture bundles stay private.
 * This is where reporters, researchers, and civic orgs land when they want
 * the rows behind the homepage.
 */
export function renderDataPage(snapshot: PublishedSnapshot, context: PublicPageContext): string {
  const body = `
    ${renderSectionHead({
      eyebrow: "CSV AND API",
      headline: "Download exactly what the public site is showing.",
      lede:
        "Use these downloads when you need the exact rows behind the public site. They stay pinned to the active publication until a newer run is reviewed and published.",
      isHero: true,
    })}

    <section class="stat-grid">
      ${renderStatTile({
        label: "District rows",
        value: snapshot.districts.length.toString(),
        note: `One row per district in the active ${snapshot.snapshot.stateName} publication.`,
      })}
      ${renderStatTile({
        label: "CSV/API parity",
        value: "Aligned",
        note: "The statewide CSV mirrors the same fields exposed by the JSON endpoints.",
      })}
      ${renderStatTile({
        label: "Source snapshot",
        value: formatDate(snapshot.snapshot.sourceSnapshotAt),
        note: "Every download carries this date and the methodology version so a citation stays valid.",
      })}
      ${renderStatTile({
        label: "Publish boundary",
        value: "Published only",
        tone: "accent",
        note: "If a newer run is incomplete, the downloads remain pinned to the last safe publication.",
      })}
    </section>

    <section class="downloads">
      ${renderSectionHead({
        headline: "Available files",
        lede:
          "District-specific history CSVs are linked from each district's permalink page so every download is one click from its narrative context.",
      })}
      <div class="card-grid card-grid--2">
        <article class="card download">
          <div class="download__meta">
            <span class="download__kind">CSV</span>
            <code class="download__path">${escapeHtml(context.routes.districtsCsv)}</code>
          </div>
          <h3>Statewide district table</h3>
          <p>One row per district with rank, pending cases, cases cleared per 100 filed, typical wait, file-clear gap, and flag reason. Includes the source snapshot date, methodology version, freshness, and source attribution as columns so the download is self-describing.</p>
          <p class="download__cta"><a class="btn btn--primary btn--small" href="${context.routes.districtsCsv}">Download CSV</a></p>
        </article>
        <article class="card download">
          <div class="download__meta">
            <span class="download__kind">JSON</span>
            <code class="download__path">${escapeHtml(context.routes.statsApi)}</code>
          </div>
          <h3>Public JSON endpoints</h3>
          <p>Three endpoints cover statewide stats, district rows, and the statewide trend series. Same fields as the CSV, fetched as machine-readable JSON for dashboards, notebooks, or downstream tooling.</p>
          <p class="download__cta"><a class="btn btn--ghost btn--small" href="${context.routes.api}">See API reference</a></p>
        </article>
      </div>
    </section>

    <section class="data__boundary">
      ${renderSectionHead({ headline: "What these files contain, and what they don't" })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>What is in the CSV</h3>
          <p>Normalized snapshot fields only: the same numbers, labels, and flag reasons that appear on the public pages.</p>
          <p>Each row references the source snapshot date and methodology version so a published number is always citeable.</p>
        </article>
        <article class="card">
          <h3>What is not in the CSV</h3>
          <p>Raw capture bundles and operator evidence artifacts stay outside the public download boundary. Those belong to the review trail, not to the reader product.</p>
          <p>For formula details, see the methodology page. For narrative context, start from a district's permalink.</p>
        </article>
      </div>
    </section>
  `;

  return renderPageShell({
    title: "Data — NyaayWatch",
    body,
    activeNav: "data",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    stateLinks: context.stateLinks,
    ticker: `${escapeHtml(snapshot.snapshot.stateName.toUpperCase())} · UPDATED ${escapeHtml(formatDate(snapshot.snapshot.sourceSnapshotAt))}`,
    pageCss: DATA_PAGE_CSS,
    footer: {
      sourceDateLabel: formatDate(snapshot.snapshot.sourceSnapshotAt),
      methodologyVersion: snapshot.snapshot.methodologyVersion,
      sourceAttribution: snapshot.snapshot.sourceAttribution,
    },
  });
}

const DATA_PAGE_CSS = `
  .downloads { margin-bottom: 72px; }
  .download { display: flex; flex-direction: column; gap: 14px; }
  .download__meta { display: flex; align-items: center; gap: 10px; }
  .download__kind {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 3px 9px 4px;
    background: var(--ink); color: var(--paper);
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.14em; border-radius: 2px;
  }
  .download__path { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 13px; background: transparent; padding: 0; color: var(--ink-soft); }
  .download__cta { margin-top: auto; padding-top: 4px; }
  .data__boundary { margin-bottom: 72px; }
`;

import type { PublishedSnapshot } from "../../domain/snapshot-schema.js";
import { escapeHtml } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";
import type { PublicPageContext } from "../public-state.js";
import { renderSectionHead, renderStatTile } from "../design/ui.js";
import { formatDate } from "../home/view-model.js";

/**
 * /data — CSV and JSON access to the lower-court figures on the public site.
 */
export function renderDataPage(snapshot: PublishedSnapshot, context: PublicPageContext): string {
  const aggregateAdjective = context.lowerCourtCopy.aggregateAdjective;
  const aggregateAdjectiveTitle = context.lowerCourtCopy.aggregateAdjectiveTitle;
  const body = `
    ${renderSectionHead({
      eyebrow: "DATA AND DOWNLOADS",
      headline: "Download court data and published snapshots.",
      lede:
        "These downloads match the figures on this page. Current files update when new figures are approved; the archive includes the current and earlier published snapshots.",
      isHero: true,
    })}

    <section class="stat-grid">
      ${renderStatTile({
        label: "District rows",
        value: snapshot.districts.length.toString(),
        note: "One row for each district in this file.",
      })}
      ${renderStatTile({
        label: "Formats",
        value: "CSV + JSON",
        note: "Download the district table as CSV or use the JSON API.",
      })}
      ${renderStatTile({
        label: "Data date",
        value: formatDate(snapshot.snapshot.referenceDateAt),
        note: "This is the source date, or the date the page was captured if no source date was available.",
      })}
      ${renderStatTile({
        label: "Data status",
        value: "Published",
        tone: "accent",
        note: "These files match the current public figures.",
      })}
    </section>

    <section class="downloads">
      ${renderSectionHead({
        headline: "Files and API",
        lede: "District history CSVs are linked from each district page.",
      })}
      <div class="card-grid card-grid--3">
        <article class="card download">
          <div class="download__meta">
            <span class="download__kind">CSV</span>
            <code class="download__path">${escapeHtml(context.routes.districtsCsv)}</code>
          </div>
          <h3>${aggregateAdjectiveTitle} district table</h3>
          <p>One row per district, with pending cases, cases filed and cleared last month, cases cleared per 100 filed, estimated wait, old-case share, backlog change, and flags. Each row includes the data date, method version, freshness and source.</p>
          <p class="download__cta"><a class="btn btn--primary btn--small" href="${context.routes.districtsCsv}">Download CSV</a></p>
        </article>
        <article class="card download">
          <div class="download__meta">
            <span class="download__kind">JSON</span>
            <code class="download__path">${escapeHtml(context.routes.statsApi)}</code>
          </div>
          <h3>JSON API</h3>
          <p>Use the JSON endpoints to get ${aggregateAdjective} stats, district rows and trends in scripts or notebooks. They use the same figures as the CSV.</p>
          <p class="download__cta"><a class="btn btn--ghost btn--small" href="${context.routes.api}">See API reference</a></p>
        </article>
        <article class="card download">
          <div class="download__meta">
            <span class="download__kind">PACK</span>
            <code class="download__path">${escapeHtml(context.routes.stateEvidencePack)}</code>
          </div>
          <h3>Evidence packs</h3>
          <p>State and district JSON packs include the figures, data and source dates, method version, caveats and links. Each district page links to its evidence pack.</p>
          <p class="download__cta"><a class="btn btn--ghost btn--small" href="${context.routes.stateEvidencePack}">Open state pack</a></p>
        </article>
      </div>
    </section>

    <section class="data__boundary">
      ${renderSectionHead({ headline: "What the downloads include" })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>Included</h3>
          <p>Normalized figures and flags shown on the site, with the data date and method version.</p>
        </article>
        <article class="card">
          <h3>Not included</h3>
          <p>Raw NJDG page captures and internal operator files are not available for download. See the Methodology page for how we calculate the figures.</p>
        </article>
      </div>
    </section>

    <section class="data__archive">
      ${renderSectionHead({
        headline: "Published snapshots",
        lede: "Each archive entry includes its data date, publish date, method version and quality status.",
      })}
      <article class="card download">
        <div class="download__meta"><span class="download__kind">JSON</span><code class="download__path">${escapeHtml(context.routes.archiveApi)}?limit=20&amp;offset=0</code></div>
        <h3>Snapshot archive</h3>
        <p>Each record is a published snapshot. Republishing the same source reading can add another record. Raw page captures and unpublished data are not included.</p>
        <p class="download__cta"><a class="btn btn--primary btn--small" href="${context.routes.archiveApi}?limit=20&amp;offset=0">Open archive JSON</a></p>
      </article>
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
    ticker: `${escapeHtml(snapshot.snapshot.stateName.toUpperCase())} · UPDATED ${escapeHtml(formatDate(snapshot.snapshot.referenceDateAt))}`,
    pageCss: DATA_PAGE_CSS,
    footer: {
      sourceDateLabel: formatDate(snapshot.snapshot.referenceDateAt),
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
  .data__boundary, .data__archive { margin-bottom: 72px; }
`;

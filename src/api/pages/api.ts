import { renderPageShell } from "../design/shell.js";
import type { PublicPageContext } from "../public-state.js";
import { renderSectionHead } from "../design/ui.js";

/**
 * /api — developer reference for the three public JSON endpoints. No snapshot
 * required; the page is static narrative + route documentation. The CSV
 * downloads are linked from /data rather than duplicated here.
 */
export function renderApiPage(context: PublicPageContext): string {
  const body = `
    ${renderSectionHead({
      eyebrow: "DEVELOPER ACCESS",
      headline: "The API matches the latest published snapshot.",
      lede:
        "If a number is public on the site, you can fetch it here. If it has not been published yet, the API does not expose it.",
      isHero: true,
    })}

    <section class="endpoints">
      ${renderSectionHead({ headline: "Public routes available today" })}
      <div class="card-grid card-grid--1">
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <code class="endpoint__path">${context.routes.statsApi}</code>
          <p>Statewide backlog, disposal pace, wait estimate, and watchlist count for the active publication.</p>
        </article>
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <code class="endpoint__path">${context.routes.districtsApi}</code>
          <p>District-level rows with rankings, queue size, disposal pace, wait estimate, and flag explanations.</p>
        </article>
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <code class="endpoint__path">${context.routes.trendsApi}</code>
          <p>Published snapshot history for the statewide trend surface.</p>
        </article>
      </div>
    </section>

    <section class="endpoints__notes">
      ${renderSectionHead({ headline: "What the API guarantees" })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>CSV parity</h3>
          <p>The <code>/data</code> downloads stay aligned with the same published read model, so the CSV columns and the JSON fields mean the same thing.</p>
        </article>
        <article class="card">
          <h3>Published only</h3>
          <p>The API never exposes fresher unpublished state than the public pages themselves. Operator captures in review stay private.</p>
        </article>
      </div>
    </section>
  `;

  return renderPageShell({
    title: "API — NyaayWatch",
    body,
    activeNav: "api",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    stateLinks: context.stateLinks,
    pageCss: API_PAGE_CSS,
    footer: {
      sourceDateLabel: null,
      methodologyVersion: null,
      sourceAttribution: null,
    },
  });
}

const API_PAGE_CSS = `
  .card-grid--1 { grid-template-columns: 1fr; }
  .endpoints { margin-bottom: 72px; }
  .endpoint { display: grid; grid-template-columns: 64px 1fr; gap: 18px 24px; align-items: baseline; }
  .endpoint p { grid-column: 2; margin: 0; }
  .endpoint__verb {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 4px 8px;
    background: var(--ink); color: var(--paper);
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.12em;
    border-radius: 2px;
    grid-row: 1;
  }
  .endpoint__path {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 16px; font-weight: 600;
    color: var(--ink);
    background: transparent;
    padding: 0;
    grid-row: 1;
  }
  @media (max-width: 720px) {
    .endpoint { grid-template-columns: 1fr; gap: 8px; }
    .endpoint p { grid-column: 1; }
    .endpoint__verb { justify-self: start; }
  }
`;

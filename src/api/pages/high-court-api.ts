import { renderPageShell } from "../design/shell.js";
import { renderSectionHead } from "../design/ui.js";
import type { PublicHighCourtPageContext } from "../public-high-court.js";

export function renderHighCourtApiPage(context: PublicHighCourtPageContext): string {
  const body = `
    ${renderSectionHead({
      eyebrow: "HIGH COURT API",
      headline: "The public High Court API matches the latest published High Court snapshot.",
      lede:
        "If a public High Court beta page shows a number, the published JSON can expose it. If it is still in operator review, it stays private.",
      isHero: true,
    })}

    <section class="endpoints">
      ${renderSectionHead({ headline: "Routes available in this beta" })}
      <div class="card-grid card-grid--1">
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <code class="endpoint__path">${context.routes.statsApi}</code>
          <p>High Court metadata plus aggregate pending, institution, and disposal fields for the active publication.</p>
        </article>
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <code class="endpoint__path">${context.routes.trendsApi}</code>
          <p>Published High Court trend points only. No unpublished operator runs leak through this surface.</p>
        </article>
      </div>
    </section>

    <section class="endpoints__notes">
      ${renderSectionHead({ headline: "What this API guarantees" })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>Published only</h3>
          <p>The API stays pinned to the active published High Court snapshot. Newer internal fetches remain private until a publish succeeds.</p>
        </article>
        <article class="card">
          <h3>Tier-aware semantics</h3>
          <p>This beta is High Court-specific. It does not reuse district-only fields or imply cross-tier ranking comparability.</p>
        </article>
      </div>
    </section>
  `;

  return renderPageShell({
    title: "High Court API — NyaayWatch",
    body,
    activeNav: "api",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    stateLinks: context.highCourtLinks,
    pageCss: HIGH_COURT_API_CSS,
    footer: {
      sourceDateLabel: null,
      methodologyVersion: null,
      sourceAttribution: null,
    },
  });
}

const HIGH_COURT_API_CSS = `
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

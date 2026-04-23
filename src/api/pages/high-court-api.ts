import { renderPageShell } from "../design/shell.js";
import { renderSectionHead } from "../design/ui.js";
import type { PublicHighCourtPageContext } from "../public-high-court.js";

export function renderHighCourtApiPage(context: PublicHighCourtPageContext): string {
  const body = `
    ${renderSectionHead({
      eyebrow: "HIGH COURT API",
      headline: `${context.profile.courtName} — API reference`,
      lede:
        `The API matches the latest published snapshot for ${context.profile.courtName} (${context.coverageLabel}). If the public page shows a number, the JSON can expose it; if it is still in operator review, it stays private.`,
      isHero: true,
      variant: "compact",
    })}

    <section class="endpoints">
      ${renderSectionHead({ headline: "Routes available on this page" })}
      <div class="card-grid card-grid--1">
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <code class="endpoint__path">${context.routes.statsApi}</code>
          <p>High Court metadata plus <code>coveredGeographies[]</code> and aggregate pending, institution, and disposal fields for the active publication.</p>
        </article>
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <code class="endpoint__path">${context.routes.trendsApi}</code>
          <p>Published High Court trend points only. They stay court-wide rather than geography-split, and no unpublished operator runs leak through this surface.</p>
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
          <p>This API is High Court-specific. A High Court page is not the same scope as a lower-court state page, so the API does not reuse district-only fields or imply cross-tier ranking comparability.</p>
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
    footer: {
      sourceDateLabel: null,
      methodologyVersion: null,
      sourceAttribution: null,
    },
  });
}

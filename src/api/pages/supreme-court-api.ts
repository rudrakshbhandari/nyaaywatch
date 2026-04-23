import { renderPageShell } from "../design/shell.js";
import { renderSectionHead } from "../design/ui.js";
import type { PublicSupremeCourtPageContext } from "../public-supreme-court.js";

export function renderSupremeCourtApiPage(context: PublicSupremeCourtPageContext): string {
  const body = `
    ${renderSectionHead({
      eyebrow: "SUPREME COURT API",
      headline: "Supreme Court API reference",
      lede:
        "The API matches the latest published Supreme Court snapshot. If the public page shows a number, the JSON can expose it; if it is still in operator review, it stays private.",
      isHero: true,
      variant: "compact",
    })}

    <section class="endpoints">
      ${renderSectionHead({ headline: "Routes available on this page" })}
      <div class="card-grid card-grid--1">
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <code class="endpoint__path">${context.routes.statsApi}</code>
          <p>Supreme Court metadata plus aggregate registered, unregistered, civil, criminal, institution, and disposal fields for the active publication.</p>
        </article>
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <code class="endpoint__path">${context.routes.trendsApi}</code>
          <p>Published trend points only. No unpublished operator runs leak through this surface.</p>
        </article>
      </div>
    </section>

    <section class="endpoints__notes">
      ${renderSectionHead({ headline: "What this API guarantees" })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>Published only</h3>
          <p>The API stays pinned to the active published Supreme Court snapshot. Newer internal fetches remain private until a publish succeeds.</p>
        </article>
        <article class="card">
          <h3>Tier-aware semantics</h3>
          <p>This API is Supreme Court-specific. It does not pretend to be a national all-courts leaderboard or a cross-tier ranking framework.</p>
        </article>
      </div>
    </section>
  `;

  return renderPageShell({
    title: "Supreme Court API — NyaayWatch",
    body,
    activeNav: "api",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    footer: {
      sourceDateLabel: null,
      methodologyVersion: null,
      sourceAttribution: null,
    },
  });
}

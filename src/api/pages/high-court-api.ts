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
          <details class="code-sample-reveal">
            <summary>Sample response</summary>
            <pre class="code-sample">{
  "snapshot": {
    "courtTier": "high_court",
    "courtCode": "HPH",
    "courtSlug": "himachal",
    "courtName": "High Court of Himachal Pradesh",
    "coveredGeographies": [
      { "geographyCode": "HP", "geographyName": "Himachal Pradesh", "geographyType": "state" }
    ],
    "referenceDateAt": "2025-03-15T00:00:00.000Z",
    "referenceDateKind": "source_snapshot_at",
    "publishedAt": "2025-03-21T09:10:00.000Z",
    "methodologyVersion": "v1.3.0",
    "qualityState": "complete"
  },
  "stats": {
    "pendingCivilCases": 48930,
    "pendingCriminalCases": 27240,
    "pendingTotalCases": 76170,
    "institutedLastMonthCivilCases": 920,
    "institutedLastMonthCriminalCases": 900,
    "institutedLastMonthTotalCases": 1820,
    "disposedLastMonthCivilCases": 830,
    "disposedLastMonthCriminalCases": 820,
    "disposedLastMonthTotalCases": 1650
  },
  "ageBuckets": {
    "lessThanOneYear": 12400,
    "oneToThreeYears": 18600,
    "threeToFiveYears": 14200,
    "fiveToTenYears": 19800,
    "aboveTenYears": 11170
  },
  "trends": [
    { "referenceDateAt": "2025-01-15T00:00:00.000Z", "referenceDateKind": "source_snapshot_at", "pendingTotalCases": 74310, "institutedLastMonthTotalCases": 1760, "disposedLastMonthTotalCases": 1690 },
    // \u2026 one point per published snapshot
  ]
}</pre>
          </details>
        </article>
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <code class="endpoint__path">${context.routes.trendsApi}</code>
          <p>Published High Court trend points only. They stay court-wide rather than geography-split, and no unpublished operator runs leak through this surface.</p>
          <details class="code-sample-reveal">
            <summary>Sample response</summary>
            <pre class="code-sample">{
  "trends": [
    {
      "referenceDateAt": "2025-01-15T00:00:00.000Z",
      "referenceDateKind": "source_snapshot_at",
      "pendingTotalCases": 74310,
      "institutedLastMonthTotalCases": 1760,
      "disposedLastMonthTotalCases": 1690
    },
    {
      "referenceDateAt": "2025-03-15T00:00:00.000Z",
      "referenceDateKind": "source_snapshot_at",
      "pendingTotalCases": 76170,
      "institutedLastMonthTotalCases": 1820,
      "disposedLastMonthTotalCases": 1650
    }
  ]
}</pre>
          </details>
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

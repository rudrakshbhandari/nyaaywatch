import { renderPageShell } from "../design/shell.js";
import { renderSectionHead } from "../design/ui.js";
import type { PublicHighCourtPageContext } from "../public-high-court.js";

export function renderHighCourtApiPage(context: PublicHighCourtPageContext): string {
  const body = `
    ${renderSectionHead({
      eyebrow: "HIGH COURT API",
      headline: `${context.profile.courtName} — API reference`,
      lede:
        `The API returns the figures shown on the ${context.profile.courtName} page for ${context.coverageLabel}.`,
      isHero: true,
      variant: "compact",
    })}

    <section class="endpoints">
      ${renderSectionHead({ headline: "Routes available on this page" })}
      <div class="card-grid card-grid--1">
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <code class="endpoint__path">${context.routes.statsApi}</code>
          <p>Court details, <code>coveredGeographies[]</code>, pending cases, and monthly cases filed and cleared.</p>
          <details class="code-sample-reveal">
            <summary>Sample response</summary>
            <pre class="code-sample">{
  "snapshot": {
    "courtTier": "high_court",
    "courtCode": "HPHC",
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
    { "referenceDateAt": "2025-02-15T00:00:00.000Z", "referenceDateKind": "source_snapshot_at", "pendingTotalCases": 76170, "institutedLastMonthTotalCases": 1820, "disposedLastMonthTotalCases": 1650 }
  ]
}</pre>
          </details>
        </article>
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <code class="endpoint__path">${context.routes.trendsApi}</code>
          <p>Court-wide trends for pending cases and cases filed or cleared last month. Trends are not split by geography.</p>
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
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <code class="endpoint__path">${context.routes.archiveApi}?limit=20&amp;offset=0</code>
          <p>Earlier snapshots for this High Court. Each record contains the full data shown for that date. Set <code>limit</code> from 1 to 100 and use <code>offset</code> to fetch more records.</p>
        </article>
      </div>
    </section>

    <section class="endpoints__notes">
      ${renderSectionHead({ headline: "What this API guarantees" })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>Current public data</h3>
          <p>The API returns figures shown on the High Court page. Data under review is not included.</p>
        </article>
        <article class="card">
          <h3>Separate court tiers</h3>
          <p>High Court pages report one High Court. Lower-court pages report state or Union Territory totals and district figures. Their measures are not directly comparable.</p>
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

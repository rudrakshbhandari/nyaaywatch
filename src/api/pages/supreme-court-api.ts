import { renderPageShell } from "../design/shell.js";
import { renderSectionHead } from "../design/ui.js";
import type { PublicSupremeCourtPageContext } from "../public-supreme-court.js";

export function renderSupremeCourtApiPage(context: PublicSupremeCourtPageContext): string {
  const body = `
    ${renderSectionHead({
      eyebrow: "SUPREME COURT API",
      headline: "Supreme Court API reference",
      lede:
        "The API returns the figures shown on the Supreme Court page.",
      isHero: true,
      variant: "compact",
    })}

    <section class="endpoints">
      ${renderSectionHead({ headline: "Routes available on this page" })}
      <div class="card-grid card-grid--1">
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <code class="endpoint__path">${context.routes.statsApi}</code>
          <p>Supreme Court totals for registered and unregistered cases, pending cases, and cases filed or cleared.</p>
          <details class="code-sample-reveal">
            <summary>Sample response</summary>
            <pre class="code-sample">{
  "snapshot": {
    "courtTier": "supreme_court",
    "courtCode": "SCI",
    "courtSlug": "supreme-court",
    "courtName": "Supreme Court of India",
    "referenceDateAt": "2025-03-01T00:00:00.000Z",
    "referenceDateKind": "captured_at",
    "publishedAt": "2025-03-12T14:22:00.000Z",
    "methodologyVersion": "v1.3.0",
    "qualityState": "complete"
  },
  "stats": {
    "pendingCivilRegisteredCases": 40120,
    "pendingCivilUnregisteredCases": 3410,
    "pendingCivilTotalCases": 43530,
    "pendingCriminalRegisteredCases": 33121,
    "pendingCriminalUnregisteredCases": 3480,
    "pendingCriminalTotalCases": 36601,
    "pendingRegisteredCases": 73241,
    "pendingUnregisteredCases": 6890,
    "pendingTotalCases": 80131,
    "institutedLastMonthTotalCases": 3240,
    "disposedLastMonthTotalCases": 3108,
    "institutedCurrentYearTotalCases": 9720,
    "disposedCurrentYearTotalCases": 9324
  },
  "trends": [
    { "referenceDateAt": "2025-01-01T00:00:00.000Z", "referenceDateKind": "captured_at", "pendingTotalCases": 78440, "institutedLastMonthTotalCases": 3180, "disposedLastMonthTotalCases": 3090 },
    { "referenceDateAt": "2025-02-01T00:00:00.000Z", "referenceDateKind": "captured_at", "pendingTotalCases": 80131, "institutedLastMonthTotalCases": 3240, "disposedLastMonthTotalCases": 3108 }
  ]
}</pre>
          </details>
        </article>
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <code class="endpoint__path">${context.routes.trendsApi}</code>
          <p>Trend points show pending cases and cases filed or cleared last month.</p>
          <details class="code-sample-reveal">
            <summary>Sample response</summary>
            <pre class="code-sample">{
  "trends": [
    {
      "referenceDateAt": "2025-01-01T00:00:00.000Z",
      "referenceDateKind": "captured_at",
      "pendingTotalCases": 78440,
      "institutedLastMonthTotalCases": 3180,
      "disposedLastMonthTotalCases": 3090
    },
    {
      "referenceDateAt": "2025-03-01T00:00:00.000Z",
      "referenceDateKind": "captured_at",
      "pendingTotalCases": 80131,
      "institutedLastMonthTotalCases": 3240,
      "disposedLastMonthTotalCases": 3108
    }
  ]
}</pre>
          </details>
        </article>
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <code class="endpoint__path">${context.routes.archiveApi}?limit=20&amp;offset=0</code>
          <p>Published Supreme Court-wide snapshots, including the current snapshot. Each record contains aggregate data for that date; there are no district-level rows. Set <code>limit</code> from 1 to 100 and use <code>offset</code> to fetch more records.</p>
        </article>
      </div>
    </section>

    <section class="endpoints__notes">
      ${renderSectionHead({ headline: "What this API guarantees" })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>Current public data</h3>
          <p>The API returns figures shown on the Supreme Court page. Data under review is not included.</p>
        </article>
        <article class="card">
          <h3>Supreme Court totals</h3>
          <p>These records contain court-wide totals. The API has no district-level data.</p>
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

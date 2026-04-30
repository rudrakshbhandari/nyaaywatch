import { renderPageShell } from "../design/shell.js";
import type { PublicPageContext } from "../public-state.js";
import { renderSectionHead } from "../design/ui.js";

/**
 * /api — developer reference for the three public JSON endpoints. No snapshot
 * required; the page is static narrative + route documentation. The CSV
 * downloads are linked from /data rather than duplicated here.
 */
export function renderApiPage(context: PublicPageContext): string {
  const aggregateAdjective = context.lowerCourtCopy.aggregateAdjective;
  const body = `
    ${renderSectionHead({
      eyebrow: "DEVELOPER ACCESS",
      headline: "API reference",
      lede:
        "The API matches what's currently on the public site. If a number is public on the site, you can fetch it here; if it hasn't been published yet, the API doesn't expose it.",
      isHero: true,
      variant: "compact",
    })}

    <section class="endpoints">
      ${renderSectionHead({ headline: "Public routes available today" })}
      <div class="card-grid card-grid--1">
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <code class="endpoint__path">${context.routes.statsApi}</code>
          <p>${context.lowerCourtCopy.aggregateAdjectiveTitle} backlog, disposal pace, wait estimate, and count of districts to watch for the active publication.</p>
          <details class="code-sample-reveal">
            <summary>Sample response</summary>
            <pre class="code-sample">{
  "snapshot": {
    "stateCode": "HP",
    "stateName": "Himachal Pradesh",
    "sourceSnapshotAt": "2025-03-15T00:00:00.000Z",
    "publishedAt": "2025-03-20T11:42:00.000Z",
    "methodologyVersion": "v1.3.0",
    "qualityState": "complete",
    "freshnessDays": 5,
    "sourceAttribution": "NJDG \u2014 March 2025"
  },
  "stats": {
    "pendingCases": 94158,
    "filedLastMonthCases": 10420,
    "clearedLastMonthCases": 9820,
    "disposalRate": 74.3,
    "medianCaseAgeDays": 847,
    "flaggedDistricts": 9,
    "oldCaseBurden": {
      "fivePlusYearsCases": 18430,
      "fivePlusYearsShare": 19.6
    },
    "backlogMovementShare": 0.6,
    "breakEvenClearancesNeeded": 600,
    "catchUpClearancesPerMonth": 1385,
    "backlogConcentration": {
      "topFiveDistrictsShare": 57.8
    }
  },
  "trends": [
    { "snapshotDate": "2025-01-15T00:00:00.000Z", "pendingCases": 91240, "filedLastMonthCases": 10120, "clearedLastMonthCases": 9460, "disposalRate": 71.8 },
    { "snapshotDate": "2025-02-15T00:00:00.000Z", "pendingCases": 94158, "filedLastMonthCases": 10420, "clearedLastMonthCases": 9820, "disposalRate": 74.3 }
  ]
}</pre>
          </details>
        </article>
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <code class="endpoint__path">${context.routes.districtsApi}</code>
          <p>District-level rows with rankings, queue size, disposal pace, wait estimate, and flag explanations.</p>
          <details class="code-sample-reveal">
            <summary>Sample response</summary>
            <pre class="code-sample">{
  "districts": [
    {
      "districtId": "kangra",
      "districtName": "Kangra",
      "rank": 1,
      "backlogCases": 12453,
      "filedLastMonthCases": 1520,
      "clearedLastMonthCases": 1360,
      "disposalRate": 68.2,
      "medianAgeDays": 912,
      "filingVsDisposalGap": 8.4,
      "oldCaseBurden": {
        "fivePlusYearsCases": 3210,
        "fivePlusYearsShare": 25.8
      },
      "backlogMovementShare": 1.3,
      "breakEvenClearancesNeeded": 160,
      "watchlistPersistence": {
        "flaggedInLastSix": 5,
        "lastSixWindow": 6
      },
      "flagReason": "High file-clear gap with growing backlog.",
      "summary": "Kangra shows a widening backlog \u2026"
    },
    {
      "districtId": "shimla",
      "districtName": "Shimla",
      "rank": 2,
      "backlogCases": 10421,
      "filedLastMonthCases": 1210,
      "clearedLastMonthCases": 1240,
      "disposalRate": 71.5,
      "medianAgeDays": 874,
      "filingVsDisposalGap": 5.9,
      "oldCaseBurden": {
        "fivePlusYearsCases": 2240,
        "fivePlusYearsShare": 21.5
      },
      "backlogMovementShare": -0.3,
      "breakEvenClearancesNeeded": 0,
      "watchlistPersistence": {
        "flaggedInLastSix": 3,
        "lastSixWindow": 6
      },
      "flagReason": "Backlog remains above the state median.",
      "summary": "Shimla remains a high-volume district in this snapshot."
    }
  ]
}</pre>
          </details>
        </article>
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <code class="endpoint__path">${context.routes.trendsApi}</code>
          <p>Published snapshot history for the ${aggregateAdjective} trend surface.</p>
          <details class="code-sample-reveal">
            <summary>Sample response</summary>
            <pre class="code-sample">{
  "trends": [
    { "snapshotDate": "2025-01-15T00:00:00.000Z", "pendingCases": 91240, "filedLastMonthCases": 10120, "clearedLastMonthCases": 9460, "disposalRate": 71.8 },
    { "snapshotDate": "2025-03-15T00:00:00.000Z", "pendingCases": 94158, "filedLastMonthCases": 10420, "clearedLastMonthCases": 9820, "disposalRate": 74.3 }
  ]
}</pre>
          </details>
        </article>
        <article class="card endpoint">
          <code class="endpoint__verb">GET</code>
          <div class="endpoint__routes">
            <code class="endpoint__path">${context.routes.stateEvidencePack}</code>
            <code class="endpoint__path">${context.routes.districtEvidencePack(":districtId")}</code>
          </div>
          <p>Evidence packs for citation and reuse. They bundle public metrics with source date, methodology version, CSV/API links, plain citation text, caveats, and the public-data safety boundary.</p>
          <details class="code-sample-reveal">
            <summary>Sample response</summary>
            <pre class="code-sample">{
  "packType": "district_evidence_pack",
  "version": "lower-court-evidence-pack.v1",
  "district": {
    "id": "kangra",
    "name": "Kangra",
    "pageUrl": "https://nyaaywatch.in/districts/kangra",
    "evidencePackUrl": "https://nyaaywatch.in/data/evidence/districts/kangra.json"
  },
  "snapshot": {
    "sourceSnapshotAt": "2025-03-15T00:00:00.000Z",
    "methodologyVersion": "v1.3.0",
    "sourceAttribution": "NJDG \u2014 March 2025"
  },
  "metrics": {
    "backlogCases": 12453,
    "clearedPer100Filed": 68.2,
    "typicalWaitMonths": 30
  },
  "safety": {
    "containsRawCaptureArtifacts": false,
    "containsOperatorOnlyEvidence": false
  }
}</pre>
          </details>
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
          <p>The API never exposes fresher unpublished data than the public pages themselves. Operator captures in review stay private.</p>
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
    footer: {
      sourceDateLabel: null,
      methodologyVersion: null,
      sourceAttribution: null,
    },
  });
}

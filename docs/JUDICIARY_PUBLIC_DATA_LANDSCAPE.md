# Indian Judiciary Public Data Landscape

Research note for NyaayWatch on what judiciary data is publicly available today, what those sources can support, and where the current public-data ceiling sits.

This document is intentionally source-linked and evidence-first. It is meant to anchor product, methodology, and scope decisions in public availability rather than aspiration.

## Why This Exists

NyaayWatch now covers the Indian court hierarchy at the aggregate observability layer, but the public data surface across the judiciary is still uneven:

- district and subordinate court aggregates are relatively strong
- High Court aggregates are public, but not identical in shape to district data
- Supreme Court public data now exists on NJDG, but with its own interface and coverage pattern
- digitization is materially incomplete, and "computerized" is not the same as "digitized" or "structured"

This doc records the current operating reality so future implementation work does not drift into unsupported claims.

## Public Sources Available Today

### Cross-Tier Official Portals

- [eCourts Services](https://ecourts.gov.in/ecourts2.0/)
  Public hub linking district-court services, High Court services, NJDG, judgment search, eFiling, ePay, and Justice Clock.
- [Department of Justice eCourts Phase III page](https://www.doj.gov.in/phase-iii)
  Official program-level description of the current eCourts modernization direction.

### District And Subordinate Courts

- [District Court NJDG](https://njdg.ecourts.gov.in/njdg_v3/)
  Public dashboard for district and subordinate courts with pendency, institution, disposal, age buckets, and state/district drilldowns.
- [District Court Services](https://services.ecourts.gov.in/)
  Public case-status, cause-list, and order/judgment access for district courts.

### High Courts

- [High Court NJDG](https://njdg.ecourts.gov.in/hcnjdg_v2/)
  Public High Court dashboard with pendency and age-bucket views.
- [High Court Services](https://hcservices.ecourts.gov.in/)
  Public case-status, cause-list, and order/judgment access for High Courts.
- [Judgment Search](https://judgments.ecourts.gov.in/pdfsearch/index.php)
  Official search portal for judgments and final orders surfaced under the eCourts system.

### Supreme Court

- [Supreme Court Data Grid](https://scdg.sci.gov.in/)
  Public Supreme Court dashboard for institution, disposal, pendency, and related analytics.
- [Supreme Court onboarding to NJDG](https://www.sci.gov.in/onboarding-of-supreme-court-of-india-on-njdg/)
  Official Supreme Court announcement dated January 16, 2024 confirming all three tiers of the judiciary are now represented on NJDG-style data infrastructure.
- [Supreme Court of India website](https://www.sci.gov.in/)
  Official source for judgments, orders, listing notices, circulars, and court updates.
- [Supreme Court Reports search](https://scr.sci.gov.in/)
  Official searchable Supreme Court Reports interface for judgments/orders.

### Structured Official Datasets And Parliamentary Material

- [Court-wise number of pending cases dataset](https://www.data.gov.in/resource/court-wise-number-pending-cases-district-and-subordinate-courts-high-courts-and-supreme)
  Official OGD dataset for pending cases across district/subordinate courts, High Courts, and Supreme Court.
- [Pages digitized dataset](https://www.data.gov.in/resource/high-court-wise-total-number-pages-digitized-high-courts-and-total-number-pages-digitized)
  Official OGD resource for High Court-wise and District Court-wise page digitization, sourced from Rajya Sabha material.
- [Rajya Sabha reply on eCourts Phase III, 01 Aug 2024](https://www.doj.gov.in/static/uploads/2025/09/24190e293f572a9ed92f6725e938d073.pdf)
  Official source describing Phase III scope, including the digitization target for legacy records.
- [Rajya Sabha reply on eCourts Phase III implementation, 12 Dec 2024](https://www.doj.gov.in/static/uploads/2025/09/04d247ddf5a1a6df49e2e61b32b58f15.pdf)
  Official source stating cumulative page-digitization progress as of October 31, 2024.

## What These Sources Support Well

Publicly available data is strong enough for:

- snapshot-based observability of pendency, institution, and disposal
- age-bucket analysis of pending cases
- district-level comparison within a state
- High Court and Supreme Court contextual benchmarks
- public trust surfaces that show source, snapshot date, and methodology
- internally stored historical snapshots built by NyaayWatch over time, even when upstream portals are operational rather than archival

This supports NyaayWatch's current product posture: a dated, reproducible observability layer rather than a live search engine.

## What These Sources Do Not Support Reliably

Public availability today does not justify claiming:

- a stable, open, self-serve public API across all judiciary tiers
- a complete national case-level corpus in one consistent schema
- full bulk export of raw case records, orders, and judgments across all courts
- complete digitized access to the historical judicial record
- full parity between Supreme Court, High Court, and district-court data models
- predictive or near-real-time judicial monitoring

Operational implication:

- NyaayWatch should continue to treat upstream sources as scrapeable public interfaces and official datasets, not as a guaranteed public-platform contract.

## Digitization: What The Official Numbers Mean

The most important distinction is:

- `computerized courts` does not mean `historical records fully digitized`
- `digitized pages` does not mean `OCRed, structured, or bulk-downloadable records`

Official material supports the following:

- the Department of Justice reported that **18,735 courts had been computerized by 2023**
- eCourts Phase III describes a legacy-record digitization scope of **3,108 crore pages**
- a Rajya Sabha reply states that **4,06,48,37,964 pages** had been digitized in High Courts and District Courts **as on 31.10.2024**

That means the public official material supports an inference that roughly **13.1%** of the stated legacy-page scope had been digitized by October 31, 2024, leaving about **2,701.5 crore pages** still outside that count.

Important caveat:

- this percentage is an inference by comparing two official numbers from different official materials
- it should not be presented as an officially published completion rate unless the government itself states it that way

Also note:

- OGD publishes a newer digitization resource tied to **28.02.2025**
- before quoting any newer all-India total, NyaayWatch should re-verify the underlying file or table at the time of publication

## Current Public-Data Ceiling For NyaayWatch

### Credible Scope Today

Using only what is publicly available today, NyaayWatch can credibly maintain:

1. Supreme Court observability using SCDG and official Supreme Court surfaces.
2. High Court observability for all 25 HC NJDG selector-backed High Court profiles, with court-specific methodology caveats.
3. District and subordinate court observability for all 36 lower-court state and Union Territory selector geographies from NJDG-derived aggregate snapshots.
4. Tier-aware benchmark context using NJDG and OGD datasets, provided public UX stays explicit about source shape and comparison limits.
5. Link-outs to official case-status, cause-list, order, and judgment pages where NyaayWatch does not maintain its own normalized evidence model.

### Not Credible Yet

Based on public availability today, NyaayWatch should not position itself as:

- a complete Supreme-to-taluka case archive
- a full-text national judicial record warehouse
- a general-purpose case-search engine
- a complete document repository for all orders and judgments
- a product with guaranteed parity across every court tier and state

The public product can cover all tiers at the aggregate snapshot layer, but the realistic path beyond that remains:

1. aggregate observability first
2. source-by-source and metric-by-metric reproducible expansion second
3. deeper document and case-level enrichment only where public availability, terms, and data quality actually support it

## Recommended Product Stance

This research supports keeping the current product strategy intact, with a sharper statement of scope:

- alpha should stay India-first at the aggregate observability layer
- alpha should stay snapshot-based
- alpha should prefer aggregate observability over case-level breadth
- alpha should treat cross-tier comparisons carefully until comparable normalized evidence is in place
- expansion beyond aggregate observability should target evidence-backed depth before comprehensive record access

In plain terms:

- NyaayWatch covers the Supreme Court, High Courts, and the district/subordinate system at the published snapshot layer
- but the public-data-backed product is an evidence-backed observability product, not a full judicial-record platform

## Claim And Provenance Rules

Future product and doc work should preserve these rules:

- always store and display the source URL or source class behind a metric
- always preserve the snapshot date used for publication
- distinguish `computerized`, `digitized`, `OCRed`, and `structured`
- avoid calling dashboard values `live` or `real-time`
- avoid redistributing raw upstream artifacts until terms and redistribution posture are explicitly reviewed

## Implications For The Current Public Alpha

The research reinforces these repo decisions already in place:

- scraping aggregated NJDG views is the right alpha source boundary
- case-level parsing remains correctly out of scope
- provenance and snapshot semantics remain non-negotiable
- source-term and redistribution review remains a launch-critical item

What should change is documentation clarity:

- future contributors should have a clear source inventory
- the repo should stay explicit that cross-tier public coverage exists in asymmetrical forms
- the repo should be explicit that "all courts" means aggregate observability over published snapshots, not a full-record claim
- the repo should record a launch-specific public exposure policy for raw artifacts versus normalized published exports

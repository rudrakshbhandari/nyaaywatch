# TODOS

`docs/MVP_EXECUTION_PLAN.md` is the ordered path to the Himachal alpha MVP.

Use this file for:

- review backlog
- post-MVP follow-up work
- important items that are not yet part of the ordered execution path

## Review

### Source Terms And Redistribution Review

**What:** Define the rules for storing, exposing, and redistributing raw snapshots versus normalized exports.

**Why:** NyaayWatch is open source and source-aware; without an explicit redistribution posture, future data/export decisions can drift into legal or product ambiguity.

**Context:** The approved design keeps code, schemas, methodology, and API contracts open, but intentionally does not assume that raw upstream artifacts can be redistributed without constraints. Review NJDG/public-source terms, decide what evidence packs can bundle directly, and lock the citation/attribution rules for raw artifacts versus normalized outputs.

**Effort:** M
**Priority:** P1
**Depends on:** Reviewing upstream source terms and deciding how evidence packs cite or bundle source material

### Multi-State Expansion Readiness Gates

**What:** Define explicit readiness criteria for expanding beyond Himachal Pradesh.

**Why:** “Himachal first” only stays disciplined if expansion has measurable gates instead of happening because momentum or ambition makes it feel time.

**Context:** The approved design says wider Indian coverage should happen only after the trust model proves itself. Capture the concrete gates, likely scrape stability, publish safety, methodology maturity, API stability, anomaly credibility, and operational reliability, so future scope expansion does not bypass the reasoning that shaped this alpha.

**Effort:** M
**Priority:** P2
**Depends on:** Initial alpha implementation and some operating evidence

### Extract Alpha Design Foundation Into DESIGN.md

**What:** Move the alpha design foundation, token rules, and component vocabulary from `docs/NYAAYWATCH_DESIGN.md` into a dedicated `DESIGN.md`.

**Why:** The design review turned the plan into the current design-system source of truth. As implementation grows across more screens and eventually more states, contributors need one reusable foundation file instead of mining the product plan for typography, color, spacing, surface, and component rules.

**Context:** The repo currently has no standalone `DESIGN.md`. The plan now contains explicit UI foundations for the public dossier visual language, trust strips, quality badges, responsive rules, and accessibility expectations. Extracting those rules after the first implementation slice lands will keep the plan strategic and make the design system easier to evolve.

**Effort:** M
**Priority:** P2
**Depends on:** First implementation slice landing so the extracted design system reflects real component usage

### Extend QA Coverage For Responsive And Accessibility Trust Surfaces

**What:** Expand `docs/ENG_REVIEW_TEST_PLAN.md` to include responsive behavior, accessibility checks, and visual trust-surface QA for the public routes.

**Why:** The design review now specifies mobile district browsing behavior, accessibility baselines, trust strips, quality badges, caveats, and public-state behavior. If these are not reflected in the test plan, they are likely to be treated as optional polish during implementation.

**Context:** The current engineering test plan is strong on publish safety, API parity, and trust-critical data flows, but it does not yet explicitly test mobile list behavior for `/districts`, keyboard navigation, screen-reader-friendly heading structure, chart text alternatives, contrast, or freshness/quality-state presentation. Adding those checks will make the design requirements enforceable rather than aspirational.

**Effort:** M
**Priority:** P2
**Depends on:** Initial public UI implementation existing so the added checks can reference real routes and components

## Completed

### Narrow Alpha Vertical Slice

- published snapshot boundary with explicit published-run state
- operator API and CLI publish control
- homepage for latest published Himachal snapshot
- district evidence page
- `GET /v1/stats/himachal`
- regression coverage for publish safety, stale and empty states, and UI/API parity

### AWS-Backed Snapshot Store

- PostgreSQL-backed canonical run and publish state
- S3-backed raw artifact and replay input storage
- operator replay and rollback flows
- local Docker dev stack for PostgreSQL plus LocalStack S3
- automated migration, service, and route coverage for the storage slice

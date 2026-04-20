# High Court Multi-Jurisdiction Public Language Plan

Concrete plan for the public-methodology and route-language pass that follows the completed internal Punjab and Haryana pilot.

This document exists to answer one narrow question:

- what exactly should the repo say, where should it say it, and in what implementation order, before any multi-jurisdiction High Court can be considered for public beta?

This is not public rollout approval.

This is the copy, IA, and trust-surface plan that must exist first.

## Why This Exists

The repo has already finished the technical phase-1 work:

- High Court identity is court-first
- High Court payloads now carry explicit `coveredGeographies[]`
- Punjab and Haryana High Court has already cleared the live internal proof bar

The next blocker is public meaning, not operator capability.

If the repo opened a multi-jurisdiction High Court page today without a language pass, the product would still have three avoidable failures:

1. the public High Court switcher and summary copy still speak in a narrow single-court beta voice
2. the methodology page still explains High Court scope without describing multi-jurisdiction coverage explicitly
3. the homepage and High Court index still risk implying that every High Court maps neatly to one lower-court state shell

## Goal

Make the public High Court surface honest enough that one future multi-jurisdiction beta page can exist without implying fake one-state coverage.

Success means:

- every High Court page stays court-first
- covered geographies are visible anywhere page scope matters
- single-jurisdiction and multi-jurisdiction High Courts use one consistent copy contract
- the homepage and High Court index do not imply one-state equivalence
- methodology language clearly limits court-to-state comparisons

## Hard Rules

- Keep `/high-courts/:courtSlug` as the public route shape.
- Do not add fake state aliases such as `/high-courts/chandigarh` for one High Court page.
- Keep switcher labels as court names, not geography names.
- Do not describe a multi-jurisdiction High Court page as if it were a state page.
- Do not imply lower-court coverage exists for every covered geography just because the High Court spans them.

## Public Copy Contract

### 1. Court Name Is The Primary Identity

Primary label everywhere:

- `High Court of Punjab and Haryana`

Not:

- `Punjab and Haryana`
- `Punjab`
- `Haryana`
- `Chandigarh`

### 2. Coverage Must Be A Separate Visible Block

Every public High Court page should show a visible coverage block near the hero or headline metrics.

Recommended format:

- `Coverage`
- `Punjab, Haryana, and Chandigarh`

Single-jurisdiction courts should use the same pattern for consistency:

- `Coverage`
- `Gujarat`

### 3. Scope Sentence Must Be Court-First

Preferred summary pattern:

- `This page tracks the High Court of Punjab and Haryana across Punjab, Haryana, and Chandigarh.`

Preferred single-jurisdiction pattern:

- `This page tracks the High Court of Gujarat across Gujarat.`

Avoid:

- `This page covers Punjab.`
- `This page covers Haryana.`
- `Punjab and Haryana page`

### 4. Comparison Language Must Stay Narrow

Allowed:

- High Court trend over time for the same court
- High Court to High Court comparisons with caution

Not allowed without stronger methodology work:

- direct High Court to lower-court state equivalence
- language implying the High Court page is the same analytical unit as a state lower-court page

## Route-Surface Decisions

### High Court Overview Page

Primary files:

- `src/api/public-high-court.ts`
- `src/api/pages/high-court-overview.ts`

Required language changes:

- replace the current generic public-scope summary with court-first coverage wording
- add a visible coverage block near the headline metrics
- preserve the current trust metadata, reference-date label, and methodology version surfaces

### High Court Methodology Page

Primary file:

- `src/api/pages/high-court-methodology.ts`

Required language changes:

- replace the current scope paragraph with explicit court-first coverage language
- add a section that explains how covered geographies relate to the court page
- state clearly that lower-court public coverage may exist for some covered geographies and not others
- state clearly that High Court and lower-court state pages are different scopes

### High Court Index

Primary file:

- `src/api/pages/high-courts-index.ts`

Required language changes:

- keep the card title as the court name
- add a compact coverage line on every card
- revise the hero lede so the index no longer implies the High Court beta is a one-state list

### Homepage High Court Section

Primary file:

- `src/api/home/national-home.ts`

Required language changes:

- add compact coverage labels to High Court cards once the design can carry them without clutter
- make the High Court section copy describe courts, not state shells
- avoid suggesting the High Court cards map one-to-one onto the lower-court state cards elsewhere on the homepage

### High Court Data And API Pages

Primary files:

- `src/api/pages/high-court-data.ts`
- `src/api/pages/high-court-api.ts`

Required language changes:

- add public copy that tells the reader the JSON/data surface is for one High Court across its covered geographies
- explicitly mention `coveredGeographies[]` in the API contract explanation if the current public docs omit it
- keep the court-level metric framing; do not imply geography-split stats that the product does not expose

## UX Decisions

### Switcher

- Keep court names only.
- Do not append covered geography text inside the switcher labels.
- Put coverage detail in the page body, not the navigation control.

### Coverage Block

- Place it near the headline metrics on overview pages.
- Keep it terse and scannable.
- Use the same visual treatment for single-jurisdiction and multi-jurisdiction courts so the product does not look like two different systems.

### Lower-Court Cross-Links

- A future multi-jurisdiction High Court page may link to covered lower-court state pages only where those state pages already exist.
- Chandigarh should not receive a fake lower-court link unless the repo later ships a real Chandigarh lower-court shell.

## Implementation Sequence

Keep this phase reviewable through narrow PRs.

### PR 1. Public Copy Plumbing

- add reusable coverage-label helpers in the public High Court view-model layer
- expose a consistent `coverageSummary` and `coverageList` to page renderers
- do not change routes or beta scope

### PR 2. High Court Page Language Pass

- update overview, methodology, data, and API page copy
- add the visible coverage block
- keep the original seven-court public beta stable while the language pass lands

### PR 3. Index And Homepage Language Pass

- update `/high-courts`
- update homepage High Court section wording
- ensure the homepage does not imply one-state equivalence

### PR 4. Multi-Jurisdiction Public-Beta Decision

- only after the copy pass lands
- decide whether Punjab and Haryana High Court should remain internal-only or become the first public multi-jurisdiction beta page
- current result: Punjab and Haryana is now the first public multi-jurisdiction High Court beta page

## Acceptance Criteria

This language phase is done only when:

- every public High Court page has explicit visible coverage language
- the methodology page explains court scope versus lower-court geography honestly
- the High Court index and homepage no longer imply one-state equivalence
- a future Punjab and Haryana public beta would not require inventing new semantics under launch pressure

## Current Recommendation

This public-language phase is now landed in the shipped High Court overview, methodology, data, API, index, and homepage surfaces, so the repo has an honest court-first copy contract.

Punjab and Haryana can now be exposed publicly without inventing fake one-state semantics, and the first public multi-jurisdiction High Court beta decision is now affirmative.

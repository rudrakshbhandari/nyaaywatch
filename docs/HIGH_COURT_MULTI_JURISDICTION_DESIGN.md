# Multi-Jurisdiction High Court Design

Initial design for supporting High Courts that do not fit the current one-court-one-state contract.

This document exists because the single-jurisdiction High Court queue is now exhausted. The next gating problem is no longer missing internal proof. The next gating problem is that the current product and data model cannot represent courts whose public scope spans multiple states or union territories without lying about coverage.

## Current Constraint

The current High Court implementation is still single-jurisdiction in four important places:

1. `src/high-courts.ts`
   - every `HighCourtProfile` has one `stateCode`, one `stateName`, and one `hcNjdgStateValue`
2. `src/domain/high-court-capture-schema.ts` and `src/domain/high-court-snapshot-schema.ts`
   - capture and published snapshot metadata both require one `stateCode` and one `stateName`
3. `src/storage/postgres.ts`
   - High Court runs, snapshots, and publications still flow through the shared `state_code` column
4. `src/api/public-high-court.ts` and `src/api/app.ts`
   - public High Court pages are court-centric in the URL, but the surrounding profile and service model still assumes one state identity under the hood

That works for the current registry because every configured public or internal High Court can still be honestly mapped to one lower-court state profile.

It breaks down for the deferred courts in `docs/HIGH_COURT_INTERNAL_WAVE_1.md`:

- Bombay High Court
- Calcutta High Court
- Gauhati High Court
- High Court of Kerala
- Madras High Court
- High Court of Punjab and Haryana
- Delhi High Court

## Design Goal

Add multi-jurisdiction High Courts without weakening the current public trust model.

That means:

- keep High Court pages court-centric, not state-centric
- make covered geography explicit anywhere the page scope matters
- stop overloading `stateCode` to mean both "lower-court geography" and "High Court identity"
- preserve replay, rollback, and publication auditability
- avoid public rollout until the multi-jurisdiction methodology is honest enough to defend

## Recommended Model

### 1. Split court identity from covered geography

Replace the current one-state High Court profile shape with a court-first model:

```ts
interface HighCourtJurisdictionUnit {
  geographyCode: string;
  geographyName: string;
  geographyType: "state" | "union_territory";
  lowerCourtStateCode?: SupportedStateCode;
}

interface HighCourtProfileV2 {
  courtCode: string;
  courtSlug: string;
  courtName: string;
  hcNjdgCourtValue: string;
  coveredGeographies: HighCourtJurisdictionUnit[];
  publicBeta: boolean;
  sourceReviewStatus: "reviewed" | "queued";
  sourceUrls: HighCourtSourceUrls;
}
```

Key change:

- the High Court remains the identity
- covered states or union territories become explicit metadata, not the primary key

### 2. Rename the storage identity away from `state_code`

The current warehouse uses `runs.state_code`, `published_snapshots.state_code`, and `publication_history.state_code` for lower courts, High Courts, and Supreme Court.

That is already semantically overloaded:

- lower courts use a real lower-court state code such as `HP`
- High Courts already pass a court code such as `HPHC`
- Supreme Court passes a court code-like identifier too

Recommended migration direction:

- add `scope_type` with values like `lower_court_state`, `high_court`, and `supreme_court`
- add `scope_code` as the canonical publication identity
- keep the legacy `state_code` column only as a temporary compatibility field during migration

This makes the next High Court step safer even for the current single-jurisdiction courts.

### 3. Widen High Court snapshot metadata

The published High Court payload should stop pretending there is one `stateCode` and one `stateName`.

Recommended metadata shape:

```ts
snapshot: {
  courtTier: "high_court";
  courtCode: string;
  courtSlug: string;
  courtName: string;
  coveredGeographies: Array<{
    geographyCode: string;
    geographyName: string;
    geographyType: "state" | "union_territory";
    lowerCourtStateCode?: string;
  }>;
  ...
}
```

Do not keep one `stateName` and then bolt on a footnote. That would keep the core lie in the canonical payload.

### 4. Keep public routing court-centric

The current `/high-courts/:courtSlug` route shape is still correct.

Do not turn multi-jurisdiction High Courts into fake state routes.

Instead:

- keep one page per High Court
- add a visible "coverage" block near the headline metrics
- say exactly which states or union territories are covered
- avoid implying that the High Court page is the same thing as any one lower-court state page

### 5. Decouple High Court navigation from lower-court geography

The current public switcher works because each public High Court can still be understood through one state name.

For multi-jurisdiction courts:

- the switcher label should remain the court name
- the page summary should describe covered geographies explicitly
- the homepage should not imply that every High Court card maps cleanly to one lower-court state card

## Methodology Guardrails

Before any multi-jurisdiction High Court goes public, the methodology needs three explicit answers:

1. What exactly is the page scope?
   - one High Court across all covered geographies
2. What does not map cleanly to the lower-court product shell?
   - lower-court coverage may exist for some covered states but not every covered geography
3. What comparisons are still valid?
   - court-to-court High Court comparisons may be fine
   - High Court to lower-court state comparisons should remain tightly caveated or withheld

Public copy must prefer:

- "This page covers the High Court across these jurisdictions"

Not:

- "This page covers <state>" when the court covers more than one geography

## Recommended First Pilot

If the repo proceeds after the model change, the first multi-jurisdiction internal pilot should be **High Court of Punjab and Haryana**.

Reason:

- Punjab and Haryana already exist in the lower-court public shell
- the court is easier to explain product-wise than the larger or more fragmented deferred courts
- it exercises the multi-jurisdiction problem directly without forcing the broader bench and geography complexity of Bombay or Gauhati first

This is a design recommendation, not a public rollout approval.

## Phased Execution

### Phase 1: Identity cleanup

- introduce `scope_type` and `scope_code`
- stop overloading `stateCode` for High Court and Supreme Court runs
- refactor `HighCourtProfile` to carry `coveredGeographies[]`

### Phase 2: Internal-only payload widening

- widen High Court capture, candidate, and published snapshot metadata
- keep all affected multi-jurisdiction courts internal-only
- prove `fetch -> publish -> replay -> rollback` for one pilot court

### Phase 3: Public-surface methodology and UX

- update High Court public page copy for explicit jurisdiction coverage
- update homepage framing so the High Court section does not imply one-state equivalence
- add methodology language for mixed state and union-territory coverage

The concrete implementation plan for this phase now lives in `docs/HIGH_COURT_MULTI_JURISDICTION_PUBLIC_LANGUAGE_PLAN.md`.

### Phase 4: Public-beta decision

Only after the first three phases succeed should the repo decide whether any multi-jurisdiction High Court deserves public beta exposure.

## Non-Goals

This design does not approve:

- automatic public launch of every deferred High Court
- a nationwide High Court shell that outruns methodology
- merging High Court and lower-court geography concepts into one blurred route family

## Current Decision

Until this design is implemented, the public High Court beta should remain fixed at:

- Himachal
- Andhra Pradesh
- Telangana
- Gujarat
- Madhya Pradesh
- Uttar Pradesh via Allahabad High Court
- Rajasthan

The concrete first execution slice for this design now lives in `docs/HIGH_COURT_MULTI_JURISDICTION_PHASE_1_PLAN.md`.
The concrete public-language follow-up after that slice now lives in `docs/HIGH_COURT_MULTI_JURISDICTION_PUBLIC_LANGUAGE_PLAN.md`.

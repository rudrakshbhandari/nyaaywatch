# High Court Multi-Jurisdiction Phase 1 Plan

Concrete implementation plan for the first court-first High Court model pass.

This document exists to answer one narrow question:

- what exactly should the repo build next so multi-jurisdiction High Courts can move from design intent to internal implementation?

This plan follows `docs/HIGH_COURT_MULTI_JURISDICTION_DESIGN.md` and turns that design into a bounded first execution slice.

## Why This Phase Exists

The repo has already finished the entire queued single-jurisdiction High Court proof set.

The next blocker is structural:

- the current High Court model still assumes one court maps to one state
- that assumption already leaks into profiles, schemas, warehouse identity, and published payloads
- the deferred courts cannot be added honestly until the identity model becomes court-first

This phase is not a public rollout.

This phase is the minimum refactor needed so the repo can represent a High Court that covers multiple jurisdictions without publishing a false `stateName`.

## Pilot Boundary

The first internal pilot should be **High Court of Punjab and Haryana**.

Why this court first:

- it directly proves the multi-jurisdiction problem instead of dodging it
- it stays easier to explain than Bombay, Calcutta, or Gauhati
- it exercises both multi-state and union-territory coverage
- the repo already has lower-court public state shells for Punjab and Haryana

Covered geographies the model should represent explicitly:

- Punjab
- Haryana
- Chandigarh as a union territory

Hard rule:

- keep this court internal-only through phase 1

## Phase 1 Goal

Land the identity and schema groundwork needed for one internal multi-jurisdiction High Court pilot.

Success means:

- High Court identity is court-first instead of state-first
- warehouse records stop depending on `state_code` as the canonical meaning for High Court and Supreme Court data
- High Court capture and published snapshot metadata can describe multiple covered geographies
- existing public single-jurisdiction High Court routes still behave the same
- the repo can add Punjab and Haryana High Court internally without lying about coverage

## Non-Goals

This phase does not:

- make any multi-jurisdiction High Court public
- redesign the public High Court pages yet
- expand the public beta beyond the current seven courts
- remodel lower-court state routing
- add every deferred multi-jurisdiction High Court at once

## Workstreams

### 1. Storage Identity Cleanup

Goal:

- stop using `state_code` as the true identity for non-lower-court tiers

Primary files:

- `src/storage/postgres.ts`
- `src/db/migrations/*`

Required work:

- add canonical `scope_type` and `scope_code` to runs, published snapshots, and publication history
- keep `state_code` only as a compatibility field during migration
- define allowed scope types at least as:
  - `lower_court_state`
  - `high_court`
  - `supreme_court`
- update Postgres read and write helpers so High Court and Supreme Court paths read by `scope_type` plus `scope_code`

Compatibility rule:

- do not break the current lower-court API or published-state reads while the compatibility field still exists

### 2. High Court Profile Refactor

Goal:

- make the High Court profile represent one court plus explicit covered geographies

Primary files:

- `src/high-courts.ts`
- `src/geographies.ts`

Required work:

- replace the singular `stateCode` and `stateName` assumption with `coveredGeographies[]`
- preserve `courtCode`, `courtSlug`, `courtName`, and `hcNjdgStateValue`
- keep a compatibility helper for current single-jurisdiction courts so existing public pages do not need an immediate UI rewrite
- add a new internal-only profile for Punjab and Haryana High Court only after the new profile shape exists

Minimum geometry shape:

- `geographyCode`
- `geographyName`
- `geographyType`
- optional `lowerCourtStateCode` when the geography maps to an existing lower-court state profile

### 3. High Court Schema Widening

Goal:

- let capture, candidate, and published payloads describe real court coverage

Primary files:

- `src/domain/high-court-capture-schema.ts`
- `src/domain/high-court-snapshot-candidate-schema.ts`
- `src/domain/high-court-snapshot-schema.ts`
- `src/normalize/high-court-snapshot-candidate.ts`

Required work:

- replace singular `stateCode` and `stateName` metadata with `coveredGeographies[]`
- keep court identity fields explicit and unchanged
- ensure trend and stats sections stay court-level, not geography-split
- preserve the existing explicit `referenceDateAt` and `referenceDateKind` trust contract

Compatibility rule:

- current public single-jurisdiction High Court pages may derive a display label from the first or primary geography during transition, but the canonical payload must no longer lie

### 4. Service And Operator Wiring

Goal:

- move High Court lifecycle code onto the new scope identity without changing operator semantics

Primary files:

- `src/services/published-high-court-snapshot-service.ts`
- `src/api/app.ts`
- `src/api/public-high-court.ts`
- `src/dev/high-court-readiness.ts`
- `src/dev/high-court-wave-readiness.ts`

Required work:

- update High Court services to use `scope_type=high_court` plus `scope_code=<courtCode>`
- keep `/operator/high-courts/:courtSlug/...` unchanged
- keep `/high-courts/:courtSlug` unchanged
- make sure readiness tooling reports coverage honestly for multi-jurisdiction courts

Hard rule:

- no fake state aliases for multi-jurisdiction High Courts

### 5. Internal Pilot Enablement

Goal:

- prove the new model on one real multi-jurisdiction court without public rollout

Primary files:

- `src/high-courts.ts`
- `docs/HIGH_COURT_INTERNAL_WAVE_1.md`
- `docs/HIGH_COURT_WAVE_VALIDATION_PLAN.md`

Required work:

- add the internal-only Punjab and Haryana High Court profile after the identity and schema work lands
- record its covered geographies explicitly
- run `fetch -> publish -> replay -> rollback` internally only after the model refactor is merged

Do not do in the same PR as the storage refactor unless the implementation stays narrow and reviewable.

## Suggested PR Sequence

Keep phase 1 small and reviewable through separate PRs.

### PR 1. Warehouse Identity Migration

- add `scope_type` and `scope_code`
- update storage adapters
- keep existing High Court and Supreme Court lifecycle reads and writes aligned to the new scope identity during compatibility mode
- add migration and regression coverage

Status:

- completed on branch `warehouse-scope-identity-migration`
- migration `002_scope_identity.sql` backfills `runs`, `published_snapshots`, and `publication_history`
- existing lower-court reads stay backward-compatible through the retained `state_code` field

### PR 2. High Court Profile And Schema Refactor

- refactor `HighCourtProfile`
- widen High Court schemas and normalization
- keep existing public single-jurisdiction behavior stable

Status:

- completed on branch `high-court-covered-geographies`
- `HighCourtProfile` now carries explicit `coveredGeographies[]` plus narrow primary-geography helpers for current single-jurisdiction call sites
- High Court capture, candidate, and published snapshot contracts now parse to canonical `coveredGeographies[]`, while legacy single-state artifacts and published payloads still read through compatibility transforms

### PR 3. Service Wiring And Internal Pilot Config

- move High Court service reads and writes to the new scope identity
- add the Punjab and Haryana High Court internal profile
- update readiness and wave docs

Status:

- completed on branch `high-court-service-wiring-punjab-haryana`
- High Court ownership checks and readiness/reporting surfaces now validate canonical `scope_type=high_court` plus `scope_code=<courtCode>` instead of implicitly trusting the compatibility `state_code`
- the internal-only Punjab and Haryana High Court profile is now configured as `PHHC` with explicit Punjab, Haryana, and Chandigarh coverage
- the current seven-court public beta remains unchanged, and `/high-courts/punjab-and-haryana` still stays outside the public route family

### PR 4. Live Internal Proof

- no broad code refactor
- run the live internal operator proof cycle for Punjab and Haryana High Court
- document the results

Status:

- completed on branch `high-court-punjab-haryana-proof`
- fetch run `run_642f9d1d-5246-42a5-b3e0-1b5bb78def50`, publish publication `publication_83b3d316-cdaf-4729-bcea-a875599af83f`, replay run `run_84726b0e-7732-4d4b-8a6b-da3c10d17ae4`, replay publication `publication_adade273-f47c-4b4e-8501-75ea35e06814`, and rollback publication `publication_797e59da-9032-42dc-a891-f68f3d83fc0b` all succeeded on `https://nyaaywatch.in`
- `npm run high-court:readiness -- --base-url=https://nyaaywatch.in --court-slug=punjab-and-haryana` now reports `runCount=2`, `publicationCount=3`, `replayedRunCount=1`, `rollbackCount=1`, `canonicalScopeAligned=true`, and `internalProofBarSatisfied=true`
- the internal-only `PHHC` profile remains outside the public High Court beta despite clearing the live proof bar

## Testing And Verification

Before calling phase 1 complete:

- relevant unit and schema tests pass locally
- migration coverage proves old records still read correctly during compatibility mode
- existing public High Court beta routes stay stable, even as canonical High Court payload metadata moves from fake singular `stateCode` / `stateName` fields to honest `coveredGeographies[]`
- internal operator lifecycle still works for one existing single-jurisdiction High Court
- the repo can configure Punjab and Haryana High Court internally with explicit covered geographies

## Exit Criteria

Phase 1 is done only when:

- the canonical identity for High Court and Supreme Court records is `scope_type` plus `scope_code`
- High Court payload metadata can express multiple covered geographies honestly
- Punjab and Haryana High Court can exist internally in the registry without fake one-state metadata
- the current seven-court public High Court beta remains stable
- the repo is ready for a separate internal proof pass, not forced into public launch

## After Phase 1

Phase 1 has now succeeded, and the next move is not automatic public rollout.

The next move is:

1. update the public-methodology and UX language for explicit jurisdiction coverage
2. decide whether any multi-jurisdiction High Court deserves public beta exposure
3. only then consider a separate public-beta decision for Punjab and Haryana or another deferred multi-jurisdiction court

# Supreme Court Internal Readiness Review

Current internal-readiness review for the Supreme Court pilot.

This document exists to answer one narrow question:

- has the Supreme Court tier accumulated enough real internal operator evidence to justify the next public-beta step?

Latest live verification referenced here was run against `https://nyaaywatch.in` on **April 18, 2026 Pacific / April 19, 2026 UTC**.

## Current Status

- `courtCode=SCI`
- `courtSlug=supreme-court`
- `courtName=Supreme Court of India`
- internal operator namespace: `/operator/supreme-court/...`
- public Supreme Court routes: not yet exposed
- Supreme Court date contract: explicit `captured_at` fallback when the stored aggregate payload does not expose a defensible upstream source snapshot timestamp

What is true in repo state now:

- stored-evidence Supreme Court capture, inspect, publish, replay, and rollback are implemented
- the internal Supreme Court read surface is implemented and test-covered
- local and remote operator tooling can target Supreme Court explicitly
- live Supreme Court internal proof cycles have now cleared `fetch -> publish -> replay -> rollback` across separate windows
- the live deployed stack now serves the Supreme Court operator namespace behind operator auth
- the repo now has a written Supreme Court methodology draft

What is still **not** yet true in repo evidence:

- the public `/supreme-court` route family is still intentionally dark
- the public Supreme Court route family and its HTML or JSON trust surfaces are not yet implemented

## Readiness Commands

Current live operator path:

```bash
npm run operator:remote -- --base-url=https://nyaaywatch.in --supreme-court publications
npm run operator:remote -- --base-url=https://nyaaywatch.in --supreme-court fetch "Internal Supreme Court fetch"
```

Requires:

- `OPERATOR_API_TOKEN` in the environment

The route-level auth boundary should also remain true:

- `GET /operator/supreme-court` without a token returns `401`
- `GET /supreme-court` currently returns `404`

## Internal Proof Bar

Supreme Court should not be considered ready for public-beta review until all of the following are true in live operator evidence:

1. an active published Supreme Court snapshot exists
2. at least one replayed Supreme Court run exists from stored evidence
3. at least one rollback publication exists
4. the reference-date contract is explicit and defensible
5. the above has been repeated across separate internal release windows, not just one isolated cycle

All five items are now satisfied.

## First Live Proof Cycle

Verified on `2026-04-19` after PR `#107` merged and GitHub deploy run `24622868188` completed on `main`.

- settled ECS task definition: `nyaaywatch-staging:95`
- unauthenticated operator route status: `401 /operator/supreme-court`
- public route status: `404 /supreme-court`
- fetch run id: `run_1eae4c35-6ed8-4e32-8d2e-a8b0b704df1e`
- first publication id: `publication_e0e10038-e70c-4556-a972-df9f530d03de`
- first published snapshot id: `snapshot_4a64f3c4-b978-4a91-90f4-1fafbfe38f81`
- replay run id: `run_06a8e66e-26ac-4de6-9182-561989b49e4c`
- replay publication id: `publication_dbcca7db-d563-4ba8-a0b1-3ea730c40ce5`
- rollback publication id: `publication_816712a1-56c7-4b2b-b49d-74d78f6a9bbd`
- active publication action after rollback: `rollback`
- active snapshot id after rollback: `snapshot_4a64f3c4-b978-4a91-90f4-1fafbfe38f81`
- published-from run id on the active snapshot: `run_1eae4c35-6ed8-4e32-8d2e-a8b0b704df1e`
- replayed-from run id retained in history: `run_1eae4c35-6ed8-4e32-8d2e-a8b0b704df1e`
- reference date: `2026-04-19T06:41:34.634Z`
- reference date kind: `captured_at`
- published snapshot `sourceSnapshotAt`: `null`
- published at: `2026-04-19T06:42:07.131Z`
- methodology version: `2026.04-supreme-court-draft`

Active internal snapshot metrics from the same live proof cycle:

- `pendingRegisteredCases=71534`
- `pendingUnregisteredCases=22624`
- `pendingTotalCases=94158`
- `institutedLastMonthTotalCases=6148`
- `disposedLastMonthTotalCases=4552`
- `institutedCurrentYearTotalCases=23743`
- `disposedCurrentYearTotalCases=21407`

This means the repo has now recorded the first real Supreme Court proof cycle with:

- one active published Supreme Court snapshot
- one replayed run from stored evidence
- one rollback publication
- an explicit and defensible `captured_at` reference-date contract

## Second Live Proof Cycle

Verified on `2026-04-19` after PR `#108` merged and GitHub deploy run `24623340754` completed on `main`.

- settled ECS task definition: `nyaaywatch-staging:96`
- unauthenticated operator route status: `401 /operator/supreme-court`
- authenticated operator route status: `200 /operator/supreme-court`
- public route status: `404 /supreme-court`
- fetch run id: `run_92990afc-1acd-4d37-b6d5-69dc95a1d933`
- second-window publication id: `publication_a4af147e-0495-40ae-8359-5d2775da3c8a`
- second-window published snapshot id: `snapshot_fee1e8ee-b67e-4c95-aa1b-a94b0ea0b486`
- replay run id: `run_e9572b2a-bb76-4318-885d-23b04d776eea`
- replay publication id: `publication_2321561c-ccdb-40f3-ba2f-ae55eadecae7`
- rollback publication id: `publication_4dbc4cab-b2cd-4021-a083-3e016dc7929a`
- active publication action after rollback: `rollback`
- active snapshot id after rollback: `snapshot_fee1e8ee-b67e-4c95-aa1b-a94b0ea0b486`
- published-from run id on the active snapshot: `run_92990afc-1acd-4d37-b6d5-69dc95a1d933`
- replayed-from run id retained in history: `run_92990afc-1acd-4d37-b6d5-69dc95a1d933`
- reference date: `2026-04-19T07:06:34.049Z`
- reference date kind: `captured_at`
- published snapshot `sourceSnapshotAt`: `null`
- published at: `2026-04-19T07:06:42.130Z`
- methodology version: `2026.04-supreme-court-draft`

Active internal snapshot metrics from the second live proof cycle:

- `pendingRegisteredCases=71534`
- `pendingUnregisteredCases=22624`
- `pendingTotalCases=94158`
- `institutedLastMonthTotalCases=6148`
- `disposedLastMonthTotalCases=4552`
- `institutedCurrentYearTotalCases=23743`
- `disposedCurrentYearTotalCases=21407`

This means the repo now has repeated live Supreme Court proof windows with:

- one active published Supreme Court snapshot from the second window
- replayed runs from stored evidence in both windows
- rollback publications in both windows
- the same explicit and defensible `captured_at` reference-date contract across both windows
- successful live operator evidence on task definitions `:95` and `:96`

## Recommendation

Supreme Court has now cleared the repeated-window internal proof bar for a public beta.

The next concrete action is:

- implement the public `/supreme-court` route family and wire it to the existing published-snapshot contract
- turn the repo-side methodology draft into the live `/supreme-court/methodology` surface
- keep the first public Supreme Court beta narrow, snapshot-based, and tier-aware

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
- a live Supreme Court internal proof cycle has now cleared `fetch -> publish -> replay -> rollback`
- the live deployed stack now serves the Supreme Court operator namespace behind operator auth

What is still **not** yet true in repo evidence:

- this repo records only one live Supreme Court proof cycle window so far
- the Supreme Court tier does not yet have repeated live proof cycles across separate windows
- the public `/supreme-court` route family is still intentionally dark
- the public Supreme Court methodology page is not yet written down

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

Items 1 through 4 are now satisfied. Item 5 is not.

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

## Recommendation

Supreme Court has cleared the first live internal proof-cycle gate.

It has **not** yet cleared the full repeated-window bar for a public beta.

The next concrete action is:

- run at least one additional live Supreme Court proof cycle in a later window
- write the public Supreme Court methodology page
- expose the public `/supreme-court` route family only after those two things are true

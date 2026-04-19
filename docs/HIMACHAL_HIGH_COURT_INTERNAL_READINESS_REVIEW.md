# Himachal High Court Internal Readiness Review

Current internal-readiness review for the Himachal High Court pilot.

This document is the High Court-tier analogue of the earlier state internal-readiness reviews. It exists to answer one narrow question:

- has Himachal High Court accumulated enough real internal operator evidence to justify a later public beta discussion?

## Current Status

- `courtCode=HPHC`
- `courtSlug=himachal`
- `courtName=High Court of Himachal Pradesh`
- internal operator namespace: `/operator/high-courts/himachal/...`
- public High Court routes: still intentionally dark
- High Court date contract: explicit `captured_at` fallback when HC NJDG does not expose a trustworthy source snapshot date

What is true in repo state now:

- stored-evidence High Court capture, inspect, publish, replay, and rollback are implemented
- the internal High Court read surface is implemented and test-covered
- local and remote operator tooling can target Himachal High Court explicitly

What is **not** yet true in repo evidence:

- this repo does not yet record repeated live Himachal High Court proof cycles across separate release windows
- this repo does not yet record a public-beta approval for Himachal High Court

## Readiness Command

Use the internal readiness verifier after each real Himachal High Court proof cycle:

```bash
npm run high-court:readiness -- --base-url=https://nyaaywatch.in --court-slug=himachal
```

Requires:

- `OPERATOR_API_TOKEN` in the environment

The command verifies:

- the High Court operator auth boundary
- the dedicated High Court internal namespace
- current published snapshot metadata
- publication history depth
- replay evidence
- rollback evidence
- the explicit High Court reference-date contract

## Internal Proof Bar

Himachal High Court should not be considered ready for public-beta review until all of the following are true in live operator evidence:

1. an active published High Court snapshot exists
2. at least one replayed High Court run exists from stored evidence
3. at least one rollback publication exists
4. the reference-date contract is explicit and defensible
5. the above has been repeated across separate internal release windows, not just one isolated cycle

The new readiness verifier covers items 1 through 4 directly. Item 5 still requires human review of repeated runs across time.

## What To Record Here Later

Once live Himachal High Court proof cycles start running, record:

- latest active publication id
- latest snapshot id
- rollback target retained from the prior proof cycle
- latest methodology version
- whether the current active snapshot is based on `source_snapshot_at` or `captured_at`
- the release windows that cleared the internal proof bar

## Recommendation

Do not open any public Himachal High Court route yet.

The next concrete action is:

- run `npm run high-court:readiness` against the live internal Himachal High Court surface across multiple real operator cycles
- then update this document with actual production evidence before any public-beta decision

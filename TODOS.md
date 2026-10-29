# Roadmap and open work

> Maintainer planning source. Last reviewed: 2026-10-29.

## Current roadmap

The current approved product scope is to operate and maintain the existing snapshot-based coverage described in [README.md](README.md) and [the coverage audit](docs/INDIA_COURT_COVERAGE_AUDIT.md). No new court-geography rollout is queued.

Two product directions are approved for roadmap planning, not implementation or a delivery date:

- [What happened to this? — public accountability timelines](https://github.com/rudrakshbhandari/nyaaywatch/issues/407): source-linked timelines for public commitments and directions, with responsible institutions, follow-through, corrections, and optional change alerts. A small source-access and editorial pilot is proposed first.
- [Follow my representatives — profiles and change alerts](https://github.com/rudrakshbhandari/nyaaywatch/issues/408): source-backed representative profiles and opt-in alerts, starting with Parliament and expanding only where coverage can be supported.

The [long-term data strategy](docs/LONG_TERM_DATA_STRATEGY.md) and [metric strategy](docs/METRIC_STRATEGY.md) describe other future directions and candidate metrics; they are not implementation commitments. New source classes, metric families, or deeper coverage must pass the source, methodology, public-trust, and operational checks in [the expansion gates](docs/MULTI_STATE_EXPANSION_GATES.md).

## Open work

The current in-flight maintenance item is [PR #406](https://github.com/rudrakshbhandari/nyaaywatch/pull/406), which fixes the Azure Ops Watchdog argument-size failure; its PR records the passing CI and pending post-merge scheduled-run check. Add other implementation tasks here only when they have an owner or clear next action, a reason they are in scope, and a verifiable completion condition. Keep release evidence in the operator ledgers rather than duplicating it here:

- `docs/internal/DEPLOYMENT_STATUS.md`
- `docs/internal/RELEASE_HISTORY.md`
- `docs/internal/EXPANSION_REVIEW_LOG.md`

High Court public-beta additions must continue to use deliberate, documented batches unless a concrete operational blocker requires an exception; record the reason with that change. This is a standing release rule, not an open expansion task.

## Historical plans

Completed plans are preserved in [`docs/archive/`](docs/archive/). They document past decisions and execution; they are not current scope or commitments. The original Himachal MVP record remains at [`docs/MVP_EXECUTION_PLAN.md`](docs/MVP_EXECUTION_PLAN.md), as repository guidance explicitly uses it for historical MVP context.

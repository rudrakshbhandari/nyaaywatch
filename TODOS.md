# TODOS

`docs/MVP_EXECUTION_PLAN.md` is the ordered path to the Himachal alpha MVP.

Use this file for:

- post-MVP operational work
- backlog shaping after the completed supported-state rollout
- deliberate scope increases that are not yet approved for implementation

Do not use this file as a second release ledger. The detailed rollout evidence already lives in:

- `docs/DEPLOYMENT_STATUS.md`
- `docs/RELEASE_HISTORY.md`
- `docs/EXPANSION_REVIEW_LOG.md`

## Next Up

### 1. Public Alpha Operations And Alerting

- [ ] Wire `npm run ops:verify-public-alpha -- --base-url=https://nyaaywatch.in` into a scheduled monitor with a real alert path. The repo now has the verification sweep; the missing piece is dependable wake-up behavior when it fails.
- [ ] Add a scheduler-execution watchdog for `nyaaywatch-staging-weekday-internal-fetch` so the team can distinguish “public snapshot is still acceptable” from “the daily internal fetch stopped firing.”
- [ ] Keep the operator review loop boring and enforced: release windows should always produce aligned evidence in `docs/RELEASE_HISTORY.md`, `docs/DEPLOYMENT_STATUS.md`, and the generated release-evidence artifacts.

### 2. Freshness And Trust-Surface Hardening

- [ ] Decide whether any public state needs a stronger freshness banner or methodology note once the ops sweep has run across multiple real release windows.
- [ ] Add an explicit operator runbook for what to do when the ops sweep reports daily-fetch lag but the product is not yet stale by the 14-day public trust threshold.
- [ ] Review whether any public state has source-shape quirks that deserve state-specific caveats instead of silently relying on the common methodology text.

### 3. Deliberate Post-Rollout Scope Decisions

- [ ] Do not add more geography just because the current state set is live. Any next expansion should clear `docs/MULTI_STATE_EXPANSION_GATES.md` after the operational loop above has held for a few stable windows.
- [ ] If the next scope increase is not another state, evaluate a single narrow candidate such as a new court tier or deeper operating evidence, not a broad “nationwide platform” step.

## Recently Completed

- [x] Fixed the false-positive Himachal daily-fetch lag in `npm run ops:verify-public-alpha`: the sweep now reads each state's latest successful internal operator run instead of inferring internal cadence from the older published snapshot date. Live AWS evidence already showed Himachal's scheduled fetch `run_337a80ae-4980-415a-8585-d670e413dfed` completed on `2026-04-17` with `sourceSnapshotAt=2026-04-16`, and the corrected live sweep is now green across all 28 public states.
- [x] All currently supported states are publicly live on `https://nyaaywatch.in`; there is no remaining approved-state internal or public rollout queue in the current roadmap.
- [x] The repo now has a public-alpha ops sweep via `npm run ops:verify-public-alpha -- --base-url=https://nyaaywatch.in`, which verifies every public state and surfaces parity failures, stale public snapshots, and daily-fetch lag explicitly.
- [x] `TODOS.md` now tracks the actual post-MVP backlog instead of duplicating rollout history.

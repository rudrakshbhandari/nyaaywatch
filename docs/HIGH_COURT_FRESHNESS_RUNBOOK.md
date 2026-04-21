# High Court Freshness And Lag Runbook

Operator-facing runbook for what to do when the ops watchdog flags a daily-fetch lag or a stale snapshot on a public High Court page.

Use `docs/RELEASE_POLICY.md` for cadence and blocking rules and `docs/ALPHA_RELEASE_CHECKLIST.md` for publish gates. This runbook is only about the post-publish window, once a court is already in the public beta.

## Why This Exists

The ops sweep measures two different things and neither is the same as "the public page is lying":

- **Daily-fetch lag** — the latest successful internal operator run for a scope is older than `DEFAULT_DAILY_FETCH_LAG_THRESHOLD_DAYS` (currently `2` days). This is an internal collection signal. The public snapshot can still be recent and defensible while daily fetch is lagging.
- **Stale snapshot** — the active publication's source snapshot is older than `STALE_SNAPSHOT_THRESHOLD_DAYS` (currently `14` days). This is a public trust signal. It is the point at which a public High Court page should no longer be presented as current without an explicit caveat.

These two signals are intentionally separated because upstream NJDG breakage is common and short-lived, and we do not want to yank a published snapshot off the public surface every time an overnight fetch misses.

## Detection Sources

The ops watchdog is where these signals surface first:

- scheduled run: `.github/workflows/ops-watchdog.yml` (every day at `05:00` UTC) and the in-stack `nyaaywatch-staging-public-alpha-ops-monitor` ECS schedule every `30` minutes
- failure artifact: the durable GitHub issue titled `Ops watchdog failure`, which lists `dailyFetchLagStates`, `staleStates`, and `failingTiers`
- first-incident alert: SNS topic `nyaaywatch-staging-alerts`
- command for an ad-hoc check:
  ```bash
  export OPERATOR_API_TOKEN=...
  npm run ops:verify-public-alpha -- --base-url=https://nyaaywatch.in
  ```

The public-alpha sweep currently covers lower-court state profiles. For High Court-specific internal history, use the wave-readiness and readiness commands:

```bash
npm run high-court:readiness -- --base-url=https://nyaaywatch.in --court-slug=<slug>
npm run high-court:wave-readiness -- --base-url=https://nyaaywatch.in --court-slugs=<slug1>,<slug2>,<slug3>
```

## Decision Tree

### A. Daily-fetch lag, public snapshot still fresh (`< 14 days`)

**What this means:** internal collection missed one or more windows, but the most recent public publication is still inside the trust window. The public page is not lying.

**Do:**

1. Check the ops watchdog issue body for which tier is lagging (`lower`, `supreme`, `high`) and which scope.
2. Inspect the latest scheduled run and freshness in the same issue body.
3. Look at `/ecs/nyaaywatch-staging` logs for the affected tier around the expected `8:00`, `8:10`, or `8:20` AM Asia/Kolkata window.
4. If the upstream source is returning a predictable error, record it in `docs/EXPANSION_REVIEW_LOG.md` and wait for the next window — do not hand-run a recovery fetch unless the next scheduled window is more than 24 hours away.
5. If the upstream source is returning something novel (HTML shape change, new challenge page, different selector payload), open a source-shape task and link it from the watchdog issue before closing.

**Do not:**

- auto-republish just to clear the lag signal — the public snapshot is already defensible
- rollback the public snapshot — a lag is not a content defect
- change the `DEFAULT_DAILY_FETCH_LAG_THRESHOLD_DAYS` value to silence the alert

### B. Daily-fetch lag and public snapshot stale (`>= 14 days`)

**What this means:** public trust threshold is at risk. The page claims to be snapshot-based and defensible and we are past the point where that is true without caveat.

**Do:**

1. Decide whether to hold the current publication with an explicit freshness banner or rollback to nothing-published for the affected scope. Holding is almost always correct — the snapshot is still provenance-traceable, only old.
2. If holding: confirm the state-specific methodology note or the shared High Court methodology page already carries language consistent with `docs/HIGH_COURT_MULTI_JURISDICTION_PUBLIC_LANGUAGE_PLAN.md`. The `coveredGeographies[]` language does not talk about freshness explicitly; if a specific court needs a court-specific caveat, add it there, not inline in the renderer.
3. If rolling back: follow the publish/rollback path in `docs/OPERATING_EVIDENCE.md`. Record the rollback in `docs/RELEASE_HISTORY.md` with a `publication_*` entry and an explicit reason field referencing this runbook.
4. Update the watchdog issue with the decision and the publication id of the action taken.

### C. Stale snapshot, no daily-fetch lag

**What this means:** internal collection is healthy but the last operator-published snapshot is old. Almost always this is because no one has run the Tuesday/Friday publish window for this scope.

**Do:**

1. Pick the most recent completed internal run for the affected scope.
2. Run the full prepublish, publish, postpublish, release-record sequence from `docs/RELEASE_POLICY.md`.
3. Re-run the ops sweep and confirm the scope drops out of `staleStates`.

### D. Source-shape caveat candidates

Some sources produce data that is structurally fine but semantically quirky (for example, scoped NJDG pages where one of the tier filters returns zero for long stretches, or where case-type coding differs from the common High Court pattern).

When a court repeatedly triggers this runbook for the same upstream reason, add a court-specific paragraph to that court's overview surface or to the shared High Court methodology page — not an inline footnote on metrics. Record the addition in `docs/EXPANSION_REVIEW_LOG.md` so future operators can see why the extra caveat exists.

## What Not To Automate

These decisions are intentionally not automated:

- switching a public High Court scope from `publicBeta=true` to `publicBeta=false` during a lag window
- auto-republishing from the latest internal run without an operator running the release checklist
- silencing the watchdog issue via workflow edits instead of fixing the underlying cadence

If automation ever looks like the right answer for one of these, write the design note first and land it through a separate PR, not during an incident.

## References

- `docs/RELEASE_POLICY.md` — cadence, publisher authority, blocked release criteria
- `docs/ALPHA_RELEASE_CHECKLIST.md` — publish-time go/no-go
- `docs/OPERATING_EVIDENCE.md` — minimum release evidence
- `docs/HIGH_COURT_MULTI_JURISDICTION_PUBLIC_LANGUAGE_PLAN.md` — High Court public copy rules
- `src/dev/public-alpha-ops.ts` — source of `DEFAULT_DAILY_FETCH_LAG_THRESHOLD_DAYS` and `STALE_SNAPSHOT_THRESHOLD_DAYS`
- `.github/workflows/ops-watchdog.yml` — scheduled watchdog and durable issue wiring

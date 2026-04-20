# Alpha Release Policy

Operating policy for keeping the Himachal Pradesh public alpha trustworthy.

This policy sets cadence, publisher rules, and blocking criteria. Use `docs/ALPHA_RELEASE_CHECKLIST.md` as the release go/no-go runbook, `docs/DEPLOYMENT_STATUS.md` as the live environment map, and `docs/DOMAIN_CUTOVER_CHECKLIST.md` only for hostname, certificate, or DNS changes.

This document answers four practical questions:

1. How often should NyaayWatch fetch and publish?
2. Who is allowed to publish?
3. What blocks a release?
4. What is the minimum log and alarm review routine?

## Default Alpha Cadence

Use a calm, predictable cadence for alpha:

- Lower-court internal raw fetches: **every day at 8:00 AM Asia/Kolkata across all implemented states**
- Supreme Court internal raw fetches: **every day at 8:10 AM Asia/Kolkata**
- High Court internal raw fetches: **every day at 8:20 AM Asia/Kolkata across reviewed High Court profiles only**
- Public snapshot publishes: **twice per week**
- Recommended publish window: **Tuesday and Friday, 11:00 AM Asia/Kolkata**
- Allowed exception: a same-day hotfix for broken public copy, methodology wording, or platform issues that do not weaken the trust boundary

Why this cadence:

- it separates collection freshness from public-claim changes
- it catches upstream breakage every day without making the site feel live
- it leaves room for operator inspection before public publish
- it is frequent enough for a public alpha but slow enough to keep every release deliberate

Do not publish just because a newer run exists. Publish only after the release checklist is green.

Treat the daily fetches as internal evidence collection only:

- they may create completed candidate runs across all implemented states, the Supreme Court tier, and reviewed High Court profiles
- they must not change the public snapshot without an explicit operator publish
- a failed daily fetch is an operational signal, not a reason to auto-publish or auto-rollback

## Publish Authority

For alpha, keep the allowlist short.

Allowed publishers must have all of the following:

- GitHub write access to the repo
- AWS access to the NyaayWatch account and staging/public stack
- the operator token for the target environment
- responsibility for completing `docs/ALPHA_RELEASE_CHECKLIST.md`

Recommended alpha policy:

- **one primary publisher**: founder or release owner
- **one backup publisher**: explicitly delegated maintainer
- **no broader operator access** until the public alpha has at least a few weeks of stable operating history

If a release changes methodology, public wording, or the publish/rollback flow itself, require a second human reviewer before publish even if one operator executes the final action.

## Blocked Release Criteria

Treat a release as blocked if any one of these is true:

- `/health` is failing through the public hostname
- ALB target health is not fully healthy
- a new run is `partial`, `failed`, or missing required artifacts
- the operator cannot complete `fetch -> inspect -> publish -> replay -> rollback` in staging or the equivalent isolated environment
- the homepage, district pages, CSV, and API do not agree on the active publication
- freshness, methodology version, source attribution, or quality state are missing from trust-critical surfaces
- the public copy implies real-time monitoring, prediction, or verdicts
- a structured app-error alarm or ALB 5xx alarm is firing and the cause is not understood
- the log review routine below has not been completed for the release window
- there is no clear rollback target in publication history

## Log And Alarm Review Routine

### Before publish

1. Open the staging dashboard and confirm:
   - healthy host count is steady
   - unhealthy host count is `0`
   - ALB 5xx counts are `0`
   - structured app errors are `0` or understood
2. Review the last 30 minutes of app logs:
   ```bash
   aws logs tail /ecs/nyaaywatch-staging --since 30m --region ap-south-1
   ```
3. If any `level=error` log line appears, either fix it first or explicitly record why it is safe to ignore for this release.
4. Run the public verification script against the target hostname:
   ```bash
   npm run release:verify -- --base-url=https://nyaaywatch.in
   ```
   For an approved state-scoped rollout, run the same command with `--state-slug=<state-slug>` as an additional check.
5. For the broad post-launch sweep, run the all-public-states ops check:
   ```bash
   export OPERATOR_API_TOKEN=...
   npm run ops:verify-public-alpha -- --base-url=https://nyaaywatch.in
   ```
   This must stay green before treating the release window as operationally quiet. It fails if any public state has route/parity drift, a stale public snapshot, or a latest successful internal fetch run old enough to suggest the daily internal fetch cadence is slipping.
6. Run prepublish verification for the candidate run and note the rollback target:
   ```bash
   npm run release:prepublish -- --run-id=<run-id> --base-url=https://nyaaywatch.in
   ```
   For an approved state-scoped rollout, add `--state-slug=<state-slug>` so the release summary verifies the matching public route family.

### During publish

Record the exact:

- run id
- publication id
- note used for publish
- reviewer name

### After publish

For the next 15 minutes:

- watch the dashboard
- confirm the public hostname still passes `/health`
- confirm `GET /v1/stats/himachal` reflects the intended active publication
- if rolling out an additional approved state, confirm its explicit state-scoped stats route reflects the intended active publication
- rerun `npm run release:verify -- --base-url=https://nyaaywatch.in` and keep the JSON summary with the release notes
- if `CLOUDFLARE_API_TOKEN` is configured for the live runtime via ECS `secrets`, confirm the public data page and CSV verification no longer require manual cache-busting and that `release:verify` passes on the stable URL alone
- run `npm run release:postpublish -- --publication-id=<publication-id> --base-url=https://nyaaywatch.in` and keep the generated markdown evidence file
- run the same postpublish command with `--state-slug=<state-slug>` for any approved state-scoped rollout
- run `npm run release:record -- --publication-id=<publication-id> --base-url=https://nyaaywatch.in --reviewer="<name>"` so `docs/RELEASE_HISTORY.md` stays current
- run the same release-record command with `--state-slug=<state-slug>` for any approved state-scoped rollout

### Weekly review

At least once each week, even without a publish:

- scan the alarm history
- review app errors for recurring patterns
- confirm the dashboard still reflects the real stack resources
- run `npm run ops:verify-public-alpha -- --base-url=https://nyaaywatch.in`
- treat any reported daily-fetch lag as an operator issue even if the public snapshot is not yet old enough to count as stale by the product trust model, because the sweep now checks internal run history rather than published snapshot age

## Practical Release Rule

If there is any doubt, leave the old published snapshot in place.

NyaayWatch is safer when it looks slightly older than when it publishes a snapshot that cannot be defended.

# Alpha Release Policy

Operating policy for keeping the Himachal Pradesh public alpha trustworthy.

This document answers four practical questions:

1. How often should NyaayWatch publish?
2. Who is allowed to publish?
3. What blocks a release?
4. What is the minimum log and alarm review routine?

## Default Publish Cadence

Use a calm, predictable cadence for alpha:

- Target snapshot publishes: **twice per week**
- Recommended window: **Tuesday and Friday, 11:00 AM Asia/Kolkata**
- Allowed exception: a same-day hotfix for broken public copy, methodology wording, or platform issues that do not weaken the trust boundary

Why this cadence:

- it keeps freshness visible without pretending the product is live
- it leaves room for operator inspection before publish
- it is frequent enough for a public alpha but slow enough to keep every release deliberate

Do not publish just because a newer run exists. Publish only after the release checklist is green.

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
- rerun `npm run release:verify -- --base-url=https://nyaaywatch.in` and keep the JSON summary with the release notes

### Weekly review

At least once each week, even without a publish:

- scan the alarm history
- review app errors for recurring patterns
- confirm the dashboard still reflects the real stack resources

## Practical Release Rule

If there is any doubt, leave the old published snapshot in place.

NyaayWatch is safer when it looks slightly older than when it publishes a snapshot that cannot be defended.

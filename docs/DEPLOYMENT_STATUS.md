# Deployment Status

Operational source of truth for where NyaayWatch is currently running and how to verify the live environment.

Keep this file updated whenever the staging stack changes, a public alpha URL is assigned, or a domain cutover is completed.

Use this document as the live environment map. For routine release go/no-go decisions, use `docs/ALPHA_RELEASE_CHECKLIST.md` plus `docs/RELEASE_POLICY.md`. Use `docs/DOMAIN_CUTOVER_CHECKLIST.md` only for future hostname, certificate, or DNS changes.

## Current Environments

### Local Development

- URL: `http://localhost:3000`
- Backing services: local Node app, local PostgreSQL, LocalStack S3
- Intended use: development, fixture-backed QA, local operator-flow checks

### Pull Request Previews

- URL shape: App Runner service URL posted back to each PR
- Backing runtime: same app image with `APP_MODE=preview`
- Data source: in-memory fixture-seeded published snapshot
- Intended use: web design, UI/UX, copy, and responsive review without live infra dependencies

### AWS Staging

- Stack name: `nyaaywatch-staging`
- Region: `ap-south-1`
- Public URL: `http://nyaaywatch-staging-964594065.ap-south-1.elb.amazonaws.com`
- Public hostname for browser checks: `https://nyaaywatch.in`
- ECS service: `nyaaywatch-staging-Service-zXxqGRuc7amS`
- ECS task definition: `nyaaywatch-staging:35`
- ALB DNS name: `nyaaywatch-staging-964594065.ap-south-1.elb.amazonaws.com`
- ACM certificate ARN: `arn:aws:acm:ap-south-1:723951822728:certificate/c55eb076-1c4c-4d94-a29b-454100e3ebc7`
- CloudWatch log group: `/ecs/nyaaywatch-staging`
- CloudWatch dashboard: `nyaaywatch-staging`
- Alarm topic ARN: `arn:aws:sns:ap-south-1:723951822728:nyaaywatch-staging-alerts`
- CloudWatch alarms:
  - `nyaaywatch-staging-health-endpoint`
  - `nyaaywatch-staging-alb-target-5xx`
  - `nyaaywatch-staging-app-errors`
- Artifacts bucket: `nyaaywatch-staging-artifacts-723951822728`
- Database endpoint: `nyaaywatch-staging-stagingdatabase-qcmxgxoytk9m.ct0sogc8a838.ap-south-1.rds.amazonaws.com`
- Intended use: operator validation, pre-release public-alpha verification, domain cutover target
- Deploy path: GitHub Actions auto-deploys every successful `main` merge by publishing a new ECR image and rolling the ECS service in place

Operational notes:

- Port `80` on the ALB redirects to `443`.
- The app itself redirects legacy `.com` host headers to the canonical `.in` hostname.
- Public browser-visible `.com -> .in` routing should be re-verified only if `nyaaywatch.com` or `www.nyaaywatch.com` are pointed at the ALB with matching ACM coverage.
- Direct `https://nyaaywatch-staging-964594065.ap-south-1.elb.amazonaws.com` checks will fail hostname validation because the certificate is for the public domain, not the raw ELB hostname.
- Use `https://nyaaywatch.in` for browser validation and the ALB DNS name for low-level AWS resource identification only.

### Public Alpha

- Domain: `https://nyaaywatch.in`
- Backing stack: `nyaaywatch-staging`
- Status: `live`
- Release path: verified `main` merges auto-roll the live ECS service through GitHub Actions
- Current public coverage:
  - unscoped default routes for Himachal Pradesh
  - explicit Punjab public routes at `/states/punjab` and `/v1/states/punjab/...`
- Current active Himachal publication: `publication_ce4939b3-0fdf-4044-9677-062ee0ae49b1`
- Current active Himachal published snapshot: `snapshot_8cda4026-d7da-43d1-a2c4-2e61fc717be7`
- Current Himachal source snapshot date: `2026-04-10`
- Current active Punjab publication: `publication_8a5ddc6e-f520-4344-8161-76dc4dead033`
- Current active Punjab published snapshot: `snapshot_35226b6d-2fac-49d6-9d53-7aa24b9387e5`
- Current Punjab source snapshot date: `2026-04-16`
- Public methodology version: `2026.04-alpha`

## How To Retrieve The AWS Staging URL

If the staging URL is not already recorded above, retrieve it from CloudFormation:

```bash
aws cloudformation describe-stacks \
  --stack-name nyaaywatch-staging \
  --region ap-south-1 \
  --query "Stacks[0].Outputs"
```

Look for:

- `ServiceUrl`
- `ArtifactsBucketName`
- `DatabaseEndpoint`
- `LogGroupName`

Then write those values back into this file in the same PR or deployment change.

## Minimum Live Verification

Run these checks against the current public URL or staging `ServiceUrl`:

```bash
curl -fsSL <base-url>/health
curl -fsSL <base-url>/v1/stats/himachal
curl -fsSL <base-url>/v1/districts
curl -fsSL <base-url>/v1/trends
curl -fsSL <base-url>/v1/states/punjab/stats
curl -fsSL <base-url>/v1/states/punjab/districts
curl -fsSL <base-url>/v1/states/punjab/trends
```

Expected:

- `/health` returns `ok: true`
- public API responses come from a published snapshot, not an empty or unpublished state

## Operator Verification

Operator endpoints must remain protected by `x-operator-token`.

Minimum manual verification:

1. call `GET /operator/publications` without a token and confirm it is rejected
2. call an operator endpoint with the correct token and confirm it succeeds
3. confirm the public routes still do not expose unpublished run state

Latest confirmed operator validation:

- Fresh alpha review cycle completed on 2026-04-15:
  - fetch run `run_0d2b486b-91fd-4592-9507-629076e8cd83`
  - publish `publication_60a42984-3fd2-4e59-88c6-230e0801d78e`
  - replay run `run_dfe8d4e5-a6e4-4211-ae4a-47ddc5a74faa`
  - rollback `publication_307fa07c-4e7d-4bff-a498-ad2ea17694be`
- Post-deploy validation cycle completed on 2026-04-15 after task definition `:9` rolled out:
  - fetch run `run_f225c213-4c88-4095-9653-5e0d065add95`
  - publish `publication_4a8ab19f-1d2a-4b9b-b6c4-1ab2d610f80a`
  - replay run `run_bac1bec6-b4cc-467c-9f77-31e2832cf64c`
  - rollback `publication_ce4939b3-0fdf-4044-9677-062ee0ae49b1`
  - public stats returned to `publishedFromRunId=run_5d8880eb-ed95-4e08-b3aa-96437d5f45d9`
- Punjab public rollout completed on 2026-04-16 after task definition `:26` rolled out:
  - GitHub deploy run `24537940704` completed successfully on `main`
  - live Punjab fetch run `run_ff674e79-8752-4b4d-9b32-4c7a368d339c`
  - live Punjab publication `publication_7db9a015-68d0-4182-8c77-f221797c7c2c`
  - live Punjab snapshot `snapshot_09384231-203b-41ec-8fe7-a71e9c456b9d`
  - `/states/punjab` returned `200`
  - `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug punjab` passed with `districtCount=22`, `trendCount=1`, and CSV metadata parity confirmed
  - Punjab publish was executed through a one-off ECS task with `STATE_CODE=PB` because task definition `:26` still exposed Himachal-scoped operator HTTP routes
  - current `main` now includes state-aware operator routing plus state-scoped `release:prepublish`, `release:postpublish`, and `release:record`; the next live release cycle should verify that the manual ECS override is no longer needed after deploy
- State-aware live release verification completed on 2026-04-16 after task definition `:28` rolled out:
  - GitHub deploy run `24539107621` completed successfully on `main`
  - live Punjab fetch run `run_2e5ea2e1-ba95-4d62-9ea9-be14123b39cf` succeeded through `POST /operator/runs/fetch` with `stateCode=PB`
  - live Punjab publication `publication_8a5ddc6e-f520-4344-8161-76dc4dead033` succeeded through `POST /operator/runs/:runId/publish`
  - `GET /operator/publications?stateSlug=punjab` returned the Punjab publication history with the new publication active
  - state-scoped `release:prepublish`, `release:postpublish`, and `release:record` all succeeded when executed inside one-off ECS tasks on task definition `:28`
  - `GET /v1/states/punjab/stats` reflected `publishedAt=2026-04-16T23:32:07.721Z` and `publishedFromRunId=run_2e5ea2e1-ba95-4d62-9ea9-be14123b39cf`
  - `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug punjab` now exposes a cache-invalidity edge case: the public API moved to the new publication immediately, but `/states/punjab/data/districts.csv` initially returned a stale Cloudflare `HIT` response with the earlier `published_at` until a cache-busting request forced a `MISS`
- Cache-invalidity follow-up completed on 2026-04-17 after PR `#45` merged to `main`:
  - GitHub deploy run `24542633809` rolled the live service to task definition `:34` with Cloudflare purge credentials plus explicit public base URL wiring
  - the repo secret had to be corrected once because the initial `CLOUDFLARE_API_TOKEN` value was accidentally set to the whole shell command instead of the token string
  - stable Punjab CSV headers now return `Cache-Control: no-store, max-age=0, must-revalidate`, `CDN-Cache-Control: no-store`, and `cf-cache-status: BYPASS`
  - `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug punjab` now passes without cache-busting, with `csvMetadataParity=true` and `publicDataCacheProtected=true`
- Haryana internal live trial completed on 2026-04-17 after PR `#46` merged to `main`:
  - GitHub deploy run `24546133140` rolled the live service to task definition `:35`
  - live Haryana fetch run `run_171cccad-9fef-47cb-9cc1-c1ae4449fe4e` succeeded through `POST /operator/runs/fetch` with `stateCode=HR`
  - live Haryana publication `publication_0d8a736d-1c27-4ae3-8cba-c0593057e3d2` activated `snapshot_5f5af9cb-e6d9-4a09-9947-025244e21035`
  - replay from stored evidence produced `run_76e23910-ffd8-4dcc-a3be-3eda0b130356` and replay publication `publication_cc7b1068-b97e-470a-a079-570cad23061f`
  - rollback publication `publication_09613d9d-ae89-4543-9028-8f5d971df587` restored the original Haryana snapshot as the active internal publication
  - `GET /operator/publications?stateCode=HR` now shows the rollback publication active, while `https://nyaaywatch.in/states/haryana` and `https://nyaaywatch.in/v1/states/haryana/stats` both still return `404`

## Release Use

Before treating a deployment as the public alpha:

1. fill in this file with the actual live URL and resource names
2. run `docs/ALPHA_RELEASE_CHECKLIST.md`
3. confirm the domain cutover steps in `docs/DOMAIN_CUTOVER_CHECKLIST.md` if a custom domain is involved

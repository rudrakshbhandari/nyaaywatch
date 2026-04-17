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
- ECS task definition: `nyaaywatch-staging:54`
- Internal raw fetch schedule: `nyaaywatch-staging-weekday-internal-fetch`
- Internal raw fetch schedule ARN: `arn:aws:scheduler:ap-south-1:723951822728:schedule/default/nyaaywatch-staging-weekday-internal-fetch`
- Internal raw fetch schedule cadence: weekdays at `8:00 AM Asia/Kolkata`
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
- Deploy path: GitHub Actions auto-deploys every successful `main` merge by publishing a new ECR image, rolling the ECS service in place, and reconciling the weekday internal fetch schedule against the live task definition while reusing the existing scheduler role

Operational notes:

- Port `80` on the ALB redirects to `443`.
- The app itself redirects legacy `.com` host headers to the canonical `.in` hostname.
- Public browser-visible `.com -> .in` routing should be re-verified only if `nyaaywatch.com` or `www.nyaaywatch.com` are pointed at the ALB with matching ACM coverage.
- Direct `https://nyaaywatch-staging-964594065.ap-south-1.elb.amazonaws.com` checks will fail hostname validation because the certificate is for the public domain, not the raw ELB hostname.
- Use `https://nyaaywatch.in` for browser validation and the ALB DNS name for low-level AWS resource identification only.
- For heavier internal-only operator runs, use `npm run operator:staging -- --state <STATE_CODE> <command> ...` as the default lane so fetches execute inside a one-off ECS task instead of through Cloudflare.
- The live weekday internal fetch schedule currently targets `STATE_CODE=HP` and runs `fetch` only. It does not publish or change the public snapshot.
- Scheduler-role bootstrap and policy rewrites still require an IAM-capable operator run; GitHub Actions only updates the schedule target after bootstrap is complete.
- ALB plus `curl --connect-to` remains a recovery fallback if the ECS helper itself is unavailable.

### Public Alpha

- Domain: `https://nyaaywatch.in`
- Backing stack: `nyaaywatch-staging`
- Status: `live`
- Release path: verified `main` merges auto-roll the live ECS service through GitHub Actions
- Current public coverage:
  - unscoped default routes for Himachal Pradesh
  - explicit Punjab public routes at `/states/punjab` and `/v1/states/punjab/...`
  - explicit Haryana public routes at `/states/haryana` and `/v1/states/haryana/...`
  - explicit Tamil Nadu public routes at `/states/tamil-nadu` and `/v1/states/tamil-nadu/...`
- Current active Himachal publication: `publication_ce4939b3-0fdf-4044-9677-062ee0ae49b1`
- Current active Himachal published snapshot: `snapshot_8cda4026-d7da-43d1-a2c4-2e61fc717be7`
- Current Himachal source snapshot date: `2026-04-10`
- Current active Punjab publication: `publication_8a5ddc6e-f520-4344-8161-76dc4dead033`
- Current active Punjab published snapshot: `snapshot_35226b6d-2fac-49d6-9d53-7aa24b9387e5`
- Current Punjab source snapshot date: `2026-04-16`
- Current active Haryana publication: `publication_e57d5546-e9aa-4bee-a951-edeb2bc4789c`
- Current active Haryana published snapshot: `snapshot_68b8cf79-ee86-4644-a876-8222e2bce71a`
- Current Haryana source snapshot date: `2026-04-16`
- Current active Tamil Nadu publication: `publication_af06c306-b7e8-4c62-b4b8-e80f301f5b04`
- Current active Tamil Nadu published snapshot: `snapshot_7307527d-f5d1-4449-bba0-a3f21beafc97`
- Current Tamil Nadu source snapshot date: `2026-04-16`
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
curl -fsSL <base-url>/v1/states/haryana/stats
curl -fsSL <base-url>/v1/states/haryana/districts
curl -fsSL <base-url>/v1/states/haryana/trends
curl -fsSL <base-url>/v1/states/tamil-nadu/stats
curl -fsSL <base-url>/v1/states/tamil-nadu/districts
curl -fsSL <base-url>/v1/states/tamil-nadu/trends
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
- Parallel internal-state live trials completed on 2026-04-17 after PR `#50` merged to `main`:
  - GitHub deploy run `24548048035` rolled the live service to task definition `:39`
  - Uttarakhand fetch `run_cf76f87a-0090-4bdd-b6f5-2df5913c45bd`, publish `publication_d7ef7572-a8ef-4e2d-af90-6873162b667b`, replay `run_86b44e6e-41dc-4135-8a39-481f6c255658`, and rollback `publication_680b9cd9-b54c-4a97-926b-dbaac9256c98` all succeeded, and the public Uttarakhand routes still returned `404`
  - Rajasthan fetch `run_b8bf0aec-3bfb-48fd-b2bf-81b45ce62177`, publish `publication_75842a37-713a-4d45-8030-086141343db1`, replay `run_211368fd-7ef3-40e5-a8f9-426487f4499e`, and rollback `publication_90655c18-6088-44b7-9740-b4546a62242b` all succeeded, and the public Rajasthan routes still returned `404`
  - the first Uttar Pradesh fetch through `https://nyaaywatch.in/operator/runs/fetch` returned a Cloudflare `504`, but the origin still completed and persisted fetch run `run_0b2ea65b-4d28-4d7b-a72c-308187a4e096`
  - Uttar Pradesh publish `publication_dbf86893-c8b4-4587-813f-b624e009b9da`, replay `run_79cb8508-85fa-4d99-a3c5-d6243d95838d`, and rollback `publication_55a13942-b67d-4a89-826a-b0ae334a7807` then succeeded via the ALB-bypassed origin path, and the public Uttar Pradesh routes still returned `404`
  - this makes large-state operator-path durability the next operational gap, not multi-state extraction or publication correctness
- ECS-backed heavy-state follow-up completed on 2026-04-17 after PR `#54` merged to `main`:
  - GitHub deploy run `24554574390` rolled the live service to task definition `:43`
  - `npm run operator:staging -- --state UP fetch "UP ECS heavy-state proof cycle fetch"` succeeded as fetch run `run_a16bb291-e3fb-4238-8695-bc60e4d63a64`
- Weekday internal fetch scheduler enabled and smoke-tested on 2026-04-17:
  - recurring schedule `nyaaywatch-staging-weekday-internal-fetch` is enabled in EventBridge Scheduler with `cron(0 8 ? * MON-FRI *)` plus `Asia/Kolkata`
  - scheduler target role is `arn:aws:iam::723951822728:role/nyaaywatch-staging-internal-fetch-scheduler`
  - one-time smoke schedule `nyaaywatch-staging-internal-fetch-smoke-1776456368` launched ECS task `bb223b4991934e2ebc554cb9d2e933cb` with `startedBy=chronos-schedule/...`
  - the smoke task exited `0` and CloudWatch logs recorded completed fetch run `run_337a80ae-4980-415a-8585-d670e413dfed` with `qualityState=complete`
  - the live ECS helper completed with `sourceSnapshotAt=2026-04-16T00:00:00.000Z`, `qualityState=complete`, `districtCount=74`, and `pendingCases=11911564`
  - raw artifact `raw/staging/up/2026-04-16/run_a16bb291-e3fb-4238-8695-bc60e4d63a64-njdg-dashboard-html.json` and normalized artifact `normalize/staging/up/2026-04-16/run_a16bb291-e3fb-4238-8695-bc60e4d63a64-snapshot-candidate.json` were stored successfully
  - `https://nyaaywatch.in/states/uttar-pradesh` and `https://nyaaywatch.in/v1/states/uttar-pradesh/stats` both still returned `404`, so the heavier-state proof stayed internal-only
  - the durable heavy-state default is now the ECS-backed operator lane rather than the Cloudflare-fronted public operator path
- Haryana public rollout completed on 2026-04-17 after PR `#56` merged to `main`:
  - GitHub deploy run `24582480598` rolled the live service to task definition `:45`
  - live Haryana fetch run `run_bf1fd888-173c-4a58-9dde-f797b92f7c30`
  - live Haryana publication `publication_e57d5546-e9aa-4bee-a951-edeb2bc4789c`
  - live Haryana snapshot `snapshot_68b8cf79-ee86-4644-a876-8222e2bce71a`
  - `GET /operator/publications?stateCode=HR` now shows the Haryana public publication active with rollback target `publication_09613d9d-ae89-4543-9028-8f5d971df587`
  - `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug haryana` passed with `districtCount=22`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
  - live browser verification loaded `https://nyaaywatch.in/states/haryana` with the explicit Haryana route family, trust metadata, and supported-state navigation showing Himachal Pradesh, Punjab, and Haryana
- Tamil Nadu and Assam internal proof cycles completed on 2026-04-17 on task definition `:45`:
  - Tamil Nadu fetch `run_329a8b74-2b9d-4c33-ba2f-46b19186935c`, publish `publication_34aa96eb-f212-4cad-9412-086bfe3c41a6`, replay `run_c69af2d5-b2dd-455e-82aa-3a7125122d71`, replay publication `publication_4965e74e-97de-47b2-b16e-eb2a2ccca25a`, and rollback `publication_43eefb27-a754-4590-91f1-0e38d9e40705` all succeeded
  - Assam fetch `run_32e2194a-027d-4ec2-8d50-b3c282446b90`, publish `publication_688f053e-53a4-4662-9367-a4ffba4973ce`, replay `run_c28d9a91-0543-40b2-adac-1ca5e0c2e85d`, replay publication `publication_c8e143f6-61f4-4c1b-9423-b49e53b17399`, and rollback `publication_e6fcc230-9de5-42ed-9e29-1ed0fc287b8f` all succeeded
  - `GET /operator/publications?stateCode=TN` and `GET /operator/publications?stateCode=AS` show the rollback publications active
  - `https://nyaaywatch.in/states/tamil-nadu`, `https://nyaaywatch.in/v1/states/tamil-nadu/stats`, `https://nyaaywatch.in/states/assam`, and `https://nyaaywatch.in/v1/states/assam/stats` all returned `404`, so both states remained internal-only throughout
- Kerala and Meghalaya internal proof cycles completed on 2026-04-17 on task definition `:47`:
  - Kerala fetch `run_60fc22fb-a2b2-41e5-9bf5-f01b6e7b39e3`, publish `publication_4f53dbb3-7530-40ca-aeed-3a27bbd5b892`, replay `run_84af7110-13b1-4150-8be6-cc82e83a36c3`, replay publication `publication_ddd7c94d-d4c9-4cad-8da9-13ef1d0b8ba1`, and rollback `publication_dafbab89-af38-4a41-a006-9153f126e785` all succeeded
  - Meghalaya fetch `run_3dd14fff-0791-45b4-9bd7-27ce798cc850`, publish `publication_b1b1d691-d8bf-4e79-8d2d-119dff5b024c`, replay `run_5fda86c5-aefe-4e33-ae39-e25dac3f4830`, replay publication `publication_503248fe-3cc6-4b24-96e9-1317a4ba6001`, and rollback `publication_7337df86-24c6-4290-8ee4-2b740e5110af` all succeeded
  - `GET /operator/publications?stateCode=KL` and `GET /operator/publications?stateCode=ML` show the rollback publications active
  - `https://nyaaywatch.in/states/kerala`, `https://nyaaywatch.in/v1/states/kerala/stats`, `https://nyaaywatch.in/states/meghalaya`, and `https://nyaaywatch.in/v1/states/meghalaya/stats` all returned `404`, so both states remained internal-only throughout
- Tamil Nadu public rollout completed on 2026-04-17 after PR `#64` merged to `main`:
  - GitHub deploy run `24588602379` rolled the live service to task definition `:54`
  - live Tamil Nadu fetch run `run_d7f79d01-99c7-41b5-b87d-a4145438b3fa`
  - live Tamil Nadu publication `publication_af06c306-b7e8-4c62-b4b8-e80f301f5b04`
  - live Tamil Nadu snapshot `snapshot_7307527d-f5d1-4449-bba0-a3f21beafc97`
  - `GET /operator/publications?stateCode=TN` now shows the Tamil Nadu public publication active with rollback target `publication_43eefb27-a754-4590-91f1-0e38d9e40705`
  - `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug tamil-nadu` passed with `districtCount=38`, `trendCount=2`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
  - live browser verification loaded `https://nyaaywatch.in/states/tamil-nadu` with the explicit Tamil Nadu route family, published-snapshot trust text, and supported-state navigation showing Himachal Pradesh, Punjab, Haryana, and Tamil Nadu
- Weekday internal fetch deploy reconciliation hardened on 2026-04-17 after PRs `#60` and `#62` plus a deploy-role IAM update:
  - GitHub deploy run `24585688516` completed successfully on rerun after granting `scheduler:GetSchedule`, `scheduler:CreateSchedule`, `scheduler:UpdateSchedule`, and scheduler-role `iam:PassRole` to `nyaaywatch-github-deploy-role`
  - the live ECS service rolled to task definition `:52`
  - the recurring scheduler `nyaaywatch-staging-weekday-internal-fetch` now targets the same live task definition `:52`
  - the deploy path now keeps the weekday internal fetch schedule aligned with the latest ECS task definition after each successful `main` rollout

## Release Use

Before treating a deployment as the public alpha:

1. fill in this file with the actual live URL and resource names
2. run `docs/ALPHA_RELEASE_CHECKLIST.md`
3. confirm the domain cutover steps in `docs/DOMAIN_CUTOVER_CHECKLIST.md` if a custom domain is involved

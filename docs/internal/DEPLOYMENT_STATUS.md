# Deployment Status

Operational source of truth for where NyaayWatch is currently running and how to verify each environment.

Keep this file updated whenever an environment stack changes, a public alpha URL is assigned, a dedicated staging URL is assigned, or a domain cutover is completed.

Use this document as the live environment map. For routine release go/no-go decisions, use `docs/ALPHA_RELEASE_CHECKLIST.md` plus `docs/RELEASE_POLICY.md`. Use `docs/DOMAIN_CUTOVER_CHECKLIST.md` only for future hostname, certificate, or DNS changes.

## Environment Model

NyaayWatch should operate with four distinct lanes:

- **Local development**: local Node, PostgreSQL, and LocalStack S3 for implementation and fixture-backed operator checks.
- **Pull request previews**: fixture-backed public web previews for copy, UI, and responsive review. Previews do not expose operator routes or touch live evidence.
- **Dedicated AWS staging**: optional isolated rehearsal environment for release checks, migration rehearsal, operator-flow validation, alarm verification, and destructive rollback/replay testing before public release work. Provision on demand with `infra/aws/staging/deploy-stack.sh`; do not keep it always-on for alpha cost.
- **Production / public alpha**: `https://nyaaywatch.in`, serving public snapshots and live operator schedules from the reality-named production stack `nyaaywatch-production`.

Important current-state note: production traffic runs through `nyaaywatch-production`. The dedicated `nyaaywatch-staging` stack was deleted on `2026-07-09` for cost; recreate it only when a real AWS rehearsal is needed.

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

### Dedicated AWS Staging

- Status: `retired` (CloudFormation stack deleted `2026-07-09` for alpha cost)
- Former stack name: `nyaaywatch-staging`
- Former URL: `https://staging.nyaaywatch.in` (DNS may still exist; origin is gone until the stack is re-provisioned)
- Intended use when provisioned: release rehearsal, migration rehearsal, operator-flow validation, alarm verification, and destructive rollback/replay testing without changing `https://nyaaywatch.in`
- Required rule: staging data and artifacts must stay isolated from production data, even if the same CloudFormation template is reused
- Retirement snapshot: `nyaaywatch-staging-retire-20260709-0648` (manual pre-delete). CloudFormation `DeletionPolicy: Snapshot` also retains an automatic final RDS snapshot.
- Retained audit artifacts (S3 `DeletionPolicy: Retain`): `nyaaywatch-staging-artifacts-723951822728`, `nyaaywatch-staging-canary-723951822728`, plus older bridge leftovers `nyaaywatch-stage-staging-artifacts-723951822728` and `nyaaywatch-stage-staging-canary-723951822728`
- ACM certificate ARN (kept in account): `arn:aws:acm:ap-south-1:723951822728:certificate/12a69434-d2e6-4a6f-a42e-d7bf64797870`
- Re-provision: deploy with `RECLAIMED_STAGING_NAME=true` via `infra/aws/staging/deploy-stack.sh`, point Cloudflare `staging` at the new ALB, seed a publication if needed, then run `npm run release:verify -- --base-url=https://staging.nyaaywatch.in`. Do not enable staging EventBridge fetch schedules unless rehearsing scheduler behavior on purpose.
- Current blocker: none for production. Staging is intentionally absent until the next rehearsal.

### Production Backing Stack

- Stack name: `nyaaywatch-production`
- Region: `ap-south-1`
- Public URL: `http://nyaaywatch-production-874934657.ap-south-1.elb.amazonaws.com`
- Public hostname for browser checks: `https://nyaaywatch.in`
- ECS service: `nyaaywatch-production-Service-09u122KrBSOg`
- ECS task definition: deploy-managed `nyaaywatch-production:<revision>`; use the schedule verifier or ECS service description for the current revision
- Internal raw fetch schedules:
  - lower-court states: `nyaaywatch-production-weekday-internal-fetch` at `8:00 AM Asia/Kolkata`
  - Supreme Court: `nyaaywatch-production-supreme-court-internal-fetch` at `8:10 AM Asia/Kolkata`
  - reviewed High Courts: `nyaaywatch-production-high-courts-internal-fetch` at `8:20 AM Asia/Kolkata`
  - publish-pending sweep: `nyaaywatch-production-publish-pending-sweep` at `8:30 AM Asia/Kolkata`
  - public alpha ops smoke monitor: `nyaaywatch-production-public-alpha-ops-monitor` hourly (`cron(0 * * * ? *)` Asia/Kolkata)
- Internal raw fetch schedule scope policy:
  - lower-court geographies: profiles returned by `listInternalFetchStateProfiles()`; all 36 lower-court state/Union Territory profiles are included after April 23, 2026 proof cycles
  - Supreme Court: the single configured Supreme Court profile
  - High Courts: only profiles whose `sourceReviewStatus` is `reviewed`
- ALB DNS name: `nyaaywatch-production-874934657.ap-south-1.elb.amazonaws.com`
- ACM certificate ARN: `arn:aws:acm:ap-south-1:723951822728:certificate/c55eb076-1c4c-4d94-a29b-454100e3ebc7`
- CloudWatch log group: `/ecs/nyaaywatch-production`
- CloudWatch dashboard: `nyaaywatch-production`
- Alarm topic ARN: `arn:aws:sns:ap-south-1:723951822728:nyaaywatch-production-alerts`
- ALB access logs: retained under `s3://nyaaywatch-production-artifacts-723951822728/alb-access-logs/AWSLogs/723951822728/` after the production stack is redeployed with the current template
- Public-ingress WAF: regional web ACL `nyaaywatch-production-public-ingress` after the production stack is redeployed with the current template; blocks non-Cloudflare source IPs at the origin and applies a default `1200` requests per 5 minutes limit to forwarded clients using `CF-Connecting-IP`
- CloudWatch alarms:
  - `nyaaywatch-production-health-endpoint`
  - `nyaaywatch-production-alb-target-5xx`
  - `nyaaywatch-production-app-errors`
  - `nyaaywatch-production-public-alpha-ops`
- Artifacts bucket: `nyaaywatch-production-artifacts-723951822728`
- Database endpoint: `nyaaywatch-production-stagingdatabase-g3twsdpyvdw2.ct0sogc8a838.ap-south-1.rds.amazonaws.com`
- Intended use: production public-alpha serving, scheduled internal fetches, public-alpha ops monitoring, release verification, and release-scoped operator actions
- Deploy path: GitHub Actions auto-deploys every successful `main` merge by publishing a new ECR image, rolling the ECS service in place, keeping production desired count at `1` by default (set `PRODUCTION_DESIRED_COUNT=2` for an HA window), and reconciling the lower-court, Supreme Court, reviewed-High-Court, publish-pending, and public-alpha smoke monitor schedules against the live task definition while reusing the production scheduler role. CloudFormation-only changes such as WAF attachment and ALB access logging still require `infra/aws/staging/deploy-stack.sh` or an equivalent reviewed stack update.
- Cost posture (`2026-07-09`): production ECS desired count `1`; monthly cost budgets `$80` per environment; dedicated staging stack deleted; public-alpha ops monitor hourly (was every 30 minutes). Production fetch and publish-pending schedules stay daily.
- Last observation check: `2026-04-29T00:51:30Z`; production preflight passed with both `nyaaywatch-staging` and `nyaaywatch-production` in `UPDATE_COMPLETE`, public `release:verify` passed for `https://nyaaywatch.in`, the public-alpha ops sweep reported `62/62` healthy targets with no stale snapshots, no daily-fetch lag, and no failures, all production schedules targeted `nyaaywatch-production:11`, and the four production CloudWatch alarms were `OK`.

Operational notes:

- This stack serves production. Do not use it as a general staging sandbox.
- The April 28, 2026 cutover restored this stack from manual RDS snapshot `nyaaywatch-prod-cutover-20260428-0019`, synced artifacts from the legacy production bucket, moved Cloudflare DNS to the production ALB, and created production-named schedules. Rollback is now through normal production recovery paths rather than DNS-first rollback to the old staging stack.
- Port `80` on the ALB redirects to `443`.
- The app itself redirects legacy `.com` host headers to the canonical `.in` hostname.
- Public browser-visible `.com -> .in` routing should be re-verified only if `nyaaywatch.com` or `www.nyaaywatch.com` are pointed at the ALB with matching ACM coverage.
- Direct `https://nyaaywatch-production-874934657.ap-south-1.elb.amazonaws.com` checks will fail hostname validation because the certificate is for the public domain, not the raw ELB hostname.
- Use `https://nyaaywatch.in` for browser validation and the ALB DNS name for low-level AWS resource identification only.
- For heavier internal-only operator runs, use `npm run operator:production -- --state <STATE_CODE> <command> ...` as the default lane so fetches execute inside a one-off ECS task instead of through Cloudflare.
- On April 23, 2026, all 8 UT/UT-style lower-court profiles cleared live `fetch -> inspect -> publish -> replay -> rollback` proof cycles through the legacy `npm run operator:staging` command; future production runs should use `npm run operator:production`.
- The documented internal raw-fetch policy is to run lower-court geography fetches every day at `8:00 AM Asia/Kolkata`, Supreme Court fetches every day at `8:10 AM Asia/Kolkata`, and reviewed High Court fetches every day at `8:20 AM Asia/Kolkata`. None of these schedules publish or change the public snapshot automatically.
- The public-alpha monitor now runs hourly through a one-off ECS task, hits the configured `PUBLIC_BASE_URL` with `--target-set=smoke`, and emits a dedicated alert log line if it detects parity drift, stale public snapshots, or daily internal fetch lag in representative public surfaces. The full all-target sweep still runs through the daily GitHub watchdog and manual release-window checks.
- Scheduler-role bootstrap and policy rewrites still require an IAM-capable operator run; GitHub Actions only updates the schedule target after bootstrap is complete.
- After the production public-ingress WAF is enabled, ALB plus `curl --connect-to` is blocked for non-Cloudflare source IPs. Use ECS-backed operator helpers first; only use direct-origin checks during a controlled recovery where the WAF has been explicitly disabled or allowlisted.

### Retired Temporary Staging Bridge

- Stack name: `nyaaywatch-staging-v2`
- Status: CloudFormation stack deleted after `staging.nyaaywatch.in` was repointed to the reclaimed `nyaaywatch-staging` stack.
- Former ALB DNS name: `nyaaywatch-stage-staging-579542294.ap-south-1.elb.amazonaws.com`
- Former purpose: temporary isolated bridge while the `nyaaywatch-staging` name was still held for rollback.
- Retained artifacts: `nyaaywatch-stage-staging-artifacts-723951822728`, `nyaaywatch-stage-staging-canary-723951822728`, and final RDS snapshot `nyaaywatch-staging-v2-snapshot-stagingdatabase-s1hxakakdlnj`

### Public Alpha

- Domain: `https://nyaaywatch.in`
- Backing stack: `nyaaywatch-production`
- Status: `live`
- Release path: verified `main` merges auto-roll the live ECS service through GitHub Actions
- Current public coverage:
  - unscoped default routes for Himachal Pradesh
  - narrow Supreme Court beta routes at `/supreme-court` and `/v1/supreme-court/...`
  - narrow public High Court beta routes under `/high-courts/...` and `/v1/high-courts/...` for Himachal High Court, High Court of Andhra Pradesh, Bombay High Court, Calcutta High Court, High Court for State of Telangana, High Court of Delhi, High Court of Gujarat, Gauhati High Court, High Court of Jammu & Kashmir and Ladakh, High Court of Kerala, Madras High Court, High Court of Madhya Pradesh, High Court of Punjab and Haryana, Allahabad High Court, and Rajasthan High Court
  - explicit Punjab public routes at `/states/punjab` and `/v1/states/punjab/...`
  - explicit Haryana public routes at `/states/haryana` and `/v1/states/haryana/...`
  - explicit Tamil Nadu public routes at `/states/tamil-nadu` and `/v1/states/tamil-nadu/...`
  - explicit Assam public routes at `/states/assam` and `/v1/states/assam/...`
  - explicit Telangana public routes at `/states/telangana` and `/v1/states/telangana/...`
  - explicit Kerala public routes at `/states/kerala` and `/v1/states/kerala/...`
  - explicit Meghalaya public routes at `/states/meghalaya` and `/v1/states/meghalaya/...`
  - explicit Karnataka public routes at `/states/karnataka` and `/v1/states/karnataka/...`
  - explicit Tripura public routes at `/states/tripura` and `/v1/states/tripura/...`
  - explicit Nagaland public routes at `/states/nagaland` and `/v1/states/nagaland/...`
  - explicit Andhra Pradesh public routes at `/states/andhra-pradesh` and `/v1/states/andhra-pradesh/...`
  - explicit Arunachal Pradesh public routes at `/states/arunachal-pradesh` and `/v1/states/arunachal-pradesh/...`
  - explicit Manipur public routes at `/states/manipur` and `/v1/states/manipur/...`
  - explicit Uttarakhand public routes at `/states/uttarakhand` and `/v1/states/uttarakhand/...`
  - explicit Rajasthan public routes at `/states/rajasthan` and `/v1/states/rajasthan/...`
  - explicit Uttar Pradesh public routes at `/states/uttar-pradesh` and `/v1/states/uttar-pradesh/...`
  - explicit Madhya Pradesh public routes at `/states/madhya-pradesh` and `/v1/states/madhya-pradesh/...`
  - explicit Maharashtra public routes at `/states/maharashtra` and `/v1/states/maharashtra/...`
  - explicit Bihar public routes at `/states/bihar` and `/v1/states/bihar/...`
  - explicit Gujarat public routes at `/states/gujarat` and `/v1/states/gujarat/...`
  - explicit Odisha public routes at `/states/odisha` and `/v1/states/odisha/...`
  - explicit West Bengal public routes at `/states/west-bengal` and `/v1/states/west-bengal/...`
  - explicit Jharkhand public routes at `/states/jharkhand` and `/v1/states/jharkhand/...`
  - explicit Chhattisgarh public routes at `/states/chhattisgarh` and `/v1/states/chhattisgarh/...`
  - explicit Goa public routes at `/states/goa` and `/v1/states/goa/...`
  - explicit Sikkim public routes at `/states/sikkim` and `/v1/states/sikkim/...`
  - explicit Mizoram public routes at `/states/mizoram` and `/v1/states/mizoram/...`
  - explicit Andaman and Nicobar Islands public routes at `/states/andaman-and-nicobar-islands` and `/v1/states/andaman-and-nicobar-islands/...`
  - explicit Chandigarh public routes at `/states/chandigarh` and `/v1/states/chandigarh/...`
  - explicit Delhi public routes at `/states/delhi` and `/v1/states/delhi/...`
  - explicit Jammu and Kashmir public routes at `/states/jammu-and-kashmir` and `/v1/states/jammu-and-kashmir/...`
  - explicit Ladakh public routes at `/states/ladakh` and `/v1/states/ladakh/...`
  - explicit Lakshadweep public routes at `/states/lakshadweep` and `/v1/states/lakshadweep/...`
  - explicit Puducherry public routes at `/states/puducherry` and `/v1/states/puducherry/...`
  - explicit Dadra and Nagar Haveli and Daman and Diu public routes at `/states/dadra-and-nagar-haveli-and-daman-and-diu` and `/v1/states/dadra-and-nagar-haveli-and-daman-and-diu/...`
- Current active Himachal Pradesh publication: `publication_ce4939b3-0fdf-4044-9677-062ee0ae49b1`
- Current active Himachal Pradesh published snapshot: `snapshot_8cda4026-d7da-43d1-a2c4-2e61fc717be7`
- Current Himachal Pradesh source snapshot date: `2026-04-10`
- Current active Himachal High Court publication: `publication_e66cb2f9-b307-46d6-b00c-51b01e901fee`
- Current active Himachal High Court published snapshot: `snapshot_eacb324b-2572-4ce6-84a9-1217abf2d14b`
- Current Himachal High Court publication action: `rollback`
- Current Himachal High Court reference date: `2026-04-19T03:39:31.512Z`
- Current Himachal High Court reference-date kind: `captured_at`
- Current Himachal High Court published-from run: `run_288288e1-f32b-45d1-86cd-c2384bba38ac`
- Current Himachal High Court methodology version: `2026.04-high-court-draft`
- Current active Gujarat High Court publication: `publication_33428d3e-cc95-4c3c-9ace-643528cfb4a7`
- Current active Gujarat High Court published snapshot: `snapshot_b114637b-e1cc-4550-a44b-66af2f14eaff`
- Current Gujarat High Court publication action: `rollback`
- Current Gujarat High Court reference date: `2026-04-19T18:59:11.819Z`
- Current Gujarat High Court reference-date kind: `captured_at`
- Current Gujarat High Court published-from run: `run_a56b9376-cb93-4e1a-968c-0a99840b500c`
- Current Gujarat High Court methodology version: `2026.04-high-court-draft`
- Current active Madhya Pradesh High Court publication: `publication_ff8a3e1c-c515-4bd3-a141-0ec3825f76b4`
- Current active Madhya Pradesh High Court published snapshot: `snapshot_636a67c4-a5bc-4841-9b45-4e306d8cb3d0`
- Current Madhya Pradesh High Court publication action: `rollback`
- Current Madhya Pradesh High Court reference date: `2026-04-19T18:59:11.663Z`
- Current Madhya Pradesh High Court reference-date kind: `captured_at`
- Current Madhya Pradesh High Court published-from run: `run_8526bedf-df11-46a0-a394-9379ae4d1547`
- Current Madhya Pradesh High Court methodology version: `2026.04-high-court-draft`
- Current active Uttar Pradesh High Court publication: `publication_91726f20-da84-4401-9da0-18c5ad711694`
- Current active Uttar Pradesh High Court published snapshot: `snapshot_c0d74fe7-6755-467e-86be-90424446a514`
- Current Uttar Pradesh High Court publication action: `rollback`
- Current Uttar Pradesh High Court reference date: `2026-04-19T03:38:57.761Z`
- Current Uttar Pradesh High Court reference-date kind: `captured_at`
- Current Uttar Pradesh High Court published-from run: `run_3c040f94-6c45-4b0a-a17d-45f7ad418abe`
- Current Uttar Pradesh High Court methodology version: `2026.04-high-court-draft`
- Current active Rajasthan High Court publication: `publication_40ac60e4-bb28-4628-b83d-2380d9dcf01f`
- Current active Rajasthan High Court published snapshot: `snapshot_03ac0bb4-ba77-4d92-9b96-478983aadfa9`
- Current Rajasthan High Court publication action: `rollback`
- Current Rajasthan High Court reference date: `2026-04-19T03:39:10.250Z`
- Current Rajasthan High Court reference-date kind: `captured_at`
- Current Rajasthan High Court published-from run: `run_bdc31094-2d40-4960-af99-13d2d803cf0c`
- Current Rajasthan High Court methodology version: `2026.04-high-court-draft`
- Current active Supreme Court publication: `publication_4dbc4cab-b2cd-4021-a083-3e016dc7929a`
- Current active Supreme Court published snapshot: `snapshot_fee1e8ee-b67e-4c95-aa1b-a94b0ea0b486`
- Current Supreme Court publication action: `rollback`
- Current Supreme Court reference date: `2026-04-19T07:06:34.049Z`
- Current Supreme Court reference-date kind: `captured_at`
- Current Supreme Court published-from run: `run_92990afc-1acd-4d37-b6d5-69dc95a1d933`
- Current Supreme Court methodology version: `2026.04-supreme-court-draft`
- Current active Punjab publication: `publication_8a5ddc6e-f520-4344-8161-76dc4dead033`
- Current active Punjab published snapshot: `snapshot_35226b6d-2fac-49d6-9d53-7aa24b9387e5`
- Current Punjab source snapshot date: `2026-04-16`
- Current active Haryana publication: `publication_e57d5546-e9aa-4bee-a951-edeb2bc4789c`
- Current active Haryana published snapshot: `snapshot_68b8cf79-ee86-4644-a876-8222e2bce71a`
- Current Haryana source snapshot date: `2026-04-16`
- Current active Tamil Nadu publication: `publication_af06c306-b7e8-4c62-b4b8-e80f301f5b04`
- Current active Tamil Nadu published snapshot: `snapshot_7307527d-f5d1-4449-bba0-a3f21beafc97`
- Current Tamil Nadu source snapshot date: `2026-04-16`
- Current active Assam publication: `publication_111cc225-f1a6-455d-8d7e-fd6af06ed597`
- Current active Assam published snapshot: `snapshot_f296e9bb-fc95-476e-9f79-1bcd3ff1f1c7`
- Current Assam source snapshot date: `2026-04-17`
- Current active Telangana publication: `publication_7691e5be-23b5-46ca-9aff-dd84148b7e8b`
- Current active Telangana published snapshot: `snapshot_c350559b-947a-40ac-9dd4-daea74f64218`
- Current Telangana source snapshot date: `2026-04-17`
- Current active Kerala publication: `publication_4fff0bca-7b58-49d1-992d-a113c43f577a`
- Current active Kerala published snapshot: `snapshot_99d7ad98-ff3c-40e2-9922-e4661998e839`
- Current Kerala source snapshot date: `2026-04-17`
- Current active Meghalaya publication: `publication_72eff473-ec6f-4f28-b4d6-fd1cffef04e5`
- Current active Meghalaya published snapshot: `snapshot_4b2e5621-0336-41aa-a492-3163e57cad1a`
- Current Meghalaya source snapshot date: `2026-04-16`
- Current active Karnataka publication: `publication_c58870a4-f378-4848-a8ce-ae38fb62f885`
- Current active Karnataka published snapshot: `snapshot_87bd1945-6b36-415f-965e-8c06cf60a989`
- Current Karnataka source snapshot date: `2026-04-16`
- Current active Tripura publication: `publication_a2308b8b-946e-4725-900e-14e638fe85dd`
- Current active Tripura published snapshot: `snapshot_73cd7146-7d74-41e0-85a5-f352baa439df`
- Current Tripura source snapshot date: `2026-04-17`
- Current active Nagaland publication: `publication_b01df802-1d04-409b-b608-55500e1b47a9`
- Current active Nagaland published snapshot: `snapshot_f73774d4-0f6f-473f-9eda-21e5cd454050`
- Current Nagaland source snapshot date: `2026-04-17`
- Current active Andhra Pradesh publication: `publication_b090f61a-3762-4bf5-8529-36b331b6e362`
- Current active Andhra Pradesh published snapshot: `snapshot_e0ec4181-cc09-46e5-a606-39a8c54bd815`
- Current Andhra Pradesh source snapshot date: `2026-04-16`
- Current active Arunachal Pradesh publication: `publication_ded2b9e1-f28a-4ead-90c4-1ba03a9890b0`
- Current active Arunachal Pradesh published snapshot: `snapshot_0daffe74-e0ec-46f0-89b1-bc3e4177392f`
- Current Arunachal Pradesh source snapshot date: `2026-04-16`
- Current active Manipur publication: `publication_0276261b-85da-4b6d-8fab-1d96a7aa3b02`
- Current active Manipur published snapshot: `snapshot_6fe0c465-2714-4134-ad30-33ada9b559a5`
- Current Manipur source snapshot date: `2026-04-16`
- Current active Uttarakhand publication: `publication_5463d029-d19a-4ed4-8271-57bb3dfc5343`
- Current active Uttarakhand published snapshot: `snapshot_e4914e8d-061f-4d10-93d0-728c201dbef8`
- Current Uttarakhand source snapshot date: `2026-04-16`
- Current active Rajasthan publication: `publication_fe0f7c25-a719-4120-bab4-8427163cd311`
- Current active Rajasthan published snapshot: `snapshot_eede344a-7518-48ec-b5f0-adbadddd5805`
- Current Rajasthan source snapshot date: `2026-04-16`
- Current active Uttar Pradesh publication: `publication_c05f662d-560f-4849-8750-37d92aa00e98`
- Current active Uttar Pradesh published snapshot: `snapshot_4047739c-44a3-4100-abfc-59baa6dfaa92`
- Current Uttar Pradesh source snapshot date: `2026-04-16`
- Current active Madhya Pradesh publication: `publication_fb5fccde-e81a-4c14-ad07-e91a810eb678`
- Current active Madhya Pradesh published snapshot: `snapshot_8f56eec9-10ec-48a2-bac5-b2a8fe589665`
- Current Madhya Pradesh source snapshot date: `2026-04-16`
- Current active Maharashtra publication: `publication_7a82419f-059a-456c-8797-bb33dbf5ab89`
- Current active Maharashtra published snapshot: `snapshot_fc9ed37f-a226-4abe-98e7-ed2e2d025be3`
- Current Maharashtra source snapshot date: `2026-04-16`
- Current active Bihar publication: `publication_1f5bd2f7-88a7-40b6-8e38-d55c1026ee86`
- Current active Bihar published snapshot: `snapshot_cf06d451-ccb0-414f-b5ce-de087d531577`
- Current Bihar source snapshot date: `2026-04-16`
- Current active Gujarat publication: `publication_b6092d4c-e9e4-483d-bb7e-2669adb52583`
- Current active Gujarat published snapshot: `snapshot_bbfa098b-3bc4-4170-8042-76fbdab832b6`
- Current Gujarat source snapshot date: `2026-04-16`
- Current active Odisha publication: `publication_bde17d21-e0fe-409a-9981-37ed7784e133`
- Current active Odisha published snapshot: `snapshot_f4c1c022-7977-4051-896c-8271e52fc3e1`
- Current Odisha source snapshot date: `2026-04-16`
- Current active West Bengal publication: `publication_df487011-4eaa-4b43-b127-166efd0866f7`
- Current active West Bengal published snapshot: `snapshot_cecd7183-b7e6-440e-8f85-f477b73b5acf`
- Current West Bengal source snapshot date: `2026-04-18`
- Current active Jharkhand publication: `publication_5c30543e-2094-4616-aff3-b17ade4254a2`
- Current active Jharkhand published snapshot: `snapshot_582d5802-ca16-47db-bb48-5662f8666c01`
- Current Jharkhand source snapshot date: `2026-04-16`
- Current active Chhattisgarh publication: `publication_2400d34a-2320-483e-866d-f529b4b81172`
- Current active Chhattisgarh published snapshot: `snapshot_ef3bc9f9-4aaa-4d9a-92cd-c4bcf34e1310`
- Current Chhattisgarh source snapshot date: `2026-04-18`
- Current active Goa publication: `publication_f55b59d8-e47a-4159-b166-ea89b8af29d4`
- Current active Goa published snapshot: `snapshot_7ba88b90-2d9a-4a68-9d98-b4aa026348a1`
- Current Goa source snapshot date: `2026-04-16`
- Current active Sikkim publication: `publication_257083da-bd8c-4efc-93f1-6837905c177f`
- Current active Sikkim published snapshot: `snapshot_dccb153e-60f9-4c6a-8ece-88fa426a7a37`
- Current Sikkim source snapshot date: `2026-04-16`
- Current active Mizoram publication: `publication_468cfd50-4661-43e5-b4a4-bce047b46618`
- Current active Mizoram published snapshot: `snapshot_054aff0e-a39d-4583-8af8-f1a60194f7d9`
- Current Mizoram source snapshot date: `2026-04-16`
- Public methodology version: `2026.04-alpha`

## How To Retrieve The Production Backing Stack URL

If the production backing stack URL is not already recorded above, retrieve it from CloudFormation:

```bash
aws cloudformation describe-stacks \
  --stack-name nyaaywatch-production \
  --region ap-south-1 \
  --query "Stacks[0].Outputs"
```

Look for:

- `ServiceUrl`
- `ArtifactsBucketName`
- `DatabaseEndpoint`
- `LogGroupName`

Then write those values back into this file in the same PR or deployment change.

## Production Cutover Preflight

Before provisioning or reviewing a parallel `nyaaywatch-production` stack, run the read-only preflight:

```bash
npm run infra:production-preflight
```

The preflight checks the current production backing stack is in a stable terminal CloudFormation status, checks its required outputs, confirms whether `nyaaywatch-production` already exists, and verifies `https://nyaaywatch.in/health`. It is intentionally non-mutating: it does not deploy CloudFormation, roll ECS, change DNS, rename resources, or reconcile schedules.

If a target `nyaaywatch-production` stack already exists, the preflight requires a stable terminal stack status and the same required output interface before it exits non-zero unless `ALLOW_EXISTING_TARGET_STACK=true` is set after manual review.

Before any mutating `nyaaywatch-production` work, also run:

```bash
npm run infra:production-cutover-inventory
```

Use that output with `docs/PRODUCTION_CUTOVER_RUNBOOK.md` to record the current ECS image, runtime bucket/secret bindings, schedule targets, and target-stack status before choosing a data bootstrap path.

## Minimum Live Verification

Run these checks against the current public production URL. Once dedicated staging exists, run the same shape against staging before production release work:

```bash
export OPERATOR_API_TOKEN=...
npm run ops:verify-public-alpha -- --base-url=<base-url>
curl -fsSL <base-url>/health
curl -fsSL <base-url>/v1/stats/himachal
curl -fsSL <base-url>/v1/districts
curl -fsSL <base-url>/v1/trends
for state in punjab haryana tamil-nadu assam telangana kerala meghalaya karnataka tripura nagaland andhra-pradesh arunachal-pradesh manipur uttarakhand rajasthan uttar-pradesh madhya-pradesh maharashtra bihar gujarat odisha west-bengal jharkhand chhattisgarh goa sikkim mizoram; do
  curl -fsSL <base-url>/v1/states/$state/stats
  curl -fsSL <base-url>/v1/states/$state/districts
  curl -fsSL <base-url>/v1/states/$state/trends
done
```

Expected:

- `/health` returns `ok: true`
- public API responses come from a published snapshot, not an empty or unpublished state
- `npm run ops:verify-public-alpha` stays green across every public target by default and fails if any state, High Court, or Supreme Court surface has parity drift, a stale snapshot, or a latest successful internal fetch run old enough to imply the daily internal fetch cadence is slipping. Use `--target-set=smoke` only for low-blast-radius incident checks.
- the CloudWatch alarm `nyaaywatch-production-public-alpha-ops` stays `OK`; if it flips to `ALARM`, inspect the matching `NYAAYWATCH_PUBLIC_ALPHA_OPS_ALERT=` line in `/ecs/nyaaywatch-production`
- `.github/workflows/ops-watchdog.yml` now runs the public-alpha sweep plus `npm run ops:verify-internal-fetch-schedule` on a daily schedule, loading `OPERATOR_API_TOKEN` from the live `OperatorApiTokenSecretArn` stack output instead of scraping task-definition env, opening or updating a durable GitHub issue on failure, and publishing a first-incident SNS alert through `AlarmTopicArn`

## Operator Verification

Operator endpoints must remain protected by `x-operator-token`.

Minimum manual verification:

1. call `GET /operator/publications` without a token and confirm it is rejected
2. call an operator endpoint with the correct token and confirm it succeeds
3. confirm the public routes still do not expose unpublished run state

Latest confirmed operator validation:

- Jammu & Kashmir and Ladakh High Court internal proof completed on 2026-04-23 before public-beta promotion:
  - the common High Court operator namespace remained auth-protected under `/operator/high-courts/jammu-kashmir-and-ladakh/...`
  - live High Court fetch run `run_e036f9ac-f0d2-4e73-b7c3-8017a054d677` completed successfully
  - live publication `publication_2957c01d-b451-4ae8-98a7-ecfe241d4297` created `snapshot_164f1f63-2d04-4685-b8ef-33261bdb064d`
  - replay run `run_3caa55b9-8e1a-4b50-8a45-58afbcf974b9` created publication `publication_93ca29e7-651b-430e-b564-7386cb50465c`
  - rollback publication `publication_e183dc01-887e-4b02-8c41-fd9e58ab471e` restored the initial publication chain and left `snapshot_164f1f63-2d04-4685-b8ef-33261bdb064d` active
  - `npm run high-court:readiness -- --base-url=https://nyaaywatch.in --court-slug=jammu-kashmir-and-ladakh` returned `runCount=2`, `publicationCount=3`, `replayedRunCount=1`, `rollbackCount=1`, `canonicalScopeAligned=true`, and `internalProofBarSatisfied=true`
  - before the later public-beta promotion, `GET /high-courts/jammu-kashmir-and-ladakh` and `GET /v1/high-courts/jammu-kashmir-and-ladakh/stats` returned `404`, confirming the proof cycle did not accidentally expose the court
  - active internal snapshot stats are `pendingTotalCases=43849`, `institutedLastMonthTotalCases=1010`, and `disposedLastMonthTotalCases=781`
- Supreme Court public beta exposure completed on 2026-04-19 after PR `#110` merged and GitHub deploy run `24624392748` rolled the live service to task definition `:98`:
  - the already-proven active Supreme Court publication `publication_4dbc4cab-b2cd-4021-a083-3e016dc7929a` became publicly reachable under `/supreme-court`
  - live route verification returned `200` for `/supreme-court`, `/supreme-court/data`, `/supreme-court/methodology`, `/supreme-court/api`, `/v1/supreme-court/stats`, and `/v1/supreme-court/trends`
  - `GET /operator/supreme-court` still returned `401` without a token, preserving the operator auth boundary after the public launch
  - authenticated `GET /operator/supreme-court/publications` showed `publication_4dbc4cab-b2cd-4021-a083-3e016dc7929a` active with `snapshot_fee1e8ee-b67e-4c95-aa1b-a94b0ea0b486` and `publishedFromRunId=run_92990afc-1acd-4d37-b6d5-69dc95a1d933`
  - the active public Supreme Court snapshot now carries `referenceDateAt=2026-04-19T07:06:34.049Z`, `referenceDateKind=captured_at`, `sourceSnapshotAt=null`, and `publishedAt=2026-04-19T07:06:42.130Z`
  - active public Supreme Court stats are `pendingTotalCases=94158`, `institutedLastMonthTotalCases=6148`, `disposedLastMonthTotalCases=4552`, and the live trends API reports `trendCount=2`
- Supreme Court second internal proof cycle completed on 2026-04-19 after PR `#108` merged and GitHub deploy run `24623340754` rolled the live service to task definition `:96`:
  - the internal Supreme Court operator namespace remained auth-protected under `/operator/supreme-court/...`
  - `GET /operator/supreme-court` returned `401` without a token and `200` with the operator token
  - `GET /supreme-court` still returned `404`, confirming the public route family remained dark after the second window
  - live Supreme Court fetch run `run_92990afc-1acd-4d37-b6d5-69dc95a1d933` completed successfully
  - live Supreme Court publication `publication_a4af147e-0495-40ae-8359-5d2775da3c8a` created `snapshot_fee1e8ee-b67e-4c95-aa1b-a94b0ea0b486`
  - live Supreme Court replay run `run_e9572b2a-bb76-4318-885d-23b04d776eea` created publication `publication_2321561c-ccdb-40f3-ba2f-ae55eadecae7`
  - live Supreme Court rollback `publication_4dbc4cab-b2cd-4021-a083-3e016dc7929a` restored the second-window publication chain and left `snapshot_fee1e8ee-b67e-4c95-aa1b-a94b0ea0b486` active
  - the active internal Supreme Court snapshot now carries `referenceDateAt=2026-04-19T07:06:34.049Z`, `referenceDateKind=captured_at`, `sourceSnapshotAt=null`, and `publishedAt=2026-04-19T07:06:42.130Z`
  - active internal Supreme Court stats remain `pendingRegisteredCases=71534`, `pendingUnregisteredCases=22624`, `pendingTotalCases=94158`, `institutedLastMonthTotalCases=6148`, and `disposedLastMonthTotalCases=4552`
- Supreme Court methodology draft completed on 2026-04-19:
  - `docs/SUPREME_COURT_METHODOLOGY.md` now records the sourced-versus-derived metric contract, the registered or unregistered pending treatment, the explicit `captured_at` fallback date policy, and the cross-tier comparison limits that should hold before any public `/supreme-court` route ships
- Supreme Court internal proof cycle completed on 2026-04-19 after PR `#107` merged and GitHub deploy run `24622868188` rolled the live service to task definition `:95`:
  - the internal Supreme Court operator namespace is now live and auth-protected under `/operator/supreme-court/...`
  - `GET /operator/supreme-court` returned `401` without a token
  - `GET /supreme-court` still returned `404`, confirming the public route family remains dark
  - live Supreme Court fetch run `run_1eae4c35-6ed8-4e32-8d2e-a8b0b704df1e` completed successfully
  - live Supreme Court publication `publication_e0e10038-e70c-4556-a972-df9f530d03de` created `snapshot_4a64f3c4-b978-4a91-90f4-1fafbfe38f81`
  - live Supreme Court replay run `run_06a8e66e-26ac-4de6-9182-561989b49e4c` created publication `publication_dbcca7db-d563-4ba8-a0b1-3ea730c40ce5`
  - live Supreme Court rollback `publication_816712a1-56c7-4b2b-b49d-74d78f6a9bbd` restored the original publication chain and left `snapshot_4a64f3c4-b978-4a91-90f4-1fafbfe38f81` active
  - the active internal Supreme Court snapshot carries `referenceDateAt=2026-04-19T06:41:34.634Z`, `referenceDateKind=captured_at`, `sourceSnapshotAt=null`, and `publishedAt=2026-04-19T06:42:07.131Z`
  - active internal Supreme Court stats are `pendingRegisteredCases=71534`, `pendingUnregisteredCases=22624`, `pendingTotalCases=94158`, `institutedLastMonthTotalCases=6148`, and `disposedLastMonthTotalCases=4552`
- Himachal High Court public beta exposure completed on 2026-04-19 after PR `#105` merged and GitHub deploy run `24621281752` rolled the live service to task definition `:93`:
  - the already-reviewed active High Court publication `publication_e66cb2f9-b307-46d6-b00c-51b01e901fee` became publicly reachable under `/high-courts/himachal`
  - the active High Court snapshot remained `snapshot_eacb324b-2572-4ce6-84a9-1217abf2d14b` with `referenceDateKind=captured_at`, `publishedAt=2026-04-19T03:40:28.731Z`, and `publishedFromRunId=run_288288e1-f32b-45d1-86cd-c2384bba38ac`
  - live route verification returned `200` for `/high-courts/himachal`, `/high-courts/himachal/data`, `/high-courts/himachal/methodology`, `/high-courts/himachal/api`, `/v1/high-courts/himachal/stats`, and `/v1/high-courts/himachal/trends`
  - public stats on the live route matched the internal proof-cycle numbers: `pendingTotalCases=105599`, `institutedLastMonthTotalCases=7046`, `disposedLastMonthTotalCases=6528`
- Gujarat and Madhya Pradesh High Court public beta exposure completed on 2026-04-19 after PR `#115` merged and GitHub deploy run `24637168455` rolled the live service to task definition `:103`:
  - the already-reviewed active Gujarat High Court publication `publication_33428d3e-cc95-4c3c-9ace-643528cfb4a7` became publicly reachable under `/high-courts/gujarat`
  - the already-reviewed active Madhya Pradesh High Court publication `publication_ff8a3e1c-c515-4bd3-a141-0ec3825f76b4` became publicly reachable under `/high-courts/madhya-pradesh`
  - live route verification returned `200` for `/high-courts`, `/high-courts/gujarat`, `/high-courts/gujarat/data`, `/high-courts/gujarat/methodology`, `/high-courts/gujarat/api`, `/v1/high-courts/gujarat/stats`, `/v1/high-courts/gujarat/trends`, `/high-courts/madhya-pradesh`, `/high-courts/madhya-pradesh/data`, `/high-courts/madhya-pradesh/methodology`, `/high-courts/madhya-pradesh/api`, `/v1/high-courts/madhya-pradesh/stats`, and `/v1/high-courts/madhya-pradesh/trends`
  - the active Gujarat High Court snapshot remains `snapshot_b114637b-e1cc-4550-a44b-66af2f14eaff` with `referenceDateKind=captured_at`, `publishedAt=2026-04-19T18:59:57.944Z`, and `publishedFromRunId=run_a56b9376-cb93-4e1a-968c-0a99840b500c`
  - the active Madhya Pradesh High Court snapshot remains `snapshot_636a67c4-a5bc-4841-9b45-4e306d8cb3d0` with `referenceDateKind=captured_at`, `publishedAt=2026-04-19T18:59:58.343Z`, and `publishedFromRunId=run_8526bedf-df11-46a0-a394-9379ae4d1547`
  - live Gujarat High Court stats are `pendingTotalCases=174777`, `institutedLastMonthTotalCases=7305`, and `disposedLastMonthTotalCases=8085`
  - live Madhya Pradesh High Court stats are `pendingTotalCases=476385`, `institutedLastMonthTotalCases=12726`, and `disposedLastMonthTotalCases=15012`
- Uttar Pradesh and Rajasthan High Court public beta exposure completed on 2026-04-19 after PR `#113` merged and GitHub deploy run `24636212237` rolled the live service to task definition `:101`:
  - the already-reviewed active Allahabad High Court publication `publication_91726f20-da84-4401-9da0-18c5ad711694` became publicly reachable under `/high-courts/uttar-pradesh`
  - the already-reviewed active Rajasthan High Court publication `publication_40ac60e4-bb28-4628-b83d-2380d9dcf01f` became publicly reachable under `/high-courts/rajasthan`
  - live route verification returned `200` for `/high-courts`, `/high-courts/uttar-pradesh`, `/high-courts/uttar-pradesh/data`, `/high-courts/uttar-pradesh/methodology`, `/high-courts/uttar-pradesh/api`, `/v1/high-courts/uttar-pradesh/stats`, `/v1/high-courts/uttar-pradesh/trends`, `/high-courts/rajasthan`, `/high-courts/rajasthan/data`, `/high-courts/rajasthan/methodology`, `/high-courts/rajasthan/api`, `/v1/high-courts/rajasthan/stats`, and `/v1/high-courts/rajasthan/trends`
  - the active Uttar Pradesh High Court snapshot remains `snapshot_c0d74fe7-6755-467e-86be-90424446a514` with `referenceDateKind=captured_at`, `publishedAt=2026-04-19T03:40:31.468Z`, and `publishedFromRunId=run_3c040f94-6c45-4b0a-a17d-45f7ad418abe`
  - the active Rajasthan High Court snapshot remains `snapshot_03ac0bb4-ba77-4d92-9b96-478983aadfa9` with `referenceDateKind=captured_at`, `publishedAt=2026-04-19T03:40:34.582Z`, and `publishedFromRunId=run_bdc31094-2d40-4960-af99-13d2d803cf0c`
  - live Allahabad High Court stats are `pendingTotalCases=1223215`, `institutedLastMonthTotalCases=26638`, and `disposedLastMonthTotalCases=28080`
  - live Rajasthan High Court stats are `pendingTotalCases=678393`, `institutedLastMonthTotalCases=18847`, and `disposedLastMonthTotalCases=12318`
- Broad public-alpha ops sweep logic corrected on 2026-04-18:
  - the original Himachal daily-fetch alert was a false positive caused by comparing internal cadence against the older published Himachal snapshot date instead of the latest internal operator run
  - live AWS staging logs already showed the scheduled Himachal fetch `run_337a80ae-4980-415a-8585-d670e413dfed` completed on `2026-04-17T20:10:06Z` with `sourceSnapshotAt=2026-04-16T00:00:00.000Z`
  - `npm run ops:verify-public-alpha` now checks latest successful operator runs per state, so future lag alerts reflect actual internal collection drift rather than deliberate publish delay
  - the corrected live rerun completed green across all 28 public states, with Himachal still showing an older published snapshot date (`2026-04-10`) but a healthy latest successful internal fetch run (`run_337a80ae-4980-415a-8585-d670e413dfed`, `sourceSnapshotAt=2026-04-16`)
- Public-alpha ops cadence semantics corrected again on 2026-04-20:
  - the repo docs had gotten ahead of the code: the sweep was already reading latest successful operator runs, but it still measured lag from each run's `sourceSnapshotAt` instead of the run's `completedAt`
  - a live rerun before the fix falsely flagged `AP`, `AR`, `MN`, `KL`, `ML`, `KA`, `TR`, `NL`, `UK`, `RJ`, `UP`, and `MP` as daily-fetch lag even though their latest successful runs had all completed on `2026-04-20`
  - `src/dev/public-alpha-ops.ts` now measures daily-fetch lag from the latest successful run completion time, falling back to `sourceSnapshotAt` only if completion time is missing
  - the post-fix live rerun completed green across all 28 public states, and the previously false-positive states now report `latestSuccessfulRunLagDays=0` with `latestSuccessfulRunCompletedAt` values on `2026-04-20`
- Remaining approved-state public rollouts completed on 2026-04-18 after PR `#83` merged and GitHub deploy run `24600208536` settled the ECS service on task definition `:74`
  - public launches completed for Manipur, Uttarakhand, Rajasthan, Uttar Pradesh, Madhya Pradesh, Maharashtra, Bihar, Gujarat, Odisha, West Bengal, Jharkhand, Chhattisgarh, Goa, Sikkim, and Mizoram
  - the rollout window used fetch runs `run_d8eee45f-ad4d-490e-b779-362a1737b2d6`, `run_c4d861cf-0c36-48af-8b3a-8f2c6990c35b`, `run_692dc19a-c8a9-4061-a22b-2f0631475baa`, `run_1eecc09f-de4e-49ce-86c3-03e1c8e09293`, `run_466f100f-22b9-4c16-8dbd-1584e462e181`, `run_1e58aef7-5966-4ce2-b24c-ebdd6e8fcb6c`, `run_154efd48-8963-44d2-8606-b5877145e26f`, `run_baf67425-5948-4e43-828c-b37b274ecfa5`, `run_60b2d9fd-14db-43c0-9cac-d9d053ebdaa3`, `run_a31e4ca1-1f26-4f19-8a7d-6e3c6f574ca0`, `run_a64b3f23-836b-4f4e-b7e6-7693d035283e`, `run_6fe389aa-d51c-48b4-9bfd-a5186a41f21d`, `run_f07af2ea-5cf4-4943-a602-bf673744c9e4`, `run_ffb1c5f8-b811-4557-9a12-0b12bdf9143f`, and `run_aaf34f71-ebcf-4d12-84ae-101ca7ad4fa0`
  - stable route verification returned `200` for all newly exposed `/states/:stateSlug` and `/v1/states/:stateSlug/stats` endpoints, with release verification confirming metadata parity and cache protection for every launch in the window
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
- Internal fetch scheduler enabled and smoke-tested on 2026-04-17:
  - recurring schedule `nyaaywatch-staging-weekday-internal-fetch` was initially enabled in EventBridge Scheduler with `cron(0 8 ? * MON-FRI *)` plus `Asia/Kolkata`
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
- Meghalaya public rollout completed on 2026-04-18 after PR `#74` merged to `main`:
  - GitHub deploy run `24595471387` rolled the live service to task definition `:64`
  - Meghalaya fetch `run_30e5689d-a0da-46e8-8c27-c8624b68cd9d`, publication `publication_72eff473-ec6f-4f28-b4d6-fd1cffef04e5`, and snapshot `snapshot_4b2e5621-0336-41aa-a492-3163e57cad1a` all succeeded
  - rollback target retained from the prior internal proof cycle: `publication_7337df86-24c6-4290-8ee4-2b740e5110af`
  - `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug meghalaya` passed with `districtCount=14`, `trendCount=2`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
  - `https://nyaaywatch.in/states/meghalaya` and `https://nyaaywatch.in/v1/states/meghalaya/stats` both return `200`, and the public page title plus heading resolve to `How long is the wait for justice in Meghalaya?`
- Goa, Sikkim, and Mizoram internal proof cycles completed on 2026-04-18 on task definition `:64`:
  - Goa fetch `run_1e21db34-f85b-48ef-9f3b-aaeea6e92f35`, publish `publication_72807a9b-b91b-4f66-8b46-2b04bcaec370`, replay `run_710e9e5f-63b3-469b-a774-2e981fa7ade2`, replay publication `publication_bfb24816-c643-4953-9afc-496f116a9f36`, and rollback `publication_03355c7b-12b3-4d56-99ff-a88cffaf99fe` all succeeded
  - Sikkim fetch `run_cbd239e8-ac46-44fd-bd7b-00e62e4c853f`, publish `publication_67ef880e-b6e6-4b84-8991-e0ff35f70f67`, replay `run_1861f08d-09df-4cfd-a440-c7e3d8e69add`, replay publication `publication_061c8ad2-e542-4d35-8740-08326b68ade0`, and rollback `publication_cde025be-6141-4f4c-8933-42844f5d0f0f` all succeeded
  - Mizoram fetch `run_b788b9fe-194f-496b-a546-df26e62dd920`, publish `publication_087ca72e-d021-4138-8933-37a227010631`, replay `run_1cd62bb2-cb1c-4780-a56e-726323045f78`, replay publication `publication_906406d3-585e-49bc-9b9d-5caf3ad6868d`, and rollback `publication_fbcca757-9039-4891-900f-98bc0889c481` all succeeded
  - the page and stats routes for Goa, Sikkim, and Mizoram all returned `404`, so all three states remained internal-only throughout the batch
- Karnataka public rollout completed on 2026-04-18 after PR `#76` merged to `main`:
  - GitHub deploy run `24596186779` rolled the live service to task definition `:66`
  - live Karnataka fetch run `run_79131eaf-bd31-4c4e-a95f-fc84b065a261`
  - live Karnataka publication `publication_c58870a4-f378-4848-a8ce-ae38fb62f885`
  - live Karnataka snapshot `snapshot_87bd1945-6b36-415f-965e-8c06cf60a989`
  - rollback target retained from the prior internal proof cycle: `publication_30e8a0c5-9d15-4e9d-8f4b-ebf3143efb39`
  - `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug karnataka` passed with `districtCount=31`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
  - `https://nyaaywatch.in/states/karnataka` and `https://nyaaywatch.in/v1/states/karnataka/stats` now return `200`, and live HTML verification confirmed the Karnataka title and `How long is the wait for justice in Karnataka?` heading
- Tripura public rollout completed on 2026-04-18 on task definition `:66`:
  - live Tripura fetch run `run_fa4c7a48-6536-4e32-9d3a-63f6eecec153`
  - live Tripura publication `publication_a2308b8b-946e-4725-900e-14e638fe85dd`
  - live Tripura snapshot `snapshot_73cd7146-7d74-41e0-85a5-f352baa439df`
  - rollback target retained from the prior internal proof cycle: `publication_81692c3c-e86a-4774-8619-32cc60f11a85`
  - `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug tripura` passed with `districtCount=8`, `trendCount=2`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
  - `https://nyaaywatch.in/states/tripura` and `https://nyaaywatch.in/v1/states/tripura/stats` now return `200`, and live HTML verification confirmed the Tripura title and `How long is the wait for justice in Tripura?` heading
- Nagaland public rollout completed on 2026-04-18 on task definition `:66`:
  - live Nagaland fetch run `run_575e0ebe-fd32-4fda-88f2-1c6d69175d6c`
  - live Nagaland publication `publication_b01df802-1d04-409b-b608-55500e1b47a9`
  - live Nagaland snapshot `snapshot_f73774d4-0f6f-473f-9eda-21e5cd454050`
  - rollback target retained from the prior internal proof cycle: `publication_10a4a7ba-57ca-4382-86e5-3be094136be7`
  - `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug nagaland` passed with `districtCount=11`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
  - `https://nyaaywatch.in/states/nagaland` and `https://nyaaywatch.in/v1/states/nagaland/stats` now return `200`, and live HTML verification confirmed the Nagaland title and `How long is the wait for justice in Nagaland?` heading
- Andhra Pradesh public rollout completed on 2026-04-18 on task definition `:69`:
  - GitHub deploy run `24599082633` rolled the live service to task definition `:69`
  - live Andhra Pradesh fetch run `run_60611cb7-7a5c-44b5-970e-4ca51355c1e7`
  - live Andhra Pradesh publication `publication_b090f61a-3762-4bf5-8529-36b331b6e362`
  - live Andhra Pradesh snapshot `snapshot_e0ec4181-cc09-46e5-a606-39a8c54bd815`
  - rollback target retained from the prior internal proof cycle: `publication_c9d3057f-b1a2-4a0f-83ea-ac2b66886e1a`
  - `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug andhra-pradesh` passed with `districtCount=13`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
  - `https://nyaaywatch.in/states/andhra-pradesh` and `https://nyaaywatch.in/v1/states/andhra-pradesh/stats` now return `200`, and live HTML verification confirmed the Andhra Pradesh title and `How long is the wait for justice in Andhra Pradesh?` heading
- Arunachal Pradesh public rollout completed on 2026-04-18 on task definition `:71`:
  - GitHub deploy run `24599656003` rolled the live service to task definition `:71`
  - live Arunachal Pradesh fetch run `run_d2dadaec-bda6-4639-8629-28201a562708`
  - live Arunachal Pradesh publication `publication_ded2b9e1-f28a-4ead-90c4-1ba03a9890b0`
  - live Arunachal Pradesh snapshot `snapshot_0daffe74-e0ec-46f0-89b1-bc3e4177392f`
  - rollback target retained from the prior internal proof cycle: `publication_3acdfe73-8c9b-40a8-b882-472934a2fa90`
  - `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug arunachal-pradesh` passed with `districtCount=27`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
  - `https://nyaaywatch.in/states/arunachal-pradesh` and `https://nyaaywatch.in/v1/states/arunachal-pradesh/stats` now return `200`, and live HTML verification confirmed the Arunachal Pradesh title and `How long is the wait for justice in Arunachal Pradesh?` heading
- Tamil Nadu public rollout completed on 2026-04-17 after PR `#64` merged to `main`:
  - GitHub deploy run `24588602379` rolled the live service to task definition `:54`
  - live Tamil Nadu fetch run `run_d7f79d01-99c7-41b5-b87d-a4145438b3fa`
  - live Tamil Nadu publication `publication_af06c306-b7e8-4c62-b4b8-e80f301f5b04`
  - live Tamil Nadu snapshot `snapshot_7307527d-f5d1-4449-bba0-a3f21beafc97`
  - `GET /operator/publications?stateCode=TN` now shows the Tamil Nadu public publication active with rollback target `publication_43eefb27-a754-4590-91f1-0e38d9e40705`
  - `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug tamil-nadu` passed with `districtCount=38`, `trendCount=2`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
  - live browser verification loaded `https://nyaaywatch.in/states/tamil-nadu` with the explicit Tamil Nadu route family, published-snapshot trust text, and supported-state navigation showing Himachal Pradesh, Punjab, Haryana, and Tamil Nadu
- Assam public rollout completed on 2026-04-17 after PR `#66` merged to `main`:
  - GitHub deploy run `24589991106` rolled the live service to task definition `:56`
  - live Assam fetch run `run_e0f10a98-5e60-445a-b080-b9dafc962f61`
  - live Assam publication `publication_111cc225-f1a6-455d-8d7e-fd6af06ed597`
  - live Assam snapshot `snapshot_f296e9bb-fc95-476e-9f79-1bcd3ff1f1c7`
  - `GET /operator/publications?stateCode=AS` now shows the Assam public publication active with rollback target `publication_e6fcc230-9de5-42ed-9e29-1ed0fc287b8f`
  - `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug assam` passed with `districtCount=34`, `trendCount=2`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
  - live browser verification loaded `https://nyaaywatch.in/states/assam` with the explicit Assam route family, published-snapshot trust text, and supported-state navigation showing Himachal Pradesh, Punjab, Haryana, Tamil Nadu, and Assam
- Karnataka, Tripura, and Nagaland internal proof cycles completed on 2026-04-17 on task definition `:56`:
  - Karnataka fetch `run_c57e88aa-c6bf-40d8-a3fb-9343bd819174`, publish `publication_54748fe1-5f7c-41d4-bc40-3c976d157f56`, replay `run_18f4c2a3-d811-496e-a277-d0d4574906c9`, replay publication `publication_144604b7-c587-4be3-8077-1c373bd9968e`, and rollback `publication_30e8a0c5-9d15-4e9d-8f4b-ebf3143efb39` all succeeded
  - Tripura fetch `run_6b5e6751-0835-42b1-a89a-f3da080f5287`, publish `publication_3936f6cd-c9fe-403a-84b2-ba22e3fdf39b`, replay `run_42e9b2bc-e00e-43b2-8f2b-f9c103ba2246`, replay publication `publication_4e89a6b5-5d92-4884-9270-512e78ba2801`, and rollback `publication_81692c3c-e86a-4774-8619-32cc60f11a85` all succeeded
  - Nagaland fetch `run_8abb0436-80c5-4ce3-92c7-cf6049c55010`, publish `publication_abc433b9-1db4-4661-902e-ffd8861e35af`, replay `run_d3d5a492-1515-4e77-ab25-27135054b787`, replay publication `publication_134cafec-fe70-4245-95bc-aa79244cb823`, and rollback `publication_10a4a7ba-57ca-4382-86e5-3be094136be7` all succeeded
  - `GET /operator/publications?stateCode=KA`, `stateCode=TR`, and `stateCode=NL` show the rollback publications active
  - `https://nyaaywatch.in/states/karnataka`, `https://nyaaywatch.in/states/tripura`, `https://nyaaywatch.in/states/nagaland`, and the matching `/v1/states/.../stats` endpoints all returned `404`, so all three states remained internal-only throughout
- Telangana, Andhra Pradesh, Arunachal Pradesh, and Manipur internal proof cycles completed on 2026-04-17 after GitHub deploy run `24591817588` rolled the live service to task definition `:58`:
  - Telangana fetch `run_b48f6632-d59e-4bf9-9cdf-30125e045538`, publish `publication_eebf7779-60ed-4f91-967e-ab8dd6006fb8`, replay `run_e350d3ba-98d9-4d55-b073-638e69a8039d`, replay publication `publication_64116adc-188e-4753-8cdb-a6a21d114e61`, and rollback `publication_83bbcec4-3402-4f8c-9014-6646255a64a0` all succeeded
  - Andhra Pradesh fetch `run_4cb87c2a-1c31-4437-98ef-dc7d082ad6ef`, publish `publication_337af32e-4f9c-45ab-a4a4-52d43a2028b4`, replay `run_ce2ec512-176a-483e-ba9c-309054a0fff6`, replay publication `publication_89c24d14-008d-4ede-a6e8-2728976b8579`, and rollback `publication_c9d3057f-b1a2-4a0f-83ea-ac2b66886e1a` all succeeded
  - Arunachal Pradesh fetch `run_330e608c-890c-47e2-a585-3171c3c44c42`, publish `publication_316b931a-30e2-418f-ae8b-ade91f1b4fa9`, replay `run_7067210b-fe7f-4366-a6a7-e0788824e727`, replay publication `publication_6fa73859-0fff-44be-99ae-17140d41678a`, and rollback `publication_3acdfe73-8c9b-40a8-b882-472934a2fa90` all succeeded
  - Manipur fetch `run_ce3e086f-84f5-40d7-9540-366fe1c40a25`, publish `publication_d747187e-cc5e-4071-9fba-75a73e96058c`, replay `run_bdfe0d4a-770d-49cb-9f04-952999686779`, replay publication `publication_bf0bd251-57dd-4807-b084-bbbac79e106e`, and rollback `publication_29505d10-5434-4237-8b0d-89a9dfcf08cf` all succeeded
  - `GET /operator/publications?stateCode=TS`, `stateCode=AP`, `stateCode=AR`, and `stateCode=MN` show the rollback publications active
  - `https://nyaaywatch.in/states/telangana`, `https://nyaaywatch.in/v1/states/telangana/stats`, `https://nyaaywatch.in/states/andhra-pradesh`, `https://nyaaywatch.in/v1/states/andhra-pradesh/stats`, `https://nyaaywatch.in/states/arunachal-pradesh`, `https://nyaaywatch.in/v1/states/arunachal-pradesh/stats`, `https://nyaaywatch.in/states/manipur`, and `https://nyaaywatch.in/v1/states/manipur/stats` all returned `404`, so all four states remained internal-only throughout
- Telangana public rollout completed on 2026-04-18 after PR `#70` merged and GitHub deploy run `24593998269` rolled the live service to task definition `:60`:
  - live Telangana fetch run `run_79ae11fb-75fa-460d-a47d-929d0889657c`
  - live Telangana publication `publication_7691e5be-23b5-46ca-9aff-dd84148b7e8b`
  - live Telangana snapshot `snapshot_c350559b-947a-40ac-9dd4-daea74f64218`
  - `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug telangana` passed with `districtCount=33`, `trendCount=2`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
  - `https://nyaaywatch.in/states/telangana` and `https://nyaaywatch.in/v1/states/telangana/stats` now return `200`, and a live Playwright check confirmed the Telangana title, published-snapshot trust text, and supported-state navigation for Punjab, Haryana, Tamil Nadu, Assam, and Telangana
- Madhya Pradesh, Maharashtra, Bihar, and Gujarat internal proof cycles completed on 2026-04-18 on task definition `:60`:
  - Madhya Pradesh fetch `run_14520fbf-0fea-4bd9-95cb-e77b100a807f`, publish `publication_18e27b87-5922-40da-a084-8af808be3ecb`, replay `run_bfdce54a-47ac-4a5f-854d-fcd744fd9513`, replay publication `publication_d37491d5-5714-4590-a542-ebda13b14b03`, and rollback `publication_3f08b92a-ac96-4a4a-9041-c02d90b1a2f2` all succeeded
  - Maharashtra fetch `run_cfdf23ca-aa24-4dd4-b954-6b07d5c9701a`, publish `publication_e19586db-da7e-4db7-a3f2-4fe484e05598`, replay `run_7e93efa9-aafc-4ca0-8948-d3eb29d44a31`, replay publication `publication_dd6d8431-409e-401c-9320-9ab6c2ea8884`, and rollback `publication_f000da6a-79d1-4683-8acf-2a1b235611b4` all succeeded
  - Bihar fetch `run_0e7317c9-2774-481f-88a9-3c52c8e1b49d`, publish `publication_07d2e083-c592-4017-b1a5-5a4ce03075ae`, replay `run_af0583ea-ef66-48d0-9b21-f582697061ce`, replay publication `publication_7e723234-8fa1-4d61-ad81-bfd4c39c49be`, and rollback `publication_3319a11d-16fd-4a40-ad4a-cb4869f41d31` all succeeded
  - Gujarat fetch `run_18386bb6-ac8a-4217-9d76-b9ad169678d3`, publish `publication_9f3892de-ed4b-4ccb-822f-5cce3c9372b8`, replay `run_ad51cf0d-5760-4913-b979-14d75cf80d32`, replay publication `publication_46ab606a-4f3d-4d93-a60e-66dc7c13e978`, and rollback `publication_82c79b8b-aa07-4733-802e-12bd65e1c897` all succeeded
  - `https://nyaaywatch.in/states/madhya-pradesh`, `https://nyaaywatch.in/v1/states/madhya-pradesh/stats`, `https://nyaaywatch.in/states/maharashtra`, `https://nyaaywatch.in/v1/states/maharashtra/stats`, `https://nyaaywatch.in/states/bihar`, `https://nyaaywatch.in/v1/states/bihar/stats`, `https://nyaaywatch.in/states/gujarat`, and `https://nyaaywatch.in/v1/states/gujarat/stats` all returned `404`, so all four states remained internal-only throughout
- Kerala public rollout completed on 2026-04-18 after PR `#72` merged to `main`:
  - GitHub deploy run `24594772675` rolled the live service to task definition `:62`
  - live Kerala fetch run `run_e4ce54db-1dd6-473e-8ea6-318856c3f1f5`
  - live Kerala publication `publication_4fff0bca-7b58-49d1-992d-a113c43f577a`
  - live Kerala snapshot `snapshot_99d7ad98-ff3c-40e2-9922-e4661998e839`
  - `GET /operator/publications?stateCode=KL` now shows the Kerala public publication active with rollback target `publication_dafbab89-af38-4a41-a006-9153f126e785`
  - `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug kerala` passed with `districtCount=14`, `trendCount=2`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
  - `https://nyaaywatch.in/states/kerala` and `https://nyaaywatch.in/v1/states/kerala/stats` now return `200`, and live HTML verification confirmed the Kerala title and `How long is the wait for justice in Kerala?` heading
- Odisha, West Bengal, Jharkhand, and Chhattisgarh internal proof cycles completed on 2026-04-18 on task definition `:62`:
  - Odisha fetch `run_eb64e8ff-b70b-4eda-be14-180441a38548`, publish `publication_24cc3461-c2e1-47b0-a870-907306ca183d`, replay `run_07c3627f-1f65-4915-9516-1d72d2ae9e18`, replay publication `publication_3df28695-e014-44d2-9b36-4bb7bb95a9cb`, and rollback `publication_0b8376be-33ae-4c60-a534-835ebb199b57` all succeeded
  - West Bengal fetch `run_4af4d3ee-db7f-4570-995b-361d99bb6bcf`, publish `publication_4b085772-5b96-402c-81fb-2bc5a9b12060`, replay `run_3e45e064-d1b8-41ea-aefe-f1c7372d3a8f`, replay publication `publication_68fe225e-1270-412c-8472-551ec957a8d3`, and rollback `publication_09fd4895-3a75-4c8f-97aa-5222e4137541` all succeeded
  - Jharkhand fetch `run_9555324e-3416-4c6d-8287-e666982f8bec`, publish `publication_ff13fc7e-1d39-44ad-ad17-c45f2515f159`, replay `run_ad91c0c0-59f9-4c50-be1c-26f387539e47`, replay publication `publication_12072ce8-33b1-4349-b13d-63516900d091`, and rollback `publication_12683d90-942c-4050-b5f7-7ccca8932b07` all succeeded
  - Chhattisgarh fetch `run_3deffe82-3ee7-477f-ae37-e70b93d544e6`, publish `publication_301acf9a-e2d2-46b2-940c-42a2cd989ece`, replay `run_d60f4c4b-8385-4193-9a63-efc5dcc3dcda`, replay publication `publication_e4502b2d-9466-434a-903e-53ff22426428`, and rollback `publication_412a4d67-73fe-4bdd-b149-24c05cbaf973` all succeeded
  - `https://nyaaywatch.in/states/odisha`, `https://nyaaywatch.in/v1/states/odisha/stats`, `https://nyaaywatch.in/states/west-bengal`, `https://nyaaywatch.in/v1/states/west-bengal/stats`, `https://nyaaywatch.in/states/jharkhand`, `https://nyaaywatch.in/v1/states/jharkhand/stats`, `https://nyaaywatch.in/states/chhattisgarh`, and `https://nyaaywatch.in/v1/states/chhattisgarh/stats` all returned `404`, so all four states remained internal-only throughout
- Internal fetch deploy reconciliation hardened on 2026-04-17 after PRs `#60` and `#62` plus a deploy-role IAM update:
  - GitHub deploy run `24585688516` completed successfully on rerun after granting `scheduler:GetSchedule`, `scheduler:CreateSchedule`, `scheduler:UpdateSchedule`, and scheduler-role `iam:PassRole` to `nyaaywatch-github-deploy-role`
  - the live ECS service rolled to task definition `:52`
  - the recurring scheduler `nyaaywatch-staging-weekday-internal-fetch` now targets the same live task definition `:52`
  - the deploy path now keeps the internal fetch schedule aligned with the latest ECS task definition after each successful `main` rollout
- Runtime secret posture and Cloudflare purge-path remediation completed on 2026-04-20 outside a code deploy:
  - the active ECS service now runs task definition `:117`
  - `DATABASE_URL`, `OPERATOR_API_TOKEN`, and `CLOUDFLARE_API_TOKEN` are all injected through ECS `secrets`, not live plaintext task-definition environment values
  - the task-execution role policy now grants `secretsmanager:GetSecretValue` for the database, operator-token, and Cloudflare-token secrets
  - a new Secrets Manager secret now backs the Cloudflare token used for public-route cache invalidation
  - the runtime purge path for Supreme Court and High Court public routes is now configured on the live service
- Staging stack reconciliation completed on 2026-04-20 after the staging template was widened to accept pre-existing secret ARNs for existing stacks:
  - the live `nyaaywatch-staging` CloudFormation stack now exposes `DatabaseUrlSecretArn`, `OperatorApiTokenSecretArn`, and `CloudflareApiTokenSecretArn` in its outputs
  - the stack-managed ECS service is stable on task definition `:119`
  - task definition `:119` injects `DATABASE_URL`, `OPERATOR_API_TOKEN`, and `CLOUDFLARE_API_TOKEN` through ECS `secrets`
  - `https://nyaaywatch.in/health` still returned `{"ok":true,"region":"ap-south-1","stateCode":"HP"}`
- Canonical `.com -> .in` ALB redirect-rule ownership reconciliation completed on 2026-04-20 without a service deploy:
  - the live `nyaaywatch-staging` CloudFormation stack imported `CanonicalHttpRedirectRule` and `CanonicalHttpsRedirectRule` at `2026-04-20T05:44Z`
  - `ManageCanonicalRedirectRules` is back to `true` on the live stack, so the canonical redirect rules are now stack-managed instead of externally managed drift
  - the imported rule ARNs remained unchanged: HTTP `.../e88986b94ac719de` and HTTPS `.../b9511887c838d80f`
  - `curl -sSI http://nyaaywatch-staging-964594065.ap-south-1.elb.amazonaws.com/ -H 'Host: nyaaywatch.com'` still returned `301` with `Location: https://nyaaywatch.in:443/`
- Punjab and Haryana High Court internal proof completed on 2026-04-20 after PR `#133` merged:
  - the live `/operator/high-courts/punjab-and-haryana` profile returned court code `PHHC` with explicit covered geographies for Punjab, Haryana, and Chandigarh while remaining outside the public High Court beta
  - fetch `run_642f9d1d-5246-42a5-b3e0-1b5bb78def50`, publish `publication_83b3d316-cdaf-4729-bcea-a875599af83f`, replay `run_84726b0e-7732-4d4b-8a6b-da3c10d17ae4`, replay publication `publication_adade273-f47c-4b4e-8501-75ea35e06814`, and rollback `publication_797e59da-9032-42dc-a891-f68f3d83fc0b` all succeeded on `https://nyaaywatch.in`
  - `npm run high-court:readiness -- --base-url=https://nyaaywatch.in --court-slug=punjab-and-haryana` returned `operatorAuthProtected=true`, `runCount=2`, `publicationCount=3`, `publishCount=2`, `rollbackCount=1`, `replayedRunCount=1`, `canonicalScopeAligned=true`, and `internalProofBarSatisfied=true`
- Punjab and Haryana High Court public beta exposure completed on 2026-04-20 after PR `#137` merged:
  - GitHub deploy run `24658794657` completed successfully, with `verify` green, `deploy` green, and `preview` skipped on `main`
  - the live ECS service rolled to task definition `:130` and reached steady state at `2026-04-20T02:30:04-07:00`
  - all three internal scheduler targets now point to task definition `:130`: `nyaaywatch-staging-weekday-internal-fetch`, `nyaaywatch-staging-supreme-court-internal-fetch`, and `nyaaywatch-staging-high-courts-internal-fetch`
  - the live public Punjab and Haryana route family now returns `200`: `/high-courts/punjab-and-haryana`, `/high-courts/punjab-and-haryana/data`, `/high-courts/punjab-and-haryana/methodology`, `/high-courts/punjab-and-haryana/api`, and `/v1/high-courts/punjab-and-haryana/stats`
  - `/high-courts` and `/` both now expose High Court of Punjab and Haryana in the public High Court switcher and card set
  - this is the first live public multi-jurisdiction High Court beta page, and its public copy names coverage across Punjab, Haryana, and Chandigarh instead of pretending one High Court equals one state
- Delhi, Kerala, and Madras High Court public beta exposure completed on 2026-04-20 after PR `#141` merged:
  - GitHub deploy run `24686545934` completed successfully on `main`, with `verify`, `secret-scan`, and `deploy` all green and `preview` skipped
  - the live ECS service rolled to task definition `:134` and reached steady state at `2026-04-20T12:45:39-07:00`
  - all three internal scheduler targets now point to task definition `:134`: `nyaaywatch-staging-weekday-internal-fetch`, `nyaaywatch-staging-supreme-court-internal-fetch`, and `nyaaywatch-staging-high-courts-internal-fetch`
  - the explicit Cloudflare purge completed for all three new High Court route families through `npm run release:purge-public-routes -- --high-court=delhi,kerala,madras`, with one `public_cache_invalidated` event per court and `urlCount=7`
  - the live public Delhi route family now returns `200`: `/high-courts/delhi`, `/high-courts/delhi/data`, `/high-courts/delhi/methodology`, `/high-courts/delhi/api`, `/v1/high-courts/delhi/stats`, and `/v1/high-courts/delhi/trends`
  - the live public Kerala route family now returns `200`: `/high-courts/kerala`, `/high-courts/kerala/data`, `/high-courts/kerala/methodology`, `/high-courts/kerala/api`, `/v1/high-courts/kerala/stats`, and `/v1/high-courts/kerala/trends`
  - the live public Madras route family now returns `200`: `/high-courts/madras`, `/high-courts/madras/data`, `/high-courts/madras/methodology`, `/high-courts/madras/api`, `/v1/high-courts/madras/stats`, and `/v1/high-courts/madras/trends`
  - `/high-courts` and `/` both now expose High Court of Delhi, High Court of Kerala, and Madras High Court in the public High Court card set and switcher
  - the live public High Court beta set is now Himachal, Andhra Pradesh, Telangana, Delhi, Gujarat, Kerala, Madras, Madhya Pradesh, Punjab and Haryana, Rajasthan, and Uttar Pradesh
- Bombay, Calcutta, and Gauhati High Court public beta exposure completed on 2026-04-20 after PR `#144` merged:
  - GitHub deploy run `24691704672` completed successfully on `main`, with `verify`, `secret-scan`, and `deploy` all green and `preview` skipped
  - the live ECS service rolled to task definition `:137` and reached steady state
  - all three internal scheduler targets now point to task definition `:137`: `nyaaywatch-staging-weekday-internal-fetch`, `nyaaywatch-staging-supreme-court-internal-fetch`, and `nyaaywatch-staging-high-courts-internal-fetch`
  - the explicit Cloudflare purge completed for all three new High Court route families through `npm run release:purge-public-routes -- --high-court=bombay,calcutta,gauhati`, with one `public_cache_invalidated` event per court and `urlCount=7`
  - the live public Bombay route family now returns `200`: `/high-courts/bombay`, `/high-courts/bombay/data`, `/high-courts/bombay/methodology`, `/high-courts/bombay/api`, `/v1/high-courts/bombay/stats`, and `/v1/high-courts/bombay/trends`
  - the live public Calcutta route family now returns `200`: `/high-courts/calcutta`, `/high-courts/calcutta/data`, `/high-courts/calcutta/methodology`, `/high-courts/calcutta/api`, `/v1/high-courts/calcutta/stats`, and `/v1/high-courts/calcutta/trends`
  - the live public Gauhati route family now returns `200`: `/high-courts/gauhati`, `/high-courts/gauhati/data`, `/high-courts/gauhati/methodology`, `/high-courts/gauhati/api`, `/v1/high-courts/gauhati/stats`, and `/v1/high-courts/gauhati/trends`
  - `/high-courts` and `/` both now expose Bombay High Court, Calcutta High Court, and Gauhati High Court in the public High Court card set and switcher
  - the live public High Court beta set is now Himachal, Andhra Pradesh, Bombay, Calcutta, Telangana, Delhi, Gujarat, Gauhati, Kerala, Madras, Madhya Pradesh, Punjab and Haryana, Rajasthan, and Uttar Pradesh
- Internal fetch scheduler deploy-role scope repair completed on 2026-04-20:
  - the first attempt of GitHub deploy run `24653526489` failed in `Reconcile daily internal fetch schedule` because `nyaaywatch-github-deploy-role` still allowed scheduler operations only on `arn:aws:scheduler:ap-south-1:723951822728:schedule/default/nyaaywatch-staging-weekday-internal-fetch`
  - the live IAM policy was widened to include `nyaaywatch-staging-supreme-court-internal-fetch` and `nyaaywatch-staging-high-courts-internal-fetch` alongside the existing lower-court schedule ARN
  - GitHub Actions rerun attempt `2` for run `24653526489` completed successfully at `2026-04-20T07:31:19Z`
  - the live ECS service is now stable on task definition `:126`
  - all three schedules now exist and target task definition `:126`: `nyaaywatch-staging-weekday-internal-fetch`, `nyaaywatch-staging-supreme-court-internal-fetch`, and `nyaaywatch-staging-high-courts-internal-fetch`
  - `curl -fsSL https://nyaaywatch.in/health` returned `{"ok":true,"region":"ap-south-1","stateCode":"HP"}`
- Lower-court Union Territory public alpha exposure completed on 2026-04-23 after PR `#185` merged:
  - GitHub deploy run `24863933038` completed successfully on `main`, with `secret-scan`, `verify`, and `deploy` green and `preview` skipped
  - the live ECS service rolled to task definition `nyaaywatch-staging:178`
  - the deploy reconcile step updated all four scheduler targets to task definition `:178`: `nyaaywatch-staging-weekday-internal-fetch`, `nyaaywatch-staging-supreme-court-internal-fetch`, `nyaaywatch-staging-high-courts-internal-fetch`, and `nyaaywatch-staging-public-alpha-ops-monitor`
  - all eight newly public lower-court Union Territory route families returned `200` on `https://nyaaywatch.in`: Andaman and Nicobar Islands, Chandigarh, Delhi, Jammu and Kashmir, Ladakh, Lakshadweep, Puducherry, and Dadra and Nagar Haveli and Daman and Diu
  - direct route verification covered each `/states/:slug`, `/states/:slug/districts`, `/states/:slug/data`, `/states/:slug/methodology`, `/states/:slug/api`, `/v1/states/:slug/stats`, `/v1/states/:slug/districts`, and `/v1/states/:slug/trends` family
  - `npm run ops:verify-public-alpha -- --base-url=https://nyaaywatch.in` passed with `totalStates=36`, `staleStates=[]`, `dailyFetchLagStates=[]`, and `failingStates=[]`
  - no Cloudflare purge was run because `release:purge-public-routes` currently supports deploy-only Supreme Court and High Court route families, not lower-court state or Union Territory route exposure; the stable live lower-court routes returned `200` without a manual purge
  - this closes the post-deploy evidence gap for the April 23 lower-court Union Territory public-alpha promotion; `docs/internal/RELEASE_HISTORY.md` now records the deploy-only exposure against the active UT publications
- Supreme Court legacy published-snapshot parse incident remediated on 2026-04-24:
  - CloudWatch alarms `nyaaywatch-staging-app-errors` and `nyaaywatch-staging-alb-target-5xx` fired after deployed code required `monthlyFinalized` on an older active Supreme Court published snapshot
  - PR `#206` restored backward compatibility by defaulting missing `monthlyFinalized` to `[]`; PR `#207` added frozen production-shape fixture tests for published-snapshot schemas
  - follow-up live check confirmed the ECS service stable on task definition `nyaaywatch-staging:212`, `/health`, `/supreme-court`, and `/v1/supreme-court/stats` returning `200`, both alarms back to `OK`, and no post-remediation structured app-error log events in the checked window

## Release Use

Before treating a deployment as the public alpha:

1. fill in this file with the actual live URL and resource names
2. run `docs/ALPHA_RELEASE_CHECKLIST.md`
3. confirm the domain cutover steps in `docs/DOMAIN_CUTOVER_CHECKLIST.md` if a custom domain is involved

# TODOS

`docs/MVP_EXECUTION_PLAN.md` is the ordered path to the Himachal alpha MVP.

Use this file for:

- review backlog
- post-MVP follow-up work
- important items that are not yet part of the ordered execution path

## Completed

### Haryana Public Rollout

- completed live on 2026-04-17 after PR `#56` merged and deploy run `24582480598` rolled the live stack to task definition `:45`
- ECS-backed fetch `run_bf1fd888-173c-4a58-9dde-f797b92f7c30` published Haryana as `publication_e57d5546-e9aa-4bee-a951-edeb2bc4789c`
- `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug haryana` passed with `districtCount=22`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
- the live browser check loaded `https://nyaaywatch.in/states/haryana` with the expected Haryana trust metadata and explicit supported-state navigation

### Tamil Nadu And Assam Internal Proof Cycles

- completed live on 2026-04-17 on task definition `:45` after PR `#56` merged
- Tamil Nadu completed fetch `run_329a8b74-2b9d-4c33-ba2f-46b19186935c`, publication `publication_34aa96eb-f212-4cad-9412-086bfe3c41a6`, replay `run_c69af2d5-b2dd-455e-82aa-3a7125122d71`, and rollback `publication_43eefb27-a754-4590-91f1-0e38d9e40705`
- Assam completed fetch `run_32e2194a-027d-4ec2-8d50-b3c282446b90`, publication `publication_688f053e-53a4-4662-9367-a4ffba4973ce`, replay `run_c28d9a91-0543-40b2-adac-1ca5e0c2e85d`, and rollback `publication_e6fcc230-9de5-42ed-9e29-1ed0fc287b8f`
- public routes for Tamil Nadu and Assam both remained dark with `404` responses throughout

### Live Verification Of The ECS Heavy-State Operator Lane

- completed live on 2026-04-17 after PR `#54` merged and deploy run `24554574390` rolled the live stack to task definition `:43`
- `npm run operator:staging -- --state UP fetch "UP ECS heavy-state proof cycle fetch"` succeeded as `run_a16bb291-e3fb-4238-8695-bc60e4d63a64`
- the ECS-backed helper stored raw artifact `raw/staging/up/2026-04-16/run_a16bb291-e3fb-4238-8695-bc60e4d63a64-njdg-dashboard-html.json` plus normalized artifact `normalize/staging/up/2026-04-16/run_a16bb291-e3fb-4238-8695-bc60e4d63a64-snapshot-candidate.json`
- the live follow-up reproduced the observed `74`-district Uttar Pradesh source surface with `qualityState=complete` and `pendingCases=11911564`
- public Uttar Pradesh routes still returned `404`, so the heavier-state proof remained internal-only while confirming the ECS lane is now the routine durable operator default

### ECS Heavy-State Operator Lane

- completed in repo tooling on 2026-04-17 with `npm run operator:staging`
- the helper now discovers the live `nyaaywatch-staging` ECS service from CloudFormation, reuses the current task definition plus network configuration, runs the requested operator command inside a one-off task, waits for completion, and prints the operator JSON result from CloudWatch logs
- `docs/STORAGE_AND_OPERATIONS.md`, `docs/DEVELOPMENT_WORKFLOW.md`, `README.md`, `infra/aws/staging/README.md`, and `docs/DEPLOYMENT_STATUS.md` now document the ECS path as the default heavy-state lane while leaving ALB plus `curl --connect-to` as fallback recovery only

### Parallel Internal State Trials

- completed live on 2026-04-17 after PR #50 merged and task definition `:39` rolled out
- Uttarakhand completed fetch `run_cf76f87a-0090-4bdd-b6f5-2df5913c45bd`, publication `publication_d7ef7572-a8ef-4e2d-af90-6873162b667b`, replay `run_86b44e6e-41dc-4135-8a39-481f6c255658`, and rollback `publication_680b9cd9-b54c-4a97-926b-dbaac9256c98`
- Rajasthan completed fetch `run_b8bf0aec-3bfb-48fd-b2bf-81b45ce62177`, publication `publication_75842a37-713a-4d45-8030-086141343db1`, replay `run_211368fd-7ef3-40e5-a8f9-426487f4499e`, and rollback `publication_90655c18-6088-44b7-9740-b4546a62242b`
- Uttar Pradesh completed fetch `run_0b2ea65b-4d28-4d7b-a72c-308187a4e096`, publication `publication_dbf86893-c8b4-4587-813f-b624e009b9da`, replay `run_79cb8508-85fa-4d99-a3c5-d6243d95838d`, and rollback `publication_55a13942-b67d-4a89-826a-b0ae334a7807`
- public routes for Uttarakhand, Rajasthan, and Uttar Pradesh all remained dark with `404` responses throughout
- the only new blocker exposed by the batch was the Cloudflare-fronted timeout on the first UP fetch, which is now tracked above as the next operational item

### Haryana Public Readiness Review

- completed in `docs/HARYANA_PUBLIC_READINESS_REVIEW.md`
- the review is now superseded by the completed Haryana public rollout
- Haryana is live, so the next public-candidate decision has moved to Tamil Nadu

### Haryana Public Preflight

- completed in `docs/HARYANA_GO_LIVE_CHECKLIST.md` and `tests/haryana-public-rollout.test.ts`
- Haryana now has a dedicated preflight checklist and regression coverage for explicit `/states/haryana/...` routes, state-scoped API parity, trust/copy guardrails, and `release:verify`-style metadata/cache checks

### Tamil Nadu Internal Trial Candidate Preparation

- completed on 2026-04-17 with a live source viability review against the NJDG Tamil Nadu page
- internal-only `TN` state support and the selector value `33~10` are now in the repo without widening the public site
- Tamil Nadu then cleared the full live internal proof cycle and is now the next public candidate

### Assam Internal Trial Candidate Preparation

- completed on 2026-04-17 with a live source viability review against the NJDG Assam page
- internal-only `AS` state support and the selector value `18~6` are now in the repo without widening the public site
- Assam then cleared the full live internal proof cycle and is now the north-east internal baseline behind Tamil Nadu's public slot

### Tamil Nadu Public Readiness Review

- completed in `docs/TAMIL_NADU_PUBLIC_READINESS_REVIEW.md` and `docs/TAMIL_NADU_GO_LIVE_CHECKLIST.md`
- Tamil Nadu is now the next narrow public rollout candidate after Haryana
- local public-route parity is now implemented in repo config and preflight coverage
- the remaining Tamil Nadu work is live rollout verification and release-history recording

### Kerala And Meghalaya Internal Trial Candidate Preparation

- completed on 2026-04-17 with live source viability reviews against the NJDG Kerala and Meghalaya pages
- internal-only `KL` and `ML` state support plus regression coverage are now in the repo without widening the public site
- Kerala and Meghalaya have now both cleared internal-only live proof cycles and remain dark on the public site

### Kerala And Meghalaya Internal Proof Cycles

- completed live on 2026-04-17 after PR #58 merged and task definition `:47` rolled out with Kerala and Meghalaya internal-only support
- Kerala fetch `run_60fc22fb-a2b2-41e5-9bf5-f01b6e7b39e3` published as `publication_4f53dbb3-7530-40ca-aeed-3a27bbd5b892`, replayed as `run_84af7110-13b1-4150-8be6-cc82e83a36c3` with replay publication `publication_ddd7c94d-d4c9-4cad-8da9-13ef1d0b8ba1`, and ended with rollback publication `publication_dafbab89-af38-4a41-a006-9153f126e785`
- Meghalaya fetch `run_3dd14fff-0791-45b4-9bd7-27ce798cc850` published as `publication_b1b1d691-d8bf-4e79-8d2d-119dff5b024c`, replayed as `run_5fda86c5-aefe-4e33-ae39-e25dac3f4830` with replay publication `publication_503248fe-3cc6-4b24-96e9-1317a4ba6001`, and ended with rollback publication `publication_7337df86-24c6-4290-8ee4-2b740e5110af`
- `GET /operator/publications?stateCode=KL` and `GET /operator/publications?stateCode=ML` both show the rollback publications active, and the Kerala plus Meghalaya public routes still return `404`

### Uttarakhand Internal Trial Candidate Preparation

- completed on 2026-04-17 with a live source viability review against the NJDG Uttarakhand page
- internal-only `UK` state support and regression coverage are now in the repo without widening the public site

### Rajasthan And Uttar Pradesh Internal Trial Candidate Preparation

- completed on 2026-04-17 with live source viability reviews against the NJDG Rajasthan and Uttar Pradesh pages
- internal-only `RJ` and `UP` state support and regression coverage are now in the repo without widening the public site
- the Uttar Pradesh preparation explicitly records the 74-district selector caveat so the first live internal run validates source completeness rather than assuming it

### Publish-Time Cache Invalidation For Public Data

- partial code fix completed in PR #44 by marking `/data` and CSV export endpoints as `no-store` for browsers and CDNs, including the explicit Punjab state-scoped routes
- `npm run release:verify` now fails if the public data page or district CSV is still cacheable, which exposed that a cached pre-fix Cloudflare object still survives until an explicit purge runs
- completed live on 2026-04-17 after PR #45 merged, the Cloudflare token wiring was corrected, task definition `:34` rolled out with purge credentials, and `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug punjab` passed without cache-busting

### Haryana Internal Trial

- completed live on 2026-04-17 after PR #46 merged and task definition `:35` rolled out with Haryana internal-only support
- first live Haryana fetch run `run_171cccad-9fef-47cb-9cc1-c1ae4449fe4e` published as `publication_0d8a736d-1c27-4ae3-8cba-c0593057e3d2`
- replay from stored evidence succeeded as `run_76e23910-ffd8-4dcc-a3be-3eda0b130356` with replay publication `publication_cc7b1068-b97e-470a-a079-570cad23061f`
- rollback `publication_09613d9d-ae89-4543-9028-8f5d971df587` restored the original Haryana publication, and public Haryana routes still returned `404`

### Source Terms And Redistribution Review

- completed in `docs/PUBLIC_DATA_EXPOSURE_POLICY.md`
- the current alpha now explicitly limits public exposure to published read-model outputs and citation metadata while keeping raw upstream captures and unpublished operator artifacts internal

### Multi-State Expansion Readiness Gates

- completed in `docs/MULTI_STATE_EXPANSION_GATES.md`
- expansion beyond Himachal now requires explicit gates for source viability, deterministic normalization, trust parity, publish safety, methodology defensibility, product IA discipline, and operating evidence

### Release Cadence And Observability Baseline

- completed in `docs/RELEASE_POLICY.md`, `docs/DEPLOYMENT_STATUS.md`, `infra/aws/staging/README.md`, `.github/workflows/ci.yml`, and `infra/aws/staging/reconcile-internal-fetch-schedule.sh`
- the alpha now separates `weekday 8:00 AM Asia/Kolkata internal raw fetches` from `twice-weekly public publishes`, keeps the publisher allowlist tight, and documents the log-review routine plus blocked-release rules

### Release History And Operating Evidence Tracking

- completed in `docs/RELEASE_HISTORY.md`, `docs/OPERATING_EVIDENCE.md`, and the `release:record` workflow
- the alpha now writes markdown plus JSON evidence artifacts and keeps a tracked release ledger tied to publication ids, rollback targets, and reviewer notes

### Extracted Design System Foundation

- completed in `DESIGN.md` with follow-on source-of-truth updates in `README.md`, `AGENTS.md`, and `docs/NYAAYWATCH_DESIGN.md`
- the repo now keeps reusable visual-system rules in one file while leaving route hierarchy and product-specific trust-surface rationale in the product design plan

### Punjab Spaced Follow-Up Window

- completed in the second live Punjab window on 2026-04-16 with `run_726b1bb9-04c8-43dc-9dfe-c977abf812e0`, `publication_91b7a54b-5262-4dfe-8e28-8c3e315c3c4c`, replay `run_13854ef4-33c1-4204-bd66-37685148e7c4`, replay publication `publication_cb511366-8bfb-4467-9e5c-5a2db394d545`, and rollback `publication_3512d69b-35e0-4a63-b3f1-35f738af7441`
- Punjab has now cleared the independent-window operating-evidence gate; the next backlog slice is public-surface implementation and parity verification

### Narrow Punjab Public Surface

- completed in the public app with explicit `/states/punjab/...` routes, state-scoped API endpoints, dynamic supported-state navigation, and route-parity coverage
- Himachal remains the default unscoped surface, while Punjab is now available as the first approved explicit state-scoped public route family pending live deployment verification

### Punjab Live Rollout Verification

- completed on 2026-04-16 with live fetch `run_ff674e79-8752-4b4d-9b32-4c7a368d339c`, publication `publication_7db9a015-68d0-4182-8c77-f221797c7c2c`, and public verification on `https://nyaaywatch.in/states/punjab`
- release verification passed with `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug punjab`, and the rollout evidence is now recorded in the deployment, release-history, and expansion-review docs

### State-Aware Live Release Tooling

- completed in the app operator routes and release helper scripts with explicit state selection by `stateCode` or `stateSlug`, plus release-evidence generation that now resolves the correct public URL for state-scoped rollouts
- regression coverage now proves Punjab operator fetch/publish over HTTP, Punjab release-history recording, and state-scoped verification summaries without Himachal-only assumptions
- completed live on 2026-04-16 with Punjab fetch/publish through the public operator routes on task definition `:28`, plus successful ECS-executed `release:prepublish`, `release:postpublish`, and `release:record`

### Internal Multi-Geography Pipeline Scaffolding

- completed in the operator and ingestion pipeline with state-profile-driven NJDG capture, state-scoped artifact prefixes, and a first internal candidate-state profile for Punjab
- the public app remains Himachal-only, but internal fetch / inspect / publish / replay / rollback work no longer requires a Himachal-specific code fork

### Responsive And Accessibility Trust-Surface QA

- `docs/ENG_REVIEW_TEST_PLAN.md` now treats responsive/mobile trust surfaces, keyboard navigation, and accessibility smoke checks as implemented coverage
- Playwright now verifies mobile district browsing behavior, trust-metadata visibility, keyboard navigation, and axe smoke checks across the public routes

### Narrow Alpha Vertical Slice

- published snapshot boundary with explicit published-run state
- operator API and CLI publish control
- homepage for latest published Himachal snapshot
- district evidence page
- `GET /v1/stats/himachal`
- regression coverage for publish safety, stale and empty states, and UI/API parity

### AWS-Backed Snapshot Store

- PostgreSQL-backed canonical run and publish state
- S3-backed raw artifact and replay input storage
- operator replay and rollback flows
- local Docker dev stack for PostgreSQL plus LocalStack S3
- automated migration, service, route, and persistent-stack integration coverage for the storage slice

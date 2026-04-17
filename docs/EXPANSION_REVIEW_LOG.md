# Expansion Review Log

Internal record of candidate-geography and candidate-tier expansion reviews.

This log exists so expansion decisions are tied to concrete runs, publication ids, and explicit gate outcomes rather than oral history.

## Punjab (`PB`) Internal Trial

- candidate geography: Punjab
- review date: 2026-04-16
- source boundary: NJDG Punjab district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-16
- latest successful validation date: 2026-04-16
- reviewer: Codex
- decision: `live on the public site`

### Trial Evidence

- initial run id: `run_e440dc29-3f34-42da-a5ad-36b3b67e2b3a`
- initial publication id: `publication_24a9da44-47d5-4bdb-94f4-3dc3d07c8e2c`
- replay run id: `run_ba5643f1-cfdb-4a13-8615-aaed8a4d4142`
- replay publication id: `publication_8ed4484e-a3dd-4950-a1a5-88ecd46c5dd3`
- rollback publication id: `publication_d7cc5d03-2ad4-4a14-a842-d54f10563fa7`
- second window run id: `run_726b1bb9-04c8-43dc-9dfe-c977abf812e0`
- second window publication id: `publication_91b7a54b-5262-4dfe-8e28-8c3e315c3c4c`
- second window replay run id: `run_13854ef4-33c1-4204-bd66-37685148e7c4`
- second window replay publication id: `publication_cb511366-8bfb-4467-9e5c-5a2db394d545`
- second window rollback publication id: `publication_3512d69b-35e0-4a63-b3f1-35f738af7441`
- live rollout fetch run id: `run_ff674e79-8752-4b4d-9b32-4c7a368d339c`
- live rollout publication id: `publication_7db9a015-68d0-4182-8c77-f221797c7c2c`
- live rollout snapshot id: `snapshot_09384231-203b-41ec-8fe7-a71e9c456b9d`
- live deploy run id: `24537940704`
- raw artifact key: `raw/dev/pb/2026-04-16/run_e440dc29-3f34-42da-a5ad-36b3b67e2b3a-njdg-dashboard-html.json`
- normalized artifact key: `normalize/dev/pb/2026-04-16/run_e440dc29-3f34-42da-a5ad-36b3b67e2b3a-snapshot-candidate.json`
- second window raw artifact key: `raw/dev/pb/2026-04-16/run_726b1bb9-04c8-43dc-9dfe-c977abf812e0-njdg-dashboard-html.json`
- second window normalized artifact key: `normalize/dev/pb/2026-04-16/run_726b1bb9-04c8-43dc-9dfe-c977abf812e0-snapshot-candidate.json`
- live rollout raw artifact key: `raw/staging/pb/2026-04-16/run_ff674e79-8752-4b4d-9b32-4c7a368d339c-njdg-dashboard-html.json`
- live rollout normalized artifact key: `normalize/staging/pb/2026-04-16/run_ff674e79-8752-4b4d-9b32-4c7a368d339c-snapshot-candidate.json`

### Observed Output

- district count captured: 22
- candidate quality state: `complete`
- pending cases: `961280`
- disposal rate: `102.7`
- median case age days: `183`
- flagged districts: `3`
- top flagged districts in this run:
  - `Ludhiana`
  - `Amritsar`
  - `Jalandhar`

### What Cleared

- Source viability: the live NJDG Punjab source was reachable and produced a full stored raw capture.
- Extract and normalize reliability: the capture normalized deterministically into a valid candidate with a `complete` quality state.
- Publish safety and operations: `fetch -> inspect -> publish -> replay -> rollback` succeeded end to end against state-scoped `pb` artifacts.
- Rollback clarity: rollback restored the original Punjab publication cleanly after the replay publication.
- Operating evidence: a second independent Punjab window ran on 2026-04-16 at least 2 hours and 43 minutes after the first one, with the same statewide outputs and another successful replay plus rollback cycle.
- Public-readiness review groundwork: `docs/PUNJAB_PUBLIC_READINESS_REVIEW.md` now covers metadata shape, copy posture, and exposure-boundary assumptions for a future narrow public rollout.
- Live rollout verification: the deployed public stack now serves Punjab at `/states/punjab`, `/v1/states/punjab/...`, and `/states/punjab/data/districts.csv`, and `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug punjab` passed with `districtCount=22`, `trendCount=1`, and CSV metadata parity confirmed.

### Operational Notes

- The live public runtime is now state-aware for read paths, but the public operator HTTP endpoints remain Himachal-scoped because the deployed app still binds operator routes to the single configured `STATE_CODE`.
- Punjab live publishing was therefore executed through one-off ECS tasks with `STATE_CODE=PB` rather than through `https://nyaaywatch.in/operator/...`.
- That tooling gap is now closed in `main`: operator routes accept explicit state selection, run/publication ids are resolved across configured state services, and `release:prepublish`, `release:postpublish`, and `release:record` now support state-scoped rollouts.
- That updated tooling is now verified live after task definition `:28` rolled out: Punjab fetch and publish succeeded through the public HTTP operator routes, and the state-scoped release helper scripts succeeded inside one-off ECS tasks without any Punjab-specific environment override.
- The state-scoped CSV cache-invalidity gap is now closed after the 2026-04-17 Cloudflare purge rollout: `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug punjab` passes on the stable URL family, and the live CSV `published_at` now matches the API `publishedAt` without cache-busting.

### Recommendation

Punjab is now the first non-Himachal geography live on the public site, and the rollout cleared the narrow public expansion path without adding nationwide scaffolding.

Haryana has now also cleared the internal-only operating evidence bar without widening the public surface.

The next expansion slice should not be more hidden Haryana plumbing. It should be one of:

1. an explicit Haryana public-readiness review with trust-surface scrutiny
2. one additional internal state trial using the same evidence discipline
3. a separate later track for High Courts rather than mixing court tiers now

## Haryana (`HR`) Internal Trial

- candidate geography: Haryana
- review date: 2026-04-17
- source boundary: NJDG Haryana district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-17
- latest successful validation date: 2026-04-17 live replay and rollback validation
- reviewer: Codex
- decision: `internal trial completed`

### Source Viability Notes

- NJDG state code value: `6~14`
- source snapshot date observed on the live state page: `2026-04-16`
- district count exposed on the live state page: `22`
- statewide pending cases shown on the live state page: `15,09,969`
- first visible district labels: `Karnal`, `Sirsa`, `Ambala`, `Bhiwani`, `Faridabad`
- instituted-last-month, disposed-last-month, and all five age-bucket widgets were present on the live state page

### Why Haryana Is Next

- The aggregate source shape matches the current Himachal and Punjab extraction contract without new metric exceptions.
- Haryana is large enough to test another real 22-district state without Rajasthan's much broader 44-district blast radius.
- The state page labels looked stable on first review, which lowers the risk that the next trial turns into source archaeology instead of pipeline proof.

### Live Trial Evidence

- deploy run: `24546133140`
- deployed task definition: `nyaaywatch-staging:35`
- first live fetch run: `run_171cccad-9fef-47cb-9cc1-c1ae4449fe4e`
- first live publication: `publication_0d8a736d-1c27-4ae3-8cba-c0593057e3d2`
- first live snapshot: `snapshot_5f5af9cb-e6d9-4a09-9947-025244e21035`
- replay run from stored evidence: `run_76e23910-ffd8-4dcc-a3be-3eda0b130356`
- replay publication: `publication_cc7b1068-b97e-470a-a079-570cad23061f`
- rollback publication restoring the first live Haryana snapshot: `publication_09613d9d-ae89-4543-9028-8f5d971df587`
- operator validation: `GET /operator/publications?stateCode=HR` showed the rollback publication active after replay plus rollback
- public-surface validation: `https://nyaaywatch.in/states/haryana` and `https://nyaaywatch.in/v1/states/haryana/stats` both returned `404`, so Haryana remained internal-only throughout the trial

### Next Required Work

- run an explicit Haryana public-readiness review before exposing any `/states/haryana/...` surface
- decide whether Haryana is the next narrow public rollout or whether the next slice should instead be a third internal state trial

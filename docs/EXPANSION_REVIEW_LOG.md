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

Those next-slice decisions are now made:

1. `docs/HARYANA_PUBLIC_READINESS_REVIEW.md` concludes Haryana should be the next narrow public rollout candidate, but not an immediate go-live
2. Uttarakhand (`UK`), Rajasthan (`RJ`), and Uttar Pradesh (`UP`) are now prepared as the next internal-only trial candidates after live source viability reviews on 2026-04-17
3. High Courts remain a separate later track rather than being mixed into subordinate-court expansion now

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

- keep Haryana internal-only until the conditions in `docs/HARYANA_PUBLIC_READINESS_REVIEW.md` are satisfied
- run the first live internal proof cycles for Uttarakhand, Rajasthan, and Uttar Pradesh in a deliberate order rather than widening the public surface immediately

## Uttarakhand (`UK`) Internal Trial Candidate

- candidate geography: Uttarakhand
- review date: 2026-04-17
- source boundary: NJDG Uttarakhand district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- reviewer: Codex
- decision: `internal trial candidate prepared`

### Source Viability Notes

- NJDG state code value: `5~15`
- source page footer updated on: `2026-04-16`
- district count exposed on the live state page: `13`
- statewide pending cases shown on the live state page: `3,05,801`
- instituted in last month: `15,352`
- disposed in last month: `23,841`
- first visible district labels: `Nainital`, `Pauri Garhwal`, `Tehri Garhwal`, `Udham Singh Nagar`, `Dehradun`
- all five age-bucket widgets were present on the live state page

### Why Uttarakhand Is Next

- The live source shape matches the current extractor and normalizer contract without new metric exceptions.
- Uttarakhand is smaller than Haryana and Punjab, which makes it a good parallel internal proof candidate while Haryana stays under public-readiness review.
- Preparing Uttarakhand now supports faster internal expansion without widening the public surface prematurely.

### Next Required Work

- run the first live Uttarakhand internal proof cycle on the deployed stack
- record the resulting run, publication, replay, and rollback ids in this log

## Rajasthan (`RJ`) Internal Trial Candidate

- candidate geography: Rajasthan
- review date: 2026-04-17
- source boundary: NJDG Rajasthan district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- reviewer: Codex
- decision: `internal trial candidate prepared`

### Source Viability Notes

- NJDG state code value: `8~9`
- source page footer updated on: `2026-04-16`
- district count exposed on the live state page: `44`
- statewide pending cases shown on the live state page: `26,35,615`
- instituted in last month: `1,82,144`
- disposed in last month: `2,26,246`
- first visible district labels: `Rajsamand`, `Alwar`, `Dausa`, `Jaipur Metro I`, `Tonk`
- all five age-bucket widgets were present on the live state page

### Why Rajasthan Is Next

- Rajasthan gives us another large real state beyond Punjab and Haryana without jumping straight to the heaviest source surface in the current shortlist.
- The live source shape matches the current extractor and normalizer contract without new metric exceptions.
- Its 44-district footprint is large enough to pressure-test scaling assumptions before a much bigger Uttar Pradesh run.

### Next Required Work

- run the first live Rajasthan internal proof cycle on the deployed stack
- record the resulting run, publication, replay, and rollback ids in this log

## Uttar Pradesh (`UP`) Internal Trial Candidate

- candidate geography: Uttar Pradesh
- review date: 2026-04-17
- source boundary: NJDG Uttar Pradesh district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- reviewer: Codex
- decision: `internal trial candidate prepared with a source-shape caveat`

### Source Viability Notes

- NJDG state code value: `9~13`
- source page footer updated on: `2026-04-16`
- district count exposed on the live state page: `74`
- statewide pending cases shown on the live state page: `1,19,09,807`
- instituted in last month: `7,41,638`
- disposed in last month: `7,38,719`
- first visible district labels: `Prayagraj`, `Bareilly`, `Gorakhpur`, `Hardoi`, `Chitrakoot`
- all five age-bucket widgets were present on the live state page

### Why Uttar Pradesh Is Still Worth Preparing

- Uttar Pradesh is the real high-stress subordinate-court candidate in the current shortlist, so it is the right state to prepare once the pipeline is stable enough to handle larger volumes.
- The source still matches the current metric contract, including instituted, disposed, and age-bucket breakdowns.
- Preparing it now lets us plan a heavy internal-only run without conflating that work with Haryana public exposure.

### Source Caveat

- The live NJDG page exposed only `74` district options during this review, which is lower than the administrative district count one would normally expect for Uttar Pradesh.
- That does not block internal candidate preparation, but it does mean the first live UP proof cycle should explicitly confirm whether the source surface is complete or whether NJDG is omitting one district from the aggregate selector.

### Next Required Work

- run the first live Uttar Pradesh internal proof cycle on the deployed stack
- explicitly confirm whether the observed 74-district selector is the stable intended source shape or a source completeness issue
- record the resulting run, publication, replay, and rollback ids in this log

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

Haryana has now moved past the internal-only bar and is also live on the public site without widening the information architecture beyond explicit state-scoped routes.

Those next-slice decisions are now made:

1. Haryana is now live on the public site at `/states/haryana` with verified API, CSV, and browser parity on 2026-04-17
2. Tamil Nadu (`TN`) and Assam (`AS`) have now joined Uttarakhand (`UK`), Rajasthan (`RJ`), and Uttar Pradesh (`UP`) as internal-only states that cleared live proof cycles without widening the public surface
3. High Courts remain a separate later track rather than being mixed into subordinate-court expansion now

## Haryana (`HR`) Internal Trial And Public Rollout

- candidate geography: Haryana
- review date: 2026-04-17
- source boundary: NJDG Haryana district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-17
- latest successful validation date: 2026-04-17 live public rollout verification
- reviewer: Codex
- decision: `public rollout completed`

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

### Public Rollout Evidence

- follow-up deploy run: `24582480598`
- follow-up deployed task definition: `nyaaywatch-staging:45`
- public rollout fetch run: `run_bf1fd888-173c-4a58-9dde-f797b92f7c30`
- public rollout publication: `publication_e57d5546-e9aa-4bee-a951-edeb2bc4789c`
- public rollout snapshot: `snapshot_68b8cf79-ee86-4644-a876-8222e2bce71a`
- operator validation: `GET /operator/publications?stateCode=HR` showed the Haryana public publication active with rollback target `publication_09613d9d-ae89-4543-9028-8f5d971df587`
- release verification: `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug haryana` passed with `districtCount=22`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
- browser validation: `https://nyaaywatch.in/states/haryana` loaded with explicit Haryana navigation, public trust metadata, and supported-state navigation for Himachal Pradesh, Punjab, and Haryana

### Next Required Work

- keep public expansion narrower than internal qualification even though Haryana is now live
- treat Tamil Nadu as the next public state once its explicit go-live checklist is complete
- keep Assam internal-only for now while Kerala and Meghalaya become the next southern and north-east internal proof pair
- keep the ECS-backed operator lane as the default path for heavier future internal-state fetches

## Uttarakhand (`UK`) Internal Trial

- candidate geography: Uttarakhand
- review date: 2026-04-17
- source boundary: NJDG Uttarakhand district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-17
- latest successful validation date: 2026-04-17 live replay and rollback validation
- reviewer: Codex
- decision: `internal trial completed`

### Source Viability Notes

- NJDG state code value: `5~15`
- source page footer updated on: `2026-04-16`
- district count exposed on the live state page: `13`
- statewide pending cases shown on the live state page: `3,05,801`
- instituted in last month: `15,352`
- disposed in last month: `23,841`
- first visible district labels: `Nainital`, `Pauri Garhwal`, `Tehri Garhwal`, `Udham Singh Nagar`, `Dehradun`
- all five age-bucket widgets were present on the live state page

### Why Uttarakhand Cleared Quickly

- The live source shape matches the current extractor and normalizer contract without new metric exceptions.
- Uttarakhand is smaller than Haryana and Punjab, which made it the lowest-risk next parallel proof candidate while Haryana stayed under public-readiness review.
- The smaller 13-district footprint let us validate multi-state throughput without conflating that work with a heavier large-state run.

### Live Trial Evidence

- deploy run: `24548048035`
- deployed task definition: `nyaaywatch-staging:39`
- first live fetch run: `run_cf76f87a-0090-4bdd-b6f5-2df5913c45bd`
- source snapshot date: `2026-04-16`
- candidate quality state: `complete`
- district count captured: `13`
- statewide pending cases captured: `305801`
- first live publication: `publication_d7ef7572-a8ef-4e2d-af90-6873162b667b`
- first live snapshot: `snapshot_16c11940-10f5-43ab-8da8-8db0ab0ba8ae`
- replay run from stored evidence: `run_86b44e6e-41dc-4135-8a39-481f6c255658`
- replay publication: `publication_975440ff-28f9-4d7d-8b55-b57f6ee682d2`
- rollback publication restoring the first live Uttarakhand snapshot: `publication_680b9cd9-b54c-4a97-926b-dbaac9256c98`
- operator validation: `GET /operator/publications?stateCode=UK` showed the rollback publication active after replay plus rollback
- public-surface validation: `https://nyaaywatch.in/states/uttarakhand` and `https://nyaaywatch.in/v1/states/uttarakhand/stats` both returned `404`, so Uttarakhand remained internal-only throughout the trial

### Next Required Work

- keep Uttarakhand internal-only until a deliberate public-readiness decision exists
- use Uttarakhand as evidence that parallel internal expansion is viable for lighter states on the current operator path

## Rajasthan (`RJ`) Internal Trial

- candidate geography: Rajasthan
- review date: 2026-04-17
- source boundary: NJDG Rajasthan district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-17
- latest successful validation date: 2026-04-17 live replay and rollback validation
- reviewer: Codex
- decision: `internal trial completed`

### Source Viability Notes

- NJDG state code value: `8~9`
- source page footer updated on: `2026-04-16`
- district count exposed on the live state page: `44`
- statewide pending cases shown on the live state page: `26,35,615`
- instituted in last month: `1,82,144`
- disposed in last month: `2,26,246`
- first visible district labels: `Rajsamand`, `Alwar`, `Dausa`, `Jaipur Metro I`, `Tonk`
- all five age-bucket widgets were present on the live state page

### Why Rajasthan Was The Right Mid-Weight Trial

- Rajasthan gives us another large real state beyond Punjab and Haryana without jumping straight to the heaviest source surface in the current shortlist.
- The live source shape matches the current extractor and normalizer contract without new metric exceptions.
- Its 44-district footprint was large enough to pressure-test scaling assumptions before the much bigger Uttar Pradesh run.

### Live Trial Evidence

- deploy run: `24548048035`
- deployed task definition: `nyaaywatch-staging:39`
- first live fetch run: `run_b8bf0aec-3bfb-48fd-b2bf-81b45ce62177`
- source snapshot date: `2026-04-16`
- candidate quality state: `complete`
- district count captured: `44`
- statewide pending cases captured: `2635615`
- first live publication: `publication_75842a37-713a-4d45-8030-086141343db1`
- first live snapshot: `snapshot_a443b7a7-5b9f-4876-ae33-3cffac67b8b7`
- replay run from stored evidence: `run_211368fd-7ef3-40e5-a8f9-426487f4499e`
- replay publication: `publication_feb65557-4f94-4225-87e0-0ae76c81a026`
- rollback publication restoring the first live Rajasthan snapshot: `publication_90655c18-6088-44b7-9740-b4546a62242b`
- operator validation: `GET /operator/publications?stateCode=RJ` showed the rollback publication active after replay plus rollback
- public-surface validation: `https://nyaaywatch.in/states/rajasthan` and `https://nyaaywatch.in/v1/states/rajasthan/stats` both returned `404`, so Rajasthan remained internal-only throughout the trial

### Next Required Work

- keep Rajasthan internal-only until a deliberate public-readiness decision exists
- treat Rajasthan as evidence that a 44-district state still fits through the current public operator lane without special recovery steps

## Uttar Pradesh (`UP`) Internal Trial

- candidate geography: Uttar Pradesh
- review date: 2026-04-17
- source boundary: NJDG Uttar Pradesh district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-17
- latest successful validation date: 2026-04-17 live ECS heavy-state validation
- reviewer: Codex
- decision: `internal trial completed`

### Source Viability Notes

- NJDG state code value: `9~13`
- source page footer updated on: `2026-04-16`
- district count exposed on the live state page: `74`
- statewide pending cases shown on the live state page: `1,19,09,807`
- instituted in last month: `7,41,638`
- disposed in last month: `7,38,719`
- first visible district labels: `Prayagraj`, `Bareilly`, `Gorakhpur`, `Hardoi`, `Chitrakoot`
- all five age-bucket widgets were present on the live state page

### Why Uttar Pradesh Was Still Worth Running

- Uttar Pradesh is the real high-stress subordinate-court candidate in the current shortlist, so it is the right state to prepare once the pipeline is stable enough to handle larger volumes.
- The source still matches the current metric contract, including instituted, disposed, and age-bucket breakdowns.
- Running it now separated source-shape concerns from operator-path concerns instead of leaving both ambiguous.

### Source Caveat Confirmed In Live Operation

- The live NJDG page exposed `74` district options during source review, which is lower than the administrative district count one would normally expect for Uttar Pradesh.
- The live proof cycle reproduced the same `74`-district shape with a `complete` candidate, so the current pipeline now treats that as the observed stable source surface rather than a transient scrape failure.

### Live Trial Evidence

- deploy run: `24548048035`
- deployed task definition: `nyaaywatch-staging:39`
- first live fetch run: `run_0b2ea65b-4d28-4d7b-a72c-308187a4e096`
- source snapshot date: `2026-04-16`
- candidate quality state: `complete`
- district count captured: `74`
- statewide pending cases captured: `11911564`
- first live publication: `publication_dbf86893-c8b4-4587-813f-b624e009b9da`
- first live snapshot: `snapshot_9078cc91-ff20-467a-87eb-9b55006cf0a5`
- replay run from stored evidence: `run_79cb8508-85fa-4d99-a3c5-d6243d95838d`
- replay publication: `publication_9e3e3632-685e-4906-ad43-9092e9fe08c2`
- rollback publication restoring the first live Uttar Pradesh snapshot: `publication_55a13942-b67d-4a89-826a-b0ae334a7807`
- operator validation: `GET /operator/publications?stateCode=UP` showed the rollback publication active after replay plus rollback
- public-surface validation: `https://nyaaywatch.in/states/uttar-pradesh` and `https://nyaaywatch.in/v1/states/uttar-pradesh/stats` both returned `404`, so Uttar Pradesh remained internal-only throughout the trial

### Operational Caveat

- The first `POST /operator/runs/fetch` attempt for Uttar Pradesh through `https://nyaaywatch.in` returned a Cloudflare `504` at `2026-04-17 04:50:42 UTC`, even though the origin completed the fetch and persisted `run_0b2ea65b-4d28-4d7b-a72c-308187a4e096`.
- Publish, replay, rollback, and validation then succeeded by bypassing Cloudflare and connecting to the ALB while preserving the `nyaaywatch.in` TLS host via `curl --connect-to`.
- That means the blocking issue for heavier states is now operator request path durability, not extractor or normalizer correctness.

### ECS Heavy-State Follow-Up

- follow-up deploy run: `24554574390`
- follow-up merged fix PR: `#54`
- follow-up deployed task definition: `nyaaywatch-staging:43`
- ECS-backed follow-up fetch run: `run_a16bb291-e3fb-4238-8695-bc60e4d63a64`
- source snapshot date: `2026-04-16`
- candidate quality state: `complete`
- district count captured: `74`
- statewide pending cases captured: `11911564`
- raw artifact key: `raw/staging/up/2026-04-16/run_a16bb291-e3fb-4238-8695-bc60e4d63a64-njdg-dashboard-html.json`
- normalized artifact key: `normalize/staging/up/2026-04-16/run_a16bb291-e3fb-4238-8695-bc60e4d63a64-snapshot-candidate.json`
- public-surface validation: `https://nyaaywatch.in/states/uttar-pradesh` and `https://nyaaywatch.in/v1/states/uttar-pradesh/stats` both still returned `404`, so the heavier-state follow-up remained internal-only
- outcome: `npm run operator:staging` is now verified live as the routine heavy-state fetch lane, which closes the Cloudflare-timeout durability gap without widening the public read surface

### Next Required Work

- keep Uttar Pradesh internal-only until a deliberate public-readiness review exists, even though the ECS-backed heavy-state operator lane is now verified live

## Tamil Nadu (`TN`) Internal Trial

- candidate geography: Tamil Nadu
- review date: 2026-04-17
- source boundary: NJDG Tamil Nadu district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-17
- latest successful validation date: 2026-04-17 live replay and rollback validation
- reviewer: Codex
- decision: `internal trial completed`

### Source Viability Notes

- NJDG state code value: `33~10`
- source page footer updated on: `2026-04-16`
- district count exposed on the live state page: `38`
- statewide pending cases shown on the live state page: `17,46,162`
- instituted in last month: `1,20,781`
- disposed in last month: `1,44,236`
- first visible district labels: `Dharmapuri`, `Pudukkottai`, `Tirunelveli`, `Theni`, `Namakkal`
- all five age-bucket widgets were present on the live state page

### Why Tamil Nadu Was The Right Southern Proof State

- Tamil Nadu gives the internal expansion track a serious southern state instead of extending the current north-heavy footprint again.
- The live source shape matches the current extractor and normalizer contract without new metric exceptions.
- Its 38-district surface is large enough to prove meaningful scale in the south without jumping immediately to a public rollout.

### Live Trial Evidence

- deployed task definition during proof cycle: `nyaaywatch-staging:45`
- first live fetch run: `run_329a8b74-2b9d-4c33-ba2f-46b19186935c`
- source snapshot date: `2026-04-17`
- candidate quality state: `complete`
- district count captured: `38`
- statewide pending cases captured: `1746162`
- first live publication: `publication_34aa96eb-f212-4cad-9412-086bfe3c41a6`
- first live snapshot: `snapshot_f8e31acc-2710-40ce-8e45-ca968b6e02d0`
- replay run from stored evidence: `run_c69af2d5-b2dd-455e-82aa-3a7125122d71`
- replay publication: `publication_4965e74e-97de-47b2-b16e-eb2a2ccca25a`
- rollback publication restoring the first Tamil Nadu snapshot: `publication_43eefb27-a754-4590-91f1-0e38d9e40705`
- operator validation: `GET /operator/publications?stateCode=TN` showed the rollback publication active after replay plus rollback
- public-surface validation: `https://nyaaywatch.in/states/tamil-nadu` and `https://nyaaywatch.in/v1/states/tamil-nadu/stats` both returned `404`, so Tamil Nadu remained internal-only throughout the trial

### Next Required Work

- complete the Tamil Nadu public-route parity and checklist work, then use Tamil Nadu as the next public rollout
- keep Kerala as the next southern internal proof state while Tamil Nadu's public slot is underway

## Assam (`AS`) Internal Trial

- candidate geography: Assam
- review date: 2026-04-17
- source boundary: NJDG Assam district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-17
- latest successful validation date: 2026-04-17 live replay and rollback validation
- reviewer: Codex
- decision: `internal trial completed`

### Source Viability Notes

- NJDG state code value: `18~6`
- source page footer updated on: `2026-04-16`
- district count exposed on the live state page: `34`
- statewide pending cases shown on the live state page: `5,81,244`
- instituted in last month: `14,498`
- disposed in last month: `15,074`
- first visible district labels: `Kamrup Metro`, `Tinsukia`, `Sivasagar`, `Morigaon`, `Lakhimpur`
- all five age-bucket widgets were present on the live state page

### Why Assam Was The Right North-East Proof State

- Assam gives the internal expansion track an explicit north-east proof state instead of implying a narrow north-west expansion story.
- The live source shape matches the current extractor and normalizer contract without new metric exceptions.
- Its 34-district footprint is large enough to matter operationally while still staying safely internal-only.

### Live Trial Evidence

- deployed task definition during proof cycle: `nyaaywatch-staging:45`
- first live fetch run: `run_32e2194a-027d-4ec2-8d50-b3c282446b90`
- source snapshot date: `2026-04-16`
- candidate quality state: `complete`
- district count captured: `34`
- statewide pending cases captured: `581244`
- first live publication: `publication_688f053e-53a4-4662-9367-a4ffba4973ce`
- first live snapshot: `snapshot_ccfe55eb-9d1f-45b9-b083-099ad8f1ceb2`
- replay run from stored evidence: `run_c28d9a91-0543-40b2-adac-1ca5e0c2e85d`
- replay publication: `publication_c8e143f6-61f4-4c1b-9423-b49e53b17399`
- rollback publication restoring the first Assam snapshot: `publication_e6fcc230-9de5-42ed-9e29-1ed0fc287b8f`
- operator validation: `GET /operator/publications?stateCode=AS` showed the rollback publication active after replay plus rollback
- public-surface validation: `https://nyaaywatch.in/states/assam` and `https://nyaaywatch.in/v1/states/assam/stats` both returned `404`, so Assam remained internal-only throughout the trial

### Next Required Work

- keep Assam internal-only until a separate public-readiness review exists
- use Assam as the north-east benchmark while Meghalaya becomes the next north-east internal proof state

## Kerala (`KL`) Internal Candidate

- candidate geography: Kerala
- review date: 2026-04-17
- source boundary: NJDG Kerala district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- latest source viability date: 2026-04-17
- reviewer: Codex
- decision: `internal candidate prepared`

### Source Viability Notes

- NJDG state code value: `32~4`
- source page footer observed on live responses: `2026-04-16`
- district count exposed on the live state page: `14`
- statewide pending cases shown on the live state page: `18,01,417`
- instituted in last month: `57,299`
- disposed in last month: `77,311`
- first visible district labels: `Kasaragod`, `Ernakulam`, `Kannur`, `Thrissur`, `Kozhikode`
- all five age-bucket widgets were present on the live state page
- sample district drilldown `dist_code=1` returned `200 OK`

### Why Kerala Is Next

- Kerala keeps the southern expansion story moving after Tamil Nadu without forcing another public-state decision first.
- The live source shape matches the current extractor and normalizer contract without new metric exceptions.
- Its 14-district footprint is lighter than Tamil Nadu, which makes it a clean internal follow-on proof state.

### Next Required Work

- merge the Kerala internal-only repo wiring to `main`
- run the live `fetch -> inspect -> publish -> replay -> rollback` proof cycle
- keep Kerala internal-only unless a later public-readiness review says otherwise

## Meghalaya (`ML`) Internal Candidate

- candidate geography: Meghalaya
- review date: 2026-04-17
- source boundary: NJDG Meghalaya district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- latest source viability date: 2026-04-17
- reviewer: Codex
- decision: `internal candidate prepared`

### Source Viability Notes

- NJDG state code value: `17~21`
- source page footer updated on: `2026-04-16`
- district count exposed on the live state page: `14`
- statewide pending cases shown on the live state page: `18,450`
- instituted in last month: `1,456`
- disposed in last month: `778`
- first visible district labels: `East Khasi Hills`, `West Garo Hills`, `West Jaintia Hills`, `East Garo Hills`, `Ri Bhoi`
- all five age-bucket widgets were present on the live state page
- sample district drilldown `dist_code=1` returned `200 OK`

### Why Meghalaya Is Next

- Meghalaya keeps the north-east expansion story moving after Assam without widening the public site prematurely.
- The live source shape matches the current extractor and normalizer contract without new metric exceptions.
- Its 14-district footprint is manageable enough to make it a clean internal follow-on proof state.

### Next Required Work

- merge the Meghalaya internal-only repo wiring to `main`
- run the live `fetch -> inspect -> publish -> replay -> rollback` proof cycle
- keep Meghalaya internal-only unless a later public-readiness review says otherwise

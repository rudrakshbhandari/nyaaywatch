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
2. Uttarakhand (`UK`), Rajasthan (`RJ`), Uttar Pradesh (`UP`), Kerala (`KL`), Meghalaya (`ML`), Karnataka (`KA`), Tripura (`TR`), and Nagaland (`NL`) have now all cleared internal-only live proof cycles without widening the public surface
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

### Public Rollout Evidence

- public rollout deploy run: `24588602379`
- public rollout deployed task definition: `nyaaywatch-staging:54`
- public rollout fetch run: `run_d7f79d01-99c7-41b5-b87d-a4145438b3fa`
- public rollout publication: `publication_af06c306-b7e8-4c62-b4b8-e80f301f5b04`
- public rollout snapshot: `snapshot_7307527d-f5d1-4449-bba0-a3f21beafc97`
- operator validation: `GET /operator/publications?stateCode=TN` showed the Tamil Nadu public publication active with rollback target `publication_43eefb27-a754-4590-91f1-0e38d9e40705`
- release verification: `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug tamil-nadu` passed with `districtCount=38`, `trendCount=2`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
- browser validation: `https://nyaaywatch.in/states/tamil-nadu` loaded with explicit Tamil Nadu navigation, published-snapshot trust text, and supported-state navigation for Himachal Pradesh, Punjab, Haryana, and Tamil Nadu

### Next Required Work

- treat Tamil Nadu as live and keep the next public-state decision separate from the internal-only qualification track
- keep Kerala internal-only after its proof cycle unless a later public-readiness review says otherwise

## Assam (`AS`) Internal Trial And Public Rollout

- candidate geography: Assam
- review date: 2026-04-17
- source boundary: NJDG Assam district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-17
- latest successful validation date: 2026-04-17 live public rollout verification
- reviewer: Codex
- decision: `public rollout completed`

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

### Public Rollout Evidence

- public rollout deploy run: `24589991106`
- public rollout deployed task definition: `nyaaywatch-staging:56`
- public rollout fetch run: `run_e0f10a98-5e60-445a-b080-b9dafc962f61`
- public rollout publication: `publication_111cc225-f1a6-455d-8d7e-fd6af06ed597`
- public rollout snapshot: `snapshot_f296e9bb-fc95-476e-9f79-1bcd3ff1f1c7`
- operator validation: `GET /operator/publications?stateCode=AS` showed the Assam public publication active with rollback target `publication_e6fcc230-9de5-42ed-9e29-1ed0fc287b8f`
- release verification: `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug assam` passed with `districtCount=34`, `trendCount=2`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
- browser validation: `https://nyaaywatch.in/states/assam` loaded with explicit Assam navigation, published-snapshot trust text, and supported-state navigation for Himachal Pradesh, Punjab, Haryana, Tamil Nadu, and Assam

### Next Required Work

- keep public expansion narrower than internal qualification even though Assam is now live
- keep Meghalaya, Tripura, and Nagaland internal-only unless later public-readiness reviews say otherwise
- choose the next public state deliberately rather than inheriting the old pre-Assam queue

## Kerala (`KL`) Internal Trial

- candidate geography: Kerala
- review date: 2026-04-17
- source boundary: NJDG Kerala district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-17
- latest successful validation date: 2026-04-17 live replay and rollback validation
- reviewer: Codex
- decision: `internal trial completed`

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

### Live Trial Evidence

- deployed task definition during proof cycle: `nyaaywatch-staging:47`
- first live fetch run: `run_60fc22fb-a2b2-41e5-9bf5-f01b6e7b39e3`
- source snapshot date: `2026-04-16`
- candidate quality state: `complete`
- district count captured: `14`
- statewide pending cases captured: `1801417`
- first live publication: `publication_4f53dbb3-7530-40ca-aeed-3a27bbd5b892`
- first live snapshot: `snapshot_d12e6bcc-c016-4f66-be4f-f9b3f3956b69`
- replay run from stored evidence: `run_84af7110-13b1-4150-8be6-cc82e83a36c3`
- replay publication: `publication_ddd7c94d-d4c9-4cad-8da9-13ef1d0b8ba1`
- rollback publication: `publication_dafbab89-af38-4a41-a006-9153f126e785`
- operator validation: `GET /operator/publications?stateCode=KL` showed the rollback publication active after replay plus rollback
- public-surface validation: `https://nyaaywatch.in/states/kerala` and `https://nyaaywatch.in/v1/states/kerala/stats` both returned `404`, so Kerala remained internal-only throughout the trial

### Next Required Work

- keep Kerala internal-only until a separate public-readiness review exists
- use Kerala as the validated southern follow-on baseline while the next public-state decision stays separate

## Meghalaya (`ML`) Internal Trial

- candidate geography: Meghalaya
- review date: 2026-04-17
- source boundary: NJDG Meghalaya district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-17
- latest successful validation date: 2026-04-17 live replay and rollback validation
- reviewer: Codex
- decision: `internal trial completed`

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

### Live Trial Evidence

- deployed task definition during proof cycle: `nyaaywatch-staging:47`
- first live fetch run: `run_3dd14fff-0791-45b4-9bd7-27ce798cc850`
- source snapshot date: `2026-04-16`
- candidate quality state: `complete`
- district count captured: `14`
- statewide pending cases captured: `18450`
- first live publication: `publication_b1b1d691-d8bf-4e79-8d2d-119dff5b024c`
- first live snapshot: `snapshot_d3bb97e6-6f30-4077-b174-05bf401b96e7`
- replay run from stored evidence: `run_5fda86c5-aefe-4e33-ae39-e25dac3f4830`
- replay publication: `publication_503248fe-3cc6-4b24-96e9-1317a4ba6001`
- rollback publication: `publication_7337df86-24c6-4290-8ee4-2b740e5110af`
- operator validation: `GET /operator/publications?stateCode=ML` showed the rollback publication active after replay plus rollback
- public-surface validation: `https://nyaaywatch.in/states/meghalaya` and `https://nyaaywatch.in/v1/states/meghalaya/stats` both returned `404`, so Meghalaya remained internal-only throughout the trial

### Next Required Work

- keep Meghalaya internal-only until a separate public-readiness review exists
- use Meghalaya as the validated north-east follow-on baseline now that Assam has moved into the public slot

## Karnataka (`KA`) Internal Trial

- candidate geography: Karnataka
- review date: 2026-04-17
- source boundary: NJDG Karnataka district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-17
- latest successful validation date: 2026-04-17 live replay and rollback validation
- reviewer: Codex
- decision: `internal trial completed`

### Source Viability Notes

- NJDG state code value: `29~3`
- source page footer updated on: `2026-04-16`
- district count exposed on the live state page: `31`
- statewide pending cases shown on the live state page: `22,30,354`
- instituted in last month: `1,99,126`
- disposed in last month: `2,87,712`
- first visible district labels: `BELAGAVI`, `BAGALKOT`, `VIJAYAPURA`, `KALABURAGI`, `BIDAR`
- all five age-bucket widgets were present on the live state page

### Why Karnataka Was The Right Southern Follow-On

- Karnataka keeps the southern expansion story moving after Tamil Nadu and Kerala without forcing another public-state decision first.
- The live source shape matches the current extractor and normalizer contract without new metric exceptions.
- Its 31-district footprint is large enough to matter operationally while staying smaller than the heaviest national stress cases.

### Live Trial Evidence

- deployed task definition during proof cycle: `nyaaywatch-staging:56`
- first live fetch run: `run_c57e88aa-c6bf-40d8-a3fb-9343bd819174`
- source snapshot date: `2026-04-16`
- candidate quality state: `complete`
- district count captured: `31`
- statewide pending cases captured: `2230354`
- first live publication: `publication_54748fe1-5f7c-41d4-bc40-3c976d157f56`
- first live snapshot: `snapshot_fe97877f-bf5a-475a-b89c-90a1926799f4`
- replay run from stored evidence: `run_18f4c2a3-d811-496e-a277-d0d4574906c9`
- replay publication: `publication_144604b7-c587-4be3-8077-1c373bd9968e`
- rollback publication: `publication_30e8a0c5-9d15-4e9d-8f4b-ebf3143efb39`
- operator validation: `GET /operator/publications?stateCode=KA` showed the rollback publication active after replay plus rollback
- public-surface validation: `https://nyaaywatch.in/states/karnataka` and `https://nyaaywatch.in/v1/states/karnataka/stats` both returned `404`, so Karnataka remained internal-only throughout the trial

### Next Required Work

- keep Karnataka internal-only until a separate public-readiness review exists
- use Karnataka as the validated next southern internal-only baseline after Kerala

## Tripura (`TR`) Internal Trial

- candidate geography: Tripura
- review date: 2026-04-17
- source boundary: NJDG Tripura district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-17
- latest successful validation date: 2026-04-17 live replay and rollback validation
- reviewer: Codex
- decision: `internal trial completed`

### Source Viability Notes

- NJDG state code value: `16~20`
- source page footer updated on: `2026-04-16`
- district count exposed on the live state page: `8`
- statewide pending cases shown on the live state page: `63,981`
- instituted in last month: `10,656`
- disposed in last month: `15,663`
- first visible district labels: `West Tripura`, `North Tripura`, `South Tripura`, `Unakoti`, `Gomati`
- all five age-bucket widgets were present on the live state page

### Why Tripura Was The Right Light North-East Follow-On

- Tripura deepens the north-east operating story after Assam and Meghalaya without widening the public site.
- The live source shape matches the current extractor and normalizer contract without new metric exceptions.
- Its 8-district footprint makes it a clean light-state proof while the heavier north-east baseline already exists.

### Live Trial Evidence

- deployed task definition during proof cycle: `nyaaywatch-staging:56`
- first live fetch run: `run_6b5e6751-0835-42b1-a89a-f3da080f5287`
- source snapshot date: `2026-04-16`
- candidate quality state: `complete`
- district count captured: `8`
- statewide pending cases captured: `63981`
- first live publication: `publication_3936f6cd-c9fe-403a-84b2-ba22e3fdf39b`
- first live snapshot: `snapshot_fc6ae256-9681-48ce-a27f-a36f005c3edb`
- replay run from stored evidence: `run_42e9b2bc-e00e-43b2-8f2b-f9c103ba2246`
- replay publication: `publication_4e89a6b5-5d92-4884-9270-512e78ba2801`
- rollback publication: `publication_81692c3c-e86a-4774-8619-32cc60f11a85`
- operator validation: `GET /operator/publications?stateCode=TR` showed the rollback publication active after replay plus rollback
- public-surface validation: `https://nyaaywatch.in/states/tripura` and `https://nyaaywatch.in/v1/states/tripura/stats` both returned `404`, so Tripura remained internal-only throughout the trial

### Next Required Work

- keep Tripura internal-only until a separate public-readiness review exists
- use Tripura as a validated light north-east follow-on state behind Assam and Meghalaya

## Nagaland (`NL`) Internal Trial

- candidate geography: Nagaland
- review date: 2026-04-17
- source boundary: NJDG Nagaland district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-17
- latest successful validation date: 2026-04-17 live replay and rollback validation
- reviewer: Codex
- decision: `internal trial completed`

### Source Viability Notes

- NJDG state code value: `13~34`
- source page footer updated on: `2026-04-16`
- district count exposed on the live state page: `11`
- statewide pending cases shown on the live state page: `3,984`
- instituted in last month: `70`
- disposed in last month: `76`
- first visible district labels: `Dimapur`, `Kohima`, `Mokokchung`, `Wokha`, `Zunheboto`
- all five age-bucket widgets were present on the live state page

### Why Nagaland Was The Right Additional North-East Proof

- Nagaland keeps the north-east track from depending on only one large baseline and one lighter follow-on.
- The live source shape matches the current extractor and normalizer contract without new metric exceptions.
- Its 11-district footprint is manageable enough to make it a sensible additional internal-only proof candidate while Assam is live publicly.

### Live Trial Evidence

- deployed task definition during proof cycle: `nyaaywatch-staging:56`
- first live fetch run: `run_8abb0436-80c5-4ce3-92c7-cf6049c55010`
- source snapshot date: `2026-04-17`
- candidate quality state: `complete`
- district count captured: `11`
- statewide pending cases captured: `3984`
- first live publication: `publication_abc433b9-1db4-4661-902e-ffd8861e35af`
- first live snapshot: `snapshot_1d804dd1-895d-4db9-870c-0ff030c22082`
- replay run from stored evidence: `run_d3d5a492-1515-4e77-ab25-27135054b787`
- replay publication: `publication_134cafec-fe70-4245-95bc-aa79244cb823`
- rollback publication: `publication_10a4a7ba-57ca-4382-86e5-3be094136be7`
- operator validation: `GET /operator/publications?stateCode=NL` showed the rollback publication active after replay plus rollback
- public-surface validation: `https://nyaaywatch.in/states/nagaland` and `https://nyaaywatch.in/v1/states/nagaland/stats` both returned `404`, so Nagaland remained internal-only throughout the trial

### Next Required Work

- keep Nagaland internal-only until a separate public-readiness review exists
- use Nagaland as additional north-east operating evidence rather than as an implied next public slot

## Telangana (`TS`) Internal Trial

- candidate geography: Telangana
- review date: 2026-04-17
- source boundary: NJDG Telangana district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-17
- latest successful validation date: 2026-04-18 live public rollout verification
- reviewer: Codex
- decision: `public rollout completed`

### Source Viability Notes

- NJDG state code value: `36~29`
- source page footer updated on: `2026-04-16`
- district count exposed on the live state page: `33`
- statewide pending cases shown on the live state page: `9,84,793`
- instituted in last month: `49,090`
- disposed in last month: `60,884`
- leading district names captured in the normalized snapshot: `Hyderabad`, `Rangareddy`, `Medchal Malkajgiri`, `Nalgonda`, `Karimnagar`
- all five age-bucket widgets were present on the live state page

### Why Telangana Was The Right Next Southern Baseline

- Telangana keeps the southern expansion story moving with a heavier state surface after Tamil Nadu, Kerala, and Karnataka.
- The live source shape matches the current extractor and normalizer contract without new metric exceptions.
- Its 33-district footprint adds meaningful operating evidence before any further public-state decision.

### Live Trial Evidence

- deployed task definition during proof cycle: `nyaaywatch-staging:58`
- first live fetch run: `run_b48f6632-d59e-4bf9-9cdf-30125e045538`
- source snapshot date: `2026-04-16`
- candidate quality state: `complete`
- district count captured: `33`
- statewide pending cases captured: `984793`
- first live publication: `publication_eebf7779-60ed-4f91-967e-ab8dd6006fb8`
- first live snapshot: `snapshot_16dda47e-b151-4528-810c-fecc6b0eacbd`
- replay run from stored evidence: `run_e350d3ba-98d9-4d55-b073-638e69a8039d`
- replay publication: `publication_64116adc-188e-4753-8cdb-a6a21d114e61`
- rollback publication: `publication_83bbcec4-3402-4f8c-9014-6646255a64a0`
- operator validation: `GET /operator/publications?stateCode=TS` showed the rollback publication active after replay plus rollback
- public-surface validation: `https://nyaaywatch.in/states/telangana` and `https://nyaaywatch.in/v1/states/telangana/stats` both returned `404`, so Telangana remained internal-only throughout the trial

### Public Rollout Evidence

- deploy run: `24593998269`
- deployed task definition during public rollout: `nyaaywatch-staging:60`
- public rollout fetch run: `run_79ae11fb-75fa-460d-a47d-929d0889657c`
- public rollout publication: `publication_7691e5be-23b5-46ca-9aff-dd84148b7e8b`
- public rollout snapshot: `snapshot_c350559b-947a-40ac-9dd4-daea74f64218`
- rollback target retained from the internal trial: `publication_83bbcec4-3402-4f8c-9014-6646255a64a0`
- release verification: `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug telangana` passed with `districtCount=33`, `trendCount=2`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
- browser validation: `https://nyaaywatch.in/states/telangana` loaded with the expected Telangana title, published-snapshot trust text, and supported-state navigation for Punjab, Haryana, Tamil Nadu, Assam, and Telangana

### Next Required Work

- advance the remaining public queue from the still-internal states in internal-proof order rather than adding fresh public exceptions
- keep the next unsupported-state batch internal-only while Telangana settles as a public state

## Andhra Pradesh (`AP`) Internal Trial

- candidate geography: Andhra Pradesh
- review date: 2026-04-17
- source boundary: NJDG Andhra Pradesh district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-17
- latest successful validation date: 2026-04-17 live replay and rollback validation
- reviewer: Codex
- decision: `internal trial completed`

### Source Viability Notes

- NJDG state code value: `28~2`
- source page footer updated on: `2026-04-16`
- district count exposed on the live state page: `13`
- statewide pending cases shown on the live state page: `9,29,470`
- instituted in last month: `94,380`
- disposed in last month: `1,05,140`
- leading district names captured in the normalized snapshot: `Guntur`, `Chittoor`, `Krishna`, `Visakapatnam`, `East Godavari`
- all five age-bucket widgets were present on the live state page

### Why Andhra Pradesh Was The Right Companion Southern Proof

- Andhra Pradesh adds another southern source surface without widening the public site.
- The live source shape matches the current extractor and normalizer contract without new metric exceptions.
- Its 13-district footprint complements Telangana by adding a lighter but still meaningful southern proof state.

### Live Trial Evidence

- deployed task definition during proof cycle: `nyaaywatch-staging:58`
- first live fetch run: `run_4cb87c2a-1c31-4437-98ef-dc7d082ad6ef`
- source snapshot date: `2026-04-16`
- candidate quality state: `complete`
- district count captured: `13`
- statewide pending cases captured: `929470`
- first live publication: `publication_337af32e-4f9c-45ab-a4a4-52d43a2028b4`
- first live snapshot: `snapshot_95c7f026-6db2-46a8-a0d2-2641512df02f`
- replay run from stored evidence: `run_ce2ec512-176a-483e-ba9c-309054a0fff6`
- replay publication: `publication_89c24d14-008d-4ede-a6e8-2728976b8579`
- rollback publication: `publication_c9d3057f-b1a2-4a0f-83ea-ac2b66886e1a`
- operator validation: `GET /operator/publications?stateCode=AP` showed the rollback publication active after replay plus rollback
- public-surface validation: `https://nyaaywatch.in/states/andhra-pradesh` and `https://nyaaywatch.in/v1/states/andhra-pradesh/stats` both returned `404`, so Andhra Pradesh remained internal-only throughout the trial

### Next Required Work

- keep Andhra Pradesh internal-only until a separate public-readiness review exists
- use Andhra Pradesh as a deliberate public-candidate option only if the next public-state decision explicitly chooses it

## Arunachal Pradesh (`AR`) Internal Trial

- candidate geography: Arunachal Pradesh
- review date: 2026-04-17
- source boundary: NJDG Arunachal Pradesh district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-17
- latest successful validation date: 2026-04-17 live replay and rollback validation
- reviewer: Codex
- decision: `internal trial completed`

### Source Viability Notes

- NJDG state code value: `12~36`
- source page footer updated on: `2026-04-16`
- district count exposed on the live state page: `27`
- statewide pending cases shown on the live state page: `15,539`
- instituted in last month: `572`
- disposed in last month: `678`
- leading district names captured in the normalized snapshot: `Papum Pare`, `East Siang`, `West Siang`, `Lohit`, `West Kameng`
- all five age-bucket widgets were present on the live state page

### Why Arunachal Pradesh Was The Right Heavier North-East Proof

- Arunachal Pradesh materially deepens the north-east operating story after Assam, Meghalaya, Tripura, and Nagaland.
- The live source shape matches the current extractor and normalizer contract without new metric exceptions.
- Its 27-district footprint gives the north-east queue another larger baseline before any new public-state decision.

### Live Trial Evidence

- deployed task definition during proof cycle: `nyaaywatch-staging:58`
- first live fetch run: `run_330e608c-890c-47e2-a585-3171c3c44c42`
- source snapshot date: `2026-04-16`
- candidate quality state: `complete`
- district count captured: `27`
- statewide pending cases captured: `15539`
- first live publication: `publication_316b931a-30e2-418f-ae8b-ade91f1b4fa9`
- first live snapshot: `snapshot_6f5e32be-6e04-4917-9baa-b7ac7b200915`
- replay run from stored evidence: `run_7067210b-fe7f-4366-a6a7-e0788824e727`
- replay publication: `publication_6fa73859-0fff-44be-99ae-17140d41678a`
- rollback publication: `publication_3acdfe73-8c9b-40a8-b882-472934a2fa90`
- operator validation: `GET /operator/publications?stateCode=AR` showed the rollback publication active after replay plus rollback
- public-surface validation: `https://nyaaywatch.in/states/arunachal-pradesh` and `https://nyaaywatch.in/v1/states/arunachal-pradesh/stats` both returned `404`, so Arunachal Pradesh remained internal-only throughout the trial

### Next Required Work

- keep Arunachal Pradesh internal-only until a separate public-readiness review exists
- use Arunachal Pradesh as a deliberate public-candidate option only if the next public-state decision explicitly chooses it

## Manipur (`MN`) Internal Trial

- candidate geography: Manipur
- review date: 2026-04-17
- source boundary: NJDG Manipur district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-17
- latest successful validation date: 2026-04-17 live replay and rollback validation
- reviewer: Codex
- decision: `internal trial completed`

### Source Viability Notes

- NJDG state code value: `14~25`
- source page footer updated on: `2026-04-16`
- district count exposed on the live state page: `9`
- statewide pending cases shown on the live state page: `14,860`
- instituted in last month: `1,174`
- disposed in last month: `869`
- leading district names captured in the normalized snapshot: `Imphal West`, `Imphal East`, `Thoubal`, `Bishnupur`, `Churachandpur`
- all five age-bucket widgets were present on the live state page

### Why Manipur Was The Right Additional North-East Follow-On

- Manipur adds another distinct north-east source surface without widening the public site.
- The live source shape matches the current extractor and normalizer contract without new metric exceptions.
- Its 9-district footprint makes it a practical lighter companion proof behind Assam, Meghalaya, and Arunachal Pradesh.

### Live Trial Evidence

- deployed task definition during proof cycle: `nyaaywatch-staging:58`
- first live fetch run: `run_ce3e086f-84f5-40d7-9540-366fe1c40a25`
- source snapshot date: `2026-04-16`
- candidate quality state: `complete`
- district count captured: `9`
- statewide pending cases captured: `14860`
- first live publication: `publication_d747187e-cc5e-4071-9fba-75a73e96058c`
- first live snapshot: `snapshot_8dbdd101-5f56-4d56-92ac-887c4028f64a`
- replay run from stored evidence: `run_bdfe0d4a-770d-49cb-9f04-952999686779`
- replay publication: `publication_bf0bd251-57dd-4807-b084-bbbac79e106e`
- rollback publication: `publication_29505d10-5434-4237-8b0d-89a9dfcf08cf`
- operator validation: `GET /operator/publications?stateCode=MN` showed the rollback publication active after replay plus rollback
- public-surface validation: `https://nyaaywatch.in/states/manipur` and `https://nyaaywatch.in/v1/states/manipur/stats` both returned `404`, so Manipur remained internal-only throughout the trial

### Next Required Work

- keep Manipur internal-only until a separate public-readiness review exists
- use Manipur as a deliberate public-candidate option only if the next public-state decision explicitly chooses it

## Madhya Pradesh (`MP`), Maharashtra (`MH`), Bihar (`BR`), And Gujarat (`GJ`) Internal Proof Batch

- candidate geographies: Madhya Pradesh, Maharashtra, Bihar, and Gujarat
- review date: 2026-04-18
- source boundary: NJDG district dashboard aggregate pages for each state
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-18
- latest successful validation date: 2026-04-18 live replay and rollback validation
- reviewer: Codex
- decision: `internal trial completed`

### Live Trial Evidence

- deployed task definition during proof cycle: `nyaaywatch-staging:60`
- Madhya Pradesh fetch `run_14520fbf-0fea-4bd9-95cb-e77b100a807f`, publish `publication_18e27b87-5922-40da-a084-8af808be3ecb`, replay `run_bfdce54a-47ac-4a5f-854d-fcd744fd9513`, replay publication `publication_d37491d5-5714-4590-a542-ebda13b14b03`, and rollback `publication_3f08b92a-ac96-4a4a-9041-c02d90b1a2f2` all succeeded
- Maharashtra fetch `run_cfdf23ca-aa24-4dd4-b954-6b07d5c9701a`, publish `publication_e19586db-da7e-4db7-a3f2-4fe484e05598`, replay `run_7e93efa9-aafc-4ca0-8948-d3eb29d44a31`, replay publication `publication_dd6d8431-409e-401c-9320-9ab6c2ea8884`, and rollback `publication_f000da6a-79d1-4683-8acf-2a1b235611b4` all succeeded
- Bihar fetch `run_0e7317c9-2774-481f-88a9-3c52c8e1b49d`, publish `publication_07d2e083-c592-4017-b1a5-5a4ce03075ae`, replay `run_af0583ea-ef66-48d0-9b21-f582697061ce`, replay publication `publication_7e723234-8fa1-4d61-ad81-bfd4c39c49be`, and rollback `publication_3319a11d-16fd-4a40-ad4a-cb4869f41d31` all succeeded
- Gujarat fetch `run_18386bb6-ac8a-4217-9d76-b9ad169678d3`, publish `publication_9f3892de-ed4b-4ccb-822f-5cce3c9372b8`, replay `run_ad51cf0d-5760-4913-b979-14d75cf80d32`, replay publication `publication_46ab606a-4f3d-4d93-a60e-66dc7c13e978`, and rollback `publication_82c79b8b-aa07-4733-802e-12bd65e1c897` all succeeded
- public-surface validation: the page and stats routes for Madhya Pradesh, Maharashtra, Bihar, and Gujarat all returned `404`, so all four states remained internal-only throughout the batch

### Recommendation

This batch is now operating evidence, not source-only speculation. Public rollout should still lag that internal qualification, and the next unsupported-state work should move to Odisha, West Bengal, Jharkhand, and Chhattisgarh before the final Goa, Sikkim, and Mizoram wave.

## Kerala (`KL`) Public Rollout

- candidate geography: Kerala
- review date: 2026-04-18
- source boundary: NJDG Kerala district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- latest successful validation date: 2026-04-18 live public rollout verification
- reviewer: Codex
- decision: `public rollout completed`

### Public Rollout Evidence

- deployed task definition during rollout: `nyaaywatch-staging:62`
- deploy run: `24594772675`
- public rollout fetch run: `run_e4ce54db-1dd6-473e-8ea6-318856c3f1f5`
- public rollout publication: `publication_4fff0bca-7b58-49d1-992d-a113c43f577a`
- public rollout snapshot: `snapshot_99d7ad98-ff3c-40e2-9922-e4661998e839`
- rollback target retained from the prior internal proof cycle: `publication_dafbab89-af38-4a41-a006-9153f126e785`
- release verification: `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug kerala` passed with `districtCount=14`, `trendCount=2`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
- live route validation: `https://nyaaywatch.in/states/kerala` and `https://nyaaywatch.in/v1/states/kerala/stats` both returned `200`
- live HTML validation: the public page title resolved to `NyaayWatch — How long is the wait for justice in Kerala?` and the page heading resolved to `How long is the wait for justice in Kerala?`

### Recommendation

Kerala is now the sixth additional public state. The next public rollout should continue from the still-internal states already cleared earlier in the internal-proof queue, starting with Meghalaya.

## Odisha (`OD`), West Bengal (`WB`), Jharkhand (`JH`), And Chhattisgarh (`CG`) Internal Proof Batch

- candidate geographies: Odisha, West Bengal, Jharkhand, and Chhattisgarh
- review date: 2026-04-18
- source boundary: NJDG district dashboard aggregate pages for each state
- methodology version: `2026.04-alpha`
- first successful capture date: `2026-04-18`
- latest successful validation date: 2026-04-18 live replay and rollback validation
- reviewer: Codex
- decision: `internal trial completed`

### Live Trial Evidence

- deployed task definition during proof cycle: `nyaaywatch-staging:62`
- Odisha fetch `run_eb64e8ff-b70b-4eda-be14-180441a38548`, publish `publication_24cc3461-c2e1-47b0-a870-907306ca183d`, replay `run_07c3627f-1f65-4915-9516-1d72d2ae9e18`, replay publication `publication_3df28695-e014-44d2-9b36-4bb7bb95a9cb`, and rollback `publication_0b8376be-33ae-4c60-a534-835ebb199b57` all succeeded
- West Bengal fetch `run_4af4d3ee-db7f-4570-995b-361d99bb6bcf`, publish `publication_4b085772-5b96-402c-81fb-2bc5a9b12060`, replay `run_3e45e064-d1b8-41ea-aefe-f1c7372d3a8f`, replay publication `publication_68fe225e-1270-412c-8472-551ec957a8d3`, and rollback `publication_09fd4895-3a75-4c8f-97aa-5222e4137541` all succeeded
- Jharkhand fetch `run_9555324e-3416-4c6d-8287-e666982f8bec`, publish `publication_ff13fc7e-1d39-44ad-ad17-c45f2515f159`, replay `run_ad91c0c0-59f9-4c50-be1c-26f387539e47`, replay publication `publication_12072ce8-33b1-4349-b13d-63516900d091`, and rollback `publication_12683d90-942c-4050-b5f7-7ccca8932b07` all succeeded
- Chhattisgarh fetch `run_3deffe82-3ee7-477f-ae37-e70b93d544e6`, publish `publication_301acf9a-e2d2-46b2-940c-42a2cd989ece`, replay `run_d60f4c4b-8385-4193-9a63-efc5dcc3dcda`, replay publication `publication_e4502b2d-9466-434a-903e-53ff22426428`, and rollback `publication_412a4d67-73fe-4bdd-b149-24c05cbaf973` all succeeded
- public-surface validation: the page and stats routes for Odisha, West Bengal, Jharkhand, and Chhattisgarh all returned `404`, so all four states remained internal-only throughout the batch

### Recommendation

This batch is now operating evidence, not source-only speculation. The final unsupported-state work should now move to Goa, Sikkim, and Mizoram, while public rollout continues in the already-cleared internal-proof order.

## Meghalaya (`ML`) Public Rollout

- candidate geography: Meghalaya
- review date: 2026-04-18
- source boundary: NJDG Meghalaya district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- latest successful validation date: 2026-04-18 live public rollout verification
- reviewer: Codex
- decision: `public rollout completed`

### Public Rollout Evidence

- deployed task definition during rollout: `nyaaywatch-staging:64`
- deploy run: `24595471387`
- public rollout fetch run: `run_30e5689d-a0da-46e8-8c27-c8624b68cd9d`
- public rollout publication: `publication_72eff473-ec6f-4f28-b4d6-fd1cffef04e5`
- public rollout snapshot: `snapshot_4b2e5621-0336-41aa-a492-3163e57cad1a`
- rollback target retained from the prior internal proof cycle: `publication_7337df86-24c6-4290-8ee4-2b740e5110af`
- release verification: `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug meghalaya` passed with `districtCount=14`, `trendCount=2`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
- live route validation: `https://nyaaywatch.in/states/meghalaya` and `https://nyaaywatch.in/v1/states/meghalaya/stats` both returned `200`
- live HTML validation: the public page title resolved to `NyaayWatch — How long is the wait for justice in Meghalaya?` and the page heading resolved to `How long is the wait for justice in Meghalaya?`

### Recommendation

Meghalaya is now the seventh additional public state. The next public rollout should continue from the still-internal states already cleared earlier in the internal-proof queue, starting with Karnataka.

## Karnataka (`KA`) Public Rollout

- candidate geography: Karnataka
- review date: 2026-04-18
- source boundary: NJDG Karnataka district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- latest successful validation date: 2026-04-18 live public rollout verification
- reviewer: Codex
- decision: `public rollout completed`

### Public Rollout Evidence

- deployed task definition during rollout: `nyaaywatch-staging:66`
- deploy run: `24596186779`
- public rollout fetch run: `run_79131eaf-bd31-4c4e-a95f-fc84b065a261`
- public rollout publication: `publication_c58870a4-f378-4848-a8ce-ae38fb62f885`
- public rollout snapshot: `snapshot_87bd1945-6b36-415f-965e-8c06cf60a989`
- rollback target retained from the prior internal proof cycle: `publication_30e8a0c5-9d15-4e9d-8f4b-ebf3143efb39`
- release verification: `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug karnataka` passed with `districtCount=31`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
- live route validation: `https://nyaaywatch.in/states/karnataka` and `https://nyaaywatch.in/v1/states/karnataka/stats` both returned `200`
- live HTML validation: the public page title resolved to `NyaayWatch — How long is the wait for justice in Karnataka?` and the page heading resolved to `How long is the wait for justice in Karnataka?`

### Recommendation

Karnataka is now the eighth additional public state. The next public rollout should continue from the still-internal states already cleared earlier in the internal-proof queue, starting with Tripura.

## Goa (`GA`), Sikkim (`SK`), And Mizoram (`MZ`) Internal Proof Batch

- candidate geographies: Goa, Sikkim, and Mizoram
- review date: 2026-04-18
- source boundary: NJDG district dashboard aggregate pages for each state
- methodology version: `2026.04-alpha`
- first successful capture date: `2026-04-18`
- latest successful validation date: 2026-04-18 live replay and rollback validation
- reviewer: Codex
- decision: `internal trial completed`

### Live Trial Evidence

- deployed task definition during proof cycle: `nyaaywatch-staging:64`
- Goa fetch `run_1e21db34-f85b-48ef-9f3b-aaeea6e92f35`, publish `publication_72807a9b-b91b-4f66-8b46-2b04bcaec370`, replay `run_710e9e5f-63b3-469b-a774-2e981fa7ade2`, replay publication `publication_bfb24816-c643-4953-9afc-496f116a9f36`, and rollback `publication_03355c7b-12b3-4d56-99ff-a88cffaf99fe` all succeeded
- Sikkim fetch `run_cbd239e8-ac46-44fd-bd7b-00e62e4c853f`, publish `publication_67ef880e-b6e6-4b84-8991-e0ff35f70f67`, replay `run_1861f08d-09df-4cfd-a440-c7e3d8e69add`, replay publication `publication_061c8ad2-e542-4d35-8740-08326b68ade0`, and rollback `publication_cde025be-6141-4f4c-8933-42844f5d0f0f` all succeeded
- Mizoram fetch `run_b788b9fe-194f-496b-a546-df26e62dd920`, publish `publication_087ca72e-d021-4138-8933-37a227010631`, replay `run_1cd62bb2-cb1c-4780-a56e-726323045f78`, replay publication `publication_906406d3-585e-49bc-9b9d-5caf3ad6868d`, and rollback `publication_fbcca757-9039-4891-900f-98bc0889c481` all succeeded
- public-surface validation: the page and stats routes for Goa, Sikkim, and Mizoram all returned `404`, so all three states remained internal-only throughout the batch

### Recommendation

All planned states are now covered by live internal proof. Public rollout should continue in internal-proof order, which keeps Goa, Sikkim, and Mizoram at the back of the current queue behind the earlier validated states.

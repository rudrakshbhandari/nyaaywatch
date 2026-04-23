# India Court Coverage Audit

Audit date: **April 23, 2026**

Purpose: record what NyaayWatch currently covers against the live official court-data surfaces, and identify what is still excluded before the product can claim all-India comprehensiveness across court tiers.

## Sources Checked

- Supreme Court of India jurisdiction page: `https://www.sci.gov.in/jurisdiction/`
- Department of Justice NJDG overview: `https://doj.gov.in/the-national-judicial-data-grid-njdg/`
- High Court NJDG dashboard: `https://njdg.ecourts.gov.in/hcnjdg_v2/`
- District and subordinate court NJDG dashboard: `https://njdg.ecourts.gov.in/njdg_v3/`

This audit uses the live NJDG selector lists available on April 23, 2026, not a static in-repo assumption.

## Current Coverage Verdict

NyaayWatch is comprehensive for configured **court tiers** at the Supreme Court and High Court registry level:

- Supreme Court: configured and public beta.
- High Courts: all 25 HC NJDG selectors are represented in `src/high-courts.ts`.

NyaayWatch is now comprehensive at the **lower-court selector registry** level, but not yet comprehensive at the public lower-court publication level:

- Lower-court NJDG exposes 36 state/Union Territory selector geographies.
- `src/geographies.ts` implements all 36 lower-court state/Union Territory profiles.
- All 36 lower-court profiles are daily internal-fetch enabled after proof.
- 28 lower-court profiles are public alpha.
- 8 Union Territory or UT-style profiles are internal-only until a UT-aware public copy and methodology review is complete.

Do not describe the product as fully all-India lower-court public comprehensive until the 8 internal-only lower-court geographies below are published.

## Supreme Court

Status: covered.

Repo posture:

- route family: `/supreme-court`
- API family: `/v1/supreme-court/...`
- public beta: yes
- source model: Supreme Court NJDG aggregate snapshot

## High Courts

Status: all 25 HC NJDG selectors are configured.

Public beta posture after this change:

- 15 High Courts are public beta.
- 10 High Courts remain configured but not public beta.
- The reviewed-High-Court internal fetch schedule includes only profiles with `sourceReviewStatus=reviewed`; public exposure remains controlled by `publicBeta`.

| HC NJDG selector | Official NJDG label | Repo code | Public beta |
| --- | --- | --- | --- |
| `9~13` | Allahabad High Court | `UPHC` | yes |
| `27~1` | Bombay High Court | `BOHC` | yes |
| `19~16` | Calcutta High Court | `CLHC` | yes |
| `18~6` | Gauhati High Court | `GHHC` | yes |
| `36~29` | High Court for State of Telangana | `TSHC` | yes |
| `28~2` | High Court of Andhra Pradesh | `APHC` | yes |
| `22~18` | High Court of Chhattisgarh | `CGHC` | no |
| `7~26` | High Court of Delhi | `DLHC` | yes |
| `24~17` | High Court of Gujarat | `GJHC` | yes |
| `2~5` | High Court of Himachal Pradesh | `HPHC` | yes |
| `1~12` | High Court of Jammu and Kashmir | `JKLHC` | yes |
| `20~7` | High Court of Jharkhand | `JHHC` | no |
| `29~3` | High Court of Karnataka | `KAHC` | no |
| `32~4` | High Court of Kerala | `KLHC` | yes |
| `23~23` | High Court of Madhya Pradesh | `MPHC` | yes |
| `14~25` | High Court of Manipur | `MNHC` | no |
| `17~21` | High Court of Meghalaya | `MLHC` | no |
| `21~11` | High Court of Orissa | `ODHC` | no |
| `3~22` | High Court of Punjab and Haryana | `PHHC` | yes |
| `8~9` | High Court of Rajasthan | `RJHC` | yes |
| `11~24` | High Court of Sikkim | `SKHC` | no |
| `16~20` | High Court of Tripura | `TRHC` | no |
| `5~15` | High Court of Uttarakhand | `UKHC` | no |
| `33~10` | Madras High Court | `MDHC` | yes |
| `10~8` | Patna High Court | `BRHC` | no |

Naming note: the live HC NJDG selector still says `High Court of Jammu and Kashmir`. NyaayWatch public copy uses the current institutional name `High Court of Jammu & Kashmir and Ladakh`, because that is the common court for the Union Territories of Jammu and Kashmir and Ladakh. The ingest target remains the upstream selector value `1~12`.

## District And Subordinate Courts

Status: all 36 NJDG selectors are registered and daily internal-fetch enabled; 28 are public alpha.

The live lower-court NJDG selector list exposes 36 state/Union Territory geographies. The repo now implements all 36 lower-court profiles.

Internal-only lower-court geographies pending public exposure:

| Lower-court NJDG selector | Selector label | Repo code | Public alpha | Daily internal fetch |
| --- | --- | --- | --- | --- |
| `35~28` | Andaman and Nicobar | `AN` | no | yes |
| `4~27` | Chandigarh | `CHD` | no | yes |
| `7~26` | Delhi | `DL` | no | yes |
| `1~12` | Jammu and Kashmir | `JK` | no | yes |
| `37~33` | Ladakh | `LA` | no | yes |
| `31~37` | Lakshadweep | `LD` | no | yes |
| `34~35` | Puducherry | `PY` | no | yes |
| `38~38` | The Dadra And Nagar Haveli And Daman And Diu | `DNHDD` | no | yes |

These profiles are now included in `listInternalFetchStateProfiles()` after completing live staging `fetch -> inspect -> publish -> replay -> rollback` proof cycles. They remain excluded from `listPublicStateProfiles()` until public lower-court copy and methodology language is made state/Union Territory aware.

Proof-cycle evidence from April 23, 2026:

| Repo code | Fetch run | Replay run | Rollback publication | Source snapshot | Districts | Pending cases |
| --- | --- | --- | --- | --- | ---: | ---: |
| `AN` | `run_1f1fe012-5c39-4a77-ace1-54350d33b3a6` | `run_104a95f2-e941-4af8-9e4d-c44592ad9991` | `publication_cc492d80-2b56-4a3d-9569-2a227fbf8461` | `2026-04-23` | 4 | 8,722 |
| `CHD` | `run_52d1c76c-357f-4a5a-a5bd-c073d12cc1bd` | `run_f6b6ece4-21e9-4249-ab85-f5fe44e98423` | `publication_3ca076d9-075a-4602-bf7b-3a18ea69afa5` | `2026-04-23` | 1 | 100,496 |
| `DL` | `run_4e308835-45e4-4eab-badc-096f694a4c84` | `run_c2594972-c85e-4b50-9486-f3147b18c900` | `publication_0f306dbf-8b5f-4639-a585-5b4181ffaf63` | `2026-04-23` | 11 | 1,693,817 |
| `JK` | `run_4d31a656-81b7-48c8-831b-7b16645c6c9b` | `run_2d09aefa-9dc5-434f-834a-fdc0c0989de2` | `publication_9679df8c-a167-406e-a89d-cf0c90794809` | `2026-04-23` | 20 | 356,819 |
| `LA` | `run_c27551d1-fa94-4bd9-bc3f-bff4ce75d061` | `run_be8924ec-a267-402f-9a33-5b79e374052f` | `publication_13782eee-5eac-4154-9f0d-bf65abbe6504` | `2026-04-22` | 2 | 1,659 |
| `LD` | `run_0dcc916c-c986-4402-b2b0-6491b2963f1a` | `run_c01f6937-9574-40bd-9dcf-bcec0a74c392` | `publication_8525bd7e-b9a2-4698-b5f6-8d1051426cb8` | `2026-04-23` | 1 | 577 |
| `PY` | `run_f629f17c-c053-4d1e-824a-ef7361863b2e` | `run_25e012d0-5e04-4909-8bbd-c8d9fa501521` | `publication_d12dcb30-c5e6-4386-91fa-fe0cffa39f17` | `2026-04-22` | 4 | 36,684 |
| `DNHDD` | `run_64134e8b-b667-4890-a950-a5d99417a211` | `run_c8366c43-9e3c-48ce-8093-bfe8e2cf2fa8` | `publication_d056cee6-916c-409e-ba37-23296950902d` | `2026-04-23` | 3 | 8,427 |

## Required Next Implementation Slice

To make NyaayWatch public-comprehensive across all courts of India:

1. Complete a UT-aware lower-court public copy and methodology pass so public routes do not describe Union Territories as states.
2. Add public route and API exposure by switching `publicAlpha=true` only after that review.
3. Verify stable public routes and API parity for each newly public lower-court geography.

Until then, the precise public claim is:

NyaayWatch covers the Supreme Court, all High Court NJDG selectors in the internal registry, and all lower-court NJDG state/Union Territory selectors in the internal registry and daily internal fetch schedule. Public lower-court pages currently cover the 28 proven lower-court state profiles, not the 8 internal-only UT profiles.

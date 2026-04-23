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
- 28 lower-court profiles are public alpha and daily internal-fetch enabled.
- 8 Union Territory or UT-style profiles are internal-only and daily-fetch disabled until explicit proof cycles run.

Do not describe the product as fully all-India lower-court public comprehensive until the 8 internal-only lower-court geographies below are proven and published.

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

Status: all 36 NJDG selectors are registered; 28 are public alpha.

The live lower-court NJDG selector list exposes 36 state/Union Territory geographies. The repo now implements all 36 lower-court profiles.

Internal-only lower-court geographies pending proof and public exposure:

| Lower-court NJDG selector | Selector label | Repo code | Public alpha | Daily internal fetch |
| --- | --- | --- | --- | --- |
| `35~28` | Andaman and Nicobar | `AN` | no | no |
| `4~27` | Chandigarh | `CHD` | no | no |
| `7~26` | Delhi | `DL` | no | no |
| `1~12` | Jammu and Kashmir | `JK` | no | no |
| `37~33` | Ladakh | `LA` | no | no |
| `31~37` | Lakshadweep | `LD` | no | no |
| `34~35` | Puducherry | `PY` | no | no |
| `38~38` | The Dadra And Nagar Haveli And Daman And Diu | `DNHDD` | no | no |

These profiles are deliberately excluded from `listInternalFetchStateProfiles()`. The lower-court daily scheduler should not pick them up until each one has an explicit proof plan.

## Required Next Implementation Slice

To make NyaayWatch public-comprehensive across all courts of India:

1. Run fetch, publish, replay, and rollback proof cycles for the 8 internal-only lower-court UT profiles.
2. Enable `internalFetchEnabled` only after the first proof cycle succeeds for each profile.
3. Add public route and API exposure by switching `publicAlpha=true` only after methodology review.
4. Update this audit after the UT proof batch verifies live route behavior.

Until then, the precise public claim is:

NyaayWatch covers the Supreme Court, all High Court NJDG selectors in the internal registry, and all lower-court NJDG state/Union Territory selectors in the internal registry. Public lower-court pages currently cover the 28 proven lower-court state profiles, not the 8 internal-only UT profiles.

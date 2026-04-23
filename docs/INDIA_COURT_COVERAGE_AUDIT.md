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

NyaayWatch is **not yet comprehensive** for district/subordinate courts:

- Lower-court NJDG exposes 36 state/Union Territory selector geographies.
- `src/geographies.ts` currently implements 28 lower-court state profiles.
- The missing lower-court geographies are all Union Territory or UT-style selectors that need explicit profile additions and proof cycles before public exposure.

Do not describe the product as fully all-India lower-court comprehensive until the missing lower-court geographies below are implemented, proven, and published.

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

Status: partially covered.

The live lower-court NJDG selector list exposes 36 state/Union Territory geographies. The repo currently implements 28 lower-court profiles: Andhra Pradesh, Arunachal Pradesh, Assam, Bihar, Chhattisgarh, Goa, Gujarat, Haryana, Himachal Pradesh, Jharkhand, Karnataka, Kerala, Madhya Pradesh, Maharashtra, Manipur, Meghalaya, Mizoram, Nagaland, Odisha, Punjab, Rajasthan, Sikkim, Tamil Nadu, Telangana, Tripura, Uttar Pradesh, Uttarakhand, and West Bengal.

Missing lower-court geographies:

| Lower-court NJDG selector | Selector label | Required repo profile |
| --- | --- | --- |
| `35~28` | Andaman and Nicobar | Union Territory profile |
| `4~27` | Chandigarh | Union Territory profile |
| `7~26` | Delhi | Union Territory profile |
| `1~12` | Jammu and Kashmir | Union Territory profile |
| `37~33` | Ladakh | Union Territory profile |
| `31~37` | Lakshadweep | Union Territory profile |
| `34~35` | Puducherry | Union Territory profile |
| `38~38` | The Dadra And Nagar Haveli And Daman And Diu | Union Territory profile |

These should not be added casually to `listStateProfiles()` without a release plan. The lower-court daily scheduler automatically targets all implemented state profiles, so adding these profiles will change live internal fetch scope immediately after deploy.

## Required Next Implementation Slice

To make NyaayWatch comprehensive across all courts of India:

1. Add lower-court geography profiles for the 8 missing NJDG state/UT selectors.
2. Keep the new lower-court UT profiles internal-only until each one has fetch, publish, replay, and rollback proof.
3. Add public route and API exposure only after proof cycles and methodology review.
4. Update this audit after the UT proof batch verifies live route behavior.

Until then, the precise public claim is:

NyaayWatch covers the Supreme Court, all High Court NJDG selectors in the internal registry, and the currently implemented lower-court state profiles. It does not yet cover every lower-court state/Union Territory selector.

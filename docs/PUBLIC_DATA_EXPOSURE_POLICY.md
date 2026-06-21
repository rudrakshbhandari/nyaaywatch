# Public Data Exposure Policy

Launch-policy note for the India-first public alpha on what NyaayWatch may expose publicly and what must stay internal.

## Why This Exists

The public alpha requires an explicit decision about raw artifact redistribution before any new public download or evidence-pack format ships.

This document records the current repo decision so operators, reviewers, and future contributors do not infer public exposure rules from implementation details alone.

## Review Basis

Reviewed on April 14, 2026 against the currently published official eCourts policies:

- eCourts Services Copyright Policy: `https://ecourts.gov.in/ecourts2.0/?p=about_us%2Fcopyright`
- eCourts Services Disclaimer: `https://ecourts.gov.in/ecourts2.0/?p=about_us%2Fdisclaimer`

Observed policy points:

- the eCourts copyright page permits reproduction with prominent source acknowledgement
- the same page says that permission does not extend to third-party material and that court-owned material may require permission from the concerned courts
- the eCourts disclaimer says users should cross-check the information with the relevant authorities and that the site data is not meant for legal evidence

Operational inference:

- the repo does not currently have a strong enough affirmative grant to treat raw upstream captures as generally safe for public bulk redistribution
- NyaayWatch should therefore use the narrower public posture until a human legal/policy review clears anything broader

This is a product and launch decision, not formal legal advice.

## Current Alpha Decision

Public alpha exposure is limited to published read-model outputs and citation metadata across the Supreme Court, High Court, and lower-court route families.

Raw upstream captures, replay copies, operator inspection payloads, and unpublished candidates stay internal.

Downloadable public evidence packs that bundle raw upstream HTML are out of scope for alpha.

## Exposure Matrix

| Surface or artifact | Stored in | Public in alpha | Reason |
|---|---|---:|---|
| Homepage, district pages, methodology, API docs | App read model | Yes | Public trust surface built from the active published snapshot only |
| Supreme Court, High Court, and lower-court public JSON endpoints | PostgreSQL published snapshot payload | Yes | Narrow machine-readable published snapshot boundary |
| Lower-court and district history CSV exports | Published snapshot payload plus published history | Yes | Normalized exports with snapshot date, methodology version, freshness, and source attribution |
| District permalinks and citation metadata | Published snapshot payload | Yes | Needed for durable public citation and responsible sharing |
| Raw NJDG HTML capture bundles | S3 raw artifacts | No | Redistribution posture is not cleared for public bulk exposure |
| Replay copies of raw artifacts | S3 replay prefixes | No | Internal operator artifacts only |
| Snapshot candidate JSON before publish | S3 normalized candidate artifacts | No | Unpublished run state must stay private |
| Operator run inspection payloads | PostgreSQL plus S3 | No | Internal review surface only |
| Bundled evidence packs containing raw HTML, screenshots, or unpublished operator context | Would combine multiple internal artifacts | No | Too close to raw redistribution and operator-only material for alpha |

## Public Exposure Rules

For the public alpha:

1. Public downloads must stay inside the published snapshot schema.
2. Every public export must carry snapshot date, publication date, methodology version, and source attribution.
3. Public pages may describe source provenance, but they must not embed or redistribute raw upstream HTML.
4. Public district evidence is provided through permalinks, narrative explanation, metadata, and CSV/API exports rather than raw evidence bundles.
5. Any new public download format must be reviewed against this policy before shipping.

## Future Expansion Gate

Do not widen public exposure unless a later review answers all of the following in writing:

- Is the source material first-party eCourts content or court-specific third-party material?
- Is there clear permission for redistribution, not just viewing?
- Does the public package avoid implying legal evidentiary status?
- Does the package avoid leaking unpublished or operator-only state?

Until those answers are documented, the default decision is `do not expose publicly`.

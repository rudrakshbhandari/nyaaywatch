# Jammu & Kashmir and Ladakh High Court Source Review

Source review for the common High Court of Jammu & Kashmir and Ladakh inside NyaayWatch.

This document records the official public-source boundary for this High Court as verified on `2026-04-22`, with live ingest proof completed on `2026-04-23`.

## Bottom Line

The correct High Court unit here is one common court, not separate Jammu and Kashmir and Ladakh High Courts.

The right source boundary is:

- **canonical aggregate source:** HC NJDG
- **supporting case-level and document link-outs:** High Court Services and the official High Court of Jammu & Kashmir and Ladakh site

The important source nuance is naming:

- HC NJDG and the older High Court Services layer still expose a legacy label aligned to `High Court of Jammu and Kashmir`
- the current official institutional name used by the court is `High Court of Jammu & Kashmir and Ladakh`

NyaayWatch should use the current official court name in public copy and record the upstream naming lag explicitly in methodology and source-review notes.

## Verified Official Sources

### 1. High Court NJDG

Primary URLs:

- [High Courts of India NJDG](https://njdg.ecourts.gov.in/hcnjdg_v2/)
- [Common High Court selector page](https://njdg.ecourts.gov.in/hcnjdg_v2/?p=home&state_code=1~12)

Observed role:

- official aggregate High Court dashboard
- one common selector for this court under legacy Jammu and Kashmir naming
- aggregate pendency, institution, disposal, age-bucket, and case-type surfaces

Why it matters:

- it is the canonical aggregate source for public observability
- it does **not** expose a separate Ladakh High Court selector
- it is the source NyaayWatch should ingest for the common High Court page

### 2. High Court Services

Primary URL:

- [eCourts High Court Services](https://hcservices.ecourts.gov.in/hcservices/main.php)

Observed role:

- case status
- orders and judgments
- cause lists
- bench and High Court selection

Why it matters:

- it is the right official link-out surface for case-level user actions
- it still uses the older Jammu and Kashmir naming in parts of the interface

### 3. Official High Court Site

Primary URL:

- [High Court of Jammu & Kashmir and Ladakh](https://jkhighcourt.nic.in/)

Observed role:

- official institutional site
- current official court naming
- subordinate judiciary pages, notices, rules, and annual-report materials

Why it matters:

- it is the authoritative public institutional surface for the common High Court
- it confirms the current official naming that public copy should follow

## Jurisdiction Boundary

The court serves:

- the Union Territory of Jammu and Kashmir
- the Union Territory of Ladakh

The repo should therefore model:

- one High Court profile
- `coveredGeographies[] = Jammu and Kashmir, Ladakh`

It should **not** model a separate Ladakh High Court unless the official source boundary changes.

## Recommended Source Roles

### Canonical Ingest Source

Use HC NJDG as the canonical aggregate observability input for the common High Court.

### Supporting Link-Out Sources

Use these as public supporting actions, not ingest sources in this slice:

- High Court Services
- the official High Court of Jammu & Kashmir and Ladakh site

## Metric Boundary

The High Court contract here should stay limited to:

- pending civil cases
- pending criminal cases
- total pending cases
- instituted in last month
- disposed in last month
- age-bucket breakdowns
- published trend points from prior stored snapshots

## Decision

Proceed with the common High Court profile using:

- `High Court of Jammu & Kashmir and Ladakh` as the public-facing court name
- HC NJDG selector value `1~12` as the aggregate source target
- `Jammu and Kashmir` and `Ladakh` as explicit covered union territories
- High Court Services and the official High Court site as supporting public link-outs

After the live `fetch -> publish -> replay -> rollback` proof cycle on `2026-04-23`, this source boundary is treated as reviewed for internal raw-fetch scheduling. That does not by itself expose a public route; public beta still depends on a separate `publicBeta` decision.

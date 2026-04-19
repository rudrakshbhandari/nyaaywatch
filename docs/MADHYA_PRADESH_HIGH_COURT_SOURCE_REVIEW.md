# Madhya Pradesh High Court Source Review

Source review for the Madhya Pradesh High Court public beta candidate inside NyaayWatch.

This document records the official public-source boundary for Madhya Pradesh High Court observability as verified on `2026-04-19`.

## Bottom Line

Madhya Pradesh High Court is viable as a public High Court beta page now that the live internal proof bar is already satisfied.

The correct source boundary remains the same as the first Himachal High Court pilot:

- **canonical aggregate source:** HC NJDG
- **supporting case-level and document link-outs:** High Court Services and the official Madhya Pradesh High Court site

## Verified Official Sources

### 1. High Court NJDG

Primary URLs:

- [High Courts of India NJDG](https://njdg.ecourts.gov.in/hcnjdg_v2/)
- [Madhya Pradesh High Court selected page](https://njdg.ecourts.gov.in/hcnjdg_v2/?p=home&state_code=23~23)

Observed role:

- official aggregate High Court dashboard
- selector value for High Court of Madhya Pradesh
- aggregate pendency, institution, disposal, age-bucket, and case-type surfaces

Why it matters:

- it is the canonical aggregate source for public observability
- it matches the stored-evidence High Court snapshot contract already implemented in repo code

### 2. High Court Services

Primary URL:

- [eCourts High Court Services](https://hcservices.ecourts.gov.in/hcservices/main.php)

Observed role:

- case status
- orders and judgments
- cause lists
- bench and High Court selection

Why it matters:

- it is the right official link-out surface for case-level user actions without forcing NyaayWatch into case-level ingest

### 3. Madhya Pradesh High Court Official Site

Primary URL:

- [Madhya Pradesh High Court official site](https://mphc.gov.in/)

Observed role:

- official institutional site
- case status, cause list, judgment and order surfaces under the same official domain
- notices, rules, listing materials, and supporting public court documents

Why it matters:

- it is the authoritative public institutional surface for the court
- it is the right official-site target for the public High Court beta page

## Recommended Source Roles

### Canonical Ingest Source

Use HC NJDG as the canonical aggregate observability input.

### Supporting Link-Out Sources

Use these as public supporting actions, not ingest sources in this beta:

- High Court Services
- Madhya Pradesh High Court official site

## Metric Boundary

The current public High Court beta contract for Madhya Pradesh High Court should stay limited to:

- pending civil cases
- pending criminal cases
- total pending cases
- instituted in last month
- disposed in last month
- age-bucket breakdowns
- published trend points from prior stored snapshots

## Decision

Proceed with the Madhya Pradesh High Court public beta using:

- HC NJDG as the stored-evidence aggregate source
- High Court Services and the official Madhya Pradesh High Court site as public supporting link-outs

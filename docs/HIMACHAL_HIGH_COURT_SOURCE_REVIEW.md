# Himachal High Court Source Review

Source review for the first High Court tier pilot in NyaayWatch.

This document records the official public-source boundary for Himachal High Court observability as verified on `2026-04-18`.

Use it to answer:

- what official sources exist today for a Himachal High Court pilot?
- which source should be treated as the canonical aggregate observability input?
- what should stay as a link-out rather than an ingested surface in v0?

## Bottom Line

Himachal High Court is viable as the first High Court pilot.

The correct source boundary for the pilot is:

- **canonical aggregate source:** HC NJDG
- **supporting case-level and document link-outs:** High Court Services and the official High Court site

The pilot should not begin with:

- case-level ingestion
- judgment-text ingestion
- PDF warehousing
- a custom search product for Himachal High Court records

## Verified Official Sources

### 1. High Court NJDG

Primary URL:

- [High Courts of India NJDG](https://njdg.ecourts.gov.in/hcnjdg_v2/)

Observed role:

- public aggregate High Court dashboard
- national High Court selector that includes **High Court of Himachal Pradesh**
- at-a-glance metrics for pendency, institution, disposal, age buckets, and case-type breakdowns

Why it matters:

- this is the closest High Court analogue to the district/subordinate NJDG surface NyaayWatch already knows how to reason about
- it is the best candidate for a first stored-evidence snapshot source
- the Himachal-selected HC NJDG page is reachable directly via `https://njdg.ecourts.gov.in/hcnjdg_v2/?p=home&state_code=2~5`

### 2. High Court Services

Primary URL:

- [eCourts High Court Services](https://hcservices.ecourts.gov.in/hcservices/main.php)

Observed role:

- case-status search
- order / judgment access
- cause lists
- High Court and bench selection

Why it matters:

- this is the right official surface to link out to when the user wants case-level or order-level detail
- it should support the pilot as a public action surface without forcing NyaayWatch to ingest case-level records yet

### 3. High Court of Himachal Pradesh Official Site

Primary URLs:

- [High Court of Himachal Pradesh sitemap](https://hphighcourt.nic.in/sitemap.html)
- [High Court of Himachal Pradesh official site](https://hphighcourt.nic.in/)

Observed role from the public sitemap:

- case status
- order/judgment
- daily disposal statement
- data of pending cases
- annual report
- High Court rules and supporting public information

Why it matters:

- this is the authoritative public institutional surface for Himachal High Court
- it is the best place to anchor official supporting links and supporting context

### 4. Himachal High Court Annual Report 2023-24

Primary URL:

- [Annual Report 2023-24](https://hphighcourt.nic.in/pdf/AnnualReport23092024.pdf)

Observed role:

- confirms NJDG upload activity is part of the High Court's working information infrastructure
- supports the claim that NJDG-linked monitoring is not an unofficial shadow source

Why it matters:

- it strengthens confidence that the High Court pilot can remain inside official, public, institution-backed information surfaces

### 5. e-Committee NJDG Documentation

Primary URLs:

- [e-Committee NJDG overview](https://ecommitteesci.gov.in/service/national-judicial-data-grid/)
- [NJDG-HC manual landing page](https://ecommitteesci.gov.in/publication/high-courts-of-india-national-judicial-data-grid-njdg-hc-2/)

Observed role:

- confirms NJDG-HC is an official judiciary-backed public data product
- provides the right documentation trail for understanding intended dashboard semantics and public use posture

Why it matters:

- it gives the pilot an official documentation path beyond just scraping a live page

## Recommended Source Roles

### Canonical Ingest Source

Use HC NJDG as the canonical aggregate observability input for the pilot.

Why:

- it is public
- it is official
- it is already shaped like an observability dashboard
- it is closer to the current district/subordinate NyaayWatch model than any case-level High Court interface

### Supporting Link-Out Sources

Use these as public supporting actions, not ingest sources in v0:

- High Court Services
- official Himachal High Court site

Why:

- users may want to inspect individual cases, orders, judgments, and cause lists
- linking out is compatible with the current trust model
- ingesting those surfaces immediately would add more complexity than value in the first pilot

## Metrics The Source Boundary Appears To Support

Based on the currently visible official surfaces, the pilot can plausibly target:

- pending civil cases
- pending criminal cases
- total pending cases
- instituted in last month
- disposed in last month
- age-bucket breakdowns
- case-type breakdowns, if capture stability is confirmed during implementation

The pilot should verify these against stored evidence before treating them as production-ready fields.

## What Should Stay Out Of Scope For V0

Do not treat the following as pilot requirements:

- case-level corpus ingest
- judgment PDF ingest
- free-text order search
- bench-by-bench historical archives
- full parity with the lower-court district model

## Source Risks And Open Questions

### 1. Registered / Unregistered Semantics

High Court and Supreme Court surfaces may expose registered / unregistered distinctions differently from the lower-court layer.

Rule:

- do not put those fields on the public page until the semantics are stable and explicitly documented

### 1a. Source Snapshot Date Gap

As verified on `2026-04-19`, the Himachal-selected HC NJDG page exposes the expected aggregate metrics in static HTML, but the static response does **not** expose a parseable `Last Reviewed and Updated on` date the way district NJDG does.

Observed static footer output:

- `Last Reviewed and Updated on :`
- `S1`
- `Version :2.0`

Operational implication:

- NyaayWatch can implement capture and aggregate extraction now
- NyaayWatch should **not** pretend it already has a trustworthy source snapshot date for High Court publications
- public beta should stay blocked until either:
  - the actual source date is recovered from an official HC NJDG response path, or
  - the methodology intentionally adopts a different trust label such as capture date with an explicit caveat

### 2. Case-Type Breakdown Stability

HC NJDG appears to expose case-type breakdowns, but the pilot should not rely on them until repeated captures prove the labels are stable enough to normalize.

### 3. Official "Data of Pending Cases" Utility

The Himachal High Court site advertises a "Data of Pending Cases" utility through the public sitemap, but the pilot should not treat it as canonical until:

- its actual shape is inspected
- stability is confirmed
- redistribution posture is reviewed

### 4. Raw Artifact Exposure

The pilot should preserve the existing NyaayWatch rule:

- raw upstream captures remain internal by default
- only normalized, publication-safe outputs are candidates for public exposure

## Decision

Proceed with the Himachal High Court pilot using:

- HC NJDG as the stored-evidence aggregate source
- High Court Services and the official Himachal High Court site as public supporting link-outs

This is narrow enough to defend and strong enough to start implementation.

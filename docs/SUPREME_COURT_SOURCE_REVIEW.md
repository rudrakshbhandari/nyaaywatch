# Supreme Court Source Review

Source review for the Supreme Court tier inside NyaayWatch.

This document records the official public-source boundary for a Supreme Court pilot as verified on `2026-04-18` and `2026-04-19`.

Use it to answer:

- what official sources exist today for a Supreme Court observability module?
- which source should be treated as the canonical aggregate observability input?
- which surfaces should remain public link-outs rather than ingested features in v0?

## Bottom Line

Supreme Court is viable as the next public top-down tier.

The correct source boundary for the pilot is:

- **canonical aggregate source:** Supreme Court NJDG
- **supporting operational and document link-outs:** the official Supreme Court of India website

The pilot should not begin with:

- case-level ingestion
- order or judgment PDF warehousing
- a custom Supreme Court search engine
- a flat national comparison layer that pretends Supreme Court semantics already match High Courts and district courts

## Verified Official Sources

### 1. Supreme Court NJDG

Primary URLs:

- [Supreme Court NJDG](https://scdg.sci.gov.in/scnjdg/)
- [Supreme Court NJDG manual](https://cdnbbsr.s3waas.gov.in/s388ef51f0bf911e452e8dbb1d807a81ab/uploads/2025/05/20250530524370674.pdf)

Observed role:

- public aggregate Supreme Court dashboard
- three top-level tabs:
  - At a Glance
  - Pending Dashboard
  - Disposed Dashboard
- at-a-glance metrics for registered cases, unregistered cases, instituted last month, disposed last month, current-year views, and coram-oriented pending views
- pending and disposed dashboards with case-type, age, stage, and disposal-shape analysis

Why it matters:

- this is the correct public aggregate source for a Supreme Court overview module
- it already has the top-of-funnel structure that fits the intended homepage UX
- the official manual confirms the dashboard is meant to support judicial monitoring, public understanding, and downloadable reporting

### 2. Supreme Court Of India NJDG Onboarding Note

Primary URL:

- [Onboarding of Supreme Court of India on NJDG](https://www.sci.gov.in/onboarding-of-supreme-court-of-india-on-njdg/)

Observed role:

- official Supreme Court announcement dated January 16, 2024
- confirms all three tiers of the judiciary are now represented on NJDG
- describes the public NJDG-SC structure and the At a Glance metrics

Why it matters:

- this is the cleanest official source for the trust narrative around the Supreme Court tier
- it explicitly describes registered and unregistered pending, instituted last month, disposed last month, and coram-wise views

### 3. Supreme Court Of India Website

Primary URLs:

- [Supreme Court of India](https://www.sci.gov.in/)
- [FAQ / ready reckoner for obtaining Supreme Court information](https://www.sci.gov.in/faq-ready-reckoner-tips-for-obtaining-information-relating-to-supreme-court/)

Observed role:

- cause list
- case status
- daily orders
- judgments
- office reports
- caveat
- display boards
- official notices and court updates
- direct NJDG link under the homepage's Explore and Connect section

Why it matters:

- this is the authoritative institutional surface for case-level and document-level link-outs
- it gives the Supreme Court tier a clean official action surface without forcing NyaayWatch to ingest case records or PDFs immediately

### 4. e-Committee NJDG Documentation

Primary URL:

- [e-Committee NJDG overview](https://ecommitteesci.gov.in/service/national-judicial-data-grid/)

Observed role:

- lists the Supreme Court, High Court, and district NJDG products together
- links to the Supreme Court NJDG and the Supreme Court NJDG manual

Why it matters:

- it reinforces that the Supreme Court dashboard is part of the same official judiciary-backed NJDG family
- it gives the repo a second official documentation path beyond the Supreme Court site itself

## Recommended Source Roles

### Canonical Ingest Source

Use Supreme Court NJDG as the canonical aggregate observability input for the pilot.

Why:

- it is public
- it is official
- it already exposes the exact top-level metrics a homepage-first tier needs
- it supports a stored-evidence aggregate model without requiring case-level ingestion

### Supporting Link-Out Sources

Use the official Supreme Court website for supporting actions, not ingest, in v0:

- cause list
- case status
- daily orders
- judgments
- office reports

Why:

- users who want to go deeper should land on the official institutional surface
- this keeps the first Supreme Court slice scoped to observability rather than record warehousing

## Metrics The Source Boundary Appears To Support

Based on the currently visible official surfaces, the pilot can plausibly target:

- pending registered cases
- pending unregistered cases
- pending total cases
- instituted in last month
- disposed in last month
- instituted in current year
- disposed in current year
- selected coram-wise pending views
- selected age and case-type views if repeated captures prove stable enough to normalize

The pilot should verify these against stored evidence before treating them as production-ready fields.

## What Should Stay Out Of Scope For V0

Do not treat the following as pilot requirements:

- case-level corpus ingest
- order PDF warehousing
- judgment text warehousing
- live bench or hearing trackers
- a unified "all tiers" ranking model

## Source Risks And Open Questions

### 1. Registered / Unregistered Semantics

Supreme Court NJDG explicitly distinguishes registered and unregistered pending matters.

Rule:

- do not flatten those into one implied pendency number without showing the distinction or documenting exactly why NyaayWatch is combining them

### 2. Coram Metrics

The source supports coram-wise pending views, but those semantics do not map cleanly to High Court or district tiers.

Rule:

- keep coram views optional in v0
- do not let coram logic leak into cross-tier comparisons

### 3. Source Snapshot Date Contract

The Supreme Court NJDG manual describes daily or near-real-time updates, but NyaayWatch still needs to prove what timestamp is actually parseable and stable on stored captures.

Operational implication:

- the Supreme Court tier should adopt the same trust discipline as the High Court tier
- if the source does not expose a defensible source snapshot date on the captured page, use an explicit fallback rather than inventing one

### 4. Raw Artifact Exposure

The pilot should preserve the existing NyaayWatch rule:

- raw upstream captures remain internal by default
- only normalized, publication-safe outputs are candidates for public exposure

## Decision

Proceed with Supreme Court as the next public top-down planning track using:

- Supreme Court NJDG as the stored-evidence aggregate source
- the official Supreme Court website as the supporting public action surface

This is narrow enough to defend and strong enough to become the next national entry module inside NyaayWatch.

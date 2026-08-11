# Government Accountability Roadmap

Strategic roadmap for NyaayWatch beyond its first judiciary vertical.

## North Star

NyaayWatch should become an evidence-first public accountability layer for India’s government.

The product should help people understand what public institutions are doing, what has changed, where pressure or delay is visible, and what evidence supports each finding. It should not present itself as an official government body, a political campaign, or a single score for government performance.

The judiciary is the first vertical and the current production product. Its aggregate snapshot system is the foundation for the broader platform, not the limit of the ambition.

## Current Position

The judiciary vertical is substantially complete at the aggregate public-observability layer:

- Supreme Court public beta
- all 25 High Court NJDG selector-backed profiles in public beta
- all 36 lower-court state and Union Territory NJDG geographies in public alpha
- published snapshots, provenance, methodology, exports, APIs, watchrooms, and evidence packs
- scheduled capture, quality gates, operator publish/replay/rollback, auto-publish, and production alerting

The next strategic problem is no longer court coverage. It is extending the same trust model to a second branch without weakening source discipline or pretending unlike institutions are directly comparable.

## Product Model

The long-term platform should share these primitives across branches:

1. Institution and jurisdiction registry
2. Person, office, and time-bounded role registry
3. Source review and capture contracts
4. Dated evidence snapshots
5. Explicit sourced-versus-derived fields
6. Versioned methodology
7. Quality, freshness, and publication gates
8. Evidence packs, citations, and public read models
9. Issue-led watchrooms and change-over-time views

Each branch should retain its own normalized schema and methodology. A shared shell does not mean a shared metric model.

The public product should avoid a single national “government score” or a mixed-branch leaderboard unless a future methodology can defend that comparison.

## First Non-Judicial Pilot Candidate

### Recommended vertical: legislative accountability and officeholder profiles

Start with a narrow Lok Sabha-first pilot called **Parliamentary Activity Snapshot + MP Profiles**. Keep Rajya Sabha and state legislatures as later expansion decisions after the first source and publication cycle is proven.

Initial candidate questions:

- What bills were introduced, passed, pending, negatived, withdrawn, or referred to a committee in a defined session window?
- Which ministries and policy areas appear in the legislative pipeline?
- How much parliamentary question activity is recorded by ministry, session, question type, or member?
- What official legislative activity is recorded for an individual Member of Parliament over a defined term or session?
- What changed between two published parliamentary snapshots?

The first version should publish aggregate activity and individual, evidence-linked activity profiles—not member performance scores, political judgments, or a claim that legislative activity equals policy quality.

### Individual politician profile contract

Politicians should be first-class accountability entities, but profiles must describe recorded public activity rather than infer personal quality.

The first MP profile may include, where the official source is complete and reproducible:

- person identity, party, constituency, House, term, and time-bounded office history
- bills introduced, sponsored, or otherwise officially attributed to the member
- parliamentary questions by session, ministry, and question type
- recorded debate or participation metadata
- committee membership and documented committee activity
- attendance only where an official source defines the measure clearly
- citations and links to the underlying official records

The product must not turn these fields into a composite politician score. Any comparison should be bounded to an explicit House, session, role, or cohort and should show the underlying counts and caveats.

## Initial Source Review

The official source surface is promising enough for a formal pilot review:

- [Digital Sansad bills](https://sansad.in/ls/legislation/bills) exposes bill-level fields such as title, ministry, dates, status, and committee-related metadata.
- [Parliament Digital Library](https://eparlib.sansad.in/) is hosted by the Lok Sabha Secretariat and provides searchable Lok Sabha debates, questions and answers, parliamentary documents, committee reports, and metadata filters.
- [Digital Sansad questions calendar](https://sansad.in/ls/questions/questions-calendar) is a candidate source for session and question-calendar context.

This is an initial desk review, not source approval. Before implementation, the pilot must resolve:

- stable capture URLs and pagination or API behavior
- source timestamps and session boundaries
- whether the displayed fields are complete, revised, or provisional
- terms, copyright, and redistribution limits for raw pages, PDFs, and extracted text
- deterministic fixture capture and replay
- whether public outputs should contain only derived aggregates plus official links
- parity between Lok Sabha source labels and the proposed public schema
- person identity resolution across spelling variants, constituencies, party changes, and terms
- whether member-attributed activity is complete enough to show as a profile rather than a partial record

The official library’s own guidance indicates that search results cannot automatically be reproduced in publications without permission. That makes a normalized, citation-linked public read model safer than redistributing raw documents or bulk search output in v0.

## Roadmap Stages

### Stage 0: Re-anchor the product

Target: immediate

- make government-wide accountability the documented north star
- define branch, institution, jurisdiction, source, snapshot, and evidence-pack concepts
- keep current judiciary routes and claims unchanged
- create a source-review gate for every future branch

### Stage 1: Harden the judiciary platform

Target: next 3–6 months

- preserve reliable daily aggregate capture and reviewed publication
- improve cross-snapshot change detection and issue watchrooms
- keep public claims snapshot-based and tier-aware
- extract reusable ingestion, provenance, quality, and publication primitives from judiciary-specific code

### Stage 2: Prove the legislative pilot

Target: following milestone

- complete the formal Lok Sabha source review
- capture a bounded historical fixture set
- define the Parliamentary Activity Snapshot schema and methodology
- define a time-bounded person, office, and role schema for MP profiles
- build internal fetch, inspect, replay, and rollback before public routes
- publish one narrow reviewed beta with at least one evidence-linked MP profile only after source and redistribution gates pass

### Stage 3: Add a second government branch

Target: after the legislative pilot is proven

Evaluate an executive-branch pilot only after selecting one bounded institution, programme, or public-finance surface with stable official evidence. Do not start with a vague “executive performance” dashboard.

Candidate shapes include:

- a ministry or department budget/expenditure snapshot
- a narrowly scoped public procurement or contract-award observatory
- a scheme-delivery surface with dated, reproducible official administrative data

The exact executive pilot remains intentionally undecided until source quality, access, definitions, and redistribution posture are reviewed.

### Stage 4: Government-wide observability layer

Target: longer term

- one public shell with branch-specific modules
- cross-branch issue pages only where the comparison is methodologically valid
- linked evidence across legislation, administration, and adjudication
- internal document and event layers for research and QA
- selective faster signals, clearly labelled separately from reviewed public snapshots

## Guardrails

NyaayWatch should not become:

- a political scorecard
- a party or politician ranking product
- a composite politician performance score based on activity counts
- a real-time claim engine built on unstable source pages
- a raw government-document mirror
- an AI-generated interpretation layer without reproducible evidence
- a mixed-branch ranking table that hides incompatible definitions

The standing rule is: widen the institution set only when provenance, reproducibility, source terms, and public meaning are strong enough to defend.

## Definition Of Done For The Next Milestone

The first government-wide roadmap milestone is complete when:

- the broader north star is reflected in the product docs
- the judiciary is explicitly identified as the first shipped vertical
- the Lok Sabha-first pilot has a reviewed source inventory and legal/exposure decision
- a bounded legislative and MP-profile schema and methodology exist
- at least one captured fixture can be deterministically replayed
- at least one individual MP profile can be reconstructed from time-bounded official evidence
- no public route or claim implies that the pilot is already live before its publication gates pass

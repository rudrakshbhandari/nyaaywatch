# Parliamentary Activity Snapshot + Individual MP Profiles

## Objective

Build and locally run NyaayWatch's first non-judicial vertical milestone: a narrow, internal-only Lok Sabha parliamentary activity snapshot and at least one time-bounded individual MP profile reconstructed from captured official records.

## Original Request

Create an evidence-first legislative vertical for Lok Sabha activity and individual MP profiles. A captured official-source fixture must deterministically transform into a published parliamentary activity snapshot, at least one time-bounded MP profile, matching internal HTML and JSON surfaces, replay and rollback evidence, source-linked citations, and methodology.

## Intake Summary

- Input shape: `specific`
- Audience: NyaayWatch operators and reviewers; internal users only until source, legal, methodology, and publication gates pass
- Authority: `requested`
- Proof type: `demo`
- Completion proof: Local fixture-backed fetch/extract/normalize/publish/replay/rollback; one time-bounded official-record MP profile; shared publication lineage; HTML/JSON parity; tests; exact PR evidence and remaining public-beta blockers
- Goal oracle: A deterministic local fixture replay yields one published Lok Sabha activity snapshot and one time-bounded MP profile with identical published values across internal HTML and JSON, source-linked methodology, and verified replay/rollback lineage
- Likely misfire: A generic politician dashboard, ranking, or composite performance score that overclaims what activity records show
- Blind spots considered: Digital Sansad and Parliament Digital Library source/legal review; timestamps; session boundaries; pagination; identity completeness; redistribution terms; explicit House/term/role/cohort boundaries; clearly defined attendance only; normalized aggregates instead of raw artifact redistribution; preservation of judiciary behavior
- Existing plan facts: The user's nine required phases are the execution sequence to validate and implement; Lok Sabha-only scope; bills and questions first; at least one MP; internal-only surfaces; no Rajya Sabha, state legislature, executive branch, rankings, composite scores, or unsupported character/quality inference

## Goal Oracle

The oracle for this goal is:

`npm`-backed local end-to-end evidence that a captured official-source fixture deterministically produces a published Lok Sabha activity snapshot and at least one time-bounded MP profile, with matching internal HTML and JSON values, shared lineage, source-linked citations/methodology, and replay plus rollback proof.

The PM must keep comparing task receipts to this oracle. Source research, a passing schema test, or a clean-looking board is not enough. The goal finishes only when a final Judge/PM audit maps receipts and verification back to this oracle and records `full_outcome_complete: true`.

## Goal Kind

`specific`

## Current Tranche

Complete the full local, internal-only vertical slice through source review, bounded official fixtures, typed domain contracts, deterministic pipeline, operator controls, aggregate and MP surfaces, tests, and a recorded demo. Keep raw source redistribution and public beta blocked unless the required source, legal, methodology, and publication gates are explicitly satisfied.

## Non-Negotiable Constraints

- Lok Sabha only; bills and parliamentary questions first.
- Do not build Rajya Sabha, state legislatures, executive-branch data, or a generic all-politicians platform.
- Do not create politician, party, or constituency rankings or a composite politician performance score.
- Do not infer competence, honesty, ideology, corruption, popularity, or policy quality from activity counts.
- Compare activity only inside explicit House, session, role, or cohort boundaries.
- Do not redistribute raw parliamentary PDFs or bulk search results without explicit source approval; prefer normalized aggregates plus official links.
- Treat public data as snapshot-based and retain reproducible provenance for every published value.
- Attendance is missing unless the official source defines it clearly.
- Keep the pilot internal until source, legal, methodology, and publication gates pass.
- Preserve all judiciary behavior and existing tests.
- Every Worker must stay within its board-listed `allowed_files`, run its listed verification, and stop on ambiguous scope, repeated verification failure, or a need for unsafe/external mutation.

## Stop Rule

Stop only when a final audit proves the full original outcome is complete, or when an exact human approval/source authorization is the only remaining blocker and no safe local work remains. A plan, source review, fixture, schema, or isolated test is not completion. If public beta gates remain, record them precisely in the final receipt while still completing the internal local milestone.

## Slice Sizing

Use the largest safe useful vertical slice at each phase: first establish source and repository evidence, then implement coherent pipeline/operator/surface packages with bounded file ownership and verification. Avoid one-task-per-helper decomposition. Reorient after two tiny tasks or whenever a task fails to move the runnable oracle.

## Run Command

```text
Codex: /goal Follow docs/goals/parliament-activity-mp-profiles/goal.md.
Claude Code: /goalbuddy Follow docs/goals/parliament-activity-mp-profiles/goal.md.
```

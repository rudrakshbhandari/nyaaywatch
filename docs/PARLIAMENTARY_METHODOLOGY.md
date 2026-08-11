# Internal Parliamentary Pilot Methodology

Status: internal pilot only. This document describes the bounded Lok Sabha vertical; it is not a public beta or a statement about all Indian legislatures.

## Scope and reference date

The pilot currently covers Lok Sabha 18, Session 5 (`2025-07-21` to `2025-08-21`) and one official-record MP profile: Shri Mani A (`mpsno=5814`), DMK, Dharmapuri, Tamil Nadu. The snapshot reference date is the official Session 5 end date, `2025-08-21`, rather than the capture time. Capture time is retained separately for reproducibility.

The pilot does not cover Rajya Sabha, state legislatures, executive-branch activity, or a generic politician directory. It does not rank MPs, parties, or constituencies and does not calculate a composite performance score.

## What is sourced

The published internal payload links to the official Digital Sansad records used for:

- MP name, party, constituency, House, Lok Sabha term label, and role history.
- Lok Sabha 18 Session 5 bill-result records. The pilot stores normalized fields and official links, not bill PDF bytes.
- Member question, debate, and committee participation aggregates.
- A bounded 20-row member- and session-filtered question result for MP source code `5814`.
- Lok Sabha session boundaries.
- Digital Sansad terms and the Parliament Digital Library copyright policy reviewed during source intake.

The source review was captured at `2026-08-11T03:30:35Z`. Links are retained in the published internal payload under `citations`; each value carries evidence IDs in the typed source envelope.

Primary source links:

- [Digital Sansad bills result](https://sansad.in/api_rs/legislation/getBills?loksabha=18&sessionNo=5&house=Lok%20Sabha&page=1&size=20&locale=en&sortOn=billIntroducedDate&sortBy=desc)
- [Digital Sansad session register](https://sansad.in/api_ls/business/getAllLoksabhaAndSession?locale=en)
- [Digital Sansad member record](https://sansad.in/api_ls/member/5814?locale=en)
- [Digital Sansad member roles](https://sansad.in/api_ls/member/positionHeld?mpCode=5814&locale=en)
- [Digital Sansad question participation](https://sansad.in/api_ls/question/participation?mpsno=5814&loksabha=18)
- [Digital Sansad filtered question result](https://sansad.in/api_ls/question/qetFilteredQuestionsAns?loksabhaNo=18&sessionNumber=5&pageNo=1&locale=en&pageSize=100&memberCode=5814)
- [Digital Sansad debate participation](https://sansad.in/api_ls/debate/participation?mpsno=5814&loksabha=18&house=LS)
- [Digital Sansad committee participation](https://sansad.in/api_ls/committee/participation?mpsno=5814&loksabha=18)
- [Digital Sansad terms](https://sansad.in/rs/privacyPolicy)
- [Parliament Digital Library copyright policy](https://eparlib.sansad.in/help/copyright-policy.jsp)

## What is derived

- Unique bill count deduplicates captured result records by bill number and title. The fixture has 15 source records and 14 unique bill identities because the source returned two status rows for bill 107.
- Question breakdowns by session, ministry, and question type are counted only from the 20 captured member- and session-filtered question rows.
- The aggregate and MP profile are built from the same candidate and carry the same capture lineage ID.
- Publication metadata records quality state, methodology version, capture time, reference date, and source evidence IDs.

## Missing data and caveats

- The observed question participation endpoint reports `125` for the member across Lok Sabha 18. It is not a Session 5 count and is labeled `sourceReportedScope: lok_sabha`.
- The official page bundle identifies the modern question endpoint as `qetFilteredQuestionsAns`. With `loksabhaNo=18`, `sessionNumber=5`, `pageNo=1`, `pageSize=100`, and `memberCode=5814`, the endpoint returned `totalRecordSize: 20`; the fixture captures those normalized fields and official links only.
- The separate member participation endpoint reports `125` across Lok Sabha 18. It is not a Session 5 count; the 20 filtered rows are the session-scoped question value used for breakdowns.
- The bill result returned `billIntroducedBy: null` for these government bills. The pilot reports no member-attributed bills; it does not infer sponsorship from ministry or bill title.
- Attendance is not published. The public attendance page was observed, but the meaning of the attendance codes was not sufficiently verified for a defensible metric.
- Debate and committee values are source-reported participation aggregates. They are not qualitative measures of contribution, effectiveness, or policy quality.
- Missing values remain missing. No value is imputed from another session, House, role, party, constituency, or cohort.

## Publication and redistribution boundary

The pilot is available only behind the operator token at `/operator/parliamentary`, `/operator/parliamentary/html`, and `/operator/parliamentary/html/mp/mp-5814`. Raw captures and replay copies remain internal artifacts. The public surfaces do not expose this vertical.

The Digital Sansad terms and Parliament Digital Library policy were reviewed, but no broad approval for bulk redistribution of parliamentary source content was inferred. The pilot therefore publishes normalized aggregates, source metadata, and official links only. Public beta requires explicit source/legal review, question-row coverage, methodology review, and a publication decision.

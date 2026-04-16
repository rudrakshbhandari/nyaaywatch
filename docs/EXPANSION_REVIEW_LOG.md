# Expansion Review Log

Internal record of candidate-geography and candidate-tier expansion reviews.

This log exists so expansion decisions are tied to concrete runs, publication ids, and explicit gate outcomes rather than oral history.

## Punjab (`PB`) Internal Trial

- candidate geography: Punjab
- review date: 2026-04-16
- source boundary: NJDG Punjab district dashboard aggregate pages
- methodology version: `2026.04-alpha`
- first successful capture date: 2026-04-16
- latest successful validation date: 2026-04-16
- reviewer: Codex
- decision: `approved for internal trial only`

### Trial Evidence

- initial run id: `run_e440dc29-3f34-42da-a5ad-36b3b67e2b3a`
- initial publication id: `publication_24a9da44-47d5-4bdb-94f4-3dc3d07c8e2c`
- replay run id: `run_ba5643f1-cfdb-4a13-8615-aaed8a4d4142`
- replay publication id: `publication_8ed4484e-a3dd-4950-a1a5-88ecd46c5dd3`
- rollback publication id: `publication_d7cc5d03-2ad4-4a14-a842-d54f10563fa7`
- raw artifact key: `raw/dev/pb/2026-04-16/run_e440dc29-3f34-42da-a5ad-36b3b67e2b3a-njdg-dashboard-html.json`
- normalized artifact key: `normalize/dev/pb/2026-04-16/run_e440dc29-3f34-42da-a5ad-36b3b67e2b3a-snapshot-candidate.json`

### Observed Output

- district count captured: 22
- candidate quality state: `complete`
- pending cases: `961280`
- disposal rate: `102.7`
- median case age days: `183`
- flagged districts: `3`
- top flagged districts in this run:
  - `Ludhiana`
  - `Amritsar`
  - `Jalandhar`

### What Cleared

- Source viability: the live NJDG Punjab source was reachable and produced a full stored raw capture.
- Extract and normalize reliability: the capture normalized deterministically into a valid candidate with a `complete` quality state.
- Publish safety and operations: `fetch -> inspect -> publish -> replay -> rollback` succeeded end to end against state-scoped `pb` artifacts.
- Rollback clarity: rollback restored the original Punjab publication cleanly after the replay publication.

### What Did Not Yet Clear

- Operating evidence: this review happened in one short operator session on 2026-04-16. It does not satisfy the accelerated-plan requirement for distinct windows spaced by at least 2 hours.
- Public trust parity review: the internal operator flow worked, but Punjab has not yet gone through the public-surface parity review required before public exposure.
- Methodology defensibility for public launch: Punjab currently reuses the same lower-court methodology version, but there is not yet a Punjab-specific written public review of caveats, parity assumptions, or any state-specific source quirks.
- Product and IA discipline: no Punjab public UX has been added, which is correct for now, but that means Punjab has not yet cleared the public-exposure bar.

### Recommendation

Punjab is the right first candidate state for the accelerated expansion track, and it has now cleared the first real internal trial.

Do not expose Punjab publicly yet.

Required next step:

1. Run one more Punjab publish window at least 2 hours after the 2026-04-16 publish window.
2. Record the second window plus the review outcome in this log.
3. Re-check public trust parity before any public Punjab release.

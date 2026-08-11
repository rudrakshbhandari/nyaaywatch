# Operating Evidence

Operator-facing guidance for collecting the repeated release evidence NyaayWatch needs before any expansion or broader trust claims.

## Why This Exists

The Himachal alpha is already live. The next discipline is not broader product scope. It is accumulating boring, repeatable proof that the current publish, replay, rollback, and verification flow behaves cleanly over time.

This is the evidence trail that supports:

- release confidence
- rollback confidence
- post-incident review
- the operating-evidence gate in `docs/MULTI_STATE_EXPANSION_GATES.md`

## Minimum Evidence To Keep

For every public publish, keep:

1. a prepublish verification summary for the target run
2. a postpublish verification summary for the active publication
3. the generated release evidence markdown and JSON files
4. a tracked entry in `docs/RELEASE_HISTORY.md`
5. the run id, publication id, and rollback target publication id

Suggested minimum operating bar before discussing another geography publicly:

- at least three successful end-to-end publishes
- at least one replay through stored evidence
- at least one rollback to a prior publication
- no unresolved trust-surface parity regressions

## Commands

Inspect publication history and rollback targets:

```bash
npm run operator:publications
```

Run prepublish verification for a completed run:

```bash
npm run release:prepublish -- --run-id=<run-id> --base-url=https://nyaaywatch.in
npm run release:prepublish -- --state-slug=<state-slug> --run-id=<run-id> --base-url=https://nyaaywatch.in
```

Run postpublish verification and write a release evidence artifact:

```bash
npm run release:postpublish -- --publication-id=<publication-id> --base-url=https://nyaaywatch.in
npm run release:postpublish -- --state-slug=<state-slug> --publication-id=<publication-id> --base-url=https://nyaaywatch.in
```

Record the publish in the tracked release ledger:

```bash
npm run release:record -- --publication-id=<publication-id> --base-url=https://nyaaywatch.in --reviewer="<name>"
npm run release:record -- --state-slug=<state-slug> --publication-id=<publication-id> --base-url=https://nyaaywatch.in --reviewer="<name>"
```

By default, postpublish evidence is written to:

```text
output/release-evidence/<publication-id>.md
output/release-evidence/<publication-id>.json
```

## Review Discipline

- Treat the current active publication as the rollback target until a new publish succeeds.
- Do not publish if the prepublish summary says the target run is not `completed` or lacks a stored candidate.
- Do not treat a postpublish run as finished until the evidence files exist, the active publication matches the intended publication id, and `docs/RELEASE_HISTORY.md` has been updated.

## Internal parliamentary pilot evidence

The bounded Lok Sabha pilot uses the same fetch, inspect, publish, replay, and rollback evidence pattern while remaining outside the public route family. Run the deterministic local proof with:

```bash
npm run parliament:demo
```

The demo records the captured, published, replayed, and rollback publication IDs, verifies that aggregate and MP profile values share one lineage, and checks the protected JSON and HTML routes. The exact output belongs in the pull request evidence for the change.

The internal routes are:

- `GET /operator/parliamentary` — published JSON read model, citations, methodology, aggregate, and profiles.
- `GET /operator/parliamentary/html` — aggregate HTML read model.
- `GET /operator/parliamentary/html/mp/mp-5814` — time-bounded Shri Mani A profile.

These routes require the operator token. They do not authorize public redistribution of raw Digital Sansad or Parliament Digital Library artifacts.

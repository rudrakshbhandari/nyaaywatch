# Storage and operator flow

## Current production storage

- PostgreSQL stores runs, artifact metadata, published snapshots, and publication
  history.
- Azure Blob Storage stores production raw captures and normalized candidates.
- The public site and API read only published snapshots.
- Local development and CI use PostgreSQL and LocalStack S3 to exercise the
  object-storage adapter without cloud credentials.

## Operator lifecycle

1. **Fetch:** capture official source data, store it with checksums, and create
   a run in PostgreSQL.
2. **Inspect:** verify the run completed and review its candidate and evidence.
3. **Publish:** require complete artifacts, valid data, and a passing quality
   gate before materializing the public snapshot.
4. **Replay:** reprocess stored source evidence through the same deterministic
   extraction and normalization steps.
5. **Rollback:** append a publication event that restores a prior snapshot.

The public API and website continue to resolve the latest publication event.
Operator endpoints require `x-operator-token`; preview runtimes keep operator
routes disabled by default.

## Operator commands

Use the remote operator lane for production actions:

```bash
npm run operator:remote -- --base-url=https://nyaaywatch.in publications
npm run operator:remote -- --base-url=https://nyaaywatch.in --state=UP fetch "Internal Uttar Pradesh fetch"
```

For local work, copy `.env.example` to `.env`, run `npm run docker:up`,
`npm install`, and `npm run dev:bootstrap`, then start the app with
`npm run dev`. LocalStack is configured for the development S3 endpoint; it is
not the production artifact store.

## Release evidence

Follow `docs/ALPHA_RELEASE_CHECKLIST.md` and `docs/RELEASE_POLICY.md`. Run the
prepublish checks, publish only a quality-complete candidate, verify public
routes afterward, save the release evidence, and record the publication in
`docs/internal/RELEASE_HISTORY.md`. Use `docs/internal/DEPLOYMENT_STATUS.md` for
the configured production provider and live-state verification pointers.

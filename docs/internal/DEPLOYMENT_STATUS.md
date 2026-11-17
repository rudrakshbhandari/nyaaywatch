# Deployment status

## Production selection

- Production provider: Azure.
- Azure production configuration: `infra/azure/production/`.
- Deployment workflow: `.github/workflows/azure-production.yml`.
- Public hostname: `https://nyaaywatch.in`.
- AWS is retired. Deployment, preview, and operator code for AWS is kept in Git
  history rather than in the active production path.

This file records repository configuration and operating pointers. It does not
claim that a deployment, scheduled job, or public endpoint is healthy right
now. Use the Azure portal and deployment workflow run for live resource state.

## Routine verification

1. Check the latest successful Azure deployment workflow on `main`.
2. Verify `https://nyaaywatch.in/health` and run
   `npm run release:verify -- --base-url=https://nyaaywatch.in`.
3. Review Azure Container Apps Job executions and logs for scheduled-fetch,
   publish-pending, and public-alpha monitoring outcomes.
4. Confirm the public snapshot matches the intended publication before closing
   a release.
5. Record publication evidence in `docs/internal/RELEASE_HISTORY.md`.

## Local and CI storage

PostgreSQL is canonical for run, publication, and snapshot state. Production
artifacts use Azure Blob Storage. Local development and CI use PostgreSQL with
Azurite Blob Storage to exercise the production adapter without cloud credentials.

## Related operating records

- `docs/ALPHA_RELEASE_CHECKLIST.md` — release go/no-go.
- `docs/RELEASE_POLICY.md` — publisher authority and release rules.
- `docs/internal/RELEASE_HISTORY.md` — publication evidence index.
- `docs/internal/EXPANSION_REVIEW_LOG.md` — source and scope decisions.

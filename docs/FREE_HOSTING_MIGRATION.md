# Free Hosting Migration

## Goal

Move the public NyaayWatch read surface away from the always-on AWS ECS, ALB, WAF, and RDS stack while preserving the project’s snapshot, provenance, operator, and rollback guarantees.

The migration target is:

```text
Reviewed public snapshot
  -> static HTML / JSON / CSV / RSS / OG bundle
  -> Cloudflare Pages

Raw evidence and private candidate artifacts
  -> private S3-compatible object storage

Fetch / extract / normalize / quality checks
  -> scheduled GitHub Actions or a scale-to-zero container

Run metadata and operator state
  -> PostgreSQL-compatible database only while required
```

The target does not expose raw upstream artifacts or operator routes publicly.

## Current implementation

`npm run export:public -- --base-url=https://nyaaywatch.in` crawls the live public sitemap and linked public resources, writes extensionless HTML routes as `index.html` directories, writes JSON APIs as `.json` files, and creates Cloudflare Pages rewrites for extensionless API paths.

`npm run verify:public-export -- dist-public` checks that the export has a root page, that every manifest resource exists, and that operator or health routes did not enter the public bundle.

The manual/scheduled workflow in `.github/workflows/publish-public-static.yml` deploys the bundle to a `migration` Pages preview branch. It is intentionally separate from the existing AWS deployment workflow until the Pages preview passes parity checks.

## Provider roles

- Cloudflare Pages: public static delivery and CDN.
- Cloudflare R2 or another private S3-compatible bucket: raw evidence and immutable snapshot artifacts after the storage mirror is verified.
- GitHub Actions: scheduled fetch, validation, export, and deployment jobs. Secrets must be stored as GitHub environment secrets and never printed.
- Neon or another scale-to-zero PostgreSQL provider: only for the operator warehouse if the static bundle cannot yet replace the read model.

Do not use Cloudflare Workers free functions for the current Express application. The static bundle avoids the free function CPU limit and keeps public requests independent of a database.

## Required GitHub configuration

Repository variables:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT` (optional; defaults to `nyaaywatch-public`)
- `PUBLIC_BASE_URL` (optional; defaults to `https://nyaaywatch.in`)

Repository secret:

- `CLOUDFLARE_API_TOKEN`: Pages deployment permission scoped to the NyaayWatch account/project.

Use a separate environment and token for preview/testing. Do not grant the deployment token broad account administration permissions.

## Cutover gates

Do not move `nyaaywatch.in` to Pages until all gates pass:

1. The exporter completes from the current production origin without missing routes.
2. The Pages preview serves every sitemap URL with matching status, title, canonical URL, and visible snapshot metadata.
3. JSON, CSV, RSS, evidence-pack, and OG routes match the current public responses.
4. A new reviewed publication is exported and both origins show the same snapshot identifier and values.
5. Rollback to the AWS origin is tested through DNS/Cloudflare before the cutover.
6. A private evidence object is confirmed inaccessible from the public Pages origin.
7. At least two scheduled export cycles complete successfully.
8. The newsletter subscribe/confirm/unsubscribe workflow is migrated to a provider-backed endpoint or explicitly disabled with a truthful public notice; static HTML alone does not preserve POST behavior.

Only after these gates pass should the AWS public service be scaled down. RDS and the artifact store must remain recoverable until the first post-cutover publication and rollback window are complete.

## Cost controls

- Keep the AWS stack unchanged during validation; this creates a short overlap cost rather than a risky cutover.
- Set a Cloudflare account budget/alert before creating R2 or Workers resources.
- Keep static public data in Pages; do not add a Pages Function for every route.
- Keep raw evidence private and apply object lifecycle rules to temporary captures.
- If a database remains, enforce scale-to-zero and storage/egress alerts. A free tier is not a spending guarantee.

## Rollback

Rollback is a DNS/Cloudflare origin change back to the AWS ALB. Do not delete RDS, S3, or the ECS task definition as part of the first cutover. Destructive AWS retirement is a separate change after the migration has produced two verified publications and a tested restore path.

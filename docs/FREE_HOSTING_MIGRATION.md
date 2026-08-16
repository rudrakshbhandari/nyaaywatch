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

`npm run export:public -- --base-url=https://nyaaywatch.in` uses an explicit inventory for configured state, High Court, Supreme Court, RSS, API, and embed routes, then follows public links for district detail and OG assets. Query-driven district views are applied in the browser so they do not collide with canonical static files. Extensionless HTML routes are written as `index.html` directories, JSON APIs as `.json` files, and Cloudflare Pages rewrites are created for extensionless API paths.

District comparison URLs use one client-side fallback page. Cloudflare Pages rewrites are `/compare/*` and `/states/:state/compare/*` (one splat, only at the end). A `/states/*/compare/*` rule is invalid Pages syntax and must not be emitted.

The static bundle does not export newsletter POST or token routes. It writes a `/subscribe` notice that sign-ups are unavailable, because Cloudflare Pages cannot preserve `POST /subscribe`, `/subscribe/confirm/:token`, or `/unsubscribe/:token`. The AWS origin keeps the working form until DNS cutover.

The origin sends `X-NyaayWatch-Publication-Identities` on responses that load a published snapshot. The exporter requires that identity on JSON, CSV, metric-bearing HTML, OG cards, and feeds, including a matching per-resource scope (so `/movers` cannot pass on another state's header). It fails if a scope's timestamp changes mid-crawl (including unpublished → first publication). Press, learn, API-reference, subscribe-notice, and comparison-shell pages stay exempt. Evidence packs can recover identity from `geography.stateCode` plus `snapshot.publishedAt` when the header is absent. Configured state or High Court inventory URLs that return 404/503 are skipped as unpublished empty states; `/` and `/supreme-court` still fail the export. The crawl manifest is written beside the bundle as `dist-public.manifest.json` so it is not deployed to Pages.

`_redirects` writes every exact-path API rewrite first, then the two comparison splat rules. Cloudflare Pages treats every rule after the first splat as dynamic and stops after 100 dynamic rules, so sorting `/compare/*` to the top would drop most JSON APIs. The verifier rejects a static rule after a dynamic rule and rejects more than 100 dynamic rules.

`npm run verify:public-export -- dist-public` checks that the sidecar manifest exists, that `export-manifest.json` is not inside the public bundle, that comparison rewrites are Cloudflare-valid, that every listed resource exists, and that operator, health, or newsletter-token routes did not enter the bundle.

The manual/scheduled workflow in `.github/workflows/publish-public-static.yml` deploys the bundle to a `migration` Pages preview branch. It is intentionally separate from the existing AWS deployment workflow until the Pages preview passes parity checks.

## Provider roles

- Cloudflare Pages: public static delivery and CDN.
- Cloudflare R2 or another private S3-compatible bucket: raw evidence and immutable snapshot artifacts after the storage mirror is verified. R2 is not enabled on the current Cloudflare account (`Please enable R2 through the Cloudflare Dashboard`, API code `10042`). Do not create buckets until that dashboard toggle and a budget alert exist.
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
8. The newsletter subscribe/confirm/unsubscribe workflow is migrated to a provider-backed endpoint or explicitly disabled with a truthful public notice; static HTML alone does not preserve POST behavior. The static exporter now ships the disabled-notice path. A provider-backed endpoint is still required before DNS cutover if email digests should keep working on `nyaaywatch.in`.

Only after these gates pass should the AWS public service be scaled down. RDS and the artifact store must remain recoverable until the first post-cutover publication and rollback window are complete.

## Cost controls

- Keep the AWS stack unchanged during validation; this creates a short overlap cost rather than a risky cutover.
- Set a Cloudflare account budget/alert before creating R2 or Workers resources.
- Keep static public data in Pages; do not add a Pages Function for every route.
- Keep raw evidence private and apply object lifecycle rules to temporary captures.
- If a database remains, enforce scale-to-zero and storage/egress alerts. A free tier is not a spending guarantee.

## Rollback

Rollback is a DNS/Cloudflare origin change back to the AWS ALB. Do not delete RDS, S3, or the ECS task definition as part of the first cutover. Destructive AWS retirement is a separate change after the migration has produced two verified publications and a tested restore path.

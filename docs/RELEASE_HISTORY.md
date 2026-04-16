# Release History

Tracked history of public NyaayWatch publishes.

Use `npm run release:record` after each successful publish to keep this file aligned with the generated evidence artifacts in `output/release-evidence/`.

<!-- release-history:entries -->

<!-- release:publication_8a5ddc6e-f520-4344-8161-76dc4dead033:start -->
## publication_8a5ddc6e-f520-4344-8161-76dc4dead033

- Reviewed at: `2026-04-16T23:33:21.182Z`
- Reviewer: `Codex state-aware live flow verification`
- Public URL: `https://nyaaywatch.in/states/punjab`
- Action: `publish`
- Source snapshot date: `2026-04-16T00:00:00.000Z`
- Published at: `2026-04-16T23:32:07.721Z`
- Methodology version: `2026.04-alpha`
- Quality state: `complete`
- Published from run: `run_2e5ea2e1-ba95-4d62-9ea9-be14123b39cf`
- Rollback target: `publication_7db9a015-68d0-4182-8c77-f221797c7c2c`
- Markdown evidence: `docs/DEPLOYMENT_STATUS.md`
- JSON evidence: `docs/EXPANSION_REVIEW_LOG.md`
- Note: Verified the post-`#41` state-aware live release flow on task definition `:28`. Punjab fetch and publish succeeded through the public HTTP operator routes, and state-scoped `release:prepublish`, `release:postpublish`, and `release:record` succeeded from one-off ECS tasks inside the AWS VPC. Public API parity updated immediately; the state-scoped CSV path required a cache-busting request to bypass a stale Cloudflare edge response.

<!-- release:publication_8a5ddc6e-f520-4344-8161-76dc4dead033:end -->

<!-- release:publication_7db9a015-68d0-4182-8c77-f221797c7c2c:start -->
## publication_7db9a015-68d0-4182-8c77-f221797c7c2c

- Reviewed at: `2026-04-16T22:55:04.683Z`
- Reviewer: `Codex Punjab public rollout`
- Public URL: `https://nyaaywatch.in/states/punjab`
- Action: `publish`
- Source snapshot date: `2026-04-16T00:00:00.000Z`
- Published at: `2026-04-16T22:53:46.960Z`
- Methodology version: `2026.04-alpha`
- Quality state: `complete`
- Published from run: `run_ff674e79-8752-4b4d-9b32-4c7a368d339c`
- Rollback target: `none`
- Markdown evidence: `docs/DEPLOYMENT_STATUS.md`
- JSON evidence: `docs/EXPANSION_REVIEW_LOG.md`
- Note: First live Punjab public publication, exposed through explicit state-scoped routes after task definition `:26` deployed. Live verification passed on `/states/punjab`, the state-scoped API and CSV surfaces, and `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug punjab`.

<!-- release:publication_7db9a015-68d0-4182-8c77-f221797c7c2c:end -->

<!-- release:publication_ce4939b3-0fdf-4044-9677-062ee0ae49b1:start -->
## publication_ce4939b3-0fdf-4044-9677-062ee0ae49b1

- Reviewed at: `2026-04-15T04:44:05.159Z`
- Reviewer: `Codex live public-alpha review`
- Public URL: `https://nyaaywatch.in`
- Action: `rollback`
- Source snapshot date: `2026-04-10T00:00:00.000Z`
- Published at: `2026-04-15T04:44:05.159Z`
- Methodology version: `2026.04-alpha`
- Quality state: `complete`
- Published from run: `run_5d8880eb-ed95-4e08-b3aa-96437d5f45d9`
- Rollback target: `publication_4a8ab19f-1d2a-4b9b-b6c4-1ab2d610f80a`
- Markdown evidence: `docs/ALPHA_RELEASE_CHECKLIST.md`
- JSON evidence: `docs/DEPLOYMENT_STATUS.md`
- Note: Post-deploy rollback restored the intended public publication after validating fetch, publish, replay, and rollback in the live stack.

<!-- release:publication_ce4939b3-0fdf-4044-9677-062ee0ae49b1:end -->

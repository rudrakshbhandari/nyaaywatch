# Release History

Tracked history of public NyaayWatch publishes.

Use `npm run release:record` after each successful publish to keep this file aligned with the generated evidence artifacts in `output/release-evidence/`.

<!-- release-history:entries -->

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

# Public Alpha Release Checklist

Canonical go/no-go checklist for deciding whether the India-first public alpha is ready to stay public.

Run this checklist before the first public launch and before any materially different release of public copy, methodology, or publish workflow behavior.

Use `docs/RELEASE_POLICY.md` for cadence and blocking rules and `docs/internal/DEPLOYMENT_STATUS.md` for provider selection and live-state verification pointers. For production infrastructure changes, review the Terraform plan under `infra/azure/production/`.

## Release Metadata

Record the actual values for the release being reviewed:

- Release date: `<YYYY-MM-DD>`
- Reviewer: `<name or review label>`
- Published snapshot id: `<snapshot-id>`
- Publication id: `<publication-id>`
- Source snapshot date: `<YYYY-MM-DD>`
- Methodology version: `<methodology-version>`
- Scope checked: `Supreme Court`, `25 High Courts`, and `36 lower-court state/Union Territory geographies` unless the release is explicitly narrower

## Launch Gates

### 1. Published Snapshot Integrity

- [ ] Public routes load only from the active published snapshot.
- [ ] No route or download reads unpublished run state.
- [ ] Supreme Court, High Court, and lower-court JSON endpoints match the active publication for the checked scope.
- [ ] Lower-court CSVs, district history CSVs, and evidence packs match the same publication lineage.

### 2. Freshness And Caveat Discipline

- [ ] Homepage shows snapshot date, publication date, freshness, methodology version, and source attribution.
- [ ] Supreme Court, High Court, lower-court geography, district workspace, and district detail pages show the same trust metadata for their scope.
- [ ] Stale-state behavior is visible and still pinned to the last safe publication.
- [ ] Partial runs remain blocked from public publish.

### 3. Methodology And Copy

- [ ] Methodology page explains formulas, quality states, and published snapshot lineage.
- [ ] Public copy uses `published snapshot`, `flagged signal`, and `operator-published` semantics.
- [ ] Public copy does not present the product as continuously refreshed, predictive, or verdict-like.
- [ ] India-first scope remains explicit: Supreme Court, all 25 High Courts, and all 36 lower-court state/Union Territory geographies. Himachal remains only the unscoped lower-court default.

### 4. Source And Export Boundary

- [ ] `docs/PUBLIC_DATA_EXPOSURE_POLICY.md` still matches the actual product behavior.
- [ ] Public downloads are limited to normalized published read-model fields.
- [ ] Raw upstream HTML bundles, replay copies, and unpublished candidates are not exposed publicly.
- [ ] Public citation surfaces still include clear source attribution and dates.

### 5. Publish Safety

- [ ] Operator `fetch -> inspect -> publish -> replay -> rollback` flow succeeds in dedicated staging or an equivalent isolated environment.
- [ ] Publish gating still requires completed run state, required artifacts, and non-partial quality state.
- [ ] Rollback returns the public API and UI to the intended prior publication.
- [ ] Cloud logs and operator notes are available for the release run.
- [ ] `docs/internal/DEPLOYMENT_STATUS.md` contains the actual live URL and current resource names for the target environment.

### 6. Domain And HTTPS

- [ ] The intended public hostname is chosen explicitly.
- [ ] HTTPS is active with a valid Azure-managed certificate.
- [ ] The public hostname resolves to the intended Azure Container App origin through Cloudflare and HTTPS is valid.

### 7. Verification

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run test:e2e`
- [ ] `RUN_PERSISTENT_STACK_TESTS=1 npm run test:persistent` or an explicit equivalent persistent-stack validation note

## Release Decision

- [ ] Ready to keep public
- [ ] Blocked

If blocked, record the exact blocker and required follow-up:

- Blocker: `None`
- Owner: `N/A`
- Next action: `<required follow-up or N/A>`

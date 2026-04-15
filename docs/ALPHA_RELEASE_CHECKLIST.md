# Alpha Release Checklist

Operator and reviewer checklist for deciding whether the Himachal Pradesh alpha is ready to stay public.

Run this checklist before the first public launch and before any materially different release of public copy, methodology, or publish workflow behavior.

## Release Metadata

- Release date:
- Reviewer:
- Published snapshot id:
- Publication id:
- Source snapshot date:
- Methodology version:

## Launch Gates

### 1. Published Snapshot Integrity

- [ ] Public routes load only from the active published snapshot.
- [ ] No route or download reads unpublished run state.
- [ ] `GET /v1/stats/himachal`, `GET /v1/districts`, and `GET /v1/trends` match the active publication.
- [ ] Statewide CSV and district history CSVs match the same publication lineage.

### 2. Freshness And Caveat Discipline

- [ ] Homepage shows snapshot date, publication date, freshness, methodology version, and source attribution.
- [ ] District workspace and district detail pages show the same trust metadata.
- [ ] Stale-state behavior is visible and still pinned to the last safe publication.
- [ ] Partial runs remain blocked from public publish.

### 3. Methodology And Copy

- [ ] Methodology page explains formulas, quality states, and published snapshot lineage.
- [ ] Public copy uses `published snapshot`, `flagged signal`, and `operator-published` semantics.
- [ ] Public copy does not present the product as continuously refreshed, predictive, or verdict-like.
- [ ] Himachal-first scope remains explicit.

### 4. Source And Export Boundary

- [ ] `docs/PUBLIC_DATA_EXPOSURE_POLICY.md` still matches the actual product behavior.
- [ ] Public downloads are limited to normalized published read-model fields.
- [ ] Raw upstream HTML bundles, replay copies, and unpublished candidates are not exposed publicly.
- [ ] Public citation surfaces still include clear source attribution and dates.

### 5. Publish Safety

- [ ] Operator `fetch -> inspect -> publish -> replay -> rollback` flow succeeds in staging or an equivalent isolated environment.
- [ ] Publish gating still requires completed run state, required artifacts, and non-partial quality state.
- [ ] Rollback returns the public API and UI to the intended prior publication.
- [ ] Cloud logs and operator notes are available for the release run.
- [ ] `docs/DEPLOYMENT_STATUS.md` contains the actual live URL and current resource names for the target environment.

### 6. Domain And HTTPS

- [ ] The intended public hostname is chosen explicitly.
- [ ] HTTPS is active with a valid ACM-backed certificate.
- [ ] DNS points at the intended AWS load balancer.
- [ ] `docs/DOMAIN_CUTOVER_CHECKLIST.md` is complete if a custom domain is involved.

### 7. Verification

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run test:e2e`
- [ ] `RUN_PERSISTENT_STACK_TESTS=1 npm run test:persistent` or an explicit equivalent persistent-stack validation note

## Release Decision

- [ ] Ready to keep public
- [ ] Blocked

If blocked, record the exact blocker and required follow-up:

- Blocker:
- Owner:
- Next action:

# Assam Internal Readiness Review

Initial source-viability and internal-readiness review for Assam before the first live operator trial or public exposure.

Assam is a strong internal-only candidate for the north-east expansion track. This document records live source evidence only. It does not approve public exposure.

Historical note:

- repo wiring for `AS` is now complete
- the live `fetch -> inspect -> publish -> replay -> rollback` proof cycle is now complete
- Assam now also has a dedicated public-readiness review and go-live checklist in the repo
- use `docs/EXPANSION_REVIEW_LOG.md` for the actual live proof lineage

## Review Basis

Source checks run against the live NJDG Assam district dashboard on `2026-04-17`.

Observed Assam source notes:

- `stateCode=AS`
- `stateName=Assam`
- `stateSlug=assam`
- `njdgStateValue=18~6`
- source page footer updated on `2026-04-16`
- 34 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `5,81,244`
- instituted last month shown on the live state page: `14,498`
- disposed last month shown on the live state page: `15,074`
- first visible district labels: `Kamrup Metro`, `Tinsukia`, `Sivasagar`, `Morigaon`, `Lakhimpur`
- all five age-bucket widgets were present on the live state page
- sample district drilldown `dist_code=1` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Assam exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Assam is not blocked on a missing metric class or a clearly different page family.

### 2. Regional Coverage Value

Assam gives the internal expansion track an explicit north-east proof state without forcing broad national scaffolding. That makes it a better narrative fit for the current expansion direction than simply adding more north or west-belt states first.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and a sample district page request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## What Still Needs Explicit Work

### 1. Repo Wiring

Assam is now wired into the repo as an internal-only state profile with tests that keep it dark on the public site.

### 2. Operating Evidence

Assam has now cleared:

- live `fetch`
- live `inspect`
- live `publish`
- live `replay`
- live `rollback`

That closes the internal proof bar. Assam is no longer only a source-viability candidate.

### 3. Public Trust Review

Assam now has a dedicated public-readiness review and go-live checklist:

- `docs/ASSAM_PUBLIC_READINESS_REVIEW.md`
- `docs/ASSAM_GO_LIVE_CHECKLIST.md`

The remaining public work is no longer whether Assam can be exposed narrowly in principle. It is the actual live rollout window plus stable-URL verification.

## Recommendation

Assam should now be treated as the validated north-east baseline and the next approved public rollout candidate after Tamil Nadu.

It should remain non-live on the public hostname until:

1. the state-scoped parity branch is merged with the local go-live gates green
2. a live Assam publication passes `release:verify` and browser checks on `https://nyaaywatch.in`

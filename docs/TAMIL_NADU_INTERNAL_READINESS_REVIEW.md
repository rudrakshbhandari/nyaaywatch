# Tamil Nadu Internal Readiness Review

Initial source-viability and internal-readiness review for Tamil Nadu before the first live operator trial or public exposure.

Tamil Nadu is a strong internal-only candidate for the southern expansion track. This document records live source evidence only. It does not approve public exposure.

Historical note:

- repo wiring for `TN` is now complete
- the live `fetch -> inspect -> publish -> replay -> rollback` proof cycle is now complete
- use `docs/EXPANSION_REVIEW_LOG.md` for the actual live proof lineage and `docs/TAMIL_NADU_PUBLIC_READINESS_REVIEW.md` for the current public recommendation

## Review Basis

Source checks run against the live NJDG Tamil Nadu district dashboard on `2026-04-17`.

Observed Tamil Nadu source notes:

- `stateCode=TN`
- `stateName=Tamil Nadu`
- `stateSlug=tamil-nadu`
- `njdgStateValue=33~10`
- source page footer updated on `2026-04-16`
- 38 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `17,46,162`
- instituted last month shown on the live state page: `1,20,781`
- disposed last month shown on the live state page: `1,44,236`
- first visible district labels: `Dharmapuri`, `Pudukkottai`, `Tirunelveli`, `Theni`, `Namakkal`
- all five age-bucket widgets were present on the live state page
- sample district drilldown `dist_code=1` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Tamil Nadu exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Tamil Nadu is not blocked on a missing metric class or a clearly different page family.

### 2. Scale Value

Tamil Nadu gives the internal expansion track a serious southern state without jumping immediately to a new public rollout. Its 38-district surface is meaningfully larger than Haryana and Uttarakhand while still staying below Uttar Pradesh's heavier stress profile.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and a sample district page request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## What Still Needs Explicit Work

### 1. Repo Wiring

Tamil Nadu is now wired into the repo as an internal-only state profile with tests that keep it dark on the public site until a deliberate public decision is made.

### 2. Operating Evidence

Tamil Nadu has now cleared:

- live `fetch`
- live `inspect`
- live `publish`
- live `replay`
- live `rollback`

That closes the internal proof bar. Tamil Nadu is no longer only a source-viability candidate.

### 3. Public Trust Review

Tamil Nadu-specific public-route parity and live hostname verification still remain. Public exposure should now be considered through the narrower go-live artifacts rather than through this initial source-viability note.

## Recommendation

Tamil Nadu should now be treated as the validated southern baseline and the next public candidate.

Its next step is:

1. complete the public-route parity and checklist work in `docs/TAMIL_NADU_PUBLIC_READINESS_REVIEW.md` and `docs/TAMIL_NADU_GO_LIVE_CHECKLIST.md`
2. run the live Tamil Nadu public rollout on the stable hostname
3. keep later internal expansion narrower than nationwide theater while that public work is underway

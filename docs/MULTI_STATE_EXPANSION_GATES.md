# Multi-State Expansion Readiness Gates

Post-MVP policy for deciding whether NyaayWatch should expand beyond Himachal Pradesh.

This document exists to keep "Himachal first" operational rather than rhetorical. A new geography should ship only after it clears explicit trust, data, and operational gates.

## Decision Rule

Expansion is allowed only when a candidate geography clears every `required` gate below.

Failing any required gate means:

- do not expose the geography publicly
- do not add public IA scaffolding for it
- treat the work as internal research, ingestion hardening, or methodology development until the gap is closed

## Scope Of This Policy

These gates apply before NyaayWatch publicly adds:

- another Indian state to the district/subordinate court observability product
- a new public court tier with different source shape, such as High Court or Supreme Court surfaces
- any broader public UX that implies multi-state readiness

They do not require the repo to stay Himachal-only forever. They require expansion to be earned.

## Required Gates

### 1. Source Viability

The candidate geography must have a stable, publicly reachable source boundary that supports reproducible snapshot capture.

Required:

- a clear official source or source set is identified
- the source exposes the minimum metrics NyaayWatch needs for backlog, disposal, age, and district-level comparison, or the gap is explicitly accepted in methodology
- the source shape is stable enough to support deterministic capture and replay
- source terms and redistribution posture are reviewed for the new geography or tier

Do not expand if:

- the geography depends on fragile one-off scraping with no replay confidence
- the source omits core metrics needed to maintain parity with the trust model
- source posture is unclear enough that public evidence surfaces would become legally or product-wise ambiguous

### 2. Extract And Normalize Reliability

NyaayWatch must be able to turn the new source into the same kind of auditable published snapshot boundary it uses for Himachal.

Required:

- deterministic extract and normalize steps exist for the new source
- explicit schema mappings and transform assumptions are documented
- fixture-backed regression coverage exists for representative source inputs
- replaying the same stored input yields the same normalized output

Do not expand if:

- the new pipeline relies on ad hoc cleanup or hand-edited outputs
- normalization logic is too source-specific to audit confidently
- methodology depends on inferred fields that cannot be defended from stored evidence

### 3. Public Trust Parity

The new geography must preserve the same trust posture the Himachal alpha established.

Required:

- every public metric can point back to stored source evidence
- freshness, source attribution, methodology version, and quality state appear near trust-critical metrics
- anomalies remain framed as flagged signals, not verdicts
- CSV, API, and UI remain in parity for the new published snapshot

Do not expand if:

- public surfaces would need weaker caveats than Himachal to look complete
- the new geography would silently degrade metadata quality or provenance
- one surface says more than the stored evidence can support

### 4. Publish Safety And Operations

Expansion must not weaken the operator safety model.

Required:

- `fetch -> inspect -> publish -> replay -> rollback` works for the new geography
- publish gating blocks incomplete or partial runs
- operator inspection surfaces show enough information to review a candidate safely
- storage, logging, and rollback behavior are tested in the persistent stack and staging-equivalent runtime

Do not expand if:

- operators cannot safely inspect what would go public
- rollback would become ambiguous across geographies
- the additional geography would introduce hidden background publish behavior

### 5. Methodology Defensibility

The methodology for the new geography must be specific, stable, and explainable.

Required:

- formulas, caveats, and source assumptions are documented
- any metric differences from Himachal are visible in methodology, not buried in code
- quality-state rules are defined for the new geography
- any cross-geography comparison is methodologically valid or explicitly withheld

Do not expand if:

- the product would imply apples-to-apples rankings without methodological parity
- the new geography requires caveats that contradict the current trust model
- change history would become too opaque for a public reviewer to follow

### 6. Product And IA Discipline

Expansion should improve the product, not add empty scaffolding.

Required:

- public IA for the new geography is concrete and non-placeholder
- copy stays explicit about what is covered now versus later
- no disabled or "coming soon" geography controls are added as a substitute for readiness
- district evidence and citation surfaces remain durable and shareable

Do not expand if:

- the UX would imply broad national coverage before it exists
- the homepage would become a vague multi-state shell with thin trust context
- the product would add breadth at the cost of legibility

### 7. Operating Evidence

NyaayWatch should not expand based only on hope or one clean run.

Required:

- multiple successful end-to-end runs exist for the candidate geography
- known source instability patterns are documented
- staging or equivalent isolated validation has succeeded more than once
- unresolved operational issues are minor enough that they would not undermine public trust

Suggested minimum bar:

- at least three successful end-to-end captures from stored evidence
- at least one replay and one rollback exercise against that geography

## Expansion Review Template

Before approving a new geography, record:

- candidate geography:
- source boundary:
- methodology version:
- first successful capture date:
- latest successful staging validation date:
- known caveats:
- reviewer:
- decision:

Decision values:

- `approved for public expansion`
- `approved for internal trial only`
- `blocked`

## Current Policy Implication

Himachal Pradesh remains the default reference geography for the public alpha.

Punjab has now cleared the narrow public expansion path and is live only through explicit `/states/punjab/...` routes rather than a nationwide shell.

This document does not itself approve any further state or tier. It defines the bar they must clear.

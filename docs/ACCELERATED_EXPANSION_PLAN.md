# Accelerated Expansion Plan

Pragmatic plan for moving NyaayWatch from the current Himachal Pradesh alpha to broader Indian court coverage without waiting weeks between decisions.

This document is intentionally aggressive on time but conservative on public trust. It assumes:

- the current Himachal public alpha stays live
- expansion decisions need to happen in days, not months
- public trust still matters more than breadth theater

## Bottom Line

### Have We Satisfied The Himachal Gates To Move On?

Partially.

Himachal is strong enough to begin expansion work now, but not strong enough to justify a public "every state plus High Courts plus Supreme Court" rollout immediately.

Current assessment:

- **Launch and trust gates for Himachal public alpha:** satisfied
- **Enough confidence to start the next geography internally now:** satisfied
- **Enough operating evidence to claim the model is broadly proven nationwide:** not yet satisfied
- **Enough evidence to add High Court and Supreme Court public tiers immediately:** not yet satisfied

Why:

- the product, storage, publish, replay, rollback, verification, and release-tracking model now exist
- the repo has live public-alpha evidence and release controls
- but the documented operating evidence is still thin relative to the multi-state gate bar, and no second geography or higher court tier has yet cleared the required gates

## Decision Rule For Fast Expansion

Use this rule for the next few days:

1. **Start expansion work immediately**
2. **Keep all new geographies internal until they clear the gate checklist**
3. **Only expose a new state publicly after one clean end-to-end publish flow for that state plus one replay or rollback exercise**
4. **Do not mix subordinate courts, High Courts, and Supreme Court into one release track**

This is the fastest path that still makes sense.

## What "Cycles" Mean

A cycle is one operator-reviewed publish attempt through the full trust boundary:

1. `fetch`
2. `inspect`
3. `publish`
4. `verify`
5. optional `replay` or `rollback`
6. `release:record`

For the accelerated plan, cycles should be spaced by **at least 2 hours** so they represent distinct release windows and give time for:

- log review
- postpublish verification
- evidence capture
- basic observation of whether the release actually stayed healthy

Do not run three back-to-back publishes 5 minutes apart and call that operating evidence.

## Current State

As of `2026-04-16`:

- Himachal subordinate-court observability is publicly live
- AWS staging/public stack is live at `https://nyaaywatch.in`
- release verification and release-history tooling exist
- the current release ledger is still sparse
- no additional state has cleared internal-trial gates
- no High Court or Supreme Court tier has cleared source or methodology review

## End Goal

The realistic end goal is three distinct coverage tracks:

1. **All states for district/subordinate courts**
2. **High Courts**
3. **Supreme Court**

These should not be treated as one pipeline or one methodology. They are related products sharing infrastructure and trust rules.

## Recommended Execution Order

### Track A: District And Subordinate Courts

This is the first expansion track because it is closest to the current Himachal model.

Phases:

1. Himachal reference model
2. one additional state internal trial
3. small public state cohort
4. wave-based state expansion
5. national subordinate-court coverage

### Track B: High Courts

This begins only after subordinate multi-state expansion is operationally stable.

Phases:

1. source and methodology review
2. one High Court internal trial
3. limited High Court public beta
4. wave rollout across additional High Courts

### Track C: Supreme Court

This is last, because it is a distinct court tier with its own source and methodology profile.

Phases:

1. source and methodology review
2. internal pilot
3. narrow public launch

## 72-Hour Accelerated Plan

This is the fastest sensible plan from the current state.

### Day 0: Today

Goal:

- declare the expansion strategy
- keep Himachal running as the trusted reference state

Actions:

1. Keep Himachal public alpha live without widening public claims
2. Record this plan in the repo
3. Pick the **next candidate state** for subordinate courts
4. Pick one owner for release evidence and one owner for source review

Output:

- chosen next state
- explicit decision that High Courts and Supreme Court are deferred to separate tracks

### Day 1

Goal:

- strengthen Himachal operating evidence
- establish source viability for one new state

Actions:

1. Run one Himachal publish cycle in the morning
2. Wait at least 2 hours
3. Run a second Himachal publish cycle or replay/rollback exercise
4. Record both in `docs/RELEASE_HISTORY.md`
5. Capture and review source artifacts for the chosen next state
6. Confirm the source exposes the minimum required state and district metrics

Required outputs by end of Day 1:

- two distinct Himachal evidence-backed release windows on the same day or across adjacent windows
- one named next state with source notes
- explicit go / no-go on source viability for that state

### Day 2

Goal:

- turn the next state into an internal trial candidate

Actions:

1. Add state-specific capture support
2. Add fixture-backed extract and normalize coverage
3. Validate deterministic replay from stored evidence
4. Run the full internal flow:
   - `fetch`
   - `inspect`
   - `publish`
   - `verify`
5. Wait at least 2 hours
6. Run either:
   - a second publish window, or
   - replay plus rollback

Required outputs by end of Day 2:

- one additional state clears internal-trial gates, or is explicitly blocked with written reasons

### Day 3

Goal:

- decide whether to expose the next state publicly

Public expansion is allowed only if all of the following are true:

- source viability is clear
- extract and normalize are deterministic
- public trust parity is intact
- publish safety works end to end
- methodology notes are written
- UI does not imply national parity
- the state has at least one clean publish and one replay or rollback exercise

Decision outcomes:

- `approved for public expansion`
- `approved for internal trial only`
- `blocked`

## Fast Public Expansion Rule

If speed is the priority, the first public move after Himachal should be:

- **one new state**, or
- **a very small cohort of 2-3 similar states**

Not:

- all states at once
- any High Court
- the Supreme Court
- a mixed lower-court plus higher-court launch

This keeps the blast radius contained while still moving quickly.

## What We Can Realistically Ship Soon

### Within A Couple Days

Realistic:

- start internal multi-state work
- clear one additional state for internal trial
- possibly expose one additional state publicly if the source and pipeline are very close to Himachal

Not realistic:

- all-state public rollout
- High Court public rollout
- Supreme Court public rollout
- defensible all-India cross-state ranking claims

### Within 1-2 Weeks

Realistic if execution is disciplined:

- 2-5 subordinate-court states publicly live
- repeatable operator workflow across those states
- clearer evidence about which states are easy vs hard

### After Subordinate Multi-State Is Stable

Then begin:

- High Court internal pilot
- later, Supreme Court internal pilot

## Gate Status Matrix

Use this working status model during accelerated expansion.

### Himachal Pradesh

- Source viability: `green`
- Extract / normalize reliability: `green`
- Public trust parity: `green`
- Publish safety and operations: `green`
- Methodology defensibility: `green`
- Product and IA discipline: `green`
- Operating evidence for broader proof: `yellow`

Decision:

- `approved as reference state`
- `not yet sufficient as sole basis for nationwide public rollout`

### Next State Candidate

Initial status before work:

- Source viability: `unknown`
- Extract / normalize reliability: `unknown`
- Public trust parity: `unknown`
- Publish safety and operations: `unknown`
- Methodology defensibility: `unknown`
- Product and IA discipline: `not yet applicable`
- Operating evidence: `none`

Decision:

- `internal trial pending`

### High Courts

Current status:

- Source viability: `unknown`
- Extract / normalize reliability: `unknown`
- Methodology defensibility: `unknown`

Decision:

- `blocked for now`

### Supreme Court

Current status:

- Source viability: `unknown`
- Extract / normalize reliability: `unknown`
- Methodology defensibility: `unknown`

Decision:

- `blocked for now`

## Concrete Next-State Selection Criteria

Choose the next subordinate-court state using these filters:

1. NJDG aggregate source shape looks closest to Himachal
2. district-level metrics are exposed clearly
3. source labels are stable enough for deterministic extraction
4. the state is large enough to test scale, but not so irregular that it becomes a source-research project

Avoid as the immediate next state:

- a state with obviously inconsistent source labels
- a state that forces major methodology exceptions
- any geography that requires public caveats much weaker than Himachal

## Higher-Court Strategy

Do not bundle High Courts and Supreme Court into the same expansion plan as subordinate courts.

Instead:

### High Court Plan

1. pick one High Court for internal source review
2. define what the public metrics should be at that tier
3. validate whether those metrics can be tied back to stored evidence with the same rigor
4. only then build a pilot pipeline

### Supreme Court Plan

1. do the same source and metric review independently
2. assume the product framing will differ from state subordinate-court observability
3. launch only after the tier-specific methodology is defensible

## Non-Negotiables

Even in the accelerated plan:

- no empty national scaffolding in public UX
- no "coming soon" state picker
- no mixing district/subordinate, High Court, and Supreme Court metrics into one implied ranking system
- no public expansion without stored-evidence-backed reproducibility
- no expansion justified only by one clean run

## Immediate Recommendation

Do this now:

1. keep Himachal public
2. run 2 more Himachal publish windows spaced at least 2 hours apart
3. pick one next subordinate-court state
4. clear that state for internal trial in 48-72 hours
5. if it clears, launch that one state or a tiny cohort publicly
6. defer High Courts and Supreme Court until subordinate multi-state is stable

That is the fastest realistic route from the current repo state to the long-term national goal.

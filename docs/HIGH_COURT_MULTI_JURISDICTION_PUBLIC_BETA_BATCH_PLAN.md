# High Court Multi-Jurisdiction Public Beta Batch Plan

Concrete rollout plan for the remaining deferred court-first High Court public beta set after Punjab and Haryana.

This document exists to answer one narrow question:

- now that Punjab and Haryana has already cleared the first public multi-jurisdiction High Court beta launch, how should the repo bring the remaining deferred courts into public beta without falling back to one-court-at-a-time hesitation?

## Current Product Decision

The product decision is now affirmative:

- all remaining deferred court-first High Courts should join the public beta
- they should ship in batches larger than two courts
- they should land one batch after another, not as isolated single-court launches

This is no longer a "should any of these courts ever go public?" discussion.

The remaining questions are execution order, batch shape, and rollout discipline.

## Remaining Deferred Courts

After Punjab and Haryana, the original remaining deferred court-first High Courts were:

- Delhi High Court
- High Court of Kerala
- Madras High Court
- Calcutta High Court
- Bombay High Court
- Gauhati High Court

`Delhi` belongs in this plan even though it is not a multi-state court in the same way as Bombay or Gauhati. It was deferred for the same structural reason: it did not fit the old one-court-one-state shell cleanly enough to approve casually. The court-first model removes that as a product blocker.

## Approved Batch Shape

The remaining six courts should ship in two public-beta waves of three courts each.

Hard rule:

- do not go back to batches of two
- do not restart single-court drip launches unless a concrete operational blocker forces that exception

## Wave 1

Wave 1 should be:

- Delhi High Court
- High Court of Kerala
- Madras High Court

Why this wave first:

- it exercises the now-approved court-first model on the narrower remaining edge cases before the broader federal courts
- Kerala and Madras both force honest state-plus-union-territory coverage language without the larger geography fan-out of Bombay or Gauhati
- Delhi closes the last obvious "court-first but not lower-court-state-shell-first" gap
- together, these three courts are a real batch, but still a legible one

Wave 1 is now the active public launch batch in repo code after all three courts cleared live internal proof.

## Wave 2

Wave 2 should be:

- Calcutta High Court
- Bombay High Court
- Gauhati High Court

Why this wave second:

- these are the broader and more operationally complex remaining courts
- they benefit from the repo first proving that the new public-beta batch discipline works on Wave 1
- once Wave 1 is stable, there is no product reason to keep these courts out of public beta

## Rollout Discipline

The batches should land one after the other, not all at once.

Recommended release discipline:

1. finish the modeling, source review, internal proof, and public copy for all three courts in the active wave
2. expose the whole wave publicly in one deliberate public-beta rollout
3. record deploy, scheduler, purge, and route-verification evidence for the whole wave
4. hold a short stable window long enough to prove no route, cache, or trust-surface regression
5. then move to the next three-court wave

The stable window is between waves, not between individual courts inside the same approved wave.

## What Still Gates A Wave

This plan approves the public-beta direction, not reckless launches.

Each wave still needs:

- configured court profiles with explicit `coveredGeographies[]`
- source review at the same trust bar as the existing public High Courts
- live `fetch -> publish -> replay -> rollback` proof for every court in the wave
- public route, methodology, data, and API verification on `https://nyaaywatch.in`
- release evidence recorded in deployment, release-history, and expansion-review docs

What no longer gates a wave:

- another open-ended product debate about whether these courts belong in public beta at all
- a requirement to re-prove the court-first model from scratch
- an artificial preference for pairs or one-court launches

## What To Avoid

Do not:

- hold the remaining courts back just because Punjab and Haryana was launched alone first
- split the approved waves back into pairs
- treat Delhi as blocked just because the lower-court state shell is different
- make the public High Court beta look half-approved or tentative after the product decision is already made

## Source Of Truth

This document is now the concrete rollout plan for the remaining deferred court-first High Court public beta set.

Supporting context still lives in:

- `docs/HIGH_COURT_MULTI_JURISDICTION_DESIGN.md`
- `docs/HIGH_COURT_MULTI_JURISDICTION_PHASE_1_PLAN.md`
- `docs/HIGH_COURT_MULTI_JURISDICTION_PUBLIC_LANGUAGE_PLAN.md`
- `docs/HIGH_COURT_WAVE_VALIDATION_PLAN.md`

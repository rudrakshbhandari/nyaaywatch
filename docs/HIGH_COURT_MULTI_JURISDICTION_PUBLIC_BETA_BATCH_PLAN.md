# High Court Multi-Jurisdiction Public Beta Batch Plan

Concrete rollout plan for the remaining deferred court-first High Court public beta set after Punjab and Haryana.

This document exists to answer one narrow question:

- now that Punjab and Haryana had already cleared the first public multi-jurisdiction High Court beta launch, how did the repo bring the remaining deferred courts into public beta without falling back to one-court-at-a-time hesitation?

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

Wave 1 is now live in the public beta after PR `#141` merged, deploy run `24686545934` completed successfully, and the Delhi, Kerala, and Madras public route families plus the explicit Cloudflare purge all cleared on `https://nyaaywatch.in`.

## Wave 2

Wave 2 should be:

- Calcutta High Court
- Bombay High Court
- Gauhati High Court

Why this wave second:

- these are the broader and more operationally complex remaining courts
- Wave 1 is now live, so the repo has already proven that the three-court public-beta batch discipline works
- once the Wave 1 stable window stayed clean, there was no product reason to keep these courts out of public beta

Wave 2 is now live in the public beta after PR `#144` merged, deploy run `24691704672` completed successfully, and the Bombay, Calcutta, and Gauhati public route families plus the explicit Cloudflare purge all cleared on `https://nyaaywatch.in`.

## Rollout Discipline

The batches should land one after the other, not all at once.

Recommended release discipline:

1. finish the modeling, source review, internal proof, and public copy for all three courts in the active wave
2. expose the whole wave publicly in one deliberate public-beta rollout
3. record deploy, scheduler, purge, and route-verification evidence for the whole wave
4. hold a short stable window long enough to prove no route, cache, or trust-surface regression
5. then move to the next three-court wave

Wave 1 and Wave 2 have now both completed steps 1 through 4 for the approved deferred court-first set. There is no remaining pending public-beta wave inside this plan.

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

Wave 2 is now complete:

1. the Bombay, Calcutta, and Gauhati profiles cleared live internal `fetch -> publish -> replay -> rollback` proof
2. the repo code flipped the whole wave public together through PR `#144`
3. deploy verification, explicit Cloudflare purge, and release-evidence sync all cleared for the whole batch

## What To Avoid

Do not:

- hold the remaining courts back just because Punjab and Haryana was launched alone first
- split the approved waves back into pairs
- treat Delhi as blocked just because the lower-court state shell is different
- make the public High Court beta look half-approved or tentative after the product decision is already made

## Source Of Truth

This document is now the completed rollout plan for the deferred court-first High Court public beta set.

Supporting context still lives in:

- `docs/HIGH_COURT_MULTI_JURISDICTION_DESIGN.md`
- `docs/archive/HIGH_COURT_MULTI_JURISDICTION_PHASE_1_PLAN.md`
- `docs/HIGH_COURT_MULTI_JURISDICTION_PUBLIC_LANGUAGE_PLAN.md`
- `docs/HIGH_COURT_WAVE_VALIDATION_PLAN.md`

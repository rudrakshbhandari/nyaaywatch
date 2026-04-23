# High Court Wave 1

First broader High Court configuration wave after the Himachal pilot.

Verified against the live official HC NJDG selector list on **April 18, 2026**.

This document now remains a historical record of the first broader internal High Court wave.

Current repo state has moved past that first wave. Most notably, the repo now also carries a reviewed public-beta profile for the common **High Court of Jammu & Kashmir and Ladakh** under one HC NJDG selector with explicit `coveredGeographies[] = Jammu and Kashmir, Ladakh`.

## What This Slice Does

This repo now configures a first internal High Court wave for the courts that already fit the current High Court snapshot contract:

- one High Court
- one primary jurisdiction already represented in the current state rollout
- one HC NJDG selector value

This document records the broader configured set, plus which courts have now advanced from internal-only status to public beta in repo code.

## Configured Internal Wave

Historical first-wave set:

The internal High Court registry now includes:

- Himachal Pradesh
- Andhra Pradesh
- Bombay High Court
- Calcutta High Court
- Telangana
- Chhattisgarh
- Delhi High Court
- Gauhati High Court
- Gujarat
- Jharkhand
- Karnataka
- High Court of Kerala
- Madras High Court
- Madhya Pradesh
- Manipur
- Meghalaya
- Odisha
- Punjab and Haryana
- Rajasthan
- Sikkim
- Tripura
- Uttarakhand
- Bihar via Patna High Court
- Uttar Pradesh via Allahabad High Court

Current posture:

- `sourceReviewStatus=reviewed`: Himachal Pradesh, Andhra Pradesh, Bombay High Court, Calcutta High Court, Telangana, Delhi High Court, Gauhati High Court, Gujarat, High Court of Kerala, Madras High Court, Madhya Pradesh, Punjab and Haryana, Rajasthan, Uttar Pradesh, and High Court of Jammu & Kashmir and Ladakh
- `sourceReviewStatus=queued`: Chhattisgarh, Jharkhand, Karnataka, Odisha, Manipur, Meghalaya, Sikkim, Tripura, Uttarakhand, and Bihar via Patna High Court
- `publicBeta=true`: Himachal Pradesh, Andhra Pradesh, Bombay High Court, Calcutta High Court, Telangana, Delhi High Court, Gujarat, Gauhati High Court, High Court of Jammu & Kashmir and Ladakh, High Court of Kerala, Madras High Court, Madhya Pradesh, Punjab and Haryana, Rajasthan, and Uttar Pradesh
- `publicBeta=false`: Chhattisgarh, Jharkhand, Karnataka, Odisha, Manipur, Meghalaya, Sikkim, Tripura, Uttarakhand, and Bihar via Patna High Court

## Why These Courts

This wave is intentionally narrower than "all High Courts in India."

It includes courts that fit the current model without pretending the model is broader than it is:

- the current canonical High Court model is now court-first and can carry explicit `coveredGeographies[]`
- the single-jurisdiction courts still map cleanly to one already-supported state profile
- Punjab and Haryana was the one intentional internal multi-jurisdiction pilot after that model change, and is now the first public multi-jurisdiction High Court beta page
- the HC NJDG selector values are explicit and stable enough to configure now

## Deferred From Public Beta

This slice originally left the Wave 2 public-batch courts internal-only while they cleared proof.

That is no longer the current posture:

- Bombay High Court via `27~1`, covering Maharashtra, Goa, and Dadra and Nagar Haveli and Daman and Diu, is now live in the public beta
- Calcutta High Court via `19~16`, covering West Bengal and Andaman and Nicobar Islands, is now live in the public beta
- Gauhati High Court via `18~6`, covering Assam, Nagaland, Mizoram, and Arunachal Pradesh, is now live in the public beta

There are no remaining deferred courts inside the approved two-wave court-first High Court public-beta plan.

## Operational Meaning

After this slice:

- the operator-only `/operator/high-courts/:courtSlug/...` namespace can be configured for this wave
- local and remote operator tooling can target these additional High Court slugs
- test and preview runtime setup no longer assume Himachal is the only configured High Court
- Delhi, Kerala, and Madras are now configured as reviewed public-beta High Courts in repo code after clearing the deliberate Wave 1 proof bar

After this slice, the repo still does **not** claim:

- that every configured High Court has cleared source review
- that cross-court methodology is public-ready
- that multi-jurisdiction High Courts fit the current schema
- that every configured High Court should launch publicly just because seven High Courts now have narrow beta routes

## Next Decision After Setup

The queued single-jurisdiction validation list is now exhausted.

The next serious gate is still operational evidence:

- repeated internal fetch and publish cycles
- replay and rollback proof
- source-review writeups for any newly modeled court shape
- a methodologically honest reason to expose any public High Court beta beyond the original seven-court set

The repo now makes the next recommendation explicit in `docs/HIGH_COURT_WAVE_VALIDATION_PLAN.md`:

- Chhattisgarh and Jharkhand have now cleared the internal proof bar
- Karnataka and Odisha have now also cleared the internal proof bar
- Bihar and Uttarakhand have now also cleared the internal proof bar
- Sikkim and Tripura have now also cleared the internal proof bar
- Meghalaya and Manipur have now also cleared the internal proof bar
- the queued single-jurisdiction High Court validation list is now exhausted
- `docs/HIGH_COURT_MULTI_JURISDICTION_DESIGN.md` now records the court-first model needed before the remaining deferred multi-jurisdiction courts can move again
- `docs/HIGH_COURT_MULTI_JURISDICTION_PHASE_1_PLAN.md` now has PR 1 through PR 4 completed, and Punjab and Haryana High Court has live internal fetch, publish, replay, and rollback proof with explicit Punjab, Haryana, and Chandigarh coverage
- the next live validation move is no longer another proof cycle; the concrete methodology and UX follow-up is now landed on the shipped public High Court surfaces
- the original seven-court public beta is no longer fixed now that Punjab and Haryana has cleared the separate product and methodology decision
- the next approved public-beta move for the remaining deferred court-first High Courts now lives in `docs/HIGH_COURT_MULTI_JURISDICTION_PUBLIC_BETA_BATCH_PLAN.md`
- Delhi, Kerala, and Madras are now live in the public High Court beta as the completed Wave 1 batch
- the remaining three deferred courts have now also cleared deploy verification, cache purge, and rollout-evidence sync for the Wave 2 public batch
- the deferred court-first High Court public-beta plan is now exhausted; future High Court scope decisions should start from operational quality and product intent, not this backlog

# High Court Wave 1

First broader High Court configuration wave after the Himachal pilot.

Verified against the live official HC NJDG selector list on **April 18, 2026**.

## What This Slice Does

This repo now configures a first internal High Court wave for the courts that already fit the current High Court snapshot contract:

- one High Court
- one primary jurisdiction already represented in the current state rollout
- one HC NJDG selector value

This document records the broader configured set, plus which courts have now advanced from internal-only status to public beta in repo code.

## Configured Internal Wave

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

- `sourceReviewStatus=reviewed`: Himachal Pradesh, Andhra Pradesh, Bombay High Court, Calcutta High Court, Telangana, Delhi High Court, Gauhati High Court, Gujarat, High Court of Kerala, Madras High Court, Madhya Pradesh, Punjab and Haryana, Rajasthan, and Uttar Pradesh
- `sourceReviewStatus=queued`: Chhattisgarh, Jharkhand, Karnataka, Odisha, Manipur, Meghalaya, Sikkim, Tripura, Uttarakhand, and Bihar via Patna High Court
- `publicBeta=true`: Himachal Pradesh, Andhra Pradesh, Telangana, Delhi High Court, Gujarat, High Court of Kerala, Madras High Court, Madhya Pradesh, Punjab and Haryana, Rajasthan, and Uttar Pradesh
- `publicBeta=false`: Bombay High Court, Calcutta High Court, Chhattisgarh, Gauhati High Court, Jharkhand, Karnataka, Odisha, Manipur, Meghalaya, Sikkim, Tripura, Uttarakhand, and Bihar via Patna High Court

## Why These Courts

This wave is intentionally narrower than "all High Courts in India."

It includes courts that fit the current model without pretending the model is broader than it is:

- the current canonical High Court model is now court-first and can carry explicit `coveredGeographies[]`
- the single-jurisdiction courts still map cleanly to one already-supported state profile
- Punjab and Haryana was the one intentional internal multi-jurisdiction pilot after that model change, and is now the first public multi-jurisdiction High Court beta page
- the HC NJDG selector values are explicit and stable enough to configure now

## Deferred From Public Beta

This slice now configures the Wave 1 public-batch courts for public beta in repo code after their internal review and proof passed.

The only remaining court-first High Courts that are still internal-only after this setup step are:

- Bombay High Court via `27~1`, covering Maharashtra, Goa, and Dadra and Nagar Haveli and Daman and Diu
- Calcutta High Court via `19~16`, covering West Bengal and Andaman and Nicobar Islands
- Gauhati High Court via `18~6`, covering Assam, Nagaland, Mizoram, and Arunachal Pradesh

Those courts are no longer just abstract deferred names. They are now configured as reviewed internal Wave 2 profiles and are waiting on the live proof batch before the public route flip.

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
- the remaining three deferred courts are now expected to follow as Wave 2 after the Wave 1 stable window proves clean
- the immediate repo step is now the live `fetch -> publish -> replay -> rollback` proof batch for Bombay, Calcutta, and Gauhati before any public route flip

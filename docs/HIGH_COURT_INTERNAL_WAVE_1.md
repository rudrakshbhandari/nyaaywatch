# High Court Wave 1

First broader High Court configuration wave after the Himachal pilot.

Verified against the live official HC NJDG selector list on **April 18, 2026**.

## What This Slice Does

This repo now configures a first internal High Court wave for the courts that already fit the current High Court snapshot contract:

- one High Court
- one primary jurisdiction already represented in the current state rollout
- one HC NJDG selector value

This document records the broader configured set, plus which courts have now advanced from internal-only status to public beta.

## Configured Internal Wave

The internal High Court registry now includes:

- Himachal Pradesh
- Andhra Pradesh
- Telangana
- Chhattisgarh
- Gujarat
- Jharkhand
- Karnataka
- Madhya Pradesh
- Manipur
- Meghalaya
- Odisha
- Rajasthan
- Sikkim
- Tripura
- Uttarakhand
- Bihar via Patna High Court
- Uttar Pradesh via Allahabad High Court

Current posture:

- `sourceReviewStatus=reviewed`: Himachal Pradesh, Andhra Pradesh, Telangana, Gujarat, Madhya Pradesh, Rajasthan, and Uttar Pradesh
- `sourceReviewStatus=queued`: every other configured court in this wave
- `publicBeta=true`: Himachal Pradesh, Andhra Pradesh, Telangana, Gujarat, Madhya Pradesh, Rajasthan, and Uttar Pradesh
- `publicBeta=false`: every other configured court in this wave

## Why These Courts

This wave is intentionally narrower than "all High Courts in India."

It includes courts that fit the current model without pretending the model is broader than it is:

- the current High Court snapshot schema still carries one `stateCode` and one `stateName`
- these courts map cleanly to one already-supported state profile
- the HC NJDG selector values are explicit and stable enough to configure now

## Explicitly Deferred

This slice does **not** configure the multi-jurisdiction High Courts whose product and schema implications need a separate pass:

- Bombay High Court
- Calcutta High Court
- Gauhati High Court
- High Court of Kerala
- Madras High Court
- High Court of Punjab and Haryana

Delhi High Court is also deferred for now because the current lower-court state registry does not yet include a Delhi state profile, and this slice intentionally stays aligned with the existing supported-state shell.

## Operational Meaning

After this slice:

- the operator-only `/operator/high-courts/:courtSlug/...` namespace can be configured for this wave
- local and remote operator tooling can target these additional High Court slugs
- test and preview runtime setup no longer assume Himachal is the only configured High Court

After this slice, the repo still does **not** claim:

- that every configured High Court has cleared source review
- that cross-court methodology is public-ready
- that multi-jurisdiction High Courts fit the current schema
- that every configured High Court should launch publicly just because seven High Courts now have narrow beta routes

## Next Decision After Setup

Use this wave to choose the next one or two queued courts after the current seven-court public beta for real operator-cycle validation.

The next serious gate is still operational evidence:

- repeated internal fetch and publish cycles
- replay and rollback proof
- source-review writeups for the next court(s)
- a methodologically honest reason to expose any public High Court beta beyond the current seven-court set

The repo now makes the next recommendation explicit in `docs/HIGH_COURT_WAVE_VALIDATION_PLAN.md`:

- Chhattisgarh and Jharkhand have now cleared the internal proof bar
- validate Karnataka and Odisha as the next deliberate queued-court pair
- keep using `npm run high-court:wave-readiness` for each deliberate pair
- treat each additional pair as an internal proof step, not automatic public-beta approval

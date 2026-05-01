# Public Alpha Launch Communications

What NyaayWatch says, where, and in what order when opening or widening public-alpha access.

This document is for the one-shot comms moment — the point at which `https://nyaaywatch.in` is shared with people who are not already operators or reviewers. Per-release operator evidence lives in `docs/RELEASE_POLICY.md`, `docs/OPERATING_EVIDENCE.md`, and `docs/RELEASE_HISTORY.md`; this document is only about the outside-the-repo surface.

## Goals

- Put NyaayWatch in front of the narrow audience that can actually check our work.
- Set expectations that match the product guardrails in `README.md`: snapshot-based, transparency-first, Himachal-first for lower-courts, Supreme Court-first nationally, eleven High Court betas today.
- Create a record of where we announced and what we said, so the next round of operators can see what we already committed to in public.

## Audience Priority

In order. Do not skip ahead unless an earlier audience has already received a concrete invitation.

1. **Direct reviewers** — the two or three legal-system people who have already seen internal readiness docs. Private message, with the live URL, the methodology page link, and one specific question about their domain (for example: Himachal district disposal rates, Supreme Court IA pendency, High Court publicBeta coverage).
2. **Specific publications and researchers** — people writing about Indian judicial data. One message each, with an explicit "this is an alpha, not a product launch" framing and a link to the methodology page for their jurisdiction of interest.
3. **Narrow professional network** — small private channels only. No broad social posts yet.
4. **Open social post** — only after the above have produced at least one round of feedback that shaped copy or methodology. Frame it as "public alpha", link the homepage, and include one link to `docs/ALPHA_RELEASE_CHECKLIST.md` or the methodology page so readers can inspect the gate.

Do not launch by posting to high-traffic aggregators. The ops cadence (`docs/RELEASE_POLICY.md`) and on-call coverage (`docs/ON_CALL_POLICY.md`) assume working-hours Asia/Kolkata attention, not a front-page traffic spike.

## Messaging Rules

Everything below applies to every external message, whether it is a DM, a post, or a footer on a blog.

- Call it a "public alpha" or "snapshot-based public alpha". Do not call it a "product", "platform", or "dashboard" without qualifier.
- Name the scope explicitly: Supreme Court, eleven High Court betas (current count from `README.md`), and twenty-eight supported lower-court states with Himachal Pradesh as the default proof surface.
- Do not imply real-time monitoring, prediction, or legal verdicts. This is the same rule as the public-copy rule in `docs/RELEASE_POLICY.md`.
- Link the methodology page for whichever scope the reader will care about, not the homepage.
- If asked about accuracy, point at provenance, not certainty. Every number traces back to a stored NJDG snapshot and a published publication id.

## Channels To Set Up Before Announcing

The following must be in place before the first message in the Audience Priority list. If any is missing, hold.

- [ ] `robots.txt` served at `https://nyaaywatch.in/robots.txt`, permitting public crawl of public routes and disallowing `/operator/`.
- [ ] Homepage methodology link reachable in one click for every currently live scope (Supreme Court, each High Court beta, Himachal lower-court).
- [ ] `docs/ALPHA_RELEASE_CHECKLIST.md` up to date for the latest publication, so external readers who inspect the repo see a checklist that matches what is actually live.
- [ ] On-call primary and backup named in `docs/ON_CALL_POLICY.md` with the expected working-hours window explicitly recorded.
- [ ] Ops watchdog green: `nyaaywatch-production-public-alpha-ops` alarm not in `ALARM`, no open `Ops watchdog failure` GitHub issue.
- [ ] A way to receive incoming feedback that is not an operator's personal DMs. For alpha, a single shared mailbox or a GitHub Discussions thread is enough; whichever it is, it must be linked from the homepage footer or the methodology page before announcing.

Analytics, paid distribution, and SEO-for-scale are deliberately out of scope for this pass. The point of alpha is to be read carefully by a small number of people, not to be discovered at scale.

## What Not To Include In External Copy

- screenshots of operator-only routes
- internal readiness-review doc names, file paths, or run ids
- AWS stack names, task definition numbers, or alarm names
- the operator token, secret ARNs, or any Cloudflare or AWS identifiers
- the names of individual reviewers who have not explicitly opted in to being named publicly
- aspirational scope ("we plan to cover every court in India by <date>") — describe current scope only

If a recipient asks for the repo link, it is fine to share. The repo is already public and is the strongest trust surface NyaayWatch has.

## After Announcing

Within one working week of the first announcement:

- Read every reply, DM, or comment. Log anything that surfaces a copy, methodology, or provenance concern as a TODO in `docs/TODOS.md` under Freshness And Trust-Surface Hardening.
- Confirm the ops watchdog has stayed green. If an incident opened during the announcement window, link the announcement in the watchdog issue so future operators can see the traffic correlation.
- Decide whether to widen to the next audience. "No decision" is a valid outcome for the first announcement.

## References

- `README.md` — product guardrails and current public scope
- `docs/RELEASE_POLICY.md` — cadence and public copy rules
- `docs/ALPHA_RELEASE_CHECKLIST.md` — publish-time go/no-go
- `docs/ON_CALL_POLICY.md` — on-call roles, response targets, escalation
- `docs/HIGH_COURT_FRESHNESS_RUNBOOK.md` — freshness and daily-fetch lag decisions
- `docs/DEPLOYMENT_STATUS.md` — live environment map

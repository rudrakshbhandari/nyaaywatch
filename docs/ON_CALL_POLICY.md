# On-Call Policy

Rules for who answers a NyaayWatch ops alert, how fast, and when to escalate.

This document only covers production public-alpha alerts on `https://nyaaywatch.in`. It is intentionally narrow for the current operator headcount; revise when the operator allowlist in `docs/RELEASE_POLICY.md` grows beyond a primary and a backup publisher.

## Covered Signals

The signals below are what "on-call" is responsible for. Everything else is normal working-hours work.

| Signal | Source | How it surfaces |
| --- | --- | --- |
| Public-alpha ops sweep failure | `nyaaywatch-production-public-alpha-ops-monitor` (every 30 min) and `.github/workflows/ops-watchdog.yml` (daily 05:00 UTC) | CloudWatch alarm `nyaaywatch-production-public-alpha-ops`, SNS topic `nyaaywatch-production-alerts`, and durable GitHub issue `Ops watchdog failure` |
| Internal fetch schedule failure | `npm run ops:verify-internal-fetch-schedule` inside the watchdog | Same GitHub issue, `failingTiers` section |
| Public hostname health | `nyaaywatch-production-health-endpoint`, `nyaaywatch-production-alb-target-5xx` | SNS topic `nyaaywatch-production-alerts` |
| Structured app errors | `nyaaywatch-production-app-errors` | SNS topic `nyaaywatch-production-alerts` |
| Missed daily internal fetch at 08:00, 08:10, or 08:20 Asia/Kolkata | `ops:verify-internal-fetch-schedule` tier outcome | Same GitHub issue, per-tier block |
| NJDG missing-zero outreach send failure | `.github/workflows/njdg-missing-zero-outreach.yml` Monday, Wednesday, and Friday schedule | Durable GitHub issue `NJDG outreach failure` and SNS topic `nyaaywatch-production-alerts` |

## Roles

Only two named roles. Both names are explicit in the watchdog issue when an incident opens.

- **Primary operator** — the release owner listed in the most recent `docs/internal/RELEASE_HISTORY.md` entry
- **Backup operator** — the delegated maintainer named in `docs/RELEASE_POLICY.md`'s Publish Authority section

The primary operator owns every alert by default. The backup operator takes over only when explicitly paged (see Escalation).

## Response Targets

These are targets, not contractual SLAs. Document any miss in the watchdog issue with a one-line reason — that is the audit trail.

| Severity | Definition | Acknowledge | Start remediation | Close or escalate |
| --- | --- | --- | --- | --- |
| Sev-1 | Public hostname `/health` failing, ALB 5xx alarm firing, or a public page serving content that does not match the active publication | 15 minutes | 30 minutes | 2 hours |
| Sev-2 | Ops watchdog red with `staleStates` non-empty, or any public snapshot past the 14-day trust threshold | 2 hours | 4 hours | next business day |
| Sev-3 | Ops watchdog red with only `dailyFetchLagStates` or `failingTiers` set, public snapshot still fresh | next business day | within 2 business days | within 5 business days |

"Acknowledge" means leaving a comment on the watchdog GitHub issue that names the operator taking the incident. "Close" means the watchdog issue is either auto-closed by a recovered run or has a final comment summarizing the decision and linking any PRs or publication ids.

## Business-Hours Assumptions

Public-alpha on-call is **working hours, Asia/Kolkata, Monday to Friday, plus the release window on Tuesday and Friday at 11:00 AM Asia/Kolkata**.

- Sev-1 alerts page outside those hours.
- Sev-2 and Sev-3 alerts wait until the next working window.
- Saturday and Sunday silence is expected and is the reason the 14-day public trust threshold exists.

If the project ever needs 24/7 coverage, this document is the first thing to rewrite.

## Escalation

Escalate by reassigning the watchdog issue to the backup operator and leaving a comment naming what blocked you.

Escalate when any of the following is true:

- the primary operator will not acknowledge a Sev-1 within 15 minutes
- the primary operator cannot start Sev-1 remediation within 30 minutes
- a Sev-2 incident has been open for 24 hours without a decision recorded
- the incident touches infrastructure the primary operator does not have access to (for example, DNS at the registrar, AWS account root, or domain-level Cloudflare settings)

Do not escalate by messaging individuals out of band without also updating the watchdog issue — the issue is the durable record and future operators will read it.

## First-Response Checklist

For every incident, in order:

1. Acknowledge on the watchdog GitHub issue. Name yourself and the start time.
2. Decide severity using the table above. Record it in the issue.
3. Run the relevant verification command against the live hostname:
   ```bash
   export OPERATOR_API_TOKEN=...
   npm run ops:verify-public-alpha -- --base-url=https://nyaaywatch.in
   npm run ops:verify-internal-fetch-schedule -- --base-url=https://nyaaywatch.in
   npm run release:verify -- --base-url=https://nyaaywatch.in
   ```
4. Decide whether the alert maps to a runbook:
   - public trust / freshness / lag: `docs/HIGH_COURT_FRESHNESS_RUNBOOK.md`
   - publish or rollback decisions: `docs/RELEASE_POLICY.md` and `docs/OPERATING_EVIDENCE.md`
   - stack or environment anomalies: `docs/internal/DEPLOYMENT_STATUS.md`
5. If the failure is stale public lower-court snapshots after a deployed code fix and fresh internal runs already exist, run the manual **Ops Publish Pending** workflow from `main`. It triggers the existing production publish-pending EventBridge schedule through the live stack, restores the normal schedule expression, then reruns the public-alpha and internal-fetch verifiers. Do not use it to bypass publish gates or publish stale/partial runs.
6. Take the action or explicitly record why no action is being taken. Every incident closes with either a publication id, a PR link, or a one-line "held, reason recorded" note.
7. If any assumption in this document was wrong in practice, propose an edit to this file in the same PR that closes the incident.

## What Not To Do

- Do not silence the watchdog alarm by editing the workflow or the alarm threshold during an incident. Fix the underlying cause or record why you are holding.
- Do not publish a new snapshot just to clear an alert. Publishing is governed by `docs/ALPHA_RELEASE_CHECKLIST.md`, not by alarm state.
- Do not skip the watchdog issue update. The durable record is more important than the individual fix.
- Do not hand out `OPERATOR_API_TOKEN` to anyone not in the Publish Authority allowlist. An incident is never a reason to widen access.

## References

- `docs/RELEASE_POLICY.md` — cadence, publish authority, blocked release criteria, weekly review
- `docs/HIGH_COURT_FRESHNESS_RUNBOOK.md` — freshness and daily-fetch lag decisions
- `docs/OPERATING_EVIDENCE.md` — required evidence per release
- `docs/internal/DEPLOYMENT_STATUS.md` — live environment map, alarm names, topic ARNs
- `.github/workflows/ops-watchdog.yml` — scheduled watchdog and issue wiring
- `.github/workflows/ops-publish-pending.yml` — manual gated publish-pending recovery

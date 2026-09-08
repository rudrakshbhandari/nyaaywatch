# Chhattisgarh review recovery — 7 September 2026

## Cause and evidence

The active August 26 publication reported 413,079 pending cases. Stored CG candidates show 502,717 on August 25, 413,079 on August 26, 501,804 on August 27, 506,397 on August 31, and 520,140 on September 7. The 17.8% decrease passed the symmetric 20% auto-publish gate; the next day's 21.5% rebound was held. Subsequent captures continued to compare against the low August 26 publication. The source-side cause of that one-day decrease is unknown.

The September 7 stored NJDG HTML explicitly selects Chhattisgarh (`22~18`) and reports 97,336 civil plus 422,804 criminal cases, totalling 520,140. The same 25 district captures sum to 520,140. This is 3.47% above August 25. The candidate is quality-complete; the raw and normalized artifact SHA-256 checksums match canonical operator metadata. This supports publishing the observed source snapshot without explaining the source fluctuation as a real change in court activity.

## Scoped production recovery

- AWS account: `723951822728`; region: `ap-south-1`.
- Reviewed run: `run_36f911f2-d1b4-467b-947a-8b4cc43f53b1`.
- Publication: `publication_0d66e9d6-245e-4d98-9e27-b16d47da15ff`.
- Published at: `2026-09-07T23:06:58.598Z`.
- Rollback target: `publication_46dcd795-7110-46b4-b2f6-a338d7ee052f`.
- Reviewer: Codex scoped CG recovery, under the user's request to fix this alert.
- Used `operator:production -- --state=CG inspect`, `publications`, and `publish`; no threshold or infrastructure changes.
- The HTTPS operator endpoint returned 403; canonical inspection/history and publish results were obtained through ECS and CloudWatch. The local prepublish/postpublish evidence helpers used those returned records and live public-route verification.
- CloudWatch records `operator_publish_completed` and successful invalidation of 53 public URLs. The public CG stats API serves the intended run and 520,140 pending cases.
- Pre/post-release verification passed for CG API/CSV metadata parity, 25 districts, protected public caches and operator authentication. ALB target was healthy, no production metric alarms were active, and the checked 30-minute app-error logs were empty. The scheduled smoke result after publication at 23:30 UTC was also inspected; its representative targets do not include CG, so CG was verified separately.

## Alert change

The sweep previously retried every held candidate in its three-day window and sent one SNS message per candidate. It now retains chronological gate evaluation but sends one review digest per scope, with all actionable held run IDs and values. A later successful publication supersedes earlier holds. Digest delivery failure marks affected results failed while allowing other scopes to continue. Immediate publish-failure alerts and the quality/20% gate remain unchanged. Unresolved scopes still receive daily reminders.

The operational recovery is live. The digest change requires its PR to merge and deploy; it was not installed by the data publication.

# NJDG Source Clarifications

Internal evidence log for source-owner replies that affect how NyaayWatch interprets NJDG aggregate dashboard fields. This is not a public release ledger.

## 2026-06-12 CPC Meghalaya monthly movement response

Source thread:

- Subject: `Re:NyaayWatch source-data check: 30 NJDG monthly movement zero cases`
- Sender: `cpc-mgl@aij.gov.in`
- Sent: `2026-06-12T11:15:25Z`
- NyaayWatch outbound sender: `data@nyaaywatch.in`
- NyaayWatch outbound date: `2026-06-10T08:30:48Z`

NyaayWatch asked whether lower-court rows with pending cases but `0` filed and `0` disposed cases for last month were true zero activity or unavailable monthly movement fields. The outbound check included affected rows across Assam, Arunachal Pradesh, Meghalaya, and Nagaland.

CPC Meghalaya replied that where the NJDG dashboard shows `0` pending backlog alongside `0` filed and `0` disposed cases for last-month movement fields, those values should be interpreted as missing data for that period. The response did not directly restate the pending-positive condition from the NyaayWatch examples, so follow-up should ask whether the same interpretation applies to the listed rows with non-zero pending cases.

NyaayWatch interpretation:

- Continue treating pending-positive rows with `0` filed and `0` disposed last month as missing monthly movement inputs unless NJDG confirms those values are true zero activity.
- Continue showing derived monthly movement metrics as `N/A`, not as zero-rate performance.
- Do not describe the source condition as a NyaayWatch-computed zero.
- Keep any public copy calm and exact: the issue is unavailable monthly movement data in the official source row, not a verdict about court performance.

Public-interest follow-up:

- The central issue is not only how unavailable values are displayed. Public court movement data should not be missing or unreported in the first place.
- NyaayWatch should ask whether NJDG/CPC can publish or restore the missing monthly filing and disposal values for the affected rows.
- If a period genuinely cannot be reported, NJDG should explain the reason and affected scope so the public can distinguish a source-reporting gap from court activity.
- NyaayWatch should ask whether this interpretation is general NJDG guidance for similar rows across CPC jurisdictions.

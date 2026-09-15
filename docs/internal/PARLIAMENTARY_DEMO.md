# Parliamentary pilot demo evidence

Run from the repository root:

```bash
npm run parliament:demo
```

The deterministic fixture demo completed on 2026-09-15 with these results:

```json
{
  "scope": "ls-18-session-5",
  "capturedRunId": "run_a2f97b1d-11c0-4953-ab80-0e4ea2639154",
  "publishedRunId": "run_a2f97b1d-11c0-4953-ab80-0e4ea2639154",
  "publishedPublicationId": "publication_f7516b37-2089-42c2-b3f2-48825e542e9b",
  "replayRunId": "run_71d16be8-c655-429b-8880-ddf80a31b346",
  "replayPublicationId": "publication_8e728de6-a445-4a99-a0a7-c21014ebc271",
  "rollbackPublicationId": "publication_b157c444-18e5-4146-850a-bc83a31f957b",
  "statuses": { "captured": "completed", "published": "published", "replayed": "replayed", "rollback": "rollback" },
  "lineage": { "aggregate": "parliament-ls18-s5-20260811T033035Z", "profile": "parliament-ls18-s5-20260811T033035Z", "replay": "parliament-ls18-s5-20260811T033035Z", "allMatch": true },
  "publishedValues": { "uniqueBillCount": 14, "sourceReportedQuestionCount": 125, "sessionScopedQuestionCount": 20, "mpProfile": "Shri Mani A" },
  "surfaces": { "jsonStatus": 200, "htmlStatus": 200, "profileHtmlStatus": 200, "htmlContainsLineage": true, "htmlContainsUniqueBillCount": true, "profileHtmlContainsName": true },
  "qualityState": "partial",
  "remainingMissingData": [
    "house-session-question-coverage-not-captured",
    "attendance-not-published-official-code-legend-unverified"
  ]
}
```

The demo uses `pg-mem` and the in-memory artifact store. It does not mutate AWS or a developer database. It exercises the typed services and protected application routes used by the local runtime.

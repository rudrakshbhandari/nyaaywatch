# Parliamentary pilot demo evidence

Run from the repository root:

```bash
npm run parliament:demo
```

The deterministic fixture demo completed on 2026-09-15 with these results:

```json
{
  "scope": "ls-18-session-5",
  "capturedRunId": "run_77a21789-09e8-4d99-a628-a4f676fdac16",
  "publishedRunId": "run_77a21789-09e8-4d99-a628-a4f676fdac16",
  "publishedPublicationId": "publication_d9910a8c-8a21-4cc5-87d6-ca9e682005f5",
  "replayRunId": "run_4452d061-46b4-46f2-9407-05465f6f1c62",
  "replayPublicationId": "publication_d6aaffbf-cd12-4661-9c59-4e6347587538",
  "rollbackPublicationId": "publication_de8049d9-301f-4264-97b4-37fc3219fef1",
  "statuses": { "captured": "completed", "published": "published", "replayed": "replayed", "rollback": "rollback" },
  "lineage": { "aggregate": "parliament-ls18-s5-20260811T033035Z", "profile": "parliament-ls18-s5-20260811T033035Z", "replay": "parliament-ls18-s5-20260811T033035Z", "allMatch": true },
  "publishedValues": { "uniqueBillCount": 14, "sourceReportedQuestionCount": 125, "sessionScopedQuestionCount": 20, "mpProfile": "Shri Mani A" },
  "surfaces": { "jsonStatus": 200, "htmlStatus": 200, "profileHtmlStatus": 200, "htmlContainsLineage": true, "htmlContainsUniqueBillCount": true, "profileHtmlContainsName": true },
  "qualityState": "partial",
  "remainingMissingData": [
    "source-question-aggregate-not-session-scoped",
    "bill-attribution-not-published-by-source",
    "attendance-not-published-official-code-legend-unverified"
  ]
}
```

The demo uses `pg-mem` and the in-memory artifact store. It does not mutate AWS or a developer database. It exercises the typed services and protected application routes used by the local runtime.

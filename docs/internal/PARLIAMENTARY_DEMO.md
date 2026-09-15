# Parliamentary pilot demo evidence

Run from the repository root:

```bash
npm run parliament:demo
```

The deterministic fixture demo completed on 2026-09-15 with these results:

```json
{
  "scope": "ls-18-session-5",
  "capturedRunId": "run_51809ae0-6a6c-45c6-9b1b-3ab0db679a43",
  "publishedRunId": "run_51809ae0-6a6c-45c6-9b1b-3ab0db679a43",
  "publishedPublicationId": "publication_56a66fe7-3676-4158-9463-6c14d32af3aa",
  "replayRunId": "run_2288bff2-dcf8-44f4-a562-7a721cb4470b",
  "replayPublicationId": "publication_51000447-42d0-47de-a547-2be98ded54d5",
  "rollbackPublicationId": "publication_abbb8412-c0d7-4d34-9dd0-bfa8da34fe2d",
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

# Parliamentary pilot demo evidence

Run from the repository root:

```bash
npm run parliament:demo
```

The deterministic fixture demo completed on 2026-09-15 with these results:

```json
{
  "scope": "ls-18-session-5",
  "capturedRunId": "run_2e2c5c49-5e76-4800-92ee-d7f568b13b59",
  "publishedRunId": "run_2e2c5c49-5e76-4800-92ee-d7f568b13b59",
  "publishedPublicationId": "publication_567ef326-57cc-439a-bfd6-1b6d413c7fce",
  "replayRunId": "run_2b543efc-4245-49ed-b645-340b020a4e0c",
  "replayPublicationId": "publication_0c1a814f-ee9c-43fd-ab51-8e211a6ee154",
  "rollbackPublicationId": "publication_dacd2ae5-ad33-4028-a364-2318a33964bd",
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

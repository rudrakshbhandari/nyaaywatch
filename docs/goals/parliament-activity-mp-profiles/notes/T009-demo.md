# Local parliamentary demo evidence

Command run from the repository root on `2026-08-11`:

```text
npm run parliament:demo
```

The command completed successfully and returned:

```json
{
  "scope": "ls-18-session-5",
  "capturedRunId": "run_eeb6ef0c-99f3-4b09-b3df-38526fef3874",
  "publishedRunId": "run_eeb6ef0c-99f3-4b09-b3df-38526fef3874",
  "publishedPublicationId": "publication_dece909b-f18a-4f97-8af6-d6dbb1d326a8",
  "replayRunId": "run_ae8e295e-3c61-4f3f-b5b7-4441f3e52d7f",
  "replayPublicationId": "publication_f32a9454-e229-459e-af84-fd30ab317145",
  "rollbackPublicationId": "publication_5f31ee20-b845-4702-bcb4-4908c83f5187",
  "statuses": {"captured":"completed","published":"published","replayed":"replayed","rollback":"rollback"},
  "lineage": {
    "aggregate": "parliament-ls18-s5-20260811T033035Z",
    "profile": "parliament-ls18-s5-20260811T033035Z",
    "replay": "parliament-ls18-s5-20260811T033035Z",
    "allMatch": true
  },
  "publishedValues": {
    "uniqueBillCount": 14,
    "sourceReportedQuestionCount": 125,
    "sessionScopedQuestionCount": 20,
    "mpProfile": "Shri Mani A"
  },
  "surfaces": {
    "jsonStatus": 200,
    "htmlStatus": 200,
    "profileHtmlStatus": 200,
    "htmlContainsLineage": true,
    "htmlContainsUniqueBillCount": true,
    "profileHtmlContainsName": true
  },
  "qualityState": "partial",
  "remainingMissingData": [
    "source-question-aggregate-not-session-scoped",
    "bill-attribution-not-published-by-source",
    "attendance-not-published-official-code-legend-unverified"
  ]
}
```

The demo uses `pg-mem` and the in-memory artifact store, so it is deterministic and does not mutate AWS or a developer database. It exercises the same typed service and protected app routes used by the local runtime.

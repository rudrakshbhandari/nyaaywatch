# Parliamentary source review

Reviewed at `2026-08-11T03:30:35Z` from the NyaayWatch worktree and official source endpoints.

## Digital Sansad

- Bills: [Lok Sabha bills](https://sansad.in/ls/legislation/bills) and the paginated `getBills` API. Lok Sabha 18, Session 5 returned 15 source records across three pages. Two status rows represented one bill identity.
- Questions: [Lok Sabha questions](https://sansad.in/ls/questions/questions-and-answers) and `qetFilteredQuestionsAns`. The fixture request used `loksabhaNo=18`, `sessionNumber=5`, `pageNo=1`, `pageSize=100`, `locale=en`, and `memberCode=5814`; it returned 20 rows and `totalRecordSize: 20`.
- Sessions: `getAllLoksabhaAndSession` returned the official Session 5 window, `2025-07-21` to `2025-08-21`.
- Member: [Shri Mani A](https://sansad.in/api_ls/member/5814?locale=en) and [role history](https://sansad.in/api_ls/member/positionHeld?mpCode=5814&locale=en) provided identity, party, constituency, House, term, and role evidence.
- Activity: [question participation](https://sansad.in/api_ls/question/participation?mpsno=5814&loksabha=18), [debate participation](https://sansad.in/api_ls/debate/participation?mpsno=5814&loksabha=18), and [committee participation](https://sansad.in/api_ls/committee/participation?mpsno=5814&loksabha=18) provide source-reported aggregates.
- Attendance codes were observed but not published because the source review did not verify their legend or scope.
- [Digital Sansad terms](https://sansad.in/rs/privacyPolicy) permit direct linking but do not provide clearance for bulk reproduction. The fixture therefore retains normalized values and official links, not raw PDFs or bulk search results.

## Parliament Digital Library

- [About and collection scope](https://eparlib.sansad.in/about_us.jsp) covers historical debates, questions and answers, committee reports, bulletins, and publications.
- [Search help](https://eparlib.sansad.in/help/search.jsp) documents paginated search controls. Captures must retain the collection, filters, page, row count, and returned total.
- [Copyright policy](https://eparlib.sansad.in/help/copyright-policy.jsp) permits some attributed research, study, criticism, review, and news use, while other reuse requires permission. The pilot stores no PDL document bodies.

## Fixture decisions

- Preserve `capturedAt` and raw source date strings. Date-only source fields remain calendar dates; no timezone is invented.
- Use closed Lok Sabha 18 Session 5 for the first fixture. Do not infer dates from an ongoing session with empty sitting-date metadata.
- Keep missing attribution, attendance, and unverified aggregates missing. Do not infer sponsorship, attendance, competence, or policy quality.

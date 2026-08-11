# T001 source review and repository map

Reviewed at `2026-08-11T03:30:35Z` from the NyaayWatch worktree and official source endpoints. This is a read-only Scout receipt; no product files or fixtures were changed.

## Official source review

### Digital Sansad

- Lok Sabha bills: <https://sansad.in/ls/legislation/bills>. The official UI exposes House, bill type, and search filters and displays bill number, title, ministry, member, introduction date/House, passage dates, status, Act, assent, Gazette, and committee-referral fields.
- The live bills request is `GET https://sansad.in/api_rs/legislation/getBills` with `loksabha`, `sessionNo`, House/ministry/type/category/status/date filters, `page`, `size`, `locale`, and sort parameters. A bounded `loksabha=18&sessionNo=5&page=1&size=5` request returned `_metadata.currentPageNumber=1`, `perPageSize=5`, `totalElements=15`, `totalPages=3`.
- The live bill record has a mixed completeness boundary: session-5 government bills had `billIntroducedBy: null` while the same response exposed House, ministry, dates, status, and official file links. The first implementation must preserve null attribution and must not infer an MP sponsor from a bill PDF or title.
- Lok Sabha questions: <https://sansad.in/ls/questions/questions-and-answers>. The official surface exposes House, Lok Sabha/session, member, ministry, question type, date, and text/file access. The page's current JavaScript uses page-number/page-size pagination and a total-record count for the modern Lok Sabha data path; older Lok Sabha data switches to PDL search.
- Session calendar: `GET https://sansad.in/api_ls/business/getAllLoksabhaAndSession?locale=en`. It returns Lok Sabha number, session number, session period, and sitting dates. Lok Sabha 18 currently has sessions 1-8; session 5 is a closed historical window (`21/07/2025 to 21/08/2025`). Session 8 is ongoing (`20/07/2026 to 13/08/2026`) and its `dates` array was empty in this response, so the pilot must not infer sitting dates from an empty array.
- Current member list: `GET https://sansad.in/api_ls/member?loksabha=18&page=1&size=10&sitting=1&locale=en`. The response reported 544 sitting members and exposes `mpsno`, name, party, state, constituency, status, `lsExpr`, and term count. A bounded candidate is Shri Mani A (`mpsno=5814`), DMK, Dharmapuri, Tamil Nadu, sitting in Lok Sabha 18, with `lsExpr=18`.
- Member identity: `GET https://sansad.in/api_ls/member/5814?locale=en` returned official name, party, constituency, state, House expression, biography fields, and source timestamps. Role history: `GET https://sansad.in/api_ls/member/positionHeld?mpCode=5814&locale=en` returned `June 2024 — Elected to 18th Lok Sabha` and `26-Sep-2024 onwards — Member, Committee on Labour, Textiles and Skill Development`.
- Member aggregate endpoints are useful evidence but not a replacement for the required breakdown: `question/participation` returned 125, `debate/participationInBills` returned 0, `committee/participation` returned 2, and `debate/participation` returned 4 for `mpsno=5814&loksabha=18`. The implementation must separately capture question rows to retain session, ministry, type, and official links.
- Attendance endpoint `GET https://sansad.in/api_ls/member/getMemberAttendanceByMpsno?loksabha=18&session=8&mpsno=5814` returned codes such as `S`, `NS`, `S*`, `S#`, `NS@`, and `NR`. The public attendance page describes the column as days the member signed the register, but the code legend and treatment are not sufficiently documented by the source review for this pilot. Attendance stays explicitly missing rather than being presented as a performance metric.
- Digital Sansad policy: <https://sansad.in/rs/privacyPolicy>. It says the portal is jointly designed, developed, and maintained by Parliament of India and NIC; direct linking is permitted, pages must not be framed, and portal contents may not be reproduced partially or fully without permission. The pilot should therefore publish normalized aggregates, provenance, and official links only; raw PDFs, bulk search results, and source HTML remain internal.

### Parliament Digital Library

- About/collection scope: <https://eparlib.sansad.in/about_us.jsp> and <https://eparlib.sansad.in/>. The portal is the official Lok Sabha document library with debates, questions and answers, committee reports, bulletins, and publications; it supports collection/member/title/date/type/ministry filtering.
- PDL search uses DSpace-style `simple-search` and collection APIs with explicit pagination. The official help/search examples show `rpp` and `start` controls; the current question page's legacy path uses collection `3` and `start=rows*(page-1)` style retrieval. Capture must preserve request URL, collection, filters, page, row count, and returned total rather than assuming one response is complete.
- PDL copyright policy: <https://eparlib.sansad.in/help/copyright-policy.jsp>. It permits reproduction for non-commercial research, private study, criticism, review, and news reporting with attribution, while other reuse requires permission. The debates collection is stricter: <https://eparlib.sansad.in/handle/123456789/6> says reproduction requires permission of the Speaker, Lok Sabha. This is not clearance for public bulk redistribution; the pilot remains internal and stores only bounded, non-public fixture material where needed.
- PDL data is historical and its coverage differs from current Digital Sansad. The PDL about page describes digitized historical/debate and questions collections, while current Lok Sabha 18 identity/activity records are served by Digital Sansad APIs. The vertical must store the source system and collection for each evidence item; it must not merge records across portals without explicit identity and time-bound provenance.

## Timestamp, session, identity, and fixture decisions

- Keep `capturedAt` as the local UTC capture instant and preserve raw source timestamp strings. Bill dates such as `2025-08-20 00:00:00.0` have no timezone; normalize them as source calendar dates, not invented instants.
- Use closed Lok Sabha 18 Session 5 as the first historical fixture window. It has a defined official period and a bounded 15-record bill result set; avoid the ongoing Session 8 until the source returns complete session-date metadata.
- Use Shri Mani A / `mpsno=5814` for the first time-bounded profile, subject to the Worker confirming the question-row endpoint and source completeness. Identity fields are official-source facts; party, constituency, House, and role dates must carry separate evidence links.
- Treat `billIntroducedBy=null`, absent question fields, absent committee dates, and undocumented attendance codes as missing data. No sponsor, attendance, competence, or policy-quality inference is allowed.

## Repository seams and verification

- Existing typed contracts are in `src/domain/`; capture, candidate, and published schemas already use Zod and explicit missing/quality metadata.
- Existing pipeline seams are `src/ingest/`, `src/extract/`, `src/normalize/`, `src/services/`, `src/storage/`, and `src/dev/operator-ops.ts`. `src/services/published-snapshot-service.ts` already implements fetch, inspect, publish, replay, and rollback against PostgreSQL plus S3 artifact metadata.
- Existing persistence is migration-backed PostgreSQL (`runs`, `run_artifacts`, `published_snapshots`, `publication_history`) with scope identity in `src/db/migrations/002_scope_identity.sql`. The parliamentary vertical should add a distinct scope identity rather than overload state-code semantics.
- Existing trust boundary is documented in `docs/PUBLIC_DATA_EXPOSURE_POLICY.md`, `docs/STORAGE_AND_OPERATIONS.md`, and `docs/OPERATING_EVIDENCE.md`: raw captures and candidates stay internal; published read models carry source date, publication date, methodology version, freshness/quality, and attribution; replay and rollback need durable IDs and evidence.
- Gate commands owned by this goal should include `npm run check:types`, targeted `npm test -- ...`, `npm run test:persistent` for the real local stack, and a new local parliamentary fixture/demo command selected by the Judge. The existing `npm test`, `npm run build`, and judiciary suites remain regression gates.

## Recommended next package

Implement one bounded foundation package: add a parliamentary scope identity, official-source evidence envelope, Lok Sabha 18 Session 5 fixture manifest for bills plus one MP identity/role/activity sample, and Zod contracts for person, office/role, party/constituency, legislative activity, source evidence, candidate, and published snapshot. Keep source file links as citations and raw response/PDF bodies internal. The Judge must choose exact paths and verification commands before a Worker writes.

## Explicit blockers before public beta

1. Confirm the current Digital Sansad question search endpoint and pagination envelope for Lok Sabha 18, including a deterministic session/ministry/type breakdown.
2. Confirm whether normalized parliamentary aggregates and official links are acceptable for the intended internal/public boundary; do not treat portal linking permission as reproduction permission.
3. Resolve source terms for any bulk capture or redistribution, especially PDL debate/question documents and bill PDFs.
4. Document identity reconciliation between Digital Sansad member codes, PDL member labels, and historical terms before expanding beyond the bounded MP.
5. Keep attendance out until the official code definitions and scope are captured in source evidence.

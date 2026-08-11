# Confirmed Digital Sansad question source evidence

The official Digital Sansad questions page bundle was inspected on `2026-08-11`. It identifies the modern Lok Sabha question endpoint as:

```text
GET https://sansad.in/api_ls/question/qetFilteredQuestionsAns
```

The page bundle passes these pagination and filter parameters for Lok Sabha 13 and later:

```text
loksabhaNo=18
sessionNumber=5
pageNo=1
pageSize=100
locale=en
memberCode=5814
```

The response was HTTP 200 with an array envelope. The first object contained `listOfQuestions` and `totalRecordSize: 20`; `listOfQuestions.length` was 20. Every observed row had `lokNo: "18"`, `sessionNo: "5"`, `member: ["Shri Mani A"]`, a date inside `2025-07-21` through `2025-08-21`, a ministry, `type: "UNSTARRED"`, question number, subject, and an official `sansad.in/getFile/...` link.

The fixture stores those 20 normalized rows and official links only. It does not store question PDF bytes or the unfiltered 5,248-row Session 5 result. The separate member participation endpoint still reports 125 at Lok Sabha 18 scope; that value remains explicitly distinct from the 20 Session 5 rows.

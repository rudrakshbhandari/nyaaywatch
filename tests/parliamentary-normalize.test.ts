import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { FixtureParliamentarySourceClient } from "../src/ingest/parliamentary-source-client.js";
import { buildParliamentarySnapshotCandidate } from "../src/normalize/parliamentary-snapshot.js";

const fixtureClient = new FixtureParliamentarySourceClient(join(process.cwd(), "fixtures/parliament"));

describe("parliamentary snapshot normalization", () => {
  it("creates a deterministic, lineage-linked aggregate and MP profile", async () => {
    const capture = await fixtureClient.capture();
    const first = buildParliamentarySnapshotCandidate(capture);
    const second = buildParliamentarySnapshotCandidate(capture);

    expect(first).toEqual(second);
    expect(first.metadata.scopeId).toBe("ls-18-session-5");
    expect(first.metadata.lineageId).toBe(capture.captureId);
    expect(first.metadata.referenceDateAt).toBe("2025-08-21T00:00:00.000Z");
    expect(first.metadata.referenceDateKind).toBe("source_session_end_date");
    expect(first.metadata.qualityState).toBe("partial");
    expect(first.aggregate.activity.bills).toEqual({
      recordCount: 15,
      uniqueBillCount: 14,
      captureStatus: "complete",
      attributedToMemberCount: null,
      attributionStatus: "not_published_by_source",
    });
    expect(first.aggregate.activity.scope).toBe("house_session");
    expect(first.aggregate.activity.questions).toMatchObject({
      sessionScopedCount: null,
      sourceReportedCount: null,
      sourceReportedScope: "not_available",
      breakdownStatus: "not_captured",
    });
    expect(first.aggregate.activity.debateParticipationCount).toBeNull();
    expect(first.aggregate.activity.committeeParticipationCount).toBeNull();
    expect(first.aggregate.missingData).toEqual([
      "house-session-question-coverage-not-captured",
      "attendance-not-published-official-code-legend-unverified",
    ]);
    expect(first.aggregate.activity.attendanceStatus).toBe("not_published");
    expect(first.profiles).toHaveLength(1);
    expect(first.profiles[0]?.person.personId).toBe("mp-5814");
    expect(first.profiles[0]?.activity.scope).toBe("member_session");
    expect(first.profiles[0]?.activity.bills).toMatchObject({
      recordCount: null,
      uniqueBillCount: null,
      captureStatus: "complete",
      attributedToMemberCount: 0,
      attributionStatus: "not_published_by_source",
    });
    expect(first.profiles[0]?.activity.questions).toMatchObject({
      sessionScopedCount: 20,
      sourceReportedCount: 125,
      sourceReportedScope: "lok_sabha",
      breakdownStatus: "captured",
    });
    expect(first.profiles[0]?.activity.debateParticipationScope).toBe("lok_sabha");
    expect(first.profiles[0]?.activity.committeeParticipationScope).toBe("lok_sabha");
    expect(first.profiles[0]?.missingData).toEqual([
      "source-question-aggregate-not-session-scoped",
      "bill-attribution-not-published-by-source",
      "attendance-not-published-official-code-legend-unverified",
    ]);
    expect(first).not.toHaveProperty("ranking");
    expect(first).not.toHaveProperty("score");
    expect(first).not.toHaveProperty("ideology");
  });

  it("flags incomplete question captures before deriving member counts", async () => {
    const capture = await fixtureClient.capture();
    capture.sourceResultTotals.questionRecords = capture.questions.length + 1;

    const candidate = buildParliamentarySnapshotCandidate(capture);

    expect(candidate.profiles[0]?.activity.questions.sessionScopedCount).toBeNull();
    expect(candidate.profiles[0]?.activity.questions.breakdownStatus).toBe("incomplete");
    expect(candidate.profiles[0]?.missingData).toContain("question-result-incomplete");
  });

  it("does not treat an unknown question total as a complete result", async () => {
    const capture = await fixtureClient.capture();
    capture.sourceResultTotals.questionRecords = null;

    const candidate = buildParliamentarySnapshotCandidate(capture);

    expect(candidate.profiles[0]?.activity.questions.sessionScopedCount).toBeNull();
    expect(candidate.profiles[0]?.activity.questions.breakdownStatus).toBe("unverified");
    expect(candidate.profiles[0]?.missingData).toContain("question-result-unverified-total");
  });

  it("does not publish bill counts when the declared result total is incomplete or unknown", async () => {
    const incompleteCapture = await fixtureClient.capture();
    incompleteCapture.sourceResultTotals.billRecords = incompleteCapture.bills.length + 1;
    const incomplete = buildParliamentarySnapshotCandidate(incompleteCapture);
    expect(incomplete.aggregate.activity.bills.recordCount).toBeNull();
    expect(incomplete.aggregate.activity.bills.captureStatus).toBe("incomplete");
    expect(incomplete.aggregate.missingData).toContain("house-session-bill-result-incomplete");

    const unverifiedCapture = await fixtureClient.capture();
    unverifiedCapture.sourceResultTotals.billRecords = null;
    const unverified = buildParliamentarySnapshotCandidate(unverifiedCapture);
    expect(unverified.aggregate.activity.bills.uniqueBillCount).toBeNull();
    expect(unverified.aggregate.activity.bills.captureStatus).toBe("unverified");
    expect(unverified.aggregate.missingData).toContain("house-session-bill-result-unverified-total");
  });

  it("rejects question rows outside the declared House, session, or member scope", async () => {
    const capture = await fixtureClient.capture();
    const question = capture.questions[0];
    if (!question) throw new Error("Fixture question missing");
    question.sessionNumber = 4;

    expect(() => buildParliamentarySnapshotCandidate(capture)).toThrow(/outside the declared capture scope/);
  });

  it("rejects bill rows outside the declared House or session scope", async () => {
    const capture = await fixtureClient.capture();
    const bill = capture.bills[0];
    if (!bill) throw new Error("Fixture bill missing");
    bill.sessionNumber = 4;

    expect(() => buildParliamentarySnapshotCandidate(capture)).toThrow(/bill rows are outside the declared capture scope/);
  });

  it("derives bill attribution status from source field coverage", async () => {
    const capture = await fixtureClient.capture();
    capture.bills = capture.bills.map((bill) => ({ ...bill, introducedByMemberId: "mp-other" }));

    const complete = buildParliamentarySnapshotCandidate(capture);
    expect(complete.profiles[0]?.activity.bills.attributedToMemberCount).toBe(0);
    expect(complete.profiles[0]?.activity.bills.attributionStatus).toBe("complete");

    capture.bills[0] = { ...capture.bills[0]!, introducedByMemberId: null };
    const partial = buildParliamentarySnapshotCandidate(capture);
    expect(partial.profiles[0]?.activity.bills.attributionStatus).toBe("partial");
  });
});

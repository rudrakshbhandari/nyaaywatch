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
      attributedToMemberCount: 0,
      attributionStatus: "not_published_by_source",
    });
    expect(first.aggregate.activity.questions).toMatchObject({
      sessionScopedCount: 20,
      sourceReportedCount: 125,
      sourceReportedScope: "lok_sabha",
      breakdownStatus: "captured",
    });
    expect(first.aggregate.activity.questions.bySession).toEqual([{ label: "Session 5", count: 20 }]);
    expect(first.aggregate.activity.questions.byType).toEqual([{ label: "UNSTARRED", count: 20 }]);
    expect(first.aggregate.activity.questions.byMinistry).toHaveLength(14);
    expect(first.aggregate.activity.attendanceStatus).toBe("not_published");
    expect(first.profiles).toHaveLength(1);
    expect(first.profiles[0]?.person.personId).toBe("mp-5814");
    expect(first.profiles[0]?.activity).toEqual(first.aggregate.activity);
    expect(first.profiles[0]?.missingData).toEqual(first.aggregate.missingData);
    expect(first.aggregate.missingData).toEqual([
      "source-question-aggregate-not-session-scoped",
      "bill-attribution-not-published-by-source",
      "attendance-not-published-official-code-legend-unverified",
    ]);
    expect(first).not.toHaveProperty("ranking");
    expect(first).not.toHaveProperty("score");
    expect(first).not.toHaveProperty("ideology");
  });
});

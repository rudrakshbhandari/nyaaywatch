import { describe, expect, it } from "vitest";

import { dedupeLineageByReferenceDate } from "../src/api/pages/lineage-dedup.js";

interface Entry {
  id: string;
  refDate: string;
  publishedAt: string;
  /**
   * ISO timestamp the row's *reference date* sorts by. Distinct from
   * `publishedAt` (the publication event time) so the test fixtures can
   * exercise both the within-group tiebreak and the outer ordering
   * independently — a backfilled row's `publishedAt` can be very recent
   * while its `refDateIso` sits far in the past.
   */
  refDateIso: string;
}

const opts = {
  referenceDateLabel: (e: Entry) => e.refDate,
  publicationTimestamp: (e: Entry) => e.publishedAt,
  referenceDateSortKey: (e: Entry) => e.refDateIso,
};

describe("dedupeLineageByReferenceDate", () => {
  it("returns one entry per reference date sorted newest first", () => {
    const input: Entry[] = [
      { id: "a", refDate: "25 April 2026", publishedAt: "2026-04-25T08:10:00Z", refDateIso: "2026-04-25T00:00:00Z" },
      { id: "b", refDate: "24 April 2026", publishedAt: "2026-04-24T08:10:00Z", refDateIso: "2026-04-24T00:00:00Z" },
      { id: "c", refDate: "23 April 2026", publishedAt: "2026-04-23T08:10:00Z", refDateIso: "2026-04-23T00:00:00Z" },
    ];

    expect(dedupeLineageByReferenceDate(input, opts).map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  it("re-sorts by reference date DESC even when input is shuffled by publication time", () => {
    // Mirrors the post-backfill case: late orphans (24 April) were published
    // after early orphans (21 April) in operator history, so DESC-by-publish
    // would interleave them. Output should still read newest-reference-date
    // first regardless of when the publish events fired.
    const input: Entry[] = [
      { id: "publish_21_today", refDate: "21 April 2026", publishedAt: "2026-04-25T21:00:00Z", refDateIso: "2026-04-21T00:00:00Z" },
      { id: "publish_24_today", refDate: "24 April 2026", publishedAt: "2026-04-25T21:30:00Z", refDateIso: "2026-04-24T00:00:00Z" },
      { id: "publish_22_today", refDate: "22 April 2026", publishedAt: "2026-04-25T21:15:00Z", refDateIso: "2026-04-22T00:00:00Z" },
    ];

    expect(dedupeLineageByReferenceDate(input, opts).map((e) => e.id)).toEqual([
      "publish_24_today",
      "publish_22_today",
      "publish_21_today",
    ]);
  });

  it("keeps the latest publication when the same reference date appears multiple times (DESC input)", () => {
    // Mirrors SC/HC where listPublicationHistory returns DESC by publication.createdAt.
    const iso = "2026-04-23T00:00:00Z";
    const input: Entry[] = [
      { id: "latest", refDate: "23 April 2026", publishedAt: "2026-04-23T18:00:00Z", refDateIso: iso },
      { id: "older", refDate: "23 April 2026", publishedAt: "2026-04-23T07:00:00Z", refDateIso: iso },
      { id: "oldest", refDate: "23 April 2026", publishedAt: "2026-04-23T03:00:00Z", refDateIso: iso },
    ];

    expect(dedupeLineageByReferenceDate(input, opts).map((e) => e.id)).toEqual(["latest"]);
  });

  it("keeps the latest publication when the same reference date appears multiple times (ASC input)", () => {
    // Mirrors the state lineage where loadHistoricalSnapshots returns ASC by sourceSnapshotAt.
    const iso = "2026-04-23T00:00:00Z";
    const input: Entry[] = [
      { id: "oldest", refDate: "23 April 2026", publishedAt: "2026-04-23T03:00:00Z", refDateIso: iso },
      { id: "older", refDate: "23 April 2026", publishedAt: "2026-04-23T07:00:00Z", refDateIso: iso },
      { id: "latest", refDate: "23 April 2026", publishedAt: "2026-04-23T18:00:00Z", refDateIso: iso },
    ];

    expect(dedupeLineageByReferenceDate(input, opts).map((e) => e.id)).toEqual(["latest"]);
  });

  it("collapses the noisy 19 April pattern (publish + rollback + publish) into a single row", () => {
    // Reproduces the screenshot: 19 April had multiple publish/rollback events. The
    // public lineage should only show the latest live publication for 19 April.
    const iso = "2026-04-19T00:00:00Z";
    const input: Entry[] = [
      { id: "rollback_late", refDate: "19 April 2026", publishedAt: "2026-04-19T07:07:03Z", refDateIso: iso },
      { id: "publish_2", refDate: "19 April 2026", publishedAt: "2026-04-19T07:06:42Z", refDateIso: iso },
      { id: "rollback_mid", refDate: "19 April 2026", publishedAt: "2026-04-19T06:42:16Z", refDateIso: iso },
      { id: "publish_1", refDate: "19 April 2026", publishedAt: "2026-04-19T06:41:34Z", refDateIso: iso },
    ];

    const result = dedupeLineageByReferenceDate(input, opts);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("rollback_late");
  });

  it("treats publicationTimestamp (not snapshot publishedAt) as the tiebreaker so rollbacks pick the actually-live entry", () => {
    // Reproduces the rollback scenario Codex flagged:
    //   publish A (snapshot_a, originally published T1)
    //   publish B (snapshot_b, originally published T2 > T1)
    //   rollback to A (new publication event at T3 > T2; snapshot.publishedAt is still T1)
    // The actually-live entry for that reference date is the rollback (back to A).
    // If we ranked by snapshot.publishedAt we'd wrongly keep B; ranking by
    // publication.createdAt (the rollback's timestamp) keeps the rollback entry.
    const iso = "2026-04-23T00:00:00Z";
    const input: Entry[] = [
      { id: "rollback_to_A", refDate: "23 April 2026", publishedAt: "2026-04-23T07:00:00Z", refDateIso: iso },
      { id: "publish_B", refDate: "23 April 2026", publishedAt: "2026-04-23T18:00:00Z", refDateIso: iso },
      { id: "publish_A", refDate: "23 April 2026", publishedAt: "2026-04-23T07:00:00Z", refDateIso: iso },
    ];

    const result = dedupeLineageByReferenceDate(input, {
      referenceDateLabel: (e) => e.refDate,
      referenceDateSortKey: (e) => e.refDateIso,
      publicationTimestamp: (e) =>
        e.id === "rollback_to_A" ? "2026-04-24T03:00:00Z" : // T3
        e.id === "publish_B" ? "2026-04-23T18:00:00Z" : // T2
        "2026-04-23T07:00:00Z", // T1 publish_A
    });

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("rollback_to_A");
  });

  it("returns an empty array for empty input", () => {
    expect(dedupeLineageByReferenceDate([], opts)).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const input: Entry[] = [
      { id: "a", refDate: "23 April 2026", publishedAt: "2026-04-23T08:00:00Z", refDateIso: "2026-04-23T00:00:00Z" },
      { id: "b", refDate: "23 April 2026", publishedAt: "2026-04-23T18:00:00Z", refDateIso: "2026-04-23T00:00:00Z" },
    ];
    const snapshot = JSON.stringify(input);

    dedupeLineageByReferenceDate(input, opts);

    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

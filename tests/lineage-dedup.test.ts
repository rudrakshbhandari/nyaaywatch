import { describe, expect, it } from "vitest";

import { dedupeLineageByReferenceDate } from "../src/api/pages/lineage-dedup.js";

interface Entry {
  id: string;
  refDate: string;
  publishedAt: string;
}

const opts = {
  referenceDateLabel: (e: Entry) => e.refDate,
  publicationTimestamp: (e: Entry) => e.publishedAt,
};

describe("dedupeLineageByReferenceDate", () => {
  it("returns the input unchanged when each reference date appears once", () => {
    const input: Entry[] = [
      { id: "a", refDate: "25 April 2026", publishedAt: "2026-04-25T08:10:00Z" },
      { id: "b", refDate: "24 April 2026", publishedAt: "2026-04-24T08:10:00Z" },
      { id: "c", refDate: "23 April 2026", publishedAt: "2026-04-23T08:10:00Z" },
    ];

    expect(dedupeLineageByReferenceDate(input, opts).map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  it("keeps the latest publication when the same reference date appears multiple times (DESC input)", () => {
    // Mirrors SC/HC where listPublicationHistory returns DESC by publication.createdAt.
    const input: Entry[] = [
      { id: "latest", refDate: "23 April 2026", publishedAt: "2026-04-23T18:00:00Z" },
      { id: "older", refDate: "23 April 2026", publishedAt: "2026-04-23T07:00:00Z" },
      { id: "oldest", refDate: "23 April 2026", publishedAt: "2026-04-23T03:00:00Z" },
    ];

    expect(dedupeLineageByReferenceDate(input, opts).map((e) => e.id)).toEqual(["latest"]);
  });

  it("keeps the latest publication when the same reference date appears multiple times (ASC input)", () => {
    // Mirrors the state lineage where loadHistoricalSnapshots returns ASC by sourceSnapshotAt.
    const input: Entry[] = [
      { id: "oldest", refDate: "23 April 2026", publishedAt: "2026-04-23T03:00:00Z" },
      { id: "older", refDate: "23 April 2026", publishedAt: "2026-04-23T07:00:00Z" },
      { id: "latest", refDate: "23 April 2026", publishedAt: "2026-04-23T18:00:00Z" },
    ];

    expect(dedupeLineageByReferenceDate(input, opts).map((e) => e.id)).toEqual(["latest"]);
  });

  it("preserves the original ordering of distinct reference dates", () => {
    const input: Entry[] = [
      { id: "a", refDate: "25 April 2026", publishedAt: "2026-04-25T08:00:00Z" },
      { id: "b1", refDate: "23 April 2026", publishedAt: "2026-04-23T18:00:00Z" },
      { id: "b2", refDate: "23 April 2026", publishedAt: "2026-04-23T07:00:00Z" },
      { id: "c", refDate: "19 April 2026", publishedAt: "2026-04-19T07:00:00Z" },
    ];

    expect(dedupeLineageByReferenceDate(input, opts).map((e) => e.id)).toEqual(["a", "b1", "c"]);
  });

  it("collapses the noisy 19 April pattern (publish + rollback + publish) into a single row", () => {
    // Reproduces the screenshot: 19 April had multiple publish/rollback events. The
    // public lineage should only show the latest live publication for 19 April.
    const input: Entry[] = [
      { id: "rollback_late", refDate: "19 April 2026", publishedAt: "2026-04-19T07:07:03Z" },
      { id: "publish_2", refDate: "19 April 2026", publishedAt: "2026-04-19T07:06:42Z" },
      { id: "rollback_mid", refDate: "19 April 2026", publishedAt: "2026-04-19T06:42:16Z" },
      { id: "publish_1", refDate: "19 April 2026", publishedAt: "2026-04-19T06:41:34Z" },
    ];

    const result = dedupeLineageByReferenceDate(input, opts);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("rollback_late");
  });

  it("returns an empty array for empty input", () => {
    expect(dedupeLineageByReferenceDate([], opts)).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const input: Entry[] = [
      { id: "a", refDate: "23 April 2026", publishedAt: "2026-04-23T08:00:00Z" },
      { id: "b", refDate: "23 April 2026", publishedAt: "2026-04-23T18:00:00Z" },
    ];
    const snapshot = JSON.stringify(input);

    dedupeLineageByReferenceDate(input, opts);

    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

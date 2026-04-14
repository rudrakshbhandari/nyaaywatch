import { describe, expect, it } from "vitest";

import { SnapshotRunSchema } from "../shared/src/contracts";
import validRun from "../warehouse/fixtures/runs/run-hp-2026-04-07.json";
import emptyRun from "../warehouse/fixtures/runs/run-hp-2026-04-10-empty.json";
import failedRun from "../warehouse/fixtures/runs/run-hp-2026-04-12-failed.json";
import { MemorySnapshotStore } from "../api/src/store/snapshot-store";
import { PublishService } from "../api/src/services/publish-service";

const parsedValidRun = SnapshotRunSchema.parse(validRun);
const parsedEmptyRun = SnapshotRunSchema.parse(emptyRun);
const parsedFailedRun = SnapshotRunSchema.parse(failedRun);

describe("PublishService", () => {
  it("publishes a completed Himachal run with evidence", async () => {
    const store = new MemorySnapshotStore([parsedValidRun]);
    const service = new PublishService(store, () => new Date("2026-04-14T00:00:00.000Z"));

    const result = await service.publish(parsedValidRun.runId);
    const state = await store.getPublishedState();

    expect(result.publishable).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(state.publishedRunId).toBe(parsedValidRun.runId);
  });

  it("blocks publish for empty runs", async () => {
    const store = new MemorySnapshotStore([parsedEmptyRun]);
    const service = new PublishService(store, () => new Date("2026-04-14T00:00:00.000Z"));

    const result = await service.publish(parsedEmptyRun.runId);

    expect(result.publishable).toBe(false);
    expect(result.reasons).toContain("Run summary has no pending cases to publish.");
    expect(result.reasons).toContain("Run has no district evidence rows.");
  });

  it("blocks publish for failed runs", async () => {
    const store = new MemorySnapshotStore([parsedFailedRun]);
    const service = new PublishService(store, () => new Date("2026-04-14T00:00:00.000Z"));

    const result = await service.publish(parsedFailedRun.runId);

    expect(result.publishable).toBe(false);
    expect(result.reasons).toContain("Run is not completed.");
  });
});

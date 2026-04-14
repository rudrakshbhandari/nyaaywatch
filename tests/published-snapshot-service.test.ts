import { afterEach, describe, expect, it } from "vitest";

import { createTestContext, seedTestSnapshot } from "./helpers.js";

describe("PublishedSnapshotService", () => {
  const pools: Array<{ end: () => Promise<void> }> = [];

  afterEach(async () => {
    while (pools.length > 0) {
      await pools.pop()?.end();
    }
  });

  it("captures a real-source fixture run, stores a candidate, and publishes it", async () => {
    const context = await createTestContext();
    pools.push(context.pool);

    const captured = await context.service.captureRun("Fixture capture");
    const statsBeforePublish = await context.service.getStats();

    expect(captured.run.status).toBe("completed");
    expect(captured.run.qualityState).toBe("complete");
    expect(captured.candidate?.stats.pendingCases).toBe(617086);
    expect(captured.candidate?.districts).toHaveLength(12);
    expect(captured.candidate?.districts[0]?.districtId).toBe("kullu");
    expect(captured.artifacts.map((artifact) => artifact.artifactType)).toEqual([
      "raw-njdg-html-bundle",
      "snapshot-candidate-json",
    ]);
    expect(statsBeforePublish).toBeNull();

    const published = await context.service.publishRun(captured.run.id, "Fixture publish");
    const stats = await context.service.getStats();
    const districts = await context.service.listDistricts();

    expect(published.run.status).toBe("published");
    expect(stats?.stats.pendingCases).toBe(617086);
    expect(districts?.districts[0]?.districtName).toBe("Kullu");
    expect(districts?.districts).toHaveLength(12);
  });

  it("blocks publish until a run is completed", async () => {
    const context = await createTestContext();
    pools.push(context.pool);

    await context.pool.query(
      `INSERT INTO runs (
        id, state_code, source_label, source_snapshot_at, methodology_version, status, quality_state, note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        "run_manual",
        "HP",
        "NJDG Himachal district dashboard",
        "2026-04-10T00:00:00.000Z",
        "2026.04-alpha",
        "pending",
        "partial",
        "Pending test run",
      ],
    );

    await expect(context.service.publishRun("run_manual")).rejects.toThrow("not ready to publish");
  });

  it("replays a published run from stored raw evidence and supports rollback", async () => {
    const context = await createTestContext();
    pools.push(context.pool);

    const seeded = await seedTestSnapshot(context.service);
    const replayed = await context.service.replayRun(seeded.run.id, "Replay test");
    const replayInspection = await context.service.inspectRun(replayed.run.id);
    const publicationsAfterReplay = await context.service.listPublications();

    expect(replayed.run.replayOfRunId).toBe(seeded.run.id);
    expect(replayed.run.status).toBe("replayed");
    expect(replayInspection?.artifacts.map((artifact) => artifact.artifactType)).toEqual([
      "raw-njdg-html-bundle",
      "snapshot-candidate-json",
    ]);
    expect(publicationsAfterReplay).toHaveLength(2);
    expect(publicationsAfterReplay[0]?.publishedSnapshotId).toBe(replayed.snapshot.id);

    const rollback = await context.service.rollbackPublication(seeded.publication.id, "Rollback test");
    const publicationsAfterRollback = await context.service.listPublications();
    const activeSnapshot = await context.service.getPublishedSnapshot();

    expect(rollback.action).toBe("rollback");
    expect(publicationsAfterRollback).toHaveLength(3);
    expect(activeSnapshot?.id).toBe(seeded.snapshot.id);
  });
});

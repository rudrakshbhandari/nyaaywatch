import { afterEach, describe, expect, it } from "vitest";

import { createTestContext, seedTestSnapshot } from "./helpers.js";

describe("PublishedSnapshotService", () => {
  const pools: Array<{ end: () => Promise<void> }> = [];

  afterEach(async () => {
    while (pools.length > 0) {
      await pools.pop()?.end();
    }
  });

  it("seeds and reads the latest published snapshot", async () => {
    const context = await createTestContext();
    pools.push(context.pool);

    const seeded = await seedTestSnapshot(context.service);
    const stats = await context.service.getStats();
    const districts = await context.service.listDistricts();
    const publications = await context.service.listPublications();

    expect(seeded.run.status).toBe("published");
    expect(stats?.stats.pendingCases).toBe(128340);
    expect(districts?.districts[0]?.districtId).toBe("kangra");
    expect(publications).toHaveLength(1);
  });

  it("replays a run into a new publication and supports rollback", async () => {
    const context = await createTestContext();
    pools.push(context.pool);

    const seeded = await seedTestSnapshot(context.service);
    const replayed = await context.service.replayRun(seeded.run.id, "Replay test");

    const publicationsAfterReplay = await context.service.listPublications();
    expect(replayed.run.replayOfRunId).toBe(seeded.run.id);
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

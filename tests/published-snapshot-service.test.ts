import { afterEach, describe, expect, it } from "vitest";

import { createScopedTestService, createTestContext, insertHistoricalPublishedSnapshot, seedTestSnapshot } from "./helpers.js";

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

    const history = await context.service.listPublicationHistory();
    expect(history[0]?.publication.id).toBe(rollback.id);
    expect(history[0]?.isActive).toBe(true);
    expect(history[0]?.snapshot.id).toBe(seeded.snapshot.id);
    expect(history[1]?.publication.id).toBe(replayed.publication.id);
  });

  it("derives district history, snapshot history, and CSV exports from published snapshots", async () => {
    const context = await createTestContext();
    pools.push(context.pool);

    await insertHistoricalPublishedSnapshot(context.pool, {
      runId: "run_old",
      snapshotId: "snapshot_old",
      publicationId: "publication_old",
      sourceSnapshotAt: "2026-03-31T00:00:00.000Z",
      publishedAt: "2026-04-01T09:00:00.000Z",
      methodologyVersion: "2026.03-alpha",
      districtOverrides: {
        kangra: {
          rank: 2,
          backlogCases: 22880,
          disposalRate: 87.1,
          medianAgeDays: 460,
          filingVsDisposalGap: 12.7,
        },
      },
    });
    await seedTestSnapshot(context.service);

    const detail = await context.service.getDistrictDetail("kangra");
    const history = await context.service.listSnapshotHistory();
    const statewideCsv = await context.service.renderDistrictCsv();
    const districtCsv = await context.service.renderDistrictHistoryCsv("kangra");

    expect(detail?.history).toHaveLength(2);
    expect(detail?.history[0]?.snapshotDate).toBe("2026-03-31T00:00:00.000Z");
    expect(detail?.history[1]?.snapshotDate).toBe("2026-04-10T00:00:00.000Z");
    expect(history).toHaveLength(2);
    expect(history[0]?.snapshot.methodologyVersion).toBe("2026.03-alpha");
    expect(statewideCsv).toContain("snapshot_date,published_at,methodology_version");
    expect(statewideCsv).toContain("summary");
    expect(districtCsv).toContain("2026-03-31T00:00:00.000Z");
    expect(districtCsv).toContain("2026-04-10T00:00:00.000Z");
  });

  it("can capture an internal Punjab trial without changing the public Himachal scope", async () => {
    const context = await createTestContext({ stateCode: "PB" });
    pools.push(context.pool);

    const captured = await context.service.captureRun("Punjab internal trial capture");

    expect(captured.run.stateCode).toBe("PB");
    expect(captured.candidate?.snapshot.stateCode).toBe("PB");
    expect(captured.candidate?.snapshot.stateName).toBe("Punjab");
    expect(captured.candidate?.districts).toHaveLength(22);
    expect(captured.candidate?.districts.some((district) => district.districtName === "Ludhiana")).toBe(true);
    expect(captured.candidate?.districts.some((district) => district.districtName === "Kangra")).toBe(false);
    expect(captured.artifacts.every((artifact) => artifact.s3Key.includes("/pb/"))).toBe(true);
  });

  it("keeps internal Punjab runs isolated from the Himachal-scoped service", async () => {
    const context = await createTestContext();
    pools.push(context.pool);

    const himachalService = createScopedTestService(context.pool, "HP");
    const punjabService = createScopedTestService(context.pool, "PB");
    const capturedPunjab = await punjabService.captureRun("Punjab isolation capture");
    const publishedPunjab = await punjabService.publishRun(capturedPunjab.run.id, "Punjab internal publish");

    await expect(himachalService.rollbackPublication(publishedPunjab.publication.id)).rejects.toThrow("does not belong to HP");
    await expect(himachalService.publishRun(capturedPunjab.run.id)).rejects.toThrow("was not found");
    expect(await himachalService.inspectRun(capturedPunjab.run.id)).toBeNull();
    expect(await himachalService.getPublishedSnapshot()).toBeNull();
    expect((await punjabService.getPublishedSnapshot())?.stateCode).toBe("PB");
  });
});

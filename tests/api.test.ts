import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import {
  createTestApp,
  createTestContext,
  insertHistoricalPublishedSnapshot,
  seedTestSnapshot,
} from "./helpers.js";

describe("HTTP routes", () => {
  const pools: Array<{ end: () => Promise<void> }> = [];

  afterEach(async () => {
    while (pools.length > 0) {
      await pools.pop()?.end();
    }
  });

  it("serves the public API and HTML from the latest published snapshot", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await insertHistoricalPublishedSnapshot(context.pool, {
      runId: "run_historical",
      snapshotId: "snapshot_historical",
      publicationId: "publication_historical",
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
          summary: "Kangra was already one of the strongest district signals in the prior published snapshot.",
        },
      },
    });
    await seedTestSnapshot(context.service);
    const app = createTestApp(context.config, context.service);

    const statsResponse = await request(app).get("/v1/stats/himachal");
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.stats.pendingCases).toBe(617086);

    const homepage = await request(app).get("/");
    expect(homepage.status).toBe(200);
    expect(homepage.text).toContain("Published snapshot");
    expect(homepage.text).toContain("Freshness and quality state");

    const districtsPage = await request(app).get("/districts?view=flagged&sort=gap&q=kang");
    expect(districtsPage.status).toBe(200);
    expect(districtsPage.text).toContain("District workspace");
    expect(districtsPage.text).toContain("Flagged signals only");
    expect(districtsPage.text).toContain("Kangra");

    const districtPage = await request(app).get("/districts/kangra");
    expect(districtPage.status).toBe(200);
    expect(districtPage.text).toContain("Published district history");
    expect(districtPage.text).toContain("/data/districts/kangra.csv");

    const dataPage = await request(app).get("/data");
    expect(dataPage.status).toBe(200);
    expect(dataPage.text).toContain("Data downloads");
    expect(dataPage.text).toContain("CSV/API parity");

    const districtCsv = await request(app).get("/data/districts.csv");
    expect(districtCsv.status).toBe(200);
    expect(districtCsv.text).toContain("snapshot_date,published_at,methodology_version");
    expect(districtCsv.text).toContain("National Judicial Data Grid public district dashboard for Himachal Pradesh");

    const districtHistoryCsv = await request(app).get("/data/districts/kangra.csv");
    expect(districtHistoryCsv.status).toBe(200);
    expect(districtHistoryCsv.text).toContain("2026-03-31T00:00:00.000Z");
    expect(districtHistoryCsv.text).toContain("2026-04-10T00:00:00.000Z");

    const methodologyPage = await request(app).get("/methodology");
    expect(methodologyPage.status).toBe(200);
    expect(methodologyPage.text).toContain("How the public metrics are derived");
    expect(methodologyPage.text).toContain("Published methodology and snapshot lineage");
  });

  it("protects operator endpoints and exposes fetch, publish, replay, and rollback flows", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    const app = createTestApp(context.config, context.service);

    const unauthorized = await request(app).get("/operator/publications");
    expect(unauthorized.status).toBe(401);

    const fetched = await request(app)
      .post("/operator/runs/fetch")
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN)
      .send({ note: "Fetch via HTTP" });

    expect(fetched.status).toBe(201);
    expect(fetched.body.run.status).toBe("completed");
    expect(fetched.body.candidate.stats.pendingCases).toBe(617086);

    const inspected = await request(app)
      .get(`/operator/runs/${fetched.body.run.id}`)
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN);

    expect(inspected.status).toBe(200);
    expect(inspected.body.run.id).toBe(fetched.body.run.id);

    const published = await request(app)
      .post(`/operator/runs/${fetched.body.run.id}/publish`)
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN)
      .send({ note: "Publish via HTTP" });

    expect(published.status).toBe(201);
    expect(published.body.run.status).toBe("published");

    const replay = await request(app)
      .post(`/operator/runs/${published.body.run.id}/replay`)
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN)
      .send({ note: "Replay via HTTP" });

    expect(replay.status).toBe(201);
    expect(replay.body.run.replayOfRunId).toBe(published.body.run.id);

    const rollback = await request(app)
      .post(`/operator/publications/${published.body.publication.id}/rollback`)
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN)
      .send({ note: "Rollback via HTTP" });

    expect(rollback.status).toBe(201);
    expect(rollback.body.action).toBe("rollback");
  });
});

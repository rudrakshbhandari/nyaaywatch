import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { createTestApp, createTestContext, seedTestSnapshot } from "./helpers.js";

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
    await seedTestSnapshot(context.service);
    const app = createTestApp(context.config, context.service);

    const statsResponse = await request(app).get("/v1/stats/himachal");
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.stats.pendingCases).toBe(128340);

    const homepage = await request(app).get("/");
    expect(homepage.status).toBe(200);
    expect(homepage.text).toContain("Published snapshot");

    const districtPage = await request(app).get("/districts/kangra");
    expect(districtPage.status).toBe(200);
    expect(districtPage.text).toContain("Kangra");
  });

  it("protects operator endpoints and exposes replay/rollback flows", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    const seeded = await seedTestSnapshot(context.service);
    const app = createTestApp(context.config, context.service);

    const unauthorized = await request(app).get("/operator/publications");
    expect(unauthorized.status).toBe(401);

    const replay = await request(app)
      .post(`/operator/runs/${seeded.run.id}/replay`)
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN)
      .send({ note: "Replay via HTTP" });

    expect(replay.status).toBe(201);
    expect(replay.body.run.replayOfRunId).toBe(seeded.run.id);

    const rollback = await request(app)
      .post(`/operator/publications/${seeded.publication.id}/rollback`)
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN)
      .send({ note: "Rollback via HTTP" });

    expect(rollback.status).toBe(201);
    expect(rollback.body.action).toBe("rollback");
  });
});

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
    expect(statsResponse.body.stats.pendingCases).toBe(617086);

    const homepage = await request(app).get("/");
    expect(homepage.status).toBe(200);
    expect(homepage.text).toContain("Published snapshot");

    const districtPage = await request(app).get("/districts/kangra");
    expect(districtPage.status).toBe(200);
    expect(districtPage.text).toContain("Kangra");
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

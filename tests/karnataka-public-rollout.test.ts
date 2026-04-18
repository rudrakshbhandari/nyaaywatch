import { createServer, type Server } from "node:http";

import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { verifyPublicRelease } from "../src/dev/release-verification.js";
import { buildKarnatakaTestSnapshot, createTestApp, createTestContext, insertPublishedSnapshot, seedTestSnapshot } from "./helpers.js";

describe("Karnataka public rollout preflight", () => {
  const pools: Array<{ end: () => Promise<void> }> = [];
  const servers: Server[] = [];

  afterEach(async () => {
    while (servers.length > 0) {
      await new Promise<void>((resolve, reject) => {
        const server = servers.pop();
        server?.close((error) => (error ? reject(error) : resolve()));
      });
    }

    while (pools.length > 0) {
      await pools.pop()?.end();
    }
  });

  async function createKarnatakaPublicApp() {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    await insertPublishedSnapshot(context.pool, {
      runId: "run_ka_public",
      snapshotId: "snapshot_ka_public",
      publicationId: "publication_ka_public",
      stateCode: "KA",
      payload: buildKarnatakaTestSnapshot(),
    });

    return createTestApp(context.config, context.service, context.publicServices);
  }

  it("serves explicit Karnataka public routes once Karnataka has a published snapshot", async () => {
    const app = await createKarnatakaPublicApp();

    const homepage = await request(app).get("/");
    expect(homepage.status).toBe(200);
    expect(homepage.text).toContain("Karnataka");

    const overview = await request(app).get("/states/karnataka");
    expect(overview.status).toBe(200);
    expect(overview.text).toContain("How long is the wait for justice in Karnataka?");

    const districts = await request(app).get("/states/karnataka/districts?view=flagged");
    expect(districts.status).toBe(200);
    expect(districts.text).toContain("Belagavi");
    expect(districts.text).toContain("/states/karnataka/data/districts.csv");

    const districtPage = await request(app).get("/states/karnataka/districts/belagavi");
    expect(districtPage.status).toBe(200);
    expect(districtPage.text).toContain("/states/karnataka/data/districts/belagavi.csv");

    const apiPage = await request(app).get("/states/karnataka/api");
    expect(apiPage.status).toBe(200);
    expect(apiPage.text).toContain("/v1/states/karnataka/districts");
  });

  it("keeps Karnataka API contracts stable on the public state-scoped URLs", async () => {
    const app = await createKarnatakaPublicApp();

    const statsResponse = await request(app).get("/v1/states/karnataka/stats");
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.snapshot.stateCode).toBe("KA");
    expect(statsResponse.body.snapshot.stateName).toBe("Karnataka");
    expect(statsResponse.body.stats.pendingCases).toBe(2230354);

    const districtsResponse = await request(app).get("/v1/states/karnataka/districts");
    expect(districtsResponse.status).toBe(200);
    expect(districtsResponse.body.snapshot.stateCode).toBe("KA");
    expect(districtsResponse.body.districts).toHaveLength(3);
    expect(districtsResponse.body.districts[0]?.districtId).toBe("belagavi");

    const trendsResponse = await request(app).get("/v1/states/karnataka/trends");
    expect(trendsResponse.status).toBe(200);
    expect(trendsResponse.body.snapshot.stateCode).toBe("KA");
    expect(trendsResponse.body.trends[0]?.pendingCases).toBe(2230354);
  });

  it("keeps Karnataka public copy inside the same trust posture", async () => {
    const app = await createKarnatakaPublicApp();

    const routes = [
      { path: "/states/karnataka", requiredText: "All numbers on this site come from the NJDG public district dashboards" },
      { path: "/states/karnataka/districts", requiredText: "Scan the districts under the most pressure." },
      {
        path: "/states/karnataka/districts/belagavi",
        requiredText: "do not assign responsibility, explain intent, or guarantee that upstream court records have already refreshed",
      },
      { path: "/states/karnataka/data", requiredText: "Raw capture bundles and operator evidence artifacts stay outside the public download boundary" },
      { path: "/states/karnataka/methodology", requiredText: "publishes dated aggregates after operator review" },
      { path: "/states/karnataka/api", requiredText: "latest published snapshot" },
    ] as const;

    for (const route of routes) {
      const response = await request(app).get(route.path);
      expect(response.status, route.path).toBe(200);
      expect(response.text, route.path).toContain(route.requiredText);
      expect(response.text, `${route.path} should not mention live dashboards`).not.toMatch(/\blive (?:feed|status|data|dashboard|monitoring)\b/i);
      expect(response.text, `${route.path} should not mention predictive claims`).not.toMatch(/\bpredictive\b/i);
      expect(response.text, `${route.path} should not mention verdicts`).not.toMatch(/\bverdicts?\b/i);
    }
  });

  it("passes release verification for Karnataka once the state-scoped public routes exist", async () => {
    const app = await createKarnatakaPublicApp();
    const server = createServer(app);
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an ephemeral TCP port.");
    }

    const result = await verifyPublicRelease(`http://127.0.0.1:${address.port}`, { stateSlug: "karnataka" });

    expect(result.target.stateCode).toBe("KA");
    expect(result.target.stateSlug).toBe("karnataka");
    expect(result.snapshot.methodologyVersion).toBe("2026.04-alpha");
    expect(result.districtCount).toBe(3);
    expect(result.trendCount).toBeGreaterThan(0);
    expect(result.csvMetadataParity).toBe(true);
    expect(result.publicDataCacheProtected).toBe(true);
  });
});

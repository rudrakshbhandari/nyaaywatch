import { createServer, type Server } from "node:http";

import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { verifyPublicRelease } from "../src/dev/release-verification.js";
import { createTestApp, createTestContext, insertPublishedSnapshot, seedTestSnapshot } from "./helpers.js";
import { buildArunachalPradeshTestSnapshot } from "./arunachal-pradesh-test-snapshot.js";

describe("Arunachal Pradesh public rollout preflight", () => {
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

  async function createArunachalPradeshPublicApp() {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    await insertPublishedSnapshot(context.pool, {
      runId: "run_ar_public",
      snapshotId: "snapshot_ar_public",
      publicationId: "publication_ar_public",
      stateCode: "AR",
      payload: buildArunachalPradeshTestSnapshot(),
    });

    return createTestApp(context.config, context.service, context.publicServices);
  }

  it("serves explicit Arunachal Pradesh public routes once Arunachal Pradesh has a published snapshot", async () => {
    const app = await createArunachalPradeshPublicApp();

    const homepage = await request(app).get("/");
    expect(homepage.status).toBe(200);
    expect(homepage.text).toContain("Arunachal Pradesh");

    const overview = await request(app).get("/states/arunachal-pradesh");
    expect(overview.status).toBe(200);
    expect(overview.text).toContain("How long is the wait for justice in Arunachal Pradesh?");

    const districts = await request(app).get("/states/arunachal-pradesh/districts?view=flagged");
    expect(districts.status).toBe(200);
    expect(districts.text).toContain("Lohit");
    expect(districts.text).toContain("/states/arunachal-pradesh/data/districts.csv");

    const districtPage = await request(app).get("/states/arunachal-pradesh/districts/lohit");
    expect(districtPage.status).toBe(200);
    expect(districtPage.text).toContain("/states/arunachal-pradesh/data/districts/lohit.csv");

    const apiPage = await request(app).get("/states/arunachal-pradesh/api");
    expect(apiPage.status).toBe(200);
    expect(apiPage.text).toContain("/v1/states/arunachal-pradesh/districts");
  });

  it("keeps Arunachal Pradesh API contracts stable on the public state-scoped URLs", async () => {
    const app = await createArunachalPradeshPublicApp();

    const statsResponse = await request(app).get("/v1/states/arunachal-pradesh/stats");
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.snapshot.stateCode).toBe("AR");
    expect(statsResponse.body.snapshot.stateName).toBe("Arunachal Pradesh");
    expect(statsResponse.body.stats.pendingCases).toBe(15539);

    const districtsResponse = await request(app).get("/v1/states/arunachal-pradesh/districts");
    expect(districtsResponse.status).toBe(200);
    expect(districtsResponse.body.snapshot.stateCode).toBe("AR");
    expect(districtsResponse.body.districts).toHaveLength(3);
    expect(districtsResponse.body.districts[0]?.districtId).toBe("lohit");

    const trendsResponse = await request(app).get("/v1/states/arunachal-pradesh/trends");
    expect(trendsResponse.status).toBe(200);
    expect(trendsResponse.body.snapshot.stateCode).toBe("AR");
    expect(trendsResponse.body.trends[0]?.pendingCases).toBe(15539);
  });

  it("keeps Arunachal Pradesh public copy inside the same trust posture", async () => {
    const app = await createArunachalPradeshPublicApp();

    const routes = [
      { path: "/states/arunachal-pradesh", requiredText: "All numbers on this site come from the NJDG public district dashboards" },
      { path: "/states/arunachal-pradesh/districts", requiredText: "Scan the districts under the most pressure." },
      {
        path: "/states/arunachal-pradesh/districts/lohit",
        requiredText: "do not assign responsibility, explain intent, or guarantee that upstream court records have already refreshed",
      },
      {
        path: "/states/arunachal-pradesh/data",
        requiredText: "Raw capture bundles and operator evidence artifacts stay outside the public download boundary",
      },
      { path: "/states/arunachal-pradesh/methodology", requiredText: "publishes dated aggregates after operator review" },
      { path: "/states/arunachal-pradesh/api", requiredText: "currently on the public site" },
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

  it("passes release verification for Arunachal Pradesh once the state-scoped public routes exist", async () => {
    const app = await createArunachalPradeshPublicApp();
    const server = createServer(app);
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an ephemeral TCP port.");
    }

    const result = await verifyPublicRelease(`http://127.0.0.1:${address.port}`, { stateSlug: "arunachal-pradesh" });

    expect(result.target.stateCode).toBe("AR");
    expect(result.target.stateSlug).toBe("arunachal-pradesh");
    expect(result.snapshot.methodologyVersion).toBe("2026.04-alpha");
    expect(result.districtCount).toBe(3);
    expect(result.trendCount).toBeGreaterThan(0);
    expect(result.csvMetadataParity).toBe(true);
    expect(result.publicDataCacheProtected).toBe(true);
  });
});

import { createServer, type Server } from "node:http";

import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { verifyPublicRelease } from "../src/dev/release-verification.js";
import { buildHaryanaTestSnapshot, createTestApp, createTestContext, insertPublishedSnapshot, seedTestSnapshot } from "./helpers.js";

describe("Haryana public rollout preflight", () => {
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

  async function createHaryanaPublicApp() {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    await insertPublishedSnapshot(context.pool, {
      runId: "run_hr_public",
      snapshotId: "snapshot_hr_public",
      publicationId: "publication_hr_public",
      stateCode: "HR",
      payload: buildHaryanaTestSnapshot(),
    });

    return createTestApp(context.config, context.service, context.publicServices);
  }

  it("serves explicit Haryana public routes once Haryana has a published snapshot", async () => {
    const app = await createHaryanaPublicApp();

    const homepage = await request(app).get("/");
    expect(homepage.status).toBe(200);
    expect(homepage.text).toContain("Haryana");

    const haryanaOverview = await request(app).get("/states/haryana");
    expect(haryanaOverview.status).toBe(200);
    expect(haryanaOverview.text).toContain("How long is the wait for justice in Haryana?");

    const haryanaDistricts = await request(app).get("/states/haryana/districts?view=flagged");
    expect(haryanaDistricts.status).toBe(200);
    expect(haryanaDistricts.text).toContain("Faridabad");
    expect(haryanaDistricts.text).toContain("/states/haryana/data/districts.csv");

    const haryanaDistrictPage = await request(app).get("/states/haryana/districts/faridabad");
    expect(haryanaDistrictPage.status).toBe(200);
    expect(haryanaDistrictPage.text).toContain("/states/haryana/data/districts/faridabad.csv");

    const haryanaApiPage = await request(app).get("/states/haryana/api");
    expect(haryanaApiPage.status).toBe(200);
    expect(haryanaApiPage.text).toContain("/v1/states/haryana/districts");
  });

  it("keeps Haryana API contracts stable on the public state-scoped URLs", async () => {
    const app = await createHaryanaPublicApp();

    const statsResponse = await request(app).get("/v1/states/haryana/stats");
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.snapshot.stateCode).toBe("HR");
    expect(statsResponse.body.snapshot.stateName).toBe("Haryana");
    expect(statsResponse.body.stats.pendingCases).toBe(1509969);

    const districtsResponse = await request(app).get("/v1/states/haryana/districts");
    expect(districtsResponse.status).toBe(200);
    expect(districtsResponse.body.snapshot.stateCode).toBe("HR");
    expect(districtsResponse.body.districts).toHaveLength(3);
    expect(districtsResponse.body.districts[0]?.districtId).toBe("faridabad");

    const trendsResponse = await request(app).get("/v1/states/haryana/trends");
    expect(trendsResponse.status).toBe(200);
    expect(trendsResponse.body.snapshot.stateCode).toBe("HR");
    expect(trendsResponse.body.trends[0]?.pendingCases).toBe(1509969);
  });

  it("keeps Haryana public copy inside the same trust posture", async () => {
    const app = await createHaryanaPublicApp();

    const routes = [
      { path: "/states/haryana", requiredText: "All numbers on this site come from the NJDG public district dashboards" },
      { path: "/states/haryana/districts", requiredText: "Scan the districts under the most pressure." },
      {
        path: "/states/haryana/districts/faridabad",
        requiredText: "do not assign responsibility, explain intent, or guarantee that upstream court records have already refreshed",
      },
      { path: "/states/haryana/data", requiredText: "Raw capture bundles and operator evidence artifacts stay outside the public download boundary" },
      { path: "/states/haryana/methodology", requiredText: "publishes dated aggregates after operator review" },
      { path: "/states/haryana/api", requiredText: "latest published snapshot" },
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

  it("passes release verification for Haryana once the state-scoped public routes exist", async () => {
    const app = await createHaryanaPublicApp();
    const server = createServer(app);
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an ephemeral TCP port.");
    }

    const result = await verifyPublicRelease(`http://127.0.0.1:${address.port}`, { stateSlug: "haryana" });

    expect(result.target.stateCode).toBe("HR");
    expect(result.target.stateSlug).toBe("haryana");
    expect(result.snapshot.methodologyVersion).toBe("2026.04-alpha");
    expect(result.districtCount).toBe(3);
    expect(result.trendCount).toBeGreaterThan(0);
    expect(result.csvMetadataParity).toBe(true);
    expect(result.publicDataCacheProtected).toBe(true);
  });
});

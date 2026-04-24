import { createServer, type Server } from "node:http";

import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { verifyPublicRelease } from "../src/dev/release-verification.js";
import { buildMeghalayaTestSnapshot, createTestApp, createTestContext, insertPublishedSnapshot, seedTestSnapshot } from "./helpers.js";

describe("Meghalaya public rollout preflight", () => {
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

  async function createMeghalayaPublicApp() {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    await insertPublishedSnapshot(context.pool, {
      runId: "run_ml_public",
      snapshotId: "snapshot_ml_public",
      publicationId: "publication_ml_public",
      stateCode: "ML",
      payload: buildMeghalayaTestSnapshot(),
    });

    return createTestApp(context.config, context.service, context.publicServices);
  }

  it("serves explicit Meghalaya public routes once Meghalaya has a published snapshot", async () => {
    const app = await createMeghalayaPublicApp();

    const homepage = await request(app).get("/");
    expect(homepage.status).toBe(200);
    expect(homepage.text).toContain("Meghalaya");

    const overview = await request(app).get("/states/meghalaya");
    expect(overview.status).toBe(200);
    expect(overview.text).toContain("How long is the wait for justice in Meghalaya?");

    const districts = await request(app).get("/states/meghalaya/districts?view=flagged");
    expect(districts.status).toBe(200);
    expect(districts.text).toContain("East Khasi Hills");
    expect(districts.text).toContain("/states/meghalaya/data/districts.csv");

    const districtPage = await request(app).get("/states/meghalaya/districts/east-khasi-hills");
    expect(districtPage.status).toBe(200);
    expect(districtPage.text).toContain("/states/meghalaya/data/districts/east-khasi-hills.csv");

    const apiPage = await request(app).get("/states/meghalaya/api");
    expect(apiPage.status).toBe(200);
    expect(apiPage.text).toContain("/v1/states/meghalaya/districts");
  });

  it("keeps Meghalaya API contracts stable on the public state-scoped URLs", async () => {
    const app = await createMeghalayaPublicApp();

    const statsResponse = await request(app).get("/v1/states/meghalaya/stats");
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.snapshot.stateCode).toBe("ML");
    expect(statsResponse.body.snapshot.stateName).toBe("Meghalaya");
    expect(statsResponse.body.stats.pendingCases).toBe(18450);

    const districtsResponse = await request(app).get("/v1/states/meghalaya/districts");
    expect(districtsResponse.status).toBe(200);
    expect(districtsResponse.body.snapshot.stateCode).toBe("ML");
    expect(districtsResponse.body.districts).toHaveLength(3);
    expect(districtsResponse.body.districts[0]?.districtId).toBe("east-khasi-hills");

    const trendsResponse = await request(app).get("/v1/states/meghalaya/trends");
    expect(trendsResponse.status).toBe(200);
    expect(trendsResponse.body.snapshot.stateCode).toBe("ML");
    expect(trendsResponse.body.trends[0]?.pendingCases).toBe(18450);
  });

  it("keeps Meghalaya public copy inside the same trust posture", async () => {
    const app = await createMeghalayaPublicApp();

    const routes = [
      { path: "/states/meghalaya", requiredText: "All numbers on this site come from the NJDG public district dashboards" },
      { path: "/states/meghalaya/districts", requiredText: "Scan the districts under the most pressure." },
      {
        path: "/states/meghalaya/districts/east-khasi-hills",
        requiredText: "do not assign responsibility, explain intent, or guarantee that upstream court records have already refreshed",
      },
      { path: "/states/meghalaya/data", requiredText: "Raw capture bundles and operator evidence artifacts stay outside the public download boundary" },
      { path: "/states/meghalaya/methodology", requiredText: "publishes dated aggregates after operator review" },
      { path: "/states/meghalaya/api", requiredText: "currently on the public site" },
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

  it("passes release verification for Meghalaya once the state-scoped public routes exist", async () => {
    const app = await createMeghalayaPublicApp();
    const server = createServer(app);
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an ephemeral TCP port.");
    }

    const result = await verifyPublicRelease(`http://127.0.0.1:${address.port}`, { stateSlug: "meghalaya" });

    expect(result.target.stateCode).toBe("ML");
    expect(result.target.stateSlug).toBe("meghalaya");
    expect(result.snapshot.methodologyVersion).toBe("2026.04-alpha");
    expect(result.districtCount).toBe(3);
    expect(result.trendCount).toBeGreaterThan(0);
    expect(result.csvMetadataParity).toBe(true);
    expect(result.publicDataCacheProtected).toBe(true);
  });
});

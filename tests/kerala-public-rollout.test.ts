import { createServer, type Server } from "node:http";

import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { verifyPublicRelease } from "../src/dev/release-verification.js";
import { buildKeralaTestSnapshot, createTestApp, createTestContext, insertPublishedSnapshot, seedTestSnapshot } from "./helpers.js";

describe("Kerala public rollout preflight", () => {
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

  async function createKeralaPublicApp() {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    await insertPublishedSnapshot(context.pool, {
      runId: "run_kl_public",
      snapshotId: "snapshot_kl_public",
      publicationId: "publication_kl_public",
      stateCode: "KL",
      payload: buildKeralaTestSnapshot(),
    });

    return createTestApp(context.config, context.service, context.publicServices);
  }

  it("serves explicit Kerala public routes once Kerala has a published snapshot", async () => {
    const app = await createKeralaPublicApp();

    const homepage = await request(app).get("/");
    expect(homepage.status).toBe(200);
    expect(homepage.text).toContain("Kerala");

    const overview = await request(app).get("/states/kerala");
    expect(overview.status).toBe(200);
    expect(overview.text).toContain("How long is the wait for justice in Kerala?");

    const districts = await request(app).get("/states/kerala/districts?view=flagged");
    expect(districts.status).toBe(200);
    expect(districts.text).toContain("Ernakulam");
    expect(districts.text).toContain("/states/kerala/data/districts.csv");

    const districtPage = await request(app).get("/states/kerala/districts/ernakulam");
    expect(districtPage.status).toBe(200);
    expect(districtPage.text).toContain("/states/kerala/data/districts/ernakulam.csv");

    const apiPage = await request(app).get("/states/kerala/api");
    expect(apiPage.status).toBe(200);
    expect(apiPage.text).toContain("/v1/states/kerala/districts");
  });

  it("keeps Kerala API contracts stable on the public state-scoped URLs", async () => {
    const app = await createKeralaPublicApp();

    const statsResponse = await request(app).get("/v1/states/kerala/stats");
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.snapshot.stateCode).toBe("KL");
    expect(statsResponse.body.snapshot.stateName).toBe("Kerala");
    expect(statsResponse.body.stats.pendingCases).toBe(1801417);

    const districtsResponse = await request(app).get("/v1/states/kerala/districts");
    expect(districtsResponse.status).toBe(200);
    expect(districtsResponse.body.snapshot.stateCode).toBe("KL");
    expect(districtsResponse.body.districts).toHaveLength(3);
    expect(districtsResponse.body.districts[0]?.districtId).toBe("ernakulam");

    const trendsResponse = await request(app).get("/v1/states/kerala/trends");
    expect(trendsResponse.status).toBe(200);
    expect(trendsResponse.body.snapshot.stateCode).toBe("KL");
    expect(trendsResponse.body.trends[0]?.pendingCases).toBe(1801417);
  });

  it("keeps Kerala public copy inside the same trust posture", async () => {
    const app = await createKeralaPublicApp();

    const routes = [
      { path: "/states/kerala", requiredText: "All numbers on this site come from the NJDG public district dashboards" },
      { path: "/states/kerala/districts", requiredText: "Scan the districts under the most pressure." },
      {
        path: "/states/kerala/districts/ernakulam",
        requiredText: "do not assign responsibility, explain intent, or guarantee that upstream court records have already refreshed",
      },
      { path: "/states/kerala/data", requiredText: "Raw capture bundles and operator evidence artifacts stay outside the public download boundary" },
      { path: "/states/kerala/methodology", requiredText: "publishes dated aggregates after operator review" },
      { path: "/states/kerala/api", requiredText: "currently on the public site" },
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

  it("passes release verification for Kerala once the state-scoped public routes exist", async () => {
    const app = await createKeralaPublicApp();
    const server = createServer(app);
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an ephemeral TCP port.");
    }

    const result = await verifyPublicRelease(`http://127.0.0.1:${address.port}`, { stateSlug: "kerala" });

    expect(result.target.stateCode).toBe("KL");
    expect(result.target.stateSlug).toBe("kerala");
    expect(result.snapshot.methodologyVersion).toBe("2026.04-alpha");
    expect(result.districtCount).toBe(3);
    expect(result.trendCount).toBeGreaterThan(0);
    expect(result.csvMetadataParity).toBe(true);
    expect(result.publicDataCacheProtected).toBe(true);
  });
});

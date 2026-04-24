import { createServer, type Server } from "node:http";

import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { verifyPublicRelease } from "../src/dev/release-verification.js";
import { buildNagalandTestSnapshot, createTestApp, createTestContext, insertPublishedSnapshot, seedTestSnapshot } from "./helpers.js";

describe("Nagaland public rollout preflight", () => {
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

  async function createNagalandPublicApp() {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    await insertPublishedSnapshot(context.pool, {
      runId: "run_nl_public",
      snapshotId: "snapshot_nl_public",
      publicationId: "publication_nl_public",
      stateCode: "NL",
      payload: buildNagalandTestSnapshot(),
    });

    return createTestApp(context.config, context.service, context.publicServices);
  }

  it("serves explicit Nagaland public routes once Nagaland has a published snapshot", async () => {
    const app = await createNagalandPublicApp();

    const homepage = await request(app).get("/");
    expect(homepage.status).toBe(200);
    expect(homepage.text).toContain("Nagaland");

    const overview = await request(app).get("/states/nagaland");
    expect(overview.status).toBe(200);
    expect(overview.text).toContain("How long is the wait for justice in Nagaland?");

    const districts = await request(app).get("/states/nagaland/districts?view=flagged");
    expect(districts.status).toBe(200);
    expect(districts.text).toContain("Dimapur");
    expect(districts.text).toContain("/states/nagaland/data/districts.csv");

    const districtPage = await request(app).get("/states/nagaland/districts/dimapur");
    expect(districtPage.status).toBe(200);
    expect(districtPage.text).toContain("/states/nagaland/data/districts/dimapur.csv");

    const apiPage = await request(app).get("/states/nagaland/api");
    expect(apiPage.status).toBe(200);
    expect(apiPage.text).toContain("/v1/states/nagaland/districts");
  });

  it("keeps Nagaland API contracts stable on the public state-scoped URLs", async () => {
    const app = await createNagalandPublicApp();

    const statsResponse = await request(app).get("/v1/states/nagaland/stats");
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.snapshot.stateCode).toBe("NL");
    expect(statsResponse.body.snapshot.stateName).toBe("Nagaland");
    expect(statsResponse.body.stats.pendingCases).toBe(3984);

    const districtsResponse = await request(app).get("/v1/states/nagaland/districts");
    expect(districtsResponse.status).toBe(200);
    expect(districtsResponse.body.snapshot.stateCode).toBe("NL");
    expect(districtsResponse.body.districts).toHaveLength(3);
    expect(districtsResponse.body.districts[0]?.districtId).toBe("dimapur");

    const trendsResponse = await request(app).get("/v1/states/nagaland/trends");
    expect(trendsResponse.status).toBe(200);
    expect(trendsResponse.body.snapshot.stateCode).toBe("NL");
    expect(trendsResponse.body.trends[0]?.pendingCases).toBe(3984);
  });

  it("keeps Nagaland public copy inside the same trust posture", async () => {
    const app = await createNagalandPublicApp();

    const routes = [
      { path: "/states/nagaland", requiredText: "All numbers on this site come from the NJDG public district dashboards" },
      { path: "/states/nagaland/districts", requiredText: "Scan the districts under the most pressure." },
      {
        path: "/states/nagaland/districts/dimapur",
        requiredText: "do not assign responsibility, explain intent, or guarantee that upstream court records have already refreshed",
      },
      { path: "/states/nagaland/data", requiredText: "Raw capture bundles and operator evidence artifacts stay outside the public download boundary" },
      { path: "/states/nagaland/methodology", requiredText: "publishes dated aggregates after operator review" },
      { path: "/states/nagaland/api", requiredText: "currently on the public site" },
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

  it("passes release verification for Nagaland once the state-scoped public routes exist", async () => {
    const app = await createNagalandPublicApp();
    const server = createServer(app);
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an ephemeral TCP port.");
    }

    const result = await verifyPublicRelease(`http://127.0.0.1:${address.port}`, { stateSlug: "nagaland" });

    expect(result.target.stateCode).toBe("NL");
    expect(result.target.stateSlug).toBe("nagaland");
    expect(result.snapshot.methodologyVersion).toBe("2026.04-alpha");
    expect(result.districtCount).toBe(3);
    expect(result.trendCount).toBeGreaterThan(0);
    expect(result.csvMetadataParity).toBe(true);
    expect(result.publicDataCacheProtected).toBe(true);
  });
});

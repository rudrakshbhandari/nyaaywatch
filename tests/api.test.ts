import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildPunjabTestSnapshot,
  createTestApp,
  createTestContext,
  insertPublishedSnapshot,
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
    const app = createTestApp(context.config, context.service, context.publicServices);

    const statsResponse = await request(app).get("/v1/stats/himachal");
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.stats.pendingCases).toBe(617086);

    const homepage = await request(app).get("/");
    expect(homepage.status).toBe(200);
    expect(homepage.text).toContain("How long is the wait for justice in Himachal Pradesh?");
    expect(homepage.text).toContain("pending cases");
    expect(homepage.text).toContain("Every one of these is a person waiting for their day in court.");
    expect(homepage.text).toContain("Three districts that need eyes on them");
    // Glossary popovers still carry the methodology strings in a tooltip, but
    // not above the fold as dashboard jargon.
    expect(homepage.text).toContain("methodology");

    const districtsPage = await request(app).get("/districts?view=flagged&sort=gap&q=kang");
    expect(districtsPage.status).toBe(200);
    expect(districtsPage.text).toContain("Scan the districts under the most pressure.");
    expect(districtsPage.text).toContain("Watchlist only");
    expect(districtsPage.text).toContain("Kangra");

    const districtPage = await request(app).get("/districts/kangra");
    expect(districtPage.status).toBe(200);
    expect(districtPage.text).toContain("Published district history");
    expect(districtPage.text).toContain("/data/districts/kangra.csv");

    const dataPage = await request(app).get("/data");
    expect(dataPage.status).toBe(200);
    expect(dataPage.text).toContain("Download exactly what the public site is showing.");
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

  it("redirects legacy .com hosts to the canonical .in hostname", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    const app = createTestApp(context.config, context.service, context.publicServices);

    const response = await request(app)
      .get("/districts?view=flagged")
      .set("host", "nyaaywatch.com")
      .set("x-forwarded-proto", "https");

    expect(response.status).toBe(301);
    expect(response.headers.location).toBe("https://nyaaywatch.in/districts?view=flagged");
  });

  it("emits structured request logs for non-health routes and skips the ALB health check noise", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    const app = createTestApp(context.config, context.service, context.publicServices);
    const infoSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await request(app).get("/");
    await request(app).get("/health");

    const messages = infoSpy.mock.calls.map((call) => String(call[0]));
    expect(messages.some((message) => message.includes("\"event\":\"http_request\""))).toBe(true);
    expect(messages.some((message) => message.includes("\"path\":\"/health\""))).toBe(false);

    infoSpy.mockRestore();
  });

  it("protects operator endpoints and exposes fetch, publish, replay, and rollback flows", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    const app = createTestApp(context.config, context.service, context.publicServices);

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

  it("serves Punjab through explicit state-scoped public routes once Punjab has a published snapshot", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    await insertPublishedSnapshot(context.pool, {
      runId: "run_pb_public",
      snapshotId: "snapshot_pb_public",
      publicationId: "publication_pb_public",
      stateCode: "PB",
      payload: buildPunjabTestSnapshot(),
    });

    const app = createTestApp(context.config, context.service, context.publicServices);

    const homepage = await request(app).get("/");
    expect(homepage.status).toBe(200);
    expect(homepage.text).toContain("Punjab");

    const punjabStats = await request(app).get("/v1/states/punjab/stats");
    expect(punjabStats.status).toBe(200);
    expect(punjabStats.body.snapshot.stateCode).toBe("PB");
    expect(punjabStats.body.stats.pendingCases).toBe(961280);

    const punjabDistricts = await request(app).get("/states/punjab/districts?view=flagged");
    expect(punjabDistricts.status).toBe(200);
    expect(punjabDistricts.text).toContain("Punjab");
    expect(punjabDistricts.text).toContain("Ludhiana");
    expect(punjabDistricts.text).toContain("/states/punjab/data/districts.csv");

    const punjabDistrictPage = await request(app).get("/states/punjab/districts/ludhiana");
    expect(punjabDistrictPage.status).toBe(200);
    expect(punjabDistrictPage.text).toContain("/states/punjab/data/districts/ludhiana.csv");
    expect(punjabDistrictPage.text).toContain("Punjab");

    const punjabData = await request(app).get("/states/punjab/data");
    expect(punjabData.status).toBe(200);
    expect(punjabData.text).toContain("/v1/states/punjab/stats");

    const punjabCsv = await request(app).get("/states/punjab/data/districts.csv");
    expect(punjabCsv.status).toBe(200);
    expect(punjabCsv.text).toContain("Punjab");
    expect(punjabCsv.text).toContain("ludhiana");

    const punjabMethodology = await request(app).get("/states/punjab/methodology");
    expect(punjabMethodology.status).toBe(200);
    expect(punjabMethodology.text).toContain("Punjab only on this page");

    const punjabApiPage = await request(app).get("/states/punjab/api");
    expect(punjabApiPage.status).toBe(200);
    expect(punjabApiPage.text).toContain("/v1/states/punjab/districts");
  });
});

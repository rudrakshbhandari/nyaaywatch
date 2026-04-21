import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildHaryanaTestSnapshot,
  buildPunjabTestSnapshot,
  createTestApp,
  createTestContext,
  insertPublishedSnapshot,
  insertHistoricalPublishedSnapshot,
  seedTestHighCourtSnapshot,
  seedTestSupremeCourtSnapshot,
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
    await insertPublishedSnapshot(context.pool, {
      runId: "run_pb_public",
      snapshotId: "snapshot_pb_public",
      publicationId: "publication_pb_public",
      stateCode: "PB",
      payload: buildPunjabTestSnapshot(),
    });
    await insertPublishedSnapshot(context.pool, {
      runId: "run_hr_public",
      snapshotId: "snapshot_hr_public",
      publicationId: "publication_hr_public",
      stateCode: "HR",
      payload: buildHaryanaTestSnapshot(),
    });
    await seedTestSnapshot(context.service);
    await seedTestSupremeCourtSnapshot(context.supremeCourtService);
    await seedTestHighCourtSnapshot(context.highCourtServices.HPHC!);
    await seedTestHighCourtSnapshot(context.highCourtServices.APHC!);
    const app = createTestApp(context.config, context.service, context.publicServices, context.highCourtServices, context.supremeCourtService);

    const statsResponse = await request(app).get("/v1/stats/himachal");
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.stats.pendingCases).toBe(617086);

    const homepage = await request(app).get("/");
    expect(homepage.status).toBe(200);
    expect(homepage.text).toContain("How long is India waiting for justice?");
    expect(homepage.text).toContain("Track the Supreme Court");
    expect(homepage.text).toContain("Most delay sits in the lower courts.");
    expect(homepage.text).toContain("Lower-court state pages.");
    expect(homepage.text).toContain("Coverage: Himachal Pradesh");
    expect(homepage.text).toContain("Coverage: Andhra Pradesh");
    expect(homepage.text).not.toContain('aria-label="Supported states"');
    expect(homepage.text).toContain("See Himachal lower courts");

    const himachalOverview = await request(app).get("/states/himachal");
    expect(himachalOverview.status).toBe(200);
    expect(himachalOverview.text).toContain("How long is the wait for justice in Himachal Pradesh?");

    const districtsPage = await request(app).get("/districts?view=flagged&sort=gap&q=kang");
    expect(districtsPage.status).toBe(200);
    expect(districtsPage.text).toContain("Scan the districts under the most pressure.");
    expect(districtsPage.text).toContain("Watchlist only");
    expect(districtsPage.text).toContain("Kangra");
    expect(districtsPage.text.indexOf("Haryana")).toBeLessThan(districtsPage.text.indexOf("Himachal Pradesh"));
    expect(districtsPage.text.indexOf("Himachal Pradesh")).toBeLessThan(districtsPage.text.indexOf("Punjab"));

    const districtPage = await request(app).get("/districts/kangra");
    expect(districtPage.status).toBe(200);
    expect(districtPage.text).toContain("Published district history");
    expect(districtPage.text).toContain("/data/districts/kangra.csv");

    const dataPage = await request(app).get("/data");
    expect(dataPage.status).toBe(200);
    expect(dataPage.headers["cache-control"]).toContain("no-store");
    expect(dataPage.headers["cloudflare-cdn-cache-control"]).toBe("no-store");
    expect(dataPage.text).toContain("Download exactly what the public site is showing.");
    expect(dataPage.text).toContain("CSV/API parity");

    const districtCsv = await request(app).get("/data/districts.csv");
    expect(districtCsv.status).toBe(200);
    expect(districtCsv.headers["cache-control"]).toContain("no-store");
    expect(districtCsv.headers["cloudflare-cdn-cache-control"]).toBe("no-store");
    expect(districtCsv.text).toContain("snapshot_date,published_at,methodology_version");
    expect(districtCsv.text).toContain("National Judicial Data Grid public district dashboard for Himachal Pradesh");

    const districtHistoryCsv = await request(app).get("/data/districts/kangra.csv");
    expect(districtHistoryCsv.status).toBe(200);
    expect(districtHistoryCsv.headers["cache-control"]).toContain("no-store");
    expect(districtHistoryCsv.headers["cloudflare-cdn-cache-control"]).toBe("no-store");
    expect(districtHistoryCsv.text).toContain("2026-03-31T00:00:00.000Z");
    expect(districtHistoryCsv.text).toContain("2026-04-10T00:00:00.000Z");

    const methodologyPage = await request(app).get("/methodology");
    expect(methodologyPage.status).toBe(200);
    expect(methodologyPage.text).toContain("Current public scope");
    expect(methodologyPage.text).toContain("How the public metrics are derived");
    expect(methodologyPage.text).toContain("Published methodology and snapshot lineage");
  });

  it("redirects legacy .com hosts to the canonical .in hostname", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    const app = createTestApp(context.config, context.service, context.publicServices, context.highCourtServices, context.supremeCourtService);

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
    const app = createTestApp(context.config, context.service, context.publicServices, context.highCourtServices, context.supremeCourtService);
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
    const app = createTestApp(context.config, context.service, context.publicServices, context.highCourtServices, context.supremeCourtService);

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

    const fetchedPunjab = await request(app)
      .post("/operator/runs/fetch")
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN)
      .send({ note: "Fetch Punjab via HTTP", stateCode: "PB" });

    expect(fetchedPunjab.status).toBe(201);
    expect(fetchedPunjab.body.run.stateCode).toBe("PB");
    expect(fetchedPunjab.body.candidate.snapshot.stateCode).toBe("PB");

    const emptyPunjabPublications = await request(app)
      .get("/operator/publications?stateCode=PB")
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN);

    expect(emptyPunjabPublications.status).toBe(200);
    expect(emptyPunjabPublications.body.state.stateCode).toBe("PB");
    expect(emptyPunjabPublications.body.publications).toEqual([]);

    const publishedPunjab = await request(app)
      .post(`/operator/runs/${fetchedPunjab.body.run.id}/publish`)
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN)
      .send({ note: "Publish Punjab via HTTP" });

    expect(publishedPunjab.status).toBe(201);
    expect(publishedPunjab.body.snapshot.payload.snapshot.stateCode).toBe("PB");

    const listedPunjabPublications = await request(app)
      .get("/operator/publications?stateSlug=punjab")
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN);

    expect(listedPunjabPublications.status).toBe(200);
    expect(listedPunjabPublications.body.state.stateCode).toBe("PB");
    expect(listedPunjabPublications.body.publications[0].publication.stateCode).toBe("PB");
  });

  it("exposes the internal High Court read surface and operator lifecycle on the dedicated namespace", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    const app = createTestApp(context.config, context.service, context.publicServices, context.highCourtServices);

    const unauthorized = await request(app).get("/operator/high-courts");
    expect(unauthorized.status).toBe(401);

    const listedHighCourts = await request(app)
      .get("/operator/high-courts")
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN);

    expect(listedHighCourts.status).toBe(200);
    expect(listedHighCourts.body.highCourts.length).toBeGreaterThan(1);
    expect(listedHighCourts.body.highCourts.map((entry: { court: { courtSlug: string } }) => entry.court.courtSlug)).toContain("himachal");
    expect(listedHighCourts.body.highCourts.map((entry: { court: { courtSlug: string } }) => entry.court.courtSlug)).toContain("uttar-pradesh");
    expect(listedHighCourts.body.highCourts.map((entry: { court: { courtSlug: string } }) => entry.court.courtSlug)).toContain(
      "punjab-and-haryana",
    );
    const himachalListing = listedHighCourts.body.highCourts.find(
      (entry: { court: { courtSlug: string } }) => entry.court.courtSlug === "himachal",
    );
    expect(himachalListing?.hasPublishedSnapshot).toBe(false);
    const punjabHaryanaListing = listedHighCourts.body.highCourts.find(
      (entry: { court: { courtSlug: string } }) => entry.court.courtSlug === "punjab-and-haryana",
    );
    expect(punjabHaryanaListing?.court.publicBeta).toBe(true);
    expect(punjabHaryanaListing?.court.coveredGeographies).toHaveLength(3);

    const fetched = await request(app)
      .post("/operator/high-courts/himachal/runs/fetch")
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN)
      .send({ note: "Fetch Himachal High Court via HTTP" });

    expect(fetched.status).toBe(201);
    expect(fetched.body.run.scopeType).toBe("high_court");
    expect(fetched.body.run.scopeCode).toBe("HPHC");
    expect(fetched.body.run.stateCode).toBe("HPHC");
    expect(fetched.body.candidate.snapshot.courtTier).toBe("high_court");
    expect(fetched.body.candidate.snapshot.referenceDateKind).toBe("captured_at");

    const runs = await request(app)
      .get("/operator/high-courts/himachal/runs")
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN);

    expect(runs.status).toBe(200);
    expect(runs.body.runs).toHaveLength(1);
    expect(runs.body.runs[0].id).toBe(fetched.body.run.id);
    expect(runs.body.runs[0].scopeCode).toBe("HPHC");

    const inspected = await request(app)
      .get(`/operator/high-courts/himachal/runs/${fetched.body.run.id}`)
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN);

    expect(inspected.status).toBe(200);
    expect(inspected.body.run.id).toBe(fetched.body.run.id);

    const published = await request(app)
      .post(`/operator/high-courts/himachal/runs/${fetched.body.run.id}/publish`)
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN)
      .send({ note: "Publish Himachal High Court via HTTP" });

    expect(published.status).toBe(201);
    expect(published.body.snapshot.payload.snapshot.courtCode).toBe("HPHC");

    const detail = await request(app)
      .get("/operator/high-courts/himachal")
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN);

    expect(detail.status).toBe(200);
    expect(detail.body.court.courtSlug).toBe("himachal");
    expect(detail.body.stats.pendingTotalCases).toBeGreaterThan(0);
    expect(detail.body.snapshot.scopeType).toBe("high_court");
    expect(detail.body.snapshot.scopeCode).toBe("HPHC");
    expect(detail.body.publications[0].publication.stateCode).toBe("HPHC");
    expect(detail.body.publications[0].publication.scopeCode).toBe("HPHC");

    const replay = await request(app)
      .post(`/operator/high-courts/himachal/runs/${published.body.run.id}/replay`)
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN)
      .send({ note: "Replay Himachal High Court via HTTP" });

    expect(replay.status).toBe(201);
    expect(replay.body.run.replayOfRunId).toBe(published.body.run.id);

    const rollback = await request(app)
      .post(`/operator/high-courts/himachal/publications/${published.body.publication.id}/rollback`)
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN)
      .send({ note: "Rollback Himachal High Court via HTTP" });

    expect(rollback.status).toBe(201);
    expect(rollback.body.action).toBe("rollback");
    expect(rollback.body.scopeCode).toBe("HPHC");

    const publicRouteWithoutPublication = await request(app).get("/high-courts/punjab-and-haryana");
    expect(publicRouteWithoutPublication.status).toBe(503);
  });

  it("exposes the internal Supreme Court read surface and operator lifecycle on the dedicated namespace", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    const app = createTestApp(
      context.config,
      context.service,
      context.publicServices,
      context.highCourtServices,
      context.supremeCourtService,
    );

    const unauthorized = await request(app).get("/operator/supreme-court");
    expect(unauthorized.status).toBe(401);

    const fetched = await request(app)
      .post("/operator/supreme-court/runs/fetch")
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN)
      .send({ note: "Fetch Supreme Court via HTTP" });

    expect(fetched.status).toBe(201);
    expect(fetched.body.run.stateCode).toBe("SCI");
    expect(fetched.body.candidate.snapshot.courtTier).toBe("supreme_court");
    expect(fetched.body.candidate.snapshot.referenceDateKind).toBe("captured_at");
    expect(fetched.body.candidate.stats.pendingRegisteredCases).toBe(70351);

    const runs = await request(app)
      .get("/operator/supreme-court/runs")
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN);

    expect(runs.status).toBe(200);
    expect(runs.body.court.courtCode).toBe("SCI");
    expect(runs.body.runs).toHaveLength(1);

    const inspected = await request(app)
      .get(`/operator/supreme-court/runs/${fetched.body.run.id}`)
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN);

    expect(inspected.status).toBe(200);
    expect(inspected.body.run.id).toBe(fetched.body.run.id);

    const published = await request(app)
      .post(`/operator/supreme-court/runs/${fetched.body.run.id}/publish`)
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN)
      .send({ note: "Publish Supreme Court via HTTP" });

    expect(published.status).toBe(201);
    expect(published.body.snapshot.payload.snapshot.courtCode).toBe("SCI");

    const detail = await request(app)
      .get("/operator/supreme-court")
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN);

    expect(detail.status).toBe(200);
    expect(detail.body.court.courtSlug).toBe("supreme-court");
    expect(detail.body.stats.pendingTotalCases).toBe(92245);
    expect(detail.body.publications[0].publication.stateCode).toBe("SCI");

    const replay = await request(app)
      .post(`/operator/supreme-court/runs/${published.body.run.id}/replay`)
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN)
      .send({ note: "Replay Supreme Court via HTTP" });

    expect(replay.status).toBe(201);
    expect(replay.body.run.replayOfRunId).toBe(published.body.run.id);

    const rollback = await request(app)
      .post(`/operator/supreme-court/publications/${published.body.publication.id}/rollback`)
      .set("x-operator-token", context.config.OPERATOR_API_TOKEN)
      .send({ note: "Rollback Supreme Court via HTTP" });

    expect(rollback.status).toBe(201);
    expect(rollback.body.action).toBe("rollback");
  });

  it("serves Himachal High Court through the public beta namespace once a published High Court snapshot exists", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestHighCourtSnapshot(context.highCourtServices.HPHC!);
    await seedTestHighCourtSnapshot(context.highCourtServices.APHC!);
    await seedTestHighCourtSnapshot(context.highCourtServices.BOHC!);
    await seedTestHighCourtSnapshot(context.highCourtServices.CLHC!);
    await seedTestHighCourtSnapshot(context.highCourtServices.TSHC!);
    await seedTestHighCourtSnapshot(context.highCourtServices.DLHC!);
    await seedTestHighCourtSnapshot(context.highCourtServices.GJHC!);
    await seedTestHighCourtSnapshot(context.highCourtServices.GHHC!);
    await seedTestHighCourtSnapshot(context.highCourtServices.KLHC!);
    await seedTestHighCourtSnapshot(context.highCourtServices.MDHC!);
    await seedTestHighCourtSnapshot(context.highCourtServices.MPHC!);
    await seedTestHighCourtSnapshot(context.highCourtServices.PHHC!);
    await seedTestHighCourtSnapshot(context.highCourtServices.RJHC!);
    await seedTestHighCourtSnapshot(context.highCourtServices.UPHC!);

    const app = createTestApp(context.config, context.service, context.publicServices, context.highCourtServices, context.supremeCourtService);

    const index = await request(app).get("/high-courts");
    expect(index.status).toBe(200);
    expect(index.text).toContain("Where is pressure building across India");
    expect(index.text).toContain("High Court of Himachal Pradesh");
    expect(index.text).toContain("High Court of Andhra Pradesh");
    expect(index.text).toContain("High Court for State of Telangana");
    expect(index.text).toContain("High Court of Delhi");
    expect(index.text).toContain("High Court of Gujarat");
    expect(index.text).toContain("High Court of Kerala");
    expect(index.text).toContain("Madras High Court");
    expect(index.text).toContain("High Court of Madhya Pradesh");
    expect(index.text).toContain("High Court of Punjab and Haryana");
    expect(index.text).toContain("High Court of Rajasthan");
    expect(index.text).toContain("Allahabad High Court");
    expect(index.text).toContain("Coverage:</strong> Himachal Pradesh");
    expect(index.text.indexOf("Allahabad High Court")).toBeLessThan(index.text.indexOf("Bombay High Court"));
    expect(index.text.indexOf("Bombay High Court")).toBeLessThan(index.text.indexOf("Calcutta High Court"));

    const overview = await request(app).get("/high-courts/himachal");
    expect(overview.status).toBe(200);
    expect(overview.text).toContain('href="/" class="masthead__brand"');
    expect(overview.text).toContain("What is the latest published snapshot showing in High Court of Himachal Pradesh?");
    expect(overview.text).toContain("High Court of Himachal Pradesh");
    expect(overview.text).toContain("Coverage");
    expect(overview.text).toContain("Current coverage:</strong> Himachal Pradesh");
    expect(overview.text).toContain("HC NJDG did not expose a trustworthy source snapshot timestamp");
    expect(overview.text).toContain("Cleared / 100 filed");
    expect(overview.text).toContain("Last-month pile change");

    const data = await request(app).get("/high-courts/himachal/data");
    expect(data.status).toBe(200);
    expect(data.text).toContain("across Himachal Pradesh");
    expect(data.text).toContain("/v1/high-courts/himachal/stats");
    expect(data.text).toContain("This public High Court page ships the JSON surface before adding download formats.");

    const methodology = await request(app).get("/high-courts/himachal/methodology");
    expect(methodology.status).toBe(200);
    expect(methodology.text).toContain("Every public High Court number comes from one published aggregate snapshot.");
    expect(methodology.text).toContain("coveredGeographies[]");
    expect(methodology.text).toContain("Current coverage on this page: Himachal Pradesh.");
    expect(methodology.text).toContain("captured_at");

    const api = await request(app).get("/high-courts/himachal/api");
    expect(api.status).toBe(200);
    expect(api.text).toContain("coveredGeographies[]");
    expect(api.text).toContain("/v1/high-courts/himachal/trends");

    const stats = await request(app).get("/v1/high-courts/himachal/stats");
    expect(stats.status).toBe(200);
    expect(stats.body.snapshot.courtCode).toBe("HPHC");
    expect(stats.body.stats.pendingTotalCases).toBeGreaterThan(0);

    const trends = await request(app).get("/v1/high-courts/himachal/trends");
    expect(trends.status).toBe(200);
    expect(trends.body.snapshot.referenceDateKind).toBe("captured_at");
    expect(trends.body.trends.length).toBeGreaterThan(0);

    const uttarPradeshOverview = await request(app).get("/high-courts/uttar-pradesh");
    expect(uttarPradeshOverview.status).toBe(200);
    expect(uttarPradeshOverview.text).toContain("Allahabad High Court");
    expect(uttarPradeshOverview.text).toContain(
      "This page tracks Allahabad High Court across Uttar Pradesh. 13 other public High Court pages are linked in the switcher.",
    );

    const punjabHaryanaOverview = await request(app).get("/high-courts/punjab-and-haryana");
    expect(punjabHaryanaOverview.status).toBe(200);
    expect(punjabHaryanaOverview.text).toContain("High Court of Punjab and Haryana");
    expect(punjabHaryanaOverview.text).toContain("Punjab, Haryana, and Chandigarh");

    const bombayOverview = await request(app).get("/high-courts/bombay");
    expect(bombayOverview.status).toBe(200);
    expect(bombayOverview.text).toContain("Bombay High Court");
    expect(bombayOverview.text).toContain("Maharashtra, Goa, and Dadra and Nagar Haveli and Daman and Diu");

    const calcuttaOverview = await request(app).get("/high-courts/calcutta");
    expect(calcuttaOverview.status).toBe(200);
    expect(calcuttaOverview.text).toContain("Calcutta High Court");
    expect(calcuttaOverview.text).toContain("West Bengal and Andaman and Nicobar Islands");

    const delhiOverview = await request(app).get("/high-courts/delhi");
    expect(delhiOverview.status).toBe(200);
    expect(delhiOverview.text).toContain("High Court of Delhi");
    expect(delhiOverview.text).toContain("Current coverage:</strong> Delhi");

    const gauhatiOverview = await request(app).get("/high-courts/gauhati");
    expect(gauhatiOverview.status).toBe(200);
    expect(gauhatiOverview.text).toContain("Gauhati High Court");
    expect(gauhatiOverview.text).toContain("Assam, Nagaland, Mizoram, and Arunachal Pradesh");

    const keralaOverview = await request(app).get("/high-courts/kerala");
    expect(keralaOverview.status).toBe(200);
    expect(keralaOverview.text).toContain("High Court of Kerala");
    expect(keralaOverview.text).toContain("Kerala and Lakshadweep");

    const madrasOverview = await request(app).get("/high-courts/madras");
    expect(madrasOverview.status).toBe(200);
    expect(madrasOverview.text).toContain("Madras High Court");
    expect(madrasOverview.text).toContain("Tamil Nadu and Puducherry");

    const punjabHaryanaStats = await request(app).get("/v1/high-courts/punjab-and-haryana/stats");
    expect(punjabHaryanaStats.status).toBe(200);
    expect(punjabHaryanaStats.body.snapshot.courtCode).toBe("PHHC");

    const bombayStats = await request(app).get("/v1/high-courts/bombay/stats");
    expect(bombayStats.status).toBe(200);
    expect(bombayStats.body.snapshot.courtCode).toBe("BOHC");

    const calcuttaTrends = await request(app).get("/v1/high-courts/calcutta/trends");
    expect(calcuttaTrends.status).toBe(200);
    expect(calcuttaTrends.body.snapshot.courtCode).toBe("CLHC");

    const delhiStats = await request(app).get("/v1/high-courts/delhi/stats");
    expect(delhiStats.status).toBe(200);
    expect(delhiStats.body.snapshot.courtCode).toBe("DLHC");

    const gauhatiStats = await request(app).get("/v1/high-courts/gauhati/stats");
    expect(gauhatiStats.status).toBe(200);
    expect(gauhatiStats.body.snapshot.courtCode).toBe("GHHC");

    const keralaTrends = await request(app).get("/v1/high-courts/kerala/trends");
    expect(keralaTrends.status).toBe(200);
    expect(keralaTrends.body.snapshot.courtCode).toBe("KLHC");

    const madrasStats = await request(app).get("/v1/high-courts/madras/stats");
    expect(madrasStats.status).toBe(200);
    expect(madrasStats.body.snapshot.courtCode).toBe("MDHC");

    const andhraPradeshOverview = await request(app).get("/high-courts/andhra-pradesh");
    expect(andhraPradeshOverview.status).toBe(200);
    expect(andhraPradeshOverview.text).toContain("High Court of Andhra Pradesh");

    const telanganaOverview = await request(app).get("/high-courts/telangana");
    expect(telanganaOverview.status).toBe(200);
    expect(telanganaOverview.text).toContain("High Court for State of Telangana");

    const gujaratOverview = await request(app).get("/high-courts/gujarat");
    expect(gujaratOverview.status).toBe(200);
    expect(gujaratOverview.text).toContain("High Court of Gujarat");

    const madhyaPradeshOverview = await request(app).get("/high-courts/madhya-pradesh");
    expect(madhyaPradeshOverview.status).toBe(200);
    expect(madhyaPradeshOverview.text).toContain("High Court of Madhya Pradesh");

    const rajasthanOverview = await request(app).get("/high-courts/rajasthan");
    expect(rajasthanOverview.status).toBe(200);
    expect(rajasthanOverview.text).toContain("High Court of Rajasthan");

    const gujaratStats = await request(app).get("/v1/high-courts/gujarat/stats");
    expect(gujaratStats.status).toBe(200);
    expect(gujaratStats.body.snapshot.courtCode).toBe("GJHC");

    const madhyaPradeshTrends = await request(app).get("/v1/high-courts/madhya-pradesh/trends");
    expect(madhyaPradeshTrends.status).toBe(200);
    expect(madhyaPradeshTrends.body.snapshot.courtCode).toBe("MPHC");

    const andhraPradeshStats = await request(app).get("/v1/high-courts/andhra-pradesh/stats");
    expect(andhraPradeshStats.status).toBe(200);
    expect(andhraPradeshStats.body.snapshot.courtCode).toBe("APHC");

    const telanganaTrends = await request(app).get("/v1/high-courts/telangana/trends");
    expect(telanganaTrends.status).toBe(200);
    expect(telanganaTrends.body.snapshot.courtCode).toBe("TSHC");

    const uttarPradeshStats = await request(app).get("/v1/high-courts/uttar-pradesh/stats");
    expect(uttarPradeshStats.status).toBe(200);
    expect(uttarPradeshStats.body.snapshot.courtCode).toBe("UPHC");

    const rajasthanTrends = await request(app).get("/v1/high-courts/rajasthan/trends");
    expect(rajasthanTrends.status).toBe(200);
    expect(rajasthanTrends.body.snapshot.courtCode).toBe("RJHC");
  });

  it("serves Supreme Court through the public beta namespace once a published Supreme Court snapshot exists", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSupremeCourtSnapshot(context.supremeCourtService);

    const app = createTestApp(
      context.config,
      context.service,
      context.publicServices,
      context.highCourtServices,
      context.supremeCourtService,
    );

    const overview = await request(app).get("/supreme-court");
    expect(overview.status).toBe(200);
    expect(overview.text).toContain("Where is pressure building at the apex court?");
    expect(overview.text).toContain("The official aggregate page did not expose a defensible source snapshot timestamp");
    expect(overview.text).toContain("Cleared / 100 filed");
    expect(overview.text).toContain("Last-month pile change");

    const data = await request(app).get("/supreme-court/data");
    expect(data.status).toBe(200);
    expect(data.text).toContain("/v1/supreme-court/stats");
    expect(data.text).toContain("This public Supreme Court page ships the JSON surface before adding download formats.");

    const methodology = await request(app).get("/supreme-court/methodology");
    expect(methodology.status).toBe(200);
    expect(methodology.text).toContain("Every public Supreme Court number comes from one published aggregate snapshot.");
    expect(methodology.text).toContain("captured_at");

    const api = await request(app).get("/supreme-court/api");
    expect(api.status).toBe(200);
    expect(api.text).toContain("/v1/supreme-court/trends");

    const stats = await request(app).get("/v1/supreme-court/stats");
    expect(stats.status).toBe(200);
    expect(stats.body.snapshot.courtCode).toBe("SCI");
    expect(stats.body.stats.pendingTotalCases).toBeGreaterThan(0);
    expect(stats.body.stats.pendingRegisteredCases).toBeGreaterThan(0);

    const trends = await request(app).get("/v1/supreme-court/trends");
    expect(trends.status).toBe(200);
    expect(trends.body.snapshot.referenceDateKind).toBe("captured_at");
    expect(trends.body.trends.length).toBeGreaterThan(0);
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

    const app = createTestApp(context.config, context.service, context.publicServices, context.highCourtServices, context.supremeCourtService);

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
    expect(punjabData.headers["cache-control"]).toContain("no-store");
    expect(punjabData.headers["cloudflare-cdn-cache-control"]).toBe("no-store");
    expect(punjabData.text).toContain("/v1/states/punjab/stats");

    const punjabCsv = await request(app).get("/states/punjab/data/districts.csv");
    expect(punjabCsv.status).toBe(200);
    expect(punjabCsv.headers["cache-control"]).toContain("no-store");
    expect(punjabCsv.headers["cloudflare-cdn-cache-control"]).toBe("no-store");
    expect(punjabCsv.text).toContain("Punjab");
    expect(punjabCsv.text).toContain("ludhiana");

    const punjabMethodology = await request(app).get("/states/punjab/methodology");
    expect(punjabMethodology.status).toBe(200);
    expect(punjabMethodology.text).toContain("This page covers Punjab.");

    const punjabApiPage = await request(app).get("/states/punjab/api");
    expect(punjabApiPage.status).toBe(200);
    expect(punjabApiPage.text).toContain("/v1/states/punjab/districts");
  });
});

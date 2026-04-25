import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";

import {
  buildPunjabTestSnapshot,
  createTestApp,
  createTestContext,
  insertPublishedSnapshot,
  seedTestSnapshot,
} from "./helpers.js";

function createSnapshotMetadataContract(stateCode: "HP" | "PB", stateName: string) {
  return z
  .object({
      stateCode: z.literal(stateCode),
      stateName: z.literal(stateName),
    sourceName: z.string().min(1),
    sourceSnapshotAt: z.string().datetime(),
    publishedAt: z.string().datetime(),
    methodologyVersion: z.string().min(1),
    qualityState: z.enum(["complete", "partial", "stale"]),
    freshnessDays: z.number().int().nonnegative(),
    sourceAttribution: z.string().min(1),
    publishedFromRunId: z.string().min(1),
    replayedFromRunId: z.string().min(1).optional(),
    })
    .strict();
}

function createStatsContract(stateCode: "HP" | "PB", stateName: string) {
  return z
  .object({
      snapshot: createSnapshotMetadataContract(stateCode, stateName),
    stats: z
      .object({
        pendingCases: z.number().int().nonnegative(),
        filedLastMonthCases: z.number().int().nonnegative(),
        clearedLastMonthCases: z.number().int().nonnegative(),
        disposalRate: z.number().nonnegative(),
        medianCaseAgeDays: z.number().int().nonnegative(),
        flaggedDistricts: z.number().int().nonnegative(),
        ageBuckets: createAgeBucketsContract(),
        oldCaseBurden: createOldCaseBurdenContract(),
        backlogMovementShare: z.number(),
        breakEvenClearancesNeeded: z.number().int().nonnegative(),
        catchUpClearancesPerMonth: z.number().int().nonnegative(),
        backlogConcentration: z
          .object({
            topFiveDistrictsShare: z.number().nonnegative(),
            topTenDistrictsShare: z.number().nonnegative(),
          })
          .strict(),
      })
      .strict(),
    })
    .strict();
}

function createAgeBucketsContract() {
  return z
    .object({
      lessThanOneYear: z.number().int().nonnegative(),
      oneToThreeYears: z.number().int().nonnegative(),
      threeToFiveYears: z.number().int().nonnegative(),
      fiveToTenYears: z.number().int().nonnegative(),
      aboveTenYears: z.number().int().nonnegative(),
    })
    .strict();
}

function createOldCaseBurdenContract() {
  return z
    .object({
      threePlusYearsCases: z.number().int().nonnegative(),
      fivePlusYearsCases: z.number().int().nonnegative(),
      tenPlusYearsCases: z.number().int().nonnegative(),
      threePlusYearsShare: z.number().nonnegative(),
      fivePlusYearsShare: z.number().nonnegative(),
      tenPlusYearsShare: z.number().nonnegative(),
    })
    .strict();
}

function createWatchlistPersistenceContract() {
  return z
    .object({
      flaggedInLastThree: z.number().int().nonnegative(),
      lastThreeWindow: z.number().int().nonnegative(),
      flaggedInLastSix: z.number().int().nonnegative(),
      lastSixWindow: z.number().int().nonnegative(),
    })
    .strict();
}

function createDistrictsContract(stateCode: "HP" | "PB", stateName: string) {
  return z
  .object({
      snapshot: createSnapshotMetadataContract(stateCode, stateName),
    districts: z
      .array(
        z
          .object({
            districtId: z.string().min(1),
            districtName: z.string().min(1),
            rank: z.number().int().positive(),
            backlogCases: z.number().int().nonnegative(),
            filedLastMonthCases: z.number().int().nonnegative(),
            clearedLastMonthCases: z.number().int().nonnegative(),
            disposalRate: z.number().nonnegative(),
            medianAgeDays: z.number().int().nonnegative(),
            filingVsDisposalGap: z.number(),
            ageBuckets: createAgeBucketsContract(),
            oldCaseBurden: createOldCaseBurdenContract(),
            backlogMovementShare: z.number(),
            breakEvenClearancesNeeded: z.number().int().nonnegative(),
            catchUpClearancesPerMonth: z.number().int().nonnegative(),
            watchlistPersistence: createWatchlistPersistenceContract(),
            flagReason: z.string().min(1),
            summary: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
    })
    .strict();
}

function createTrendsContract(stateCode: "HP" | "PB", stateName: string) {
  return z
  .object({
      snapshot: createSnapshotMetadataContract(stateCode, stateName),
    trends: z
      .array(
        z
          .object({
            snapshotDate: z.string().datetime(),
            pendingCases: z.number().int().nonnegative(),
            filedLastMonthCases: z.number().int().nonnegative(),
            clearedLastMonthCases: z.number().int().nonnegative(),
            disposalRate: z.number().nonnegative(),
          })
          .strict(),
      )
      .min(1),
    })
    .strict();
}

describe("API contract stability", () => {
  const pools: Array<{ end: () => Promise<void> }> = [];

  afterEach(async () => {
    while (pools.length > 0) {
      await pools.pop()?.end();
    }
  });

  it("serves a stable contract for /v1/stats/himachal", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);

    const app = createTestApp(context.config, context.service, context.publicServices);
    const response = await request(app).get("/v1/stats/himachal");

    expect(response.status).toBe(200);
    const parsed = createStatsContract("HP", "Himachal Pradesh").parse(response.body);
    expect(parsed.stats.pendingCases).toBe(617086);
    expect(Object.keys(parsed.snapshot)).toEqual([
      "stateCode",
      "stateName",
      "sourceName",
      "sourceSnapshotAt",
      "publishedAt",
      "methodologyVersion",
      "qualityState",
      "freshnessDays",
      "sourceAttribution",
      "publishedFromRunId",
    ]);
  });

  it("serves a stable contract for /v1/districts", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);

    const app = createTestApp(context.config, context.service, context.publicServices);
    const response = await request(app).get("/v1/districts");

    expect(response.status).toBe(200);
    const parsed = createDistrictsContract("HP", "Himachal Pradesh").parse(response.body);
    expect(parsed.districts).toHaveLength(12);
    expect(Object.keys(parsed.districts[0] ?? {})).toEqual([
      "districtId",
      "districtName",
      "rank",
      "backlogCases",
      "filedLastMonthCases",
      "clearedLastMonthCases",
      "disposalRate",
      "medianAgeDays",
      "filingVsDisposalGap",
      "ageBuckets",
      "oldCaseBurden",
      "backlogMovementShare",
      "breakEvenClearancesNeeded",
      "catchUpClearancesPerMonth",
      "watchlistPersistence",
      "flagReason",
      "summary",
    ]);
  });

  it("serves a stable contract for /v1/trends", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);

    const app = createTestApp(context.config, context.service, context.publicServices);
    const response = await request(app).get("/v1/trends");

    expect(response.status).toBe(200);
    const parsed = createTrendsContract("HP", "Himachal Pradesh").parse(response.body);
    expect(parsed.trends.length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(parsed.trends[0] ?? {})).toEqual([
      "snapshotDate",
      "pendingCases",
      "filedLastMonthCases",
      "clearedLastMonthCases",
      "disposalRate",
    ]);
  });

  it("serves a stable contract for state-scoped Punjab endpoints", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    await insertPublishedSnapshot(context.pool, {
      runId: "run_pb_contract",
      snapshotId: "snapshot_pb_contract",
      publicationId: "publication_pb_contract",
      stateCode: "PB",
      payload: buildPunjabTestSnapshot(),
    });

    const app = createTestApp(context.config, context.service, context.publicServices);

    const statsResponse = await request(app).get("/v1/states/punjab/stats");
    expect(statsResponse.status).toBe(200);
    const stats = createStatsContract("PB", "Punjab").parse(statsResponse.body);
    expect(stats.stats.pendingCases).toBe(961280);

    const districtsResponse = await request(app).get("/v1/states/punjab/districts");
    expect(districtsResponse.status).toBe(200);
    const districts = createDistrictsContract("PB", "Punjab").parse(districtsResponse.body);
    expect(districts.districts[0]?.districtId).toBe("ludhiana");

    const trendsResponse = await request(app).get("/v1/states/punjab/trends");
    expect(trendsResponse.status).toBe(200);
    const trends = createTrendsContract("PB", "Punjab").parse(trendsResponse.body);
    expect(trends.trends[0]?.pendingCases).toBe(961280);
  });
});

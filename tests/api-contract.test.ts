import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { createTestApp, createTestContext, seedTestSnapshot } from "./helpers.js";

const SnapshotMetadataContract = z
  .object({
    stateCode: z.literal("HP"),
    stateName: z.literal("Himachal Pradesh"),
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

const StatsContract = z
  .object({
    snapshot: SnapshotMetadataContract,
    stats: z
      .object({
        pendingCases: z.number().int().nonnegative(),
        disposalRate: z.number().nonnegative(),
        medianCaseAgeDays: z.number().int().nonnegative(),
        flaggedDistricts: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

const DistrictsContract = z
  .object({
    snapshot: SnapshotMetadataContract,
    districts: z
      .array(
        z
          .object({
            districtId: z.string().min(1),
            districtName: z.string().min(1),
            rank: z.number().int().positive(),
            backlogCases: z.number().int().nonnegative(),
            disposalRate: z.number().nonnegative(),
            medianAgeDays: z.number().int().nonnegative(),
            filingVsDisposalGap: z.number(),
            flagReason: z.string().min(1),
            summary: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

const TrendsContract = z
  .object({
    snapshot: SnapshotMetadataContract,
    trends: z
      .array(
        z
          .object({
            snapshotDate: z.string().datetime(),
            pendingCases: z.number().int().nonnegative(),
            disposalRate: z.number().nonnegative(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

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

    const app = createTestApp(context.config, context.service);
    const response = await request(app).get("/v1/stats/himachal");

    expect(response.status).toBe(200);
    const parsed = StatsContract.parse(response.body);
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

    const app = createTestApp(context.config, context.service);
    const response = await request(app).get("/v1/districts");

    expect(response.status).toBe(200);
    const parsed = DistrictsContract.parse(response.body);
    expect(parsed.districts).toHaveLength(12);
    expect(Object.keys(parsed.districts[0] ?? {})).toEqual([
      "districtId",
      "districtName",
      "rank",
      "backlogCases",
      "disposalRate",
      "medianAgeDays",
      "filingVsDisposalGap",
      "flagReason",
      "summary",
    ]);
  });

  it("serves a stable contract for /v1/trends", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);

    const app = createTestApp(context.config, context.service);
    const response = await request(app).get("/v1/trends");

    expect(response.status).toBe(200);
    const parsed = TrendsContract.parse(response.body);
    expect(parsed.trends.length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(parsed.trends[0] ?? {})).toEqual([
      "snapshotDate",
      "pendingCases",
      "disposalRate",
    ]);
  });
});

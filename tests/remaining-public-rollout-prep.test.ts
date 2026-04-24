import { createServer, type Server } from "node:http";

import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import type { PublishedSnapshot } from "../src/domain/snapshot-schema.js";
import { verifyPublicRelease } from "../src/dev/release-verification.js";
import type { SupportedStateCode } from "../src/geographies.js";
import { createTestApp, createTestContext, insertPublishedSnapshot, seedTestSnapshot } from "./helpers.js";

interface PublicPrepCase {
  stateCode: SupportedStateCode;
  stateName: string;
  stateSlug: string;
  districtId: string;
  districtName: string;
  pendingCases: number;
  disposalRate: number;
  sourceSnapshotAt: string;
}

const REMAINING_PUBLIC_PREP_CASES: PublicPrepCase[] = [
  { stateCode: "MN", stateName: "Manipur", stateSlug: "manipur", districtId: "imphal-west", districtName: "Imphal West", pendingCases: 48211, disposalRate: 92.4, sourceSnapshotAt: "2026-04-16T00:00:00.000Z" },
  { stateCode: "UK", stateName: "Uttarakhand", stateSlug: "uttarakhand", districtId: "dehradun", districtName: "Dehradun", pendingCases: 138442, disposalRate: 103.8, sourceSnapshotAt: "2026-04-16T00:00:00.000Z" },
  { stateCode: "RJ", stateName: "Rajasthan", stateSlug: "rajasthan", districtId: "jaipur", districtName: "Jaipur", pendingCases: 1218448, disposalRate: 108.6, sourceSnapshotAt: "2026-04-16T00:00:00.000Z" },
  { stateCode: "UP", stateName: "Uttar Pradesh", stateSlug: "uttar-pradesh", districtId: "lucknow", districtName: "Lucknow", pendingCases: 11911564, disposalRate: 101.2, sourceSnapshotAt: "2026-04-16T00:00:00.000Z" },
  { stateCode: "MP", stateName: "Madhya Pradesh", stateSlug: "madhya-pradesh", districtId: "bhopal", districtName: "Bhopal", pendingCases: 934522, disposalRate: 105.7, sourceSnapshotAt: "2026-04-17T00:00:00.000Z" },
  { stateCode: "MH", stateName: "Maharashtra", stateSlug: "maharashtra", districtId: "pune", districtName: "Pune", pendingCases: 2419855, disposalRate: 111.9, sourceSnapshotAt: "2026-04-17T00:00:00.000Z" },
  { stateCode: "BR", stateName: "Bihar", stateSlug: "bihar", districtId: "patna", districtName: "Patna", pendingCases: 713644, disposalRate: 96.2, sourceSnapshotAt: "2026-04-17T00:00:00.000Z" },
  { stateCode: "GJ", stateName: "Gujarat", stateSlug: "gujarat", districtId: "ahmedabad", districtName: "Ahmedabad", pendingCases: 884931, disposalRate: 109.8, sourceSnapshotAt: "2026-04-17T00:00:00.000Z" },
  { stateCode: "OD", stateName: "Odisha", stateSlug: "odisha", districtId: "khordha", districtName: "Khordha", pendingCases: 524309, disposalRate: 101.4, sourceSnapshotAt: "2026-04-18T00:00:00.000Z" },
  { stateCode: "WB", stateName: "West Bengal", stateSlug: "west-bengal", districtId: "kolkata", districtName: "Kolkata", pendingCases: 1328422, disposalRate: 97.7, sourceSnapshotAt: "2026-04-18T00:00:00.000Z" },
  { stateCode: "JH", stateName: "Jharkhand", stateSlug: "jharkhand", districtId: "ranchi", districtName: "Ranchi", pendingCases: 301116, disposalRate: 94.9, sourceSnapshotAt: "2026-04-18T00:00:00.000Z" },
  { stateCode: "CG", stateName: "Chhattisgarh", stateSlug: "chhattisgarh", districtId: "raipur", districtName: "Raipur", pendingCases: 288224, disposalRate: 106.1, sourceSnapshotAt: "2026-04-18T00:00:00.000Z" },
  { stateCode: "GA", stateName: "Goa", stateSlug: "goa", districtId: "north-goa", districtName: "North Goa", pendingCases: 24437, disposalRate: 114.4, sourceSnapshotAt: "2026-04-18T00:00:00.000Z" },
  { stateCode: "SK", stateName: "Sikkim", stateSlug: "sikkim", districtId: "east-sikkim", districtName: "East Sikkim", pendingCases: 10444, disposalRate: 117.3, sourceSnapshotAt: "2026-04-18T00:00:00.000Z" },
  { stateCode: "MZ", stateName: "Mizoram", stateSlug: "mizoram", districtId: "aizawl", districtName: "Aizawl", pendingCases: 9122, disposalRate: 112.5, sourceSnapshotAt: "2026-04-18T00:00:00.000Z" },
];

function buildPublishedSnapshot(input: PublicPrepCase): PublishedSnapshot {
  const districtSlugTwo = `${input.districtId}-east`;
  const districtNameTwo = `${input.districtName} East`;
  const districtSlugThree = `${input.districtId}-west`;
  const districtNameThree = `${input.districtName} West`;

  return {
    snapshot: {
      stateCode: input.stateCode,
      stateName: input.stateName,
      sourceName: `NJDG ${input.stateName} district dashboard`,
      sourceSnapshotAt: input.sourceSnapshotAt,
      publishedAt: "2026-04-18T08:00:00.000Z",
      methodologyVersion: "2026.04-alpha",
      qualityState: "complete",
      freshnessDays: 0,
      sourceAttribution: `National Judicial Data Grid public district dashboard for ${input.stateName}`,
      publishedFromRunId: `run_${input.stateCode.toLowerCase()}_public`,
    },
    stats: {
      pendingCases: input.pendingCases,
      disposalRate: input.disposalRate,
      medianCaseAgeDays: 365,
      flaggedDistricts: 3,
    },
    districts: [
      {
        districtId: input.districtId,
        districtName: input.districtName,
        rank: 1,
        backlogCases: Math.round(input.pendingCases * 0.18),
        disposalRate: input.disposalRate - 6.4,
        medianAgeDays: 365,
        filingVsDisposalGap: 6.4,
        flagReason: "New cases are still arriving faster than this district is clearing them, and the queue is already among the state's largest.",
        summary: `${input.districtName} has ${Math.round(input.pendingCases * 0.18).toLocaleString("en-IN")} cases waiting. A typical pending case falls around 365 days old, and the district cleared ${(input.disposalRate - 6.4).toFixed(1)}% as many cases as it received last month. It stays on the list of districts to watch in this snapshot.`,
      },
      {
        districtId: districtSlugTwo,
        districtName: districtNameTwo,
        rank: 2,
        backlogCases: Math.round(input.pendingCases * 0.12),
        disposalRate: input.disposalRate + 4.2,
        medianAgeDays: 730,
        filingVsDisposalGap: -4.2,
        flagReason: "People appear to be waiting longer here than in much of the state, based on the latest published snapshot.",
        summary: `${districtNameTwo} has ${Math.round(input.pendingCases * 0.12).toLocaleString("en-IN")} cases waiting. A typical pending case falls around 730 days old, and the district cleared ${(input.disposalRate + 4.2).toFixed(1)}% as many cases as it received last month. It stays on the list of districts to watch in this snapshot.`,
      },
      {
        districtId: districtSlugThree,
        districtName: districtNameThree,
        rank: 3,
        backlogCases: Math.round(input.pendingCases * 0.09),
        disposalRate: input.disposalRate - 1.3,
        medianAgeDays: 183,
        filingVsDisposalGap: 1.3,
        flagReason: "This district still carries visible backlog pressure in the statewide snapshot even though disposal remains close to filings.",
        summary: `${districtNameThree} has ${Math.round(input.pendingCases * 0.09).toLocaleString("en-IN")} cases waiting. A typical pending case falls around 183 days old, and the district cleared ${(input.disposalRate - 1.3).toFixed(1)}% as many cases as it received last month. It stays on the list of districts to watch in this snapshot.`,
      },
    ],
    trends: [
      {
        snapshotDate: input.sourceSnapshotAt,
        pendingCases: input.pendingCases,
        disposalRate: input.disposalRate,
      },
    ],
  };
}

describe("supported state public route coverage", () => {
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

  async function createPublicApp(input: PublicPrepCase) {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    await insertPublishedSnapshot(context.pool, {
      runId: `run_${input.stateCode.toLowerCase()}_public`,
      snapshotId: `snapshot_${input.stateCode.toLowerCase()}_public`,
      publicationId: `publication_${input.stateCode.toLowerCase()}_public`,
      stateCode: input.stateCode,
      payload: buildPublishedSnapshot(input),
    });

    return createTestApp(context.config, context.service, context.publicServices);
  }

  for (const rolloutCase of REMAINING_PUBLIC_PREP_CASES) {
    it(`serves stable public routes and release verification for ${rolloutCase.stateName}`, async () => {
      const app = await createPublicApp(rolloutCase);

      const overview = await request(app).get(`/states/${rolloutCase.stateSlug}`);
      expect(overview.status).toBe(200);
      expect(overview.text).toContain(`How long is the wait for justice in ${rolloutCase.stateName}?`);

      const districts = await request(app).get(`/states/${rolloutCase.stateSlug}/districts?view=flagged`);
      expect(districts.status).toBe(200);
      expect(districts.text).toContain(rolloutCase.districtName);
      expect(districts.text).toContain(`/states/${rolloutCase.stateSlug}/data/districts.csv`);

      const districtPage = await request(app).get(`/states/${rolloutCase.stateSlug}/districts/${rolloutCase.districtId}`);
      expect(districtPage.status).toBe(200);
      expect(districtPage.text).toContain(`/states/${rolloutCase.stateSlug}/data/districts/${rolloutCase.districtId}.csv`);

      const statsResponse = await request(app).get(`/v1/states/${rolloutCase.stateSlug}/stats`);
      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.snapshot.stateCode).toBe(rolloutCase.stateCode);
      expect(statsResponse.body.snapshot.stateName).toBe(rolloutCase.stateName);
      expect(statsResponse.body.stats.pendingCases).toBe(rolloutCase.pendingCases);

      const server = createServer(app);
      servers.push(server);

      await new Promise<void>((resolve) => server.listen(0, resolve));
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Expected an ephemeral TCP port.");
      }

      const result = await verifyPublicRelease(`http://127.0.0.1:${address.port}`, { stateSlug: rolloutCase.stateSlug });

      expect(result.target.stateCode).toBe(rolloutCase.stateCode);
      expect(result.target.stateSlug).toBe(rolloutCase.stateSlug);
      expect(result.snapshot.methodologyVersion).toBe("2026.04-alpha");
      expect(result.districtCount).toBe(3);
      expect(result.trendCount).toBeGreaterThan(0);
      expect(result.csvMetadataParity).toBe(true);
      expect(result.publicDataCacheProtected).toBe(true);
    });
  }
});

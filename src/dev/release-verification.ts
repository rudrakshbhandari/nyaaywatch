import { z } from "zod";

import { SnapshotMetadataSchema, StateStatsSchema, TrendPointSchema, type QualityState } from "../domain/snapshot-schema.js";
import { getPublicStateProfileBySlug } from "../geographies.js";
import { freshnessDays } from "../lib/time.js";

const HealthResponseSchema = z.object({
  ok: z.literal(true),
  region: z.literal("ap-south-1"),
  stateCode: z.literal("HP"),
});

const StatsResponseSchema = z.object({
  snapshot: SnapshotMetadataSchema,
  stats: StateStatsSchema,
});

const DistrictsResponseSchema = z.object({
  snapshot: SnapshotMetadataSchema,
  districts: z.array(
    z.object({
      districtId: z.string().min(1),
      districtName: z.string().min(1),
      rank: z.number().int().positive(),
    }),
  ),
});

const TrendsResponseSchema = z.object({
  snapshot: SnapshotMetadataSchema,
  trends: z.array(TrendPointSchema),
});

const OperatorUnauthorizedSchema = z.object({
  error: z.literal("Operator token required."),
});

type SnapshotMetadata = z.infer<typeof SnapshotMetadataSchema>;

export interface ReleaseVerificationSummary {
  baseUrl: string;
  checkedAt: string;
  target: {
    stateCode: string;
    stateName: string;
    stateSlug: string;
    statsPath: string;
    districtsPath: string;
    trendsPath: string;
    dataPagePath: string;
    districtsCsvPath: string;
  };
  snapshot: {
    sourceSnapshotAt: string;
    publishedAt: string;
    freshnessDaysAtPublish: number;
    currentFreshnessDays: number;
    methodologyVersion: string;
    qualityState: QualityState;
    publishedFromRunId: string | null;
    replayedFromRunId: string | null;
  };
  health: {
    region: string;
    stateCode: string;
  };
  districtCount: number;
  trendCount: number;
  csvMetadataParity: true;
  publicDataCacheProtected: true;
  operatorAuthProtected: true;
}

export async function verifyPublicRelease(
  baseUrl: string,
  options: {
    stateSlug?: string;
    now?: Date;
  } = {},
): Promise<ReleaseVerificationSummary> {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const target = resolveReleaseTarget(options.stateSlug);
  const checkedAt = options.now ?? new Date();
  const [health, statsPayload, districtsPayload, trendsPayload, operatorAuthResult, dataPage, districtsCsv] =
    await Promise.all([
      fetchJson(`${normalizedBaseUrl}/health`, HealthResponseSchema),
      fetchJson(`${normalizedBaseUrl}${target.statsPath}`, StatsResponseSchema),
      fetchJson(`${normalizedBaseUrl}${target.districtsPath}`, DistrictsResponseSchema),
      fetchJson(`${normalizedBaseUrl}${target.trendsPath}`, TrendsResponseSchema),
      fetchJson(`${normalizedBaseUrl}/operator/publications`, OperatorUnauthorizedSchema, 401),
      fetchTextResponse(`${normalizedBaseUrl}${target.dataPagePath}`),
      fetchTextResponse(`${normalizedBaseUrl}${target.districtsCsvPath}`),
    ]);

  assertSnapshotState(statsPayload.snapshot, target.stateCode, target.stateName);
  assertMatchingSnapshot("districts", districtsPayload.snapshot, statsPayload.snapshot);
  assertMatchingSnapshot("trends", trendsPayload.snapshot, statsPayload.snapshot);
  assertCacheProtection("public data page", dataPage.response);
  assertCacheProtection("district CSV", districtsCsv.response);
  assertCsvMetadataParity(districtsCsv.body, statsPayload.snapshot);
  const currentFreshnessDays = freshnessDays(statsPayload.snapshot.sourceSnapshotAt, checkedAt);

  return {
    baseUrl: normalizedBaseUrl,
    checkedAt: checkedAt.toISOString(),
    target,
    snapshot: {
      sourceSnapshotAt: statsPayload.snapshot.sourceSnapshotAt,
      publishedAt: statsPayload.snapshot.publishedAt,
      freshnessDaysAtPublish: statsPayload.snapshot.freshnessDays,
      currentFreshnessDays,
      methodologyVersion: statsPayload.snapshot.methodologyVersion,
      qualityState: statsPayload.snapshot.qualityState,
      publishedFromRunId: statsPayload.snapshot.publishedFromRunId ?? null,
      replayedFromRunId: statsPayload.snapshot.replayedFromRunId ?? null,
    },
    health: {
      region: health.region,
      stateCode: health.stateCode,
    },
    districtCount: districtsPayload.districts.length,
    trendCount: trendsPayload.trends.length,
    csvMetadataParity: true,
    publicDataCacheProtected: true,
    operatorAuthProtected: true,
  };
}

function normalizeBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.trim();
  if (trimmed.length === 0) {
    throw new Error("A base URL is required.");
  }

  return trimmed.replace(/\/+$/, "");
}

function resolveReleaseTarget(stateSlug?: string) {
  const defaultStateSlug = "himachal-pradesh";
  const resolvedStateSlug = stateSlug?.trim() || defaultStateSlug;
  const profile = getPublicStateProfileBySlug(resolvedStateSlug);
  if (!profile) {
    throw new Error(`Unsupported public state slug: ${resolvedStateSlug}`);
  }

  if (profile.stateCode === "HP") {
    return {
      stateCode: profile.stateCode,
      stateName: profile.stateName,
      stateSlug: profile.stateSlug,
      statsPath: "/v1/stats/himachal",
      districtsPath: "/v1/districts",
      trendsPath: "/v1/trends",
      dataPagePath: "/data",
      districtsCsvPath: "/data/districts.csv",
    };
  }

  return {
    stateCode: profile.stateCode,
    stateName: profile.stateName,
    stateSlug: profile.stateSlug,
    statsPath: `/v1/states/${profile.stateSlug}/stats`,
    districtsPath: `/v1/states/${profile.stateSlug}/districts`,
    trendsPath: `/v1/states/${profile.stateSlug}/trends`,
    dataPagePath: `/states/${profile.stateSlug}/data`,
    districtsCsvPath: `/states/${profile.stateSlug}/data/districts.csv`,
  };
}

async function fetchJson<T extends z.ZodTypeAny>(url: string, schema: T, expectedStatus = 200): Promise<z.infer<T>> {
  const response = await fetch(url);
  return schema.parse(await readResponse(url, response, expectedStatus));
}

async function fetchText(url: string, expectedStatus = 200): Promise<string> {
  return (await fetchTextResponse(url, expectedStatus)).body;
}

async function fetchTextResponse(url: string, expectedStatus = 200): Promise<{ body: string; response: Response }> {
  const response = await fetch(url);
  const body = await readResponse(url, response, expectedStatus);
  if (typeof body !== "string") {
    throw new Error(`Expected text response from ${url}.`);
  }
  return { body, response };
}

async function readResponse(url: string, response: Response, expectedStatus: number): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();

  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected ${url} to return ${expectedStatus}, received ${response.status}: ${typeof body === "string" ? body : JSON.stringify(body)}`,
    );
  }

  return body;
}

function assertMatchingSnapshot(label: string, actual: SnapshotMetadata, expected: SnapshotMetadata) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`Snapshot metadata mismatch for ${label}.`);
  }
}

function assertSnapshotState(snapshot: SnapshotMetadata, expectedStateCode: string, expectedStateName: string) {
  if (snapshot.stateCode !== expectedStateCode || snapshot.stateName !== expectedStateName) {
    throw new Error(
      `Snapshot state mismatch. Expected ${expectedStateCode}/${expectedStateName}, received ${snapshot.stateCode}/${snapshot.stateName}.`,
    );
  }
}

function assertCsvMetadataParity(csv: string, snapshot: SnapshotMetadata) {
  const [headerLine, firstDataLine] = csv.trim().split(/\r?\n/);
  if (!headerLine || !firstDataLine) {
    throw new Error("District CSV did not include a header and at least one data row.");
  }

  const headers = headerLine.split(",");
  const sourceSnapshotIndex = headers.indexOf("snapshot_date");
  const publishedAtIndex = headers.indexOf("published_at");
  const methodologyVersionIndex = headers.indexOf("methodology_version");

  if (sourceSnapshotIndex < 0 || publishedAtIndex < 0 || methodologyVersionIndex < 0) {
    throw new Error("District CSV is missing publication metadata columns.");
  }

  const cells = firstDataLine.split(",");
  if (
    readCsvCell(cells[sourceSnapshotIndex]) !== snapshot.sourceSnapshotAt ||
    readCsvCell(cells[publishedAtIndex]) !== snapshot.publishedAt ||
    readCsvCell(cells[methodologyVersionIndex]) !== snapshot.methodologyVersion
  ) {
    throw new Error("District CSV publication metadata does not match the public API snapshot.");
  }
}

function assertCacheProtection(label: string, response: Response) {
  const cacheControl = response.headers.get("cache-control") ?? "";
  const cdnCacheControl =
    response.headers.get("cloudflare-cdn-cache-control") ?? response.headers.get("cdn-cache-control") ?? "";

  if (!hasNoStoreDirective(cacheControl)) {
    throw new Error(`${label} is missing a no-store Cache-Control header.`);
  }

  if (cdnCacheControl.length > 0 && !hasNoStoreDirective(cdnCacheControl)) {
    throw new Error(`${label} is missing a no-store CDN cache header.`);
  }
}

function hasNoStoreDirective(value: string) {
  return value
    .split(",")
    .map((directive) => directive.trim().toLowerCase())
    .includes("no-store");
}

function readCsvCell(value: string | undefined) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
    return trimmed.slice(1, -1).replace(/""/g, "\"");
  }

  return trimmed;
}

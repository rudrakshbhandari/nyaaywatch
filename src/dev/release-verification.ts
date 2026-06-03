import { z } from "zod";

import {
  HighCourtSnapshotMetadataSchema,
  HighCourtStatsSchema,
  HighCourtTrendPointSchema,
} from "../domain/high-court-snapshot-schema.js";
import { SnapshotMetadataSchema, StateStatsSchema, TrendPointSchema, type QualityState } from "../domain/snapshot-schema.js";
import {
  SupremeCourtSnapshotMetadataSchema,
  SupremeCourtStatsSchema,
  SupremeCourtTrendPointSchema,
} from "../domain/supreme-court-snapshot-schema.js";
import { getPublicStateProfileBySlug } from "../geographies.js";
import { getPublicHighCourtProfileBySlug } from "../high-courts.js";
import { freshnessDays } from "../lib/time.js";
import { getSupremeCourtProfile } from "../supreme-court.js";

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

const HighCourtStatsResponseSchema = z.object({
  snapshot: HighCourtSnapshotMetadataSchema,
  stats: HighCourtStatsSchema,
});

const HighCourtTrendsResponseSchema = z.object({
  snapshot: HighCourtSnapshotMetadataSchema,
  trends: z.array(HighCourtTrendPointSchema),
});

const SupremeCourtStatsResponseSchema = z.object({
  snapshot: SupremeCourtSnapshotMetadataSchema,
  stats: SupremeCourtStatsSchema,
});

const SupremeCourtTrendsResponseSchema = z.object({
  snapshot: SupremeCourtSnapshotMetadataSchema,
  trends: z.array(SupremeCourtTrendPointSchema),
});

const OperatorUnauthorizedSchema = z.object({
  error: z.literal("Operator token required."),
});

const TRANSIENT_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const FETCH_RETRY_DELAYS_MS = [250, 1_000];

type SnapshotMetadata = z.infer<typeof SnapshotMetadataSchema>;
type HighCourtSnapshotMetadata = z.infer<typeof HighCourtSnapshotMetadataSchema>;
type SupremeCourtSnapshotMetadata = z.infer<typeof SupremeCourtSnapshotMetadataSchema>;
type CourtSnapshotMetadata = HighCourtSnapshotMetadata | SupremeCourtSnapshotMetadata;
type ReleaseTarget = ReturnType<typeof resolveReleaseTarget>;

export interface ReleaseVerificationSummary {
  baseUrl: string;
  checkedAt: string;
  target: {
    tier: "lower_court_state" | "high_court" | "supreme_court";
    identifier: string;
    label: string;
    stateCode?: string;
    stateName?: string;
    stateSlug?: string;
    courtCode?: string;
    courtName?: string;
    courtSlug?: string;
    statsPath: string;
    trendsPath: string;
    dataPagePath: string;
    operatorAuthPath: string;
    districtsPath?: string;
    districtsCsvPath?: string;
  };
  snapshot: {
    sourceSnapshotAt: string | null;
    referenceDateAt: string;
    referenceDateKind?: string;
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
  districtCount: number | null;
  trendCount: number;
  csvMetadataParity: true | null;
  publicDataCacheProtected: true;
  operatorAuthProtected: true;
}

export async function verifyPublicRelease(
  baseUrl: string,
  options: {
    stateSlug?: string;
    highCourtSlug?: string;
    supremeCourt?: boolean;
    now?: Date;
    /** Override the CSV parity retry delay. Pass 0 in tests to avoid real waits. */
    csvParityRetryDelayMs?: number;
  } = {},
): Promise<ReleaseVerificationSummary> {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const target = resolveReleaseTarget(options);
  const checkedAt = options.now ?? new Date();
  const retryDelayMs = options.csvParityRetryDelayMs ?? CSV_PARITY_RETRY_DELAY_MS;
  if (target.tier === "high_court") {
    return verifyHighCourtRelease(normalizedBaseUrl, target, checkedAt);
  }
  if (target.tier === "supreme_court") {
    return verifySupremeCourtRelease(normalizedBaseUrl, target, checkedAt);
  }

  return verifyLowerCourtRelease(normalizedBaseUrl, target, checkedAt, retryDelayMs);
}

async function verifyLowerCourtRelease(
  normalizedBaseUrl: string,
  target: Extract<ReleaseTarget, { tier: "lower_court_state" }>,
  checkedAt: Date,
  retryDelayMs: number,
): Promise<ReleaseVerificationSummary> {
  const [health, statsPayload, districtsPayload, trendsPayload, operatorAuthResult, dataPage, districtsCsv] =
    await Promise.all([
      fetchJson(`${normalizedBaseUrl}/health`, HealthResponseSchema),
      fetchJson(`${normalizedBaseUrl}${target.statsPath}`, StatsResponseSchema),
      fetchJson(`${normalizedBaseUrl}${target.districtsPath}`, DistrictsResponseSchema),
      fetchJson(`${normalizedBaseUrl}${target.trendsPath}`, TrendsResponseSchema),
      fetchJson(`${normalizedBaseUrl}${target.operatorAuthPath}`, OperatorUnauthorizedSchema, 401),
      fetchTextResponse(`${normalizedBaseUrl}${target.dataPagePath}`),
      fetchTextResponse(`${normalizedBaseUrl}${target.districtsCsvPath}`),
    ]);

  assertSnapshotState(statsPayload.snapshot, target.stateCode, target.stateName);
  assertMatchingSnapshot("districts", districtsPayload.snapshot, statsPayload.snapshot);
  assertMatchingSnapshot("trends", trendsPayload.snapshot, statsPayload.snapshot);
  assertCacheProtection("public data page", dataPage.response);
  assertCacheProtection("district CSV", districtsCsv.response);
  // Retry CSV parity once after a short wait. A Cloudflare cache propagation window
  // can cause a transient mismatch immediately after a snapshot publish — the API
  // returns the new snapshot while the CDN still serves the previous districts.csv.
  let csvBody = districtsCsv.body;
  try {
    assertCsvMetadataParity(csvBody, statsPayload.snapshot);
  } catch {
    await sleep(retryDelayMs);
    ({ body: csvBody } = await fetchTextResponse(`${normalizedBaseUrl}${target.districtsCsvPath}`));
    assertCsvMetadataParity(csvBody, statsPayload.snapshot);
  }
  const currentFreshnessDays = freshnessDays(statsPayload.snapshot.sourceSnapshotAt, checkedAt);

  return {
    baseUrl: normalizedBaseUrl,
    checkedAt: checkedAt.toISOString(),
    target,
    snapshot: {
      sourceSnapshotAt: statsPayload.snapshot.sourceSnapshotAt,
      referenceDateAt: statsPayload.snapshot.sourceSnapshotAt,
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

async function verifyHighCourtRelease(
  normalizedBaseUrl: string,
  target: Extract<ReleaseTarget, { tier: "high_court" }>,
  checkedAt: Date,
): Promise<ReleaseVerificationSummary> {
  const [health, statsPayload, trendsPayload, operatorAuthResult, dataPage] = await Promise.all([
    fetchJson(`${normalizedBaseUrl}/health`, HealthResponseSchema),
    fetchJson(`${normalizedBaseUrl}${target.statsPath}`, HighCourtStatsResponseSchema),
    fetchJson(`${normalizedBaseUrl}${target.trendsPath}`, HighCourtTrendsResponseSchema),
    fetchJson(`${normalizedBaseUrl}${target.operatorAuthPath}`, OperatorUnauthorizedSchema, 401),
    fetchTextResponse(`${normalizedBaseUrl}${target.dataPagePath}`),
  ]);

  assertHighCourtSnapshot(statsPayload.snapshot, target);
  assertMatchingSnapshotJson("high court trends", trendsPayload.snapshot, statsPayload.snapshot);
  assertCacheProtection(`${target.label} data page`, dataPage.response);
  const currentFreshnessDays = freshnessDays(statsPayload.snapshot.referenceDateAt, checkedAt);

  return {
    baseUrl: normalizedBaseUrl,
    checkedAt: checkedAt.toISOString(),
    target,
    snapshot: buildCourtSnapshotSummary(statsPayload.snapshot, currentFreshnessDays),
    health: {
      region: health.region,
      stateCode: health.stateCode,
    },
    districtCount: null,
    trendCount: trendsPayload.trends.length,
    csvMetadataParity: null,
    publicDataCacheProtected: true,
    operatorAuthProtected: true,
  };
}

async function verifySupremeCourtRelease(
  normalizedBaseUrl: string,
  target: Extract<ReleaseTarget, { tier: "supreme_court" }>,
  checkedAt: Date,
): Promise<ReleaseVerificationSummary> {
  const [health, statsPayload, trendsPayload, operatorAuthResult, dataPage] = await Promise.all([
    fetchJson(`${normalizedBaseUrl}/health`, HealthResponseSchema),
    fetchJson(`${normalizedBaseUrl}${target.statsPath}`, SupremeCourtStatsResponseSchema),
    fetchJson(`${normalizedBaseUrl}${target.trendsPath}`, SupremeCourtTrendsResponseSchema),
    fetchJson(`${normalizedBaseUrl}${target.operatorAuthPath}`, OperatorUnauthorizedSchema, 401),
    fetchTextResponse(`${normalizedBaseUrl}${target.dataPagePath}`),
  ]);

  assertSupremeCourtSnapshot(statsPayload.snapshot, target);
  assertMatchingSnapshotJson("supreme court trends", trendsPayload.snapshot, statsPayload.snapshot);
  assertCacheProtection("Supreme Court data page", dataPage.response);
  const currentFreshnessDays = freshnessDays(statsPayload.snapshot.referenceDateAt, checkedAt);

  return {
    baseUrl: normalizedBaseUrl,
    checkedAt: checkedAt.toISOString(),
    target,
    snapshot: buildCourtSnapshotSummary(statsPayload.snapshot, currentFreshnessDays),
    health: {
      region: health.region,
      stateCode: health.stateCode,
    },
    districtCount: null,
    trendCount: trendsPayload.trends.length,
    csvMetadataParity: null,
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

function resolveReleaseTarget(options: { stateSlug?: string; highCourtSlug?: string; supremeCourt?: boolean }) {
  const selectedTargets = [options.stateSlug, options.highCourtSlug, options.supremeCourt ? "supreme-court" : undefined]
    .filter((value) => typeof value === "string" && value.trim().length > 0);
  if (selectedTargets.length > 1) {
    throw new Error("Select only one release target: --state-slug, --high-court, or --supreme-court.");
  }

  if (options.supremeCourt) {
    const profile = getSupremeCourtProfile();
    return {
      tier: "supreme_court" as const,
      identifier: profile.courtCode,
      label: profile.courtName,
      courtCode: profile.courtCode,
      courtName: profile.courtName,
      courtSlug: profile.courtSlug,
      statsPath: "/v1/supreme-court/stats",
      trendsPath: "/v1/supreme-court/trends",
      dataPagePath: "/supreme-court/data",
      operatorAuthPath: "/operator/supreme-court/publications",
    };
  }

  if (options.highCourtSlug) {
    const profile = getPublicHighCourtProfileBySlug(options.highCourtSlug);
    if (!profile) {
      throw new Error(`Unsupported public High Court slug: ${options.highCourtSlug}`);
    }

    return {
      tier: "high_court" as const,
      identifier: profile.courtCode,
      label: profile.courtName,
      courtCode: profile.courtCode,
      courtName: profile.courtName,
      courtSlug: profile.courtSlug,
      statsPath: `/v1/high-courts/${profile.courtSlug}/stats`,
      trendsPath: `/v1/high-courts/${profile.courtSlug}/trends`,
      dataPagePath: `/high-courts/${profile.courtSlug}/data`,
      operatorAuthPath: `/operator/high-courts/${profile.courtSlug}/publications`,
    };
  }

  const defaultStateSlug = "himachal-pradesh";
  const resolvedStateSlug = options.stateSlug?.trim() || defaultStateSlug;
  const profile = getPublicStateProfileBySlug(resolvedStateSlug);
  if (!profile) {
    throw new Error(`Unsupported public state slug: ${resolvedStateSlug}`);
  }

  if (profile.stateCode === "HP") {
    return {
      tier: "lower_court_state" as const,
      identifier: profile.stateCode,
      label: profile.stateName,
      stateCode: profile.stateCode,
      stateName: profile.stateName,
      stateSlug: profile.stateSlug,
      statsPath: "/v1/stats/himachal",
      districtsPath: "/v1/districts",
      trendsPath: "/v1/trends",
      dataPagePath: "/data",
      districtsCsvPath: "/data/districts.csv",
      operatorAuthPath: "/operator/publications",
    };
  }

  return {
    tier: "lower_court_state" as const,
    identifier: profile.stateCode,
    label: profile.stateName,
    stateCode: profile.stateCode,
    stateName: profile.stateName,
    stateSlug: profile.stateSlug,
    statsPath: `/v1/states/${profile.stateSlug}/stats`,
    districtsPath: `/v1/states/${profile.stateSlug}/districts`,
    trendsPath: `/v1/states/${profile.stateSlug}/trends`,
    dataPagePath: `/states/${profile.stateSlug}/data`,
    districtsCsvPath: `/states/${profile.stateSlug}/data/districts.csv`,
    operatorAuthPath: "/operator/publications",
  };
}

export const CSV_PARITY_RETRY_DELAY_MS = 15_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T extends z.ZodTypeAny>(url: string, schema: T, expectedStatus = 200): Promise<z.infer<T>> {
  const response = await fetchWithTransientRetry(url, expectedStatus);
  return schema.parse(await readResponse(url, response, expectedStatus));
}

async function fetchText(url: string, expectedStatus = 200): Promise<string> {
  return (await fetchTextResponse(url, expectedStatus)).body;
}

async function fetchTextResponse(url: string, expectedStatus = 200): Promise<{ body: string; response: Response }> {
  const response = await fetchWithTransientRetry(url, expectedStatus);
  const body = await readResponse(url, response, expectedStatus);
  if (typeof body !== "string") {
    throw new Error(`Expected text response from ${url}.`);
  }
  return { body, response };
}

async function fetchWithTransientRetry(url: string, expectedStatus: number): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= FETCH_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.status === expectedStatus || !TRANSIENT_HTTP_STATUSES.has(response.status)) {
        return response;
      }
      if (attempt === FETCH_RETRY_DELAYS_MS.length) {
        return response;
      }
      lastError = new Error(`Transient HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    const delayMs = FETCH_RETRY_DELAYS_MS[attempt];
    if (delayMs !== undefined) {
      await sleep(delayMs);
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Failed to fetch ${url} after transient retries: ${message}`);
}

function sleep(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
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
  if (!snapshotsMatch(actual, expected)) {
    throw new Error(`Snapshot metadata mismatch for ${label}.`);
  }
}

function assertMatchingSnapshotJson(label: string, actual: CourtSnapshotMetadata, expected: CourtSnapshotMetadata) {
  if (!snapshotsMatch(actual, expected)) {
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

function assertHighCourtSnapshot(
  snapshot: HighCourtSnapshotMetadata,
  target: Extract<ReleaseTarget, { tier: "high_court" }>,
) {
  if (
    snapshot.courtCode !== target.courtCode ||
    snapshot.courtSlug !== target.courtSlug ||
    snapshot.courtName !== target.courtName
  ) {
    throw new Error(
      `High Court snapshot mismatch. Expected ${target.courtCode}/${target.courtSlug}, received ${snapshot.courtCode}/${snapshot.courtSlug}.`,
    );
  }
}

function assertSupremeCourtSnapshot(
  snapshot: SupremeCourtSnapshotMetadata,
  target: Extract<ReleaseTarget, { tier: "supreme_court" }>,
) {
  if (
    snapshot.courtCode !== target.courtCode ||
    snapshot.courtSlug !== target.courtSlug ||
    snapshot.courtName !== target.courtName
  ) {
    throw new Error(
      `Supreme Court snapshot mismatch. Expected ${target.courtCode}/${target.courtSlug}, received ${snapshot.courtCode}/${snapshot.courtSlug}.`,
    );
  }
}

function snapshotsMatch(actual: unknown, expected: unknown) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function buildCourtSnapshotSummary(snapshot: CourtSnapshotMetadata, currentFreshnessDays: number) {
  return {
    sourceSnapshotAt: snapshot.sourceSnapshotAt,
    referenceDateAt: snapshot.referenceDateAt,
    referenceDateKind: snapshot.referenceDateKind,
    publishedAt: snapshot.publishedAt,
    freshnessDaysAtPublish: snapshot.freshnessDays,
    currentFreshnessDays,
    methodologyVersion: snapshot.methodologyVersion,
    qualityState: snapshot.qualityState,
    publishedFromRunId: snapshot.publishedFromRunId ?? null,
    replayedFromRunId: snapshot.replayedFromRunId ?? null,
  };
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

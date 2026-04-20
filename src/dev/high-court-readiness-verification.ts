import { z } from "zod";

import { HighCourtCoveredGeographySchema } from "../domain/high-court-capture-schema.js";
import {
  HighCourtPublishedSnapshotSchema,
  HighCourtReferenceDateKindSchema,
  HighCourtSnapshotMetadataSchema,
  HighCourtStatsSchema,
  HighCourtTrendPointSchema,
} from "../domain/high-court-snapshot-schema.js";
import { getHighCourtProfileBySlug } from "../high-courts.js";

const OperatorUnauthorizedSchema = z.object({
  error: z.literal("Operator token required."),
});

const RunRecordSchema = z.object({
  id: z.string().min(1),
  scopeType: z.enum(["lower_court_state", "high_court", "supreme_court"]),
  scopeCode: z.string().min(1),
  stateCode: z.string().min(1),
  sourceLabel: z.string().min(1),
  sourceSnapshotAt: z.string().datetime(),
  methodologyVersion: z.string().min(1),
  status: z.string().min(1),
  qualityState: z.string().min(1),
  replayOfRunId: z.string().min(1).nullable(),
  note: z.string().nullable(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});

const PublicationRecordSchema = z.object({
  id: z.string().min(1),
  scopeType: z.enum(["lower_court_state", "high_court", "supreme_court"]),
  scopeCode: z.string().min(1),
  stateCode: z.string().min(1),
  publishedSnapshotId: z.string().min(1),
  action: z.enum(["publish", "rollback"]),
  note: z.string().nullable(),
  previousPublicationId: z.string().nullable(),
  createdAt: z.string().datetime(),
});

const HighCourtPublicationHistoryEntrySchema = z.object({
  publication: PublicationRecordSchema,
  snapshot: HighCourtSnapshotMetadataSchema.extend({
    id: z.string().min(1),
  }),
  run: z.object({
    id: z.string().min(1),
    status: z.string().min(1),
    replayOfRunId: z.string().min(1).nullable(),
    sourceSnapshotAt: z.string().datetime(),
    methodologyVersion: z.string().min(1),
    qualityState: z.string().min(1),
  }),
  isActive: z.boolean(),
});

const HighCourtDetailResponseSchema = z.object({
  court: z.object({
    courtCode: z.string().min(1),
    courtSlug: z.string().min(1),
    courtName: z.string().min(1),
    coveredGeographies: z.array(HighCourtCoveredGeographySchema).min(1),
    publicBeta: z.boolean(),
  }),
  snapshot: z.object({
    id: z.string().min(1),
    runId: z.string().min(1),
    scopeType: z.enum(["lower_court_state", "high_court", "supreme_court"]),
    scopeCode: z.string().min(1),
    stateCode: z.string().min(1),
    payloadVersion: z.number().int().positive(),
    payload: HighCourtPublishedSnapshotSchema,
    checksumSha256: z.string().min(1),
    createdAt: z.string().datetime(),
  }).nullable(),
  stats: HighCourtStatsSchema.nullable(),
  trends: z.array(HighCourtTrendPointSchema).nullable(),
  publications: z.array(HighCourtPublicationHistoryEntrySchema),
});

const HighCourtRunsResponseSchema = z.object({
  court: z.object({
    courtCode: z.string().min(1),
    courtSlug: z.string().min(1),
  }),
  runs: z.array(RunRecordSchema),
});

const HighCourtPublicationsResponseSchema = z.object({
  court: z.object({
    courtCode: z.string().min(1),
    courtSlug: z.string().min(1),
  }),
  publications: z.array(HighCourtPublicationHistoryEntrySchema),
});

type HighCourtDetailResponse = z.infer<typeof HighCourtDetailResponseSchema>;
type HighCourtRunsResponse = z.infer<typeof HighCourtRunsResponseSchema>;
type HighCourtPublicationsResponse = z.infer<typeof HighCourtPublicationsResponseSchema>;

export interface HighCourtInternalReadinessSummary {
  baseUrl: string;
  checkedAt: string;
  target: {
    courtCode: string;
    courtSlug: string;
    courtName: string;
    coveredGeographies: Array<z.infer<typeof HighCourtCoveredGeographySchema>>;
    detailPath: string;
    runsPath: string;
    publicationsPath: string;
  };
  operatorAuthProtected: true;
  snapshot: {
    publicationId: string;
    snapshotId: string;
    publishedAt: string;
    referenceDateAt: string;
    referenceDateKind: z.infer<typeof HighCourtReferenceDateKindSchema>;
    sourceSnapshotAt: string | null;
    methodologyVersion: string;
    qualityState: string;
    publishedFromRunId: string | null;
    replayedFromRunId: string | null;
  } | null;
  internalEvidence: {
    runCount: number;
    publicationCount: number;
    publishCount: number;
    rollbackCount: number;
    replayedRunCount: number;
    latestRunId: string | null;
    latestRunStatus: string | null;
    latestRunScopeType: "lower_court_state" | "high_court" | "supreme_court" | null;
    latestRunScopeCode: string | null;
    latestPublicationId: string | null;
    latestPublicationScopeType: "lower_court_state" | "high_court" | "supreme_court" | null;
    latestPublicationScopeCode: string | null;
    rollbackTargetPublicationId: string | null;
  };
  gates: {
    hasPublishedSnapshot: boolean;
    hasReplayEvidence: boolean;
    hasRollbackEvidence: boolean;
    referenceDateContractDefensible: boolean;
    canonicalScopeAligned: boolean;
    internalProofBarSatisfied: boolean;
  };
}

export async function verifyHighCourtInternalReadiness(
  baseUrl: string,
  operatorToken: string,
  options: { courtSlug: string; now?: Date },
): Promise<HighCourtInternalReadinessSummary> {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const target = resolveHighCourtTarget(options.courtSlug);
  const checkedAt = options.now ?? new Date();

  await fetchJson(`${normalizedBaseUrl}/operator/high-courts`, OperatorUnauthorizedSchema, {
    expectedStatus: 401,
  });

  const [detail, runsResponse, publicationsResponse] = await Promise.all([
    fetchJson(`${normalizedBaseUrl}${target.detailPath}`, HighCourtDetailResponseSchema, {
      operatorToken,
    }),
    fetchJson(`${normalizedBaseUrl}${target.runsPath}`, HighCourtRunsResponseSchema, {
      operatorToken,
    }),
    fetchJson(`${normalizedBaseUrl}${target.publicationsPath}`, HighCourtPublicationsResponseSchema, {
      operatorToken,
    }),
  ]);

  assertMatchingHighCourt(detail, runsResponse, publicationsResponse, target.courtSlug);

  const activePublication = publicationsResponse.publications.find((entry) => entry.isActive) ?? null;
  const publishCount = publicationsResponse.publications.filter((entry) => entry.publication.action === "publish").length;
  const rollbackCount = publicationsResponse.publications.filter((entry) => entry.publication.action === "rollback").length;
  const replayedRunCount = runsResponse.runs.filter((run) => run.replayOfRunId !== null).length;
  const hasPublishedSnapshot = detail.snapshot !== null && activePublication !== null;
  const referenceDateContractDefensible =
    detail.snapshot !== null &&
    (detail.snapshot.payload.snapshot.sourceSnapshotAt !== null || detail.snapshot.payload.snapshot.referenceDateKind === "captured_at");
  const hasReplayEvidence = replayedRunCount > 0;
  const hasRollbackEvidence = rollbackCount > 0;
  const canonicalScopeAligned =
    (detail.snapshot === null || (detail.snapshot.scopeType === "high_court" && detail.snapshot.scopeCode === target.courtCode)) &&
    runsResponse.runs.every((run) => run.scopeType === "high_court" && run.scopeCode === target.courtCode) &&
    publicationsResponse.publications.every(
      (entry) => entry.publication.scopeType === "high_court" && entry.publication.scopeCode === target.courtCode,
    );

  return {
    baseUrl: normalizedBaseUrl,
    checkedAt: checkedAt.toISOString(),
    target,
    operatorAuthProtected: true,
    snapshot:
      detail.snapshot && activePublication
        ? {
            publicationId: activePublication.publication.id,
            snapshotId: activePublication.snapshot.id,
            publishedAt: detail.snapshot.payload.snapshot.publishedAt,
            referenceDateAt: detail.snapshot.payload.snapshot.referenceDateAt,
            referenceDateKind: detail.snapshot.payload.snapshot.referenceDateKind,
            sourceSnapshotAt: detail.snapshot.payload.snapshot.sourceSnapshotAt,
            methodologyVersion: detail.snapshot.payload.snapshot.methodologyVersion,
            qualityState: detail.snapshot.payload.snapshot.qualityState,
            publishedFromRunId: detail.snapshot.payload.snapshot.publishedFromRunId ?? null,
            replayedFromRunId: detail.snapshot.payload.snapshot.replayedFromRunId ?? null,
          }
        : null,
    internalEvidence: {
      runCount: runsResponse.runs.length,
      publicationCount: publicationsResponse.publications.length,
      publishCount,
      rollbackCount,
      replayedRunCount,
      latestRunId: runsResponse.runs[0]?.id ?? null,
      latestRunStatus: runsResponse.runs[0]?.status ?? null,
      latestRunScopeType: runsResponse.runs[0]?.scopeType ?? null,
      latestRunScopeCode: runsResponse.runs[0]?.scopeCode ?? null,
      latestPublicationId: publicationsResponse.publications[0]?.publication.id ?? null,
      latestPublicationScopeType: publicationsResponse.publications[0]?.publication.scopeType ?? null,
      latestPublicationScopeCode: publicationsResponse.publications[0]?.publication.scopeCode ?? null,
      rollbackTargetPublicationId: publicationsResponse.publications[1]?.publication.id ?? null,
    },
    gates: {
      hasPublishedSnapshot,
      hasReplayEvidence,
      hasRollbackEvidence,
      referenceDateContractDefensible,
      canonicalScopeAligned,
      internalProofBarSatisfied:
        hasPublishedSnapshot && hasReplayEvidence && hasRollbackEvidence && referenceDateContractDefensible && canonicalScopeAligned,
    },
  };
}

function normalizeBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.trim();
  if (trimmed.length === 0) {
    throw new Error("A base URL is required.");
  }

  return trimmed.replace(/\/+$/, "");
}

function resolveHighCourtTarget(courtSlug: string) {
  const profile = getHighCourtProfileBySlug(courtSlug.trim());
  if (!profile) {
    throw new Error(`Unsupported High Court slug: ${courtSlug}`);
  }

  return {
    courtCode: profile.courtCode,
    courtSlug: profile.courtSlug,
    courtName: profile.courtName,
    coveredGeographies: profile.coveredGeographies,
    detailPath: `/operator/high-courts/${profile.courtSlug}`,
    runsPath: `/operator/high-courts/${profile.courtSlug}/runs`,
    publicationsPath: `/operator/high-courts/${profile.courtSlug}/publications`,
  };
}

async function fetchJson<T extends z.ZodTypeAny>(
  url: string,
  schema: T,
  options: { operatorToken?: string; expectedStatus?: number } = {},
): Promise<z.infer<T>> {
  const response = await fetch(url, {
    headers: options.operatorToken
      ? {
          accept: "application/json",
          "x-operator-token": options.operatorToken,
        }
      : {
          accept: "application/json",
        },
  });
  const expectedStatus = options.expectedStatus ?? 200;
  const body = await readResponse(url, response, expectedStatus);
  return schema.parse(body);
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

function assertMatchingHighCourt(
  detail: HighCourtDetailResponse,
  runs: HighCourtRunsResponse,
  publications: HighCourtPublicationsResponse,
  expectedCourtSlug: string,
) {
  if (detail.court.courtSlug !== expectedCourtSlug) {
    throw new Error(`High Court detail route returned ${detail.court.courtSlug}, expected ${expectedCourtSlug}.`);
  }

  if (detail.snapshot && (detail.snapshot.scopeType !== "high_court" || detail.snapshot.scopeCode !== detail.court.courtCode)) {
    throw new Error(`High Court detail snapshot scope did not match ${detail.court.courtCode}.`);
  }

  if (runs.court.courtSlug !== expectedCourtSlug) {
    throw new Error(`High Court runs route returned ${runs.court.courtSlug}, expected ${expectedCourtSlug}.`);
  }

  if (publications.court.courtSlug !== expectedCourtSlug) {
    throw new Error(`High Court publications route returned ${publications.court.courtSlug}, expected ${expectedCourtSlug}.`);
  }

  if (JSON.stringify(detail.court.coveredGeographies) !== JSON.stringify(getHighCourtProfileBySlug(expectedCourtSlug)?.coveredGeographies ?? [])) {
    throw new Error(`High Court detail route returned unexpected covered geographies for ${expectedCourtSlug}.`);
  }
}

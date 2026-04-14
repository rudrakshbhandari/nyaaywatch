import { z } from "zod";

export const QualityStatusSchema = z.enum(["complete", "partial"]);
export const FreshnessStatusSchema = z.enum(["fresh", "stale"]);
export const TrendDirectionSchema = z.enum(["rising", "falling", "flat"]);

export const TrendPointSchema = z.object({
  snapshotDate: z.string(),
  pendingCases: z.number().nonnegative(),
});

export const DistrictTrendPointSchema = z.object({
  snapshotDate: z.string(),
  pendingCases: z.number().nonnegative(),
  disposalRatePct: z.number().nonnegative(),
});

export const FlaggedSignalSchema = z.object({
  slug: z.string(),
  label: z.string(),
  summary: z.string(),
});

export const DistrictSnapshotSchema = z.object({
  slug: z.string(),
  name: z.string(),
  rank: z.number().int().positive(),
  pendingCases: z.number().nonnegative(),
  backlogChangePct: z.number(),
  disposalRatePct: z.number().nonnegative(),
  filingToDisposalRatio: z.number().nonnegative(),
  timeToJusticeIndex: z.number().nonnegative(),
  flagged: z.boolean(),
  signalSummary: z.string(),
  plainLanguageSummary: z.string(),
  qualityStatus: QualityStatusSchema,
  evidenceNotes: z.array(z.string()),
  trend: z.array(DistrictTrendPointSchema),
});

export const SnapshotSummarySchema = z.object({
  pendingCases: z.number().nonnegative(),
  filingDisposalGapPct: z.number(),
  districtsFlagged: z.number().int().nonnegative(),
  timeToJusticeIndex: z.number().nonnegative(),
  trendDirection: TrendDirectionSchema,
});

export const SnapshotRunSchema = z.object({
  runId: z.string(),
  status: z.enum(["completed", "failed"]),
  snapshotDate: z.string(),
  completedAt: z.string(),
  methodologyVersion: z.string(),
  sourceName: z.string(),
  geographySlug: z.literal("himachal-pradesh"),
  qualityStatus: QualityStatusSchema,
  summary: SnapshotSummarySchema,
  flaggedSignals: z.array(FlaggedSignalSchema),
  trend: z.array(TrendPointSchema),
  districts: z.array(DistrictSnapshotSchema),
});

export const PublishStateSchema = z.object({
  publishedRunId: z.string().nullable(),
  publishedAt: z.string().nullable(),
});

export const SnapshotTrustMetadataSchema = z.object({
  runId: z.string(),
  snapshotDate: z.string(),
  publishedAt: z.string(),
  methodologyVersion: z.string(),
  sourceName: z.string(),
  freshnessStatus: FreshnessStatusSchema,
  ageDays: z.number().int().nonnegative(),
  qualityStatus: QualityStatusSchema,
});

export const DistrictPreviewSchema = DistrictSnapshotSchema.pick({
  slug: true,
  name: true,
  rank: true,
  pendingCases: true,
  backlogChangePct: true,
  disposalRatePct: true,
  timeToJusticeIndex: true,
  flagged: true,
  signalSummary: true,
  qualityStatus: true,
});

export const HimachalStatsPayloadSchema = z.object({
  geography: z.object({
    code: z.literal("hp"),
    name: z.literal("Himachal Pradesh"),
  }),
  snapshot: SnapshotTrustMetadataSchema,
  metrics: SnapshotSummarySchema,
  trend: z.array(TrendPointSchema),
  flaggedSignals: z.array(FlaggedSignalSchema),
  districtsPreview: z.array(DistrictPreviewSchema),
});

export const DistrictDetailPayloadSchema = z.object({
  geography: z.object({
    code: z.literal("hp"),
    name: z.literal("Himachal Pradesh"),
  }),
  snapshot: SnapshotTrustMetadataSchema,
  district: DistrictSnapshotSchema,
});

export const OperatorRunStatusSchema = z.object({
  runId: z.string(),
  status: z.enum(["completed", "failed"]),
  snapshotDate: z.string(),
  qualityStatus: QualityStatusSchema,
  publishable: z.boolean(),
  reasons: z.array(z.string()),
  currentlyPublished: z.boolean(),
});

export type DistrictDetailPayload = z.infer<typeof DistrictDetailPayloadSchema>;
export type DistrictPreview = z.infer<typeof DistrictPreviewSchema>;
export type HimachalStatsPayload = z.infer<typeof HimachalStatsPayloadSchema>;
export type OperatorRunStatus = z.infer<typeof OperatorRunStatusSchema>;
export type PublishState = z.infer<typeof PublishStateSchema>;
export type SnapshotRun = z.infer<typeof SnapshotRunSchema>;
export type SnapshotTrustMetadata = z.infer<typeof SnapshotTrustMetadataSchema>;

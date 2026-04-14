import { z } from "zod";

export const QualityStateSchema = z.enum(["complete", "partial", "stale"]);

export const SnapshotMetadataSchema = z.object({
  stateCode: z.literal("HP"),
  stateName: z.literal("Himachal Pradesh"),
  sourceName: z.string().min(1),
  sourceSnapshotAt: z.string().datetime(),
  publishedAt: z.string().datetime(),
  methodologyVersion: z.string().min(1),
  qualityState: QualityStateSchema,
  freshnessDays: z.number().int().nonnegative(),
  sourceAttribution: z.string().min(1),
  publishedFromRunId: z.string().min(1).optional(),
  replayedFromRunId: z.string().min(1).optional(),
});

export const StateStatsSchema = z.object({
  pendingCases: z.number().int().nonnegative(),
  disposalRate: z.number().nonnegative(),
  medianCaseAgeDays: z.number().int().nonnegative(),
  flaggedDistricts: z.number().int().nonnegative(),
});

export const DistrictSnapshotSchema = z.object({
  districtId: z.string().min(1),
  districtName: z.string().min(1),
  rank: z.number().int().positive(),
  backlogCases: z.number().int().nonnegative(),
  disposalRate: z.number().nonnegative(),
  medianAgeDays: z.number().int().nonnegative(),
  filingVsDisposalGap: z.number(),
  flagReason: z.string().min(1),
  summary: z.string().min(1),
});

export const TrendPointSchema = z.object({
  snapshotDate: z.string().datetime(),
  pendingCases: z.number().int().nonnegative(),
  disposalRate: z.number().nonnegative(),
});

export const PublishedSnapshotSchema = z.object({
  snapshot: SnapshotMetadataSchema,
  stats: StateStatsSchema,
  districts: z.array(DistrictSnapshotSchema).min(1),
  trends: z.array(TrendPointSchema).min(1),
});

export type QualityState = z.infer<typeof QualityStateSchema>;
export type PublishedSnapshot = z.infer<typeof PublishedSnapshotSchema>;
export type DistrictSnapshot = z.infer<typeof DistrictSnapshotSchema>;

import { z } from "zod";

import { QualityStateSchema } from "./snapshot-schema.js";

export const HighCourtReferenceDateKindSchema = z.enum(["source_snapshot_at", "captured_at"]);

export const HighCourtSnapshotMetadataSchema = z.object({
  courtTier: z.literal("high_court"),
  courtCode: z.string().min(1),
  courtSlug: z.string().min(1),
  courtName: z.string().min(1),
  stateCode: z.string().min(1),
  stateName: z.string().min(1),
  sourceName: z.string().min(1),
  sourceSnapshotAt: z.string().datetime().nullable(),
  referenceDateAt: z.string().datetime(),
  referenceDateKind: HighCourtReferenceDateKindSchema,
  publishedAt: z.string().datetime(),
  methodologyVersion: z.string().min(1),
  qualityState: QualityStateSchema,
  freshnessDays: z.number().int().nonnegative(),
  sourceAttribution: z.string().min(1),
  publishedFromRunId: z.string().min(1).optional(),
  replayedFromRunId: z.string().min(1).optional(),
});

export const HighCourtStatsSchema = z.object({
  pendingCivilCases: z.number().int().nonnegative(),
  pendingCriminalCases: z.number().int().nonnegative(),
  pendingTotalCases: z.number().int().nonnegative(),
  institutedLastMonthCivilCases: z.number().int().nonnegative(),
  institutedLastMonthCriminalCases: z.number().int().nonnegative(),
  institutedLastMonthTotalCases: z.number().int().nonnegative(),
  disposedLastMonthCivilCases: z.number().int().nonnegative(),
  disposedLastMonthCriminalCases: z.number().int().nonnegative(),
  disposedLastMonthTotalCases: z.number().int().nonnegative(),
});

export const HighCourtAgeBucketsSchema = z.object({
  lessThanOneYear: z.number().int().nonnegative(),
  oneToThreeYears: z.number().int().nonnegative(),
  threeToFiveYears: z.number().int().nonnegative(),
  fiveToTenYears: z.number().int().nonnegative(),
  aboveTenYears: z.number().int().nonnegative(),
});

export const HighCourtCaseTypeBreakdownSchema = z.object({
  caseType: z.string().min(1),
  civilCases: z.number().int().nonnegative(),
  criminalCases: z.number().int().nonnegative(),
  totalCases: z.number().int().nonnegative(),
});

export const HighCourtTrendPointSchema = z.object({
  referenceDateAt: z.string().datetime(),
  referenceDateKind: HighCourtReferenceDateKindSchema,
  pendingTotalCases: z.number().int().nonnegative(),
  institutedLastMonthTotalCases: z.number().int().nonnegative(),
  disposedLastMonthTotalCases: z.number().int().nonnegative(),
});

export const HighCourtPublishedSnapshotSchema = z.object({
  snapshot: HighCourtSnapshotMetadataSchema,
  stats: HighCourtStatsSchema,
  ageBuckets: HighCourtAgeBucketsSchema,
  caseTypeBreakdown: z.array(HighCourtCaseTypeBreakdownSchema).min(1).optional(),
  trends: z.array(HighCourtTrendPointSchema).min(1),
});

export type HighCourtPublishedSnapshot = z.infer<typeof HighCourtPublishedSnapshotSchema>;

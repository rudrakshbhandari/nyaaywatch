import { z } from "zod";

import { QualityStateSchema } from "./snapshot-schema.js";

export const SupremeCourtReferenceDateKindSchema = z.enum(["source_snapshot_at", "captured_at"]);

export const SupremeCourtSnapshotMetadataSchema = z.object({
  courtTier: z.literal("supreme_court"),
  courtCode: z.literal("SCI"),
  courtSlug: z.literal("supreme-court"),
  courtName: z.literal("Supreme Court of India"),
  sourceName: z.string().min(1),
  sourceSnapshotAt: z.string().datetime().nullable(),
  referenceDateAt: z.string().datetime(),
  referenceDateKind: SupremeCourtReferenceDateKindSchema,
  publishedAt: z.string().datetime(),
  methodologyVersion: z.string().min(1),
  qualityState: QualityStateSchema,
  freshnessDays: z.number().int().nonnegative(),
  sourceAttribution: z.string().min(1),
  publishedFromRunId: z.string().min(1).optional(),
  replayedFromRunId: z.string().min(1).optional(),
});

export const SupremeCourtStatsSchema = z.object({
  pendingCivilRegisteredCases: z.number().int().nonnegative(),
  pendingCivilUnregisteredCases: z.number().int().nonnegative(),
  pendingCivilTotalCases: z.number().int().nonnegative(),
  pendingCriminalRegisteredCases: z.number().int().nonnegative(),
  pendingCriminalUnregisteredCases: z.number().int().nonnegative(),
  pendingCriminalTotalCases: z.number().int().nonnegative(),
  pendingRegisteredCases: z.number().int().nonnegative(),
  pendingUnregisteredCases: z.number().int().nonnegative(),
  pendingTotalCases: z.number().int().nonnegative(),
  institutedLastMonthCivilCases: z.number().int().nonnegative(),
  institutedLastMonthCriminalCases: z.number().int().nonnegative(),
  institutedLastMonthTotalCases: z.number().int().nonnegative(),
  disposedLastMonthCivilCases: z.number().int().nonnegative(),
  disposedLastMonthCriminalCases: z.number().int().nonnegative(),
  disposedLastMonthTotalCases: z.number().int().nonnegative(),
  institutedCurrentYearCivilCases: z.number().int().nonnegative(),
  institutedCurrentYearCriminalCases: z.number().int().nonnegative(),
  institutedCurrentYearTotalCases: z.number().int().nonnegative(),
  disposedCurrentYearCivilCases: z.number().int().nonnegative(),
  disposedCurrentYearCriminalCases: z.number().int().nonnegative(),
  disposedCurrentYearTotalCases: z.number().int().nonnegative(),
});

export const SupremeCourtTrendPointSchema = z.object({
  referenceDateAt: z.string().datetime(),
  referenceDateKind: SupremeCourtReferenceDateKindSchema,
  pendingTotalCases: z.number().int().nonnegative(),
  institutedLastMonthTotalCases: z.number().int().nonnegative(),
  disposedLastMonthTotalCases: z.number().int().nonnegative(),
});

export const SupremeCourtPublishedSnapshotSchema = z.object({
  snapshot: SupremeCourtSnapshotMetadataSchema,
  stats: SupremeCourtStatsSchema,
  trends: z.array(SupremeCourtTrendPointSchema).min(1),
});

export type SupremeCourtPublishedSnapshot = z.infer<typeof SupremeCourtPublishedSnapshotSchema>;

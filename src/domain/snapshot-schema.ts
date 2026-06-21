import { z } from "zod";

export const QualityStateSchema = z.enum(["complete", "partial", "stale"]);
export const ReferenceDateKindSchema = z.enum(["source_snapshot_at", "captured_at"]);

export const MissingMetricReasonSchema = z.enum([
  "source-not-published",
  "insufficient-history",
  "incomplete-breakdown",
  "not-applicable",
]);

const MissingMetricSchema = z.object({
  state: z.literal("missing"),
  reason: MissingMetricReasonSchema,
});

export const MetricValueSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("ok"), value: z.number() }),
  MissingMetricSchema,
]);

export type MissingMetricReason = z.infer<typeof MissingMetricReasonSchema>;
export type MetricValue = z.infer<typeof MetricValueSchema>;

const MISSING_SOURCE_NOT_PUBLISHED = {
  state: "missing",
  reason: "source-not-published",
} as const;

const MISSING_INCOMPLETE_BREAKDOWN = {
  state: "missing",
  reason: "incomplete-breakdown",
} as const;

const MetricValueOrLegacyNumberSchema = z
  .union([
    z.number().transform((value) => ({ state: "ok" as const, value })),
    MetricValueSchema,
  ])
  .default(MISSING_SOURCE_NOT_PUBLISHED);

const NonNegativeIntegerMetricValueSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("ok"), value: z.number().int().nonnegative() }),
  MissingMetricSchema,
]);

const NonNegativeIntegerMetricValueOrLegacyNumberSchema = z
  .union([
    z.number().int().nonnegative().transform((value) => ({ state: "ok" as const, value })),
    NonNegativeIntegerMetricValueSchema,
  ])
  .default(MISSING_SOURCE_NOT_PUBLISHED);

const EMPTY_AGE_BUCKETS = {
  lessThanOneYear: 0,
  oneToThreeYears: 0,
  threeToFiveYears: 0,
  fiveToTenYears: 0,
  aboveTenYears: 0,
};

const EMPTY_OLD_CASE_BURDEN = {
  threePlusYearsCases: 0,
  fivePlusYearsCases: 0,
  tenPlusYearsCases: 0,
  threePlusYearsShare: 0,
  fivePlusYearsShare: 0,
  tenPlusYearsShare: 0,
};

const EMPTY_WATCHLIST_PERSISTENCE = {
  flaggedInLastThree: 0,
  lastThreeWindow: 0,
  flaggedInLastSix: 0,
  lastSixWindow: 0,
};

export const AgeBucketsSchema = z.object({
  lessThanOneYear: z.number().int().nonnegative().default(0),
  oneToThreeYears: z.number().int().nonnegative().default(0),
  threeToFiveYears: z.number().int().nonnegative().default(0),
  fiveToTenYears: z.number().int().nonnegative().default(0),
  aboveTenYears: z.number().int().nonnegative().default(0),
});

export const OldCaseBurdenSchema = z.object({
  threePlusYearsCases: z.number().int().nonnegative().default(0),
  fivePlusYearsCases: z.number().int().nonnegative().default(0),
  tenPlusYearsCases: z.number().int().nonnegative().default(0),
  threePlusYearsShare: z.number().nonnegative().default(0),
  fivePlusYearsShare: z.number().nonnegative().default(0),
  tenPlusYearsShare: z.number().nonnegative().default(0),
});

export const OldCaseBurdenMetricSchema = z
  .union([
    z.discriminatedUnion("state", [
      z.object({ state: z.literal("ok"), value: OldCaseBurdenSchema }),
      MissingMetricSchema,
    ]),
    OldCaseBurdenSchema.transform((value) => ({ state: "ok" as const, value })),
  ])
  .default(MISSING_SOURCE_NOT_PUBLISHED);

export const BacklogConcentrationSchema = z.object({
  topFiveDistrictsShare: z.number().nonnegative().default(0),
  topTenDistrictsShare: z.number().nonnegative().default(0),
});

export const BacklogConcentrationMetricSchema = z
  .union([
    z.discriminatedUnion("state", [
      z.object({ state: z.literal("ok"), value: BacklogConcentrationSchema }),
      MissingMetricSchema,
    ]),
    BacklogConcentrationSchema.transform((value) => ({ state: "ok" as const, value })),
  ])
  .default(MISSING_INCOMPLETE_BREAKDOWN);

export const WatchlistPersistenceSchema = z.object({
  flaggedInLastThree: z.number().int().nonnegative().default(0),
  lastThreeWindow: z.number().int().nonnegative().default(0),
  flaggedInLastSix: z.number().int().nonnegative().default(0),
  lastSixWindow: z.number().int().nonnegative().default(0),
});

export const SnapshotMetadataCanonicalSchema = z.object({
  stateCode: z.string().min(1),
  stateName: z.string().min(1),
  sourceName: z.string().min(1),
  sourceSnapshotAt: z.string().datetime().nullable(),
  referenceDateAt: z.string().datetime(),
  referenceDateKind: ReferenceDateKindSchema,
  publishedAt: z.string().datetime(),
  methodologyVersion: z.string().min(1),
  qualityState: QualityStateSchema,
  freshnessDays: z.number().int().nonnegative(),
  sourceAttribution: z.string().min(1),
  publishedFromRunId: z.string().min(1).optional(),
  replayedFromRunId: z.string().min(1).optional(),
});

export const SnapshotMetadataSchema = z.preprocess(
  normalizeSnapshotMetadataInput,
  SnapshotMetadataCanonicalSchema,
);

export const StateStatsSchema = z.object({
  pendingCases: z.number().int().nonnegative(),
  filedLastMonthCases: z.number().int().nonnegative().default(0),
  clearedLastMonthCases: z.number().int().nonnegative().default(0),
  disposalRate: z.number().nonnegative(),
  medianCaseAgeDays: z.number().int().nonnegative(),
  flaggedDistricts: z.number().int().nonnegative(),
  ageBuckets: AgeBucketsSchema.default(EMPTY_AGE_BUCKETS),
  oldCaseBurden: OldCaseBurdenMetricSchema,
  backlogMovementShare: MetricValueOrLegacyNumberSchema,
  breakEvenClearancesNeeded: NonNegativeIntegerMetricValueOrLegacyNumberSchema,
  catchUpClearancesPerMonth: NonNegativeIntegerMetricValueOrLegacyNumberSchema,
  backlogConcentration: BacklogConcentrationMetricSchema,
});

export const DistrictSnapshotSchema = z.object({
  districtId: z.string().min(1),
  districtName: z.string().min(1),
  rank: z.number().int().positive(),
  backlogCases: z.number().int().nonnegative(),
  filedLastMonthCases: z.number().int().nonnegative().default(0),
  clearedLastMonthCases: z.number().int().nonnegative().default(0),
  disposalRate: z.number().nonnegative(),
  medianAgeDays: z.number().int().nonnegative(),
  filingVsDisposalGap: z.number(),
  ageBuckets: AgeBucketsSchema.default(EMPTY_AGE_BUCKETS),
  oldCaseBurden: OldCaseBurdenSchema.default(EMPTY_OLD_CASE_BURDEN),
  backlogMovementShare: z.number().default(0),
  breakEvenClearancesNeeded: z.number().int().nonnegative().default(0),
  catchUpClearancesPerMonth: z.number().int().nonnegative().default(0),
  watchlistPersistence: WatchlistPersistenceSchema.default(EMPTY_WATCHLIST_PERSISTENCE),
  flagReason: z.string().min(1),
  summary: z.string().min(1),
});

export const TrendPointSchema = z.object({
  snapshotDate: z.string().datetime(),
  pendingCases: z.number().int().nonnegative(),
  filedLastMonthCases: z.number().int().nonnegative().default(0),
  clearedLastMonthCases: z.number().int().nonnegative().default(0),
  disposalRate: z.number().nonnegative(),
});

const PublishedSnapshotCanonicalSchema = z.object({
  snapshot: SnapshotMetadataSchema,
  stats: StateStatsSchema,
  districts: z.array(DistrictSnapshotSchema).min(1),
  trends: z.array(TrendPointSchema).min(1),
});

export const PublishedSnapshotSchema = z.preprocess(
  normalizePublishedSnapshotInput,
  PublishedSnapshotCanonicalSchema,
);

export type QualityState = z.infer<typeof QualityStateSchema>;
export type AgeBuckets = z.infer<typeof AgeBucketsSchema>;
export type OldCaseBurden = z.infer<typeof OldCaseBurdenSchema>;
export type OldCaseBurdenMetric = z.infer<typeof OldCaseBurdenMetricSchema>;
export type BacklogConcentration = z.infer<typeof BacklogConcentrationSchema>;
export type BacklogConcentrationMetric = z.infer<typeof BacklogConcentrationMetricSchema>;
export type PublishedSnapshot = z.infer<typeof PublishedSnapshotSchema>;
export type DistrictSnapshot = z.infer<typeof DistrictSnapshotSchema>;

export function normalizeSnapshotMetadataInput(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  const sourceSnapshotAt = typeof record.sourceSnapshotAt === "string" ? record.sourceSnapshotAt : null;
  return {
    ...record,
    referenceDateAt: typeof record.referenceDateAt === "string" ? record.referenceDateAt : sourceSnapshotAt,
    referenceDateKind:
      record.referenceDateKind === "captured_at" || record.referenceDateKind === "source_snapshot_at"
        ? record.referenceDateKind
        : "source_snapshot_at",
  };
}

function normalizePublishedSnapshotInput(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  return {
    ...record,
    snapshot: normalizeSnapshotMetadataInput(record.snapshot),
  };
}

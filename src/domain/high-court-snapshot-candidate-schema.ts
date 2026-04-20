import { z } from "zod";

import {
  HighCourtAgeBucketsSchema,
  HighCourtCaseTypeBreakdownSchema,
  HighCourtSnapshotMetadataSchema,
  HighCourtStatsSchema,
  HighCourtTrendPointSchema,
  normalizeHighCourtSnapshotMetadataInput,
} from "./high-court-snapshot-schema.js";

export const HighCourtSnapshotCandidateMetadataSchema = HighCourtSnapshotMetadataSchema.omit({
  publishedAt: true,
  freshnessDays: true,
  publishedFromRunId: true,
  replayedFromRunId: true,
});

const HighCourtSnapshotCandidateCanonicalSchema = z.object({
  snapshot: HighCourtSnapshotCandidateMetadataSchema,
  stats: HighCourtStatsSchema,
  ageBuckets: HighCourtAgeBucketsSchema,
  caseTypeBreakdown: z.array(HighCourtCaseTypeBreakdownSchema).min(1).optional(),
  trends: z.array(HighCourtTrendPointSchema).min(1),
});

export const HighCourtSnapshotCandidateSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  return {
    ...record,
    snapshot: normalizeHighCourtSnapshotMetadataInput(record.snapshot),
  };
}, HighCourtSnapshotCandidateCanonicalSchema);

export type HighCourtSnapshotCandidate = z.infer<typeof HighCourtSnapshotCandidateSchema>;

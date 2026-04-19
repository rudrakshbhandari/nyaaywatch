import { z } from "zod";

import {
  HighCourtAgeBucketsSchema,
  HighCourtCaseTypeBreakdownSchema,
  HighCourtSnapshotMetadataSchema,
  HighCourtStatsSchema,
  HighCourtTrendPointSchema,
} from "./high-court-snapshot-schema.js";

export const HighCourtSnapshotCandidateMetadataSchema = HighCourtSnapshotMetadataSchema.omit({
  publishedAt: true,
  freshnessDays: true,
  publishedFromRunId: true,
  replayedFromRunId: true,
});

export const HighCourtSnapshotCandidateSchema = z.object({
  snapshot: HighCourtSnapshotCandidateMetadataSchema,
  stats: HighCourtStatsSchema,
  ageBuckets: HighCourtAgeBucketsSchema,
  caseTypeBreakdown: z.array(HighCourtCaseTypeBreakdownSchema).min(1).optional(),
  trends: z.array(HighCourtTrendPointSchema).min(1),
});

export type HighCourtSnapshotCandidate = z.infer<typeof HighCourtSnapshotCandidateSchema>;

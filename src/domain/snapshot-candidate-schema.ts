import { z } from "zod";

import {
  DistrictSnapshotSchema,
  SnapshotMetadataCanonicalSchema,
  StateStatsSchema,
  TrendPointSchema,
  normalizeSnapshotMetadataInput,
} from "./snapshot-schema.js";

export const SnapshotCandidateMetadataSchema = z.preprocess(
  normalizeSnapshotMetadataInput,
  SnapshotMetadataCanonicalSchema.omit({
    publishedAt: true,
    freshnessDays: true,
    publishedFromRunId: true,
    replayedFromRunId: true,
  }),
);

export const SnapshotCandidateSchema = z.object({
  snapshot: SnapshotCandidateMetadataSchema,
  stats: StateStatsSchema,
  districts: z.array(DistrictSnapshotSchema).min(1),
  trends: z.array(TrendPointSchema).min(1),
});

export type SnapshotCandidate = z.infer<typeof SnapshotCandidateSchema>;

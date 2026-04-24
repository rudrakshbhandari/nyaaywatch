import { z } from "zod";

import {
  SupremeCourtMonthlyFinalizedSchema,
  SupremeCourtSnapshotMetadataSchema,
  SupremeCourtStatsSchema,
  SupremeCourtTrendPointSchema,
} from "./supreme-court-snapshot-schema.js";

export const SupremeCourtSnapshotCandidateMetadataSchema = SupremeCourtSnapshotMetadataSchema.omit({
  publishedAt: true,
  freshnessDays: true,
  publishedFromRunId: true,
  replayedFromRunId: true,
});

export const SupremeCourtSnapshotCandidateSchema = z.object({
  snapshot: SupremeCourtSnapshotCandidateMetadataSchema,
  stats: SupremeCourtStatsSchema,
  trends: z.array(SupremeCourtTrendPointSchema).min(1),
  monthlyFinalized: z.array(SupremeCourtMonthlyFinalizedSchema),
});

export type SupremeCourtSnapshotCandidate = z.infer<typeof SupremeCourtSnapshotCandidateSchema>;

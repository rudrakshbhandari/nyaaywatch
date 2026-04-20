import type { HighCourtPublishedSnapshot } from "../domain/high-court-snapshot-schema.js";
import { HighCourtSnapshotCandidateSchema, type HighCourtSnapshotCandidate } from "../domain/high-court-snapshot-candidate-schema.js";
import type { ExtractedHighCourtSnapshot } from "../extract/high-court-njdg-html.js";
import { freshnessDays } from "../lib/time.js";

const HIGH_COURT_METHODOLOGY_VERSION = "2026.04-high-court-draft";

export function buildHighCourtSnapshotCandidate(
  extracted: ExtractedHighCourtSnapshot,
  previousSnapshots: HighCourtPublishedSnapshot[],
): HighCourtSnapshotCandidate {
  const referenceDateAt = extracted.sourceSnapshotAt ?? extracted.capturedAt;
  const referenceDateKind = extracted.sourceSnapshotAt ? "source_snapshot_at" : "captured_at";

  return HighCourtSnapshotCandidateSchema.parse({
    snapshot: {
      courtTier: "high_court",
      courtCode: extracted.courtCode,
      courtSlug: extracted.courtSlug,
      courtName: extracted.courtName,
      coveredGeographies: extracted.coveredGeographies,
      sourceName: extracted.sourceName,
      sourceSnapshotAt: extracted.sourceSnapshotAt,
      referenceDateAt,
      referenceDateKind,
      methodologyVersion: HIGH_COURT_METHODOLOGY_VERSION,
      qualityState: "complete",
      sourceAttribution: extracted.sourceAttribution,
    },
    stats: {
      pendingCivilCases: extracted.pendingCases.civilCases,
      pendingCriminalCases: extracted.pendingCases.criminalCases,
      pendingTotalCases: extracted.pendingCases.totalCases,
      institutedLastMonthCivilCases: extracted.institutedLastMonth.civilCases,
      institutedLastMonthCriminalCases: extracted.institutedLastMonth.criminalCases,
      institutedLastMonthTotalCases: extracted.institutedLastMonth.totalCases,
      disposedLastMonthCivilCases: extracted.disposedLastMonth.civilCases,
      disposedLastMonthCriminalCases: extracted.disposedLastMonth.criminalCases,
      disposedLastMonthTotalCases: extracted.disposedLastMonth.totalCases,
    },
    ageBuckets: {
      lessThanOneYear: extracted.ageBucketTotals.lessThanOneYear,
      oneToThreeYears: extracted.ageBucketTotals.oneToThreeYears,
      threeToFiveYears: extracted.ageBucketTotals.threeToFiveYears,
      fiveToTenYears: extracted.ageBucketTotals.fiveToTenYears,
      aboveTenYears: extracted.ageBucketTotals.aboveTenYears,
    },
    trends: buildTrendPoints(previousSnapshots, extracted),
  });
}

export function materializeHighCourtPublishedSnapshot(
  candidate: HighCourtSnapshotCandidate,
  publishedAt: string,
  runId: string,
  replayedFromRunId?: string,
): HighCourtPublishedSnapshot {
  return {
    ...candidate,
    snapshot: {
      ...candidate.snapshot,
      publishedAt,
      freshnessDays: freshnessDays(candidate.snapshot.referenceDateAt, new Date(publishedAt)),
      publishedFromRunId: runId,
      replayedFromRunId,
    },
  };
}

function buildTrendPoints(
  previousSnapshots: HighCourtPublishedSnapshot[],
  extracted: ExtractedHighCourtSnapshot,
) {
  const referenceDateAt = extracted.sourceSnapshotAt ?? extracted.capturedAt;
  const referenceDateKind = extracted.sourceSnapshotAt ? "source_snapshot_at" : "captured_at";
  const seen = new Set<string>();
  const points = previousSnapshots
    .slice()
    .reverse()
    .map((snapshot) => ({
      referenceDateAt: snapshot.snapshot.referenceDateAt,
      referenceDateKind: snapshot.snapshot.referenceDateKind,
      pendingTotalCases: snapshot.stats.pendingTotalCases,
      institutedLastMonthTotalCases: snapshot.stats.institutedLastMonthTotalCases,
      disposedLastMonthTotalCases: snapshot.stats.disposedLastMonthTotalCases,
    }))
    .filter((point) => {
      const dedupeKey = `${point.referenceDateKind}:${point.referenceDateAt}`;
      if (seen.has(dedupeKey)) {
        return false;
      }

      seen.add(dedupeKey);
      return true;
    });

  const currentDedupeKey = `${referenceDateKind}:${referenceDateAt}`;
  if (!seen.has(currentDedupeKey)) {
    points.push({
      referenceDateAt,
      referenceDateKind,
      pendingTotalCases: extracted.pendingCases.totalCases,
      institutedLastMonthTotalCases: extracted.institutedLastMonth.totalCases,
      disposedLastMonthTotalCases: extracted.disposedLastMonth.totalCases,
    });
  }

  return points.slice(-5);
}

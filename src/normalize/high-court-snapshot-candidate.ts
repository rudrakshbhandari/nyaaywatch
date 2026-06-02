import type { HighCourtPublishedSnapshot } from "../domain/high-court-snapshot-schema.js";
import { HighCourtSnapshotCandidateSchema, type HighCourtSnapshotCandidate } from "../domain/high-court-snapshot-candidate-schema.js";
import type { ExtractedHighCourtSnapshot, HighCourtMetricBreakdown } from "../extract/high-court-njdg-html.js";
import { freshnessDays } from "../lib/time.js";

const HIGH_COURT_METHODOLOGY_VERSION = "2026.04-high-court-draft";

export function buildHighCourtSnapshotCandidate(
  extracted: ExtractedHighCourtSnapshot,
  previousSnapshots: HighCourtPublishedSnapshot[],
): HighCourtSnapshotCandidate {
  const referenceDateAt = extracted.sourceSnapshotAt ?? extracted.capturedAt;
  const referenceDateKind = extracted.sourceSnapshotAt ? "source_snapshot_at" : "captured_at";

  // When NJDG is recomputing a monthly accumulator it does not publish the value
  // (extraction yields null). Carry the most recent published reading forward so a
  // transient source gap does not block the daily run. These are slow-moving
  // month-to-date accumulators, so the prior reading is the best available estimate
  // until the source republishes.
  const institutedLastMonth = resolveMonthlyMetric(
    extracted.institutedLastMonth,
    previousSnapshots,
    referenceDateAt,
    (stats) => ({
      civilCases: stats.institutedLastMonthCivilCases,
      criminalCases: stats.institutedLastMonthCriminalCases,
      totalCases: stats.institutedLastMonthTotalCases,
    }),
    "instituted in last month",
    extracted.courtCode,
  );
  const disposedLastMonth = resolveMonthlyMetric(
    extracted.disposedLastMonth,
    previousSnapshots,
    referenceDateAt,
    (stats) => ({
      civilCases: stats.disposedLastMonthCivilCases,
      criminalCases: stats.disposedLastMonthCriminalCases,
      totalCases: stats.disposedLastMonthTotalCases,
    }),
    "disposal in last month",
    extracted.courtCode,
  );

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
      institutedLastMonthCivilCases: institutedLastMonth.civilCases,
      institutedLastMonthCriminalCases: institutedLastMonth.criminalCases,
      institutedLastMonthTotalCases: institutedLastMonth.totalCases,
      disposedLastMonthCivilCases: disposedLastMonth.civilCases,
      disposedLastMonthCriminalCases: disposedLastMonth.criminalCases,
      disposedLastMonthTotalCases: disposedLastMonth.totalCases,
    },
    ageBuckets: {
      lessThanOneYear: extracted.ageBucketTotals.lessThanOneYear,
      oneToThreeYears: extracted.ageBucketTotals.oneToThreeYears,
      threeToFiveYears: extracted.ageBucketTotals.threeToFiveYears,
      fiveToTenYears: extracted.ageBucketTotals.fiveToTenYears,
      aboveTenYears: extracted.ageBucketTotals.aboveTenYears,
    },
    trends: buildTrendPoints(previousSnapshots, {
      referenceDateAt,
      referenceDateKind,
      pendingTotalCases: extracted.pendingCases.totalCases,
      institutedLastMonthTotalCases: institutedLastMonth.totalCases,
      disposedLastMonthTotalCases: disposedLastMonth.totalCases,
    }),
  });
}

function resolveMonthlyMetric(
  current: HighCourtMetricBreakdown | null,
  previousSnapshotsByPublicationRecency: HighCourtPublishedSnapshot[],
  referenceDateAt: string,
  pickFromStats: (stats: HighCourtPublishedSnapshot["stats"]) => HighCourtMetricBreakdown,
  metricLabel: string,
  courtCode: string,
): HighCourtMetricBreakdown {
  if (current) {
    return current;
  }

  // Carry forward from the active published value. `previousSnapshots` arrives in
  // publication-event recency order (most recently published / currently-active
  // first), so the first entry dated on or before this candidate's reference date is
  // the live value for the most recent period <= the candidate. Selecting by
  // publication order (rather than the snapshot's own publishedAt) keeps three cases
  // correct in one rule:
  //   - rollback: a rollback is the newest publication event, so its target wins over
  //     a later-but-rolled-back correction;
  //   - same-date correction: the correction is published after the value it replaces;
  //   - replay of an older capture: newer-dated publications are skipped by the bound.
  const activePrior = previousSnapshotsByPublicationRecency.find(
    (snapshot) => snapshot.snapshot.referenceDateAt <= referenceDateAt,
  );

  if (!activePrior) {
    throw new Error(
      `Cannot carry forward ${metricLabel} for ${courtCode}: source has not published the value yet and there is no prior snapshot on or before ${referenceDateAt} to carry forward.`,
    );
  }

  return pickFromStats(activePrior.stats);
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

interface HighCourtTrendPointInput {
  referenceDateAt: string;
  referenceDateKind: "source_snapshot_at" | "captured_at";
  pendingTotalCases: number;
  institutedLastMonthTotalCases: number;
  disposedLastMonthTotalCases: number;
}

function buildTrendPoints(
  previousSnapshots: HighCourtPublishedSnapshot[],
  current: HighCourtTrendPointInput,
) {
  const { referenceDateAt, referenceDateKind } = current;
  const seen = new Set<string>();
  // previousSnapshots arrives in publication-recency order; trends want chronological
  // order, so sort by reference date (then publishedAt) before walking newest-first.
  const points = [...previousSnapshots]
    .sort(
      (left, right) =>
        left.snapshot.referenceDateAt.localeCompare(right.snapshot.referenceDateAt) ||
        left.snapshot.publishedAt.localeCompare(right.snapshot.publishedAt),
    )
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
      pendingTotalCases: current.pendingTotalCases,
      institutedLastMonthTotalCases: current.institutedLastMonthTotalCases,
      disposedLastMonthTotalCases: current.disposedLastMonthTotalCases,
    });
  }

  return points.slice(-5);
}

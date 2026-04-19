import type { SupremeCourtPublishedSnapshot } from "../domain/supreme-court-snapshot-schema.js";
import {
  SupremeCourtSnapshotCandidateSchema,
  type SupremeCourtSnapshotCandidate,
} from "../domain/supreme-court-snapshot-candidate-schema.js";
import type { ExtractedSupremeCourtSnapshot } from "../extract/supreme-court-njdg-html.js";
import { freshnessDays } from "../lib/time.js";

const SUPREME_COURT_METHODOLOGY_VERSION = "2026.04-supreme-court-draft";

export function buildSupremeCourtSnapshotCandidate(
  extracted: ExtractedSupremeCourtSnapshot,
  previousSnapshots: SupremeCourtPublishedSnapshot[],
): SupremeCourtSnapshotCandidate {
  const referenceDateAt = extracted.sourceSnapshotAt ?? extracted.capturedAt;
  const referenceDateKind = extracted.sourceSnapshotAt ? "source_snapshot_at" : "captured_at";

  return SupremeCourtSnapshotCandidateSchema.parse({
    snapshot: {
      courtTier: "supreme_court",
      courtCode: extracted.courtCode,
      courtSlug: extracted.courtSlug,
      courtName: extracted.courtName,
      sourceName: extracted.sourceName,
      sourceSnapshotAt: extracted.sourceSnapshotAt,
      referenceDateAt,
      referenceDateKind,
      methodologyVersion: SUPREME_COURT_METHODOLOGY_VERSION,
      qualityState: "complete",
      sourceAttribution: extracted.sourceAttribution,
    },
    stats: {
      pendingCivilRegisteredCases: extracted.pendingCivil.registeredCases,
      pendingCivilUnregisteredCases: extracted.pendingCivil.unregisteredCases,
      pendingCivilTotalCases: extracted.pendingCivil.totalCases,
      pendingCriminalRegisteredCases: extracted.pendingCriminal.registeredCases,
      pendingCriminalUnregisteredCases: extracted.pendingCriminal.unregisteredCases,
      pendingCriminalTotalCases: extracted.pendingCriminal.totalCases,
      pendingRegisteredCases: extracted.pendingRegisteredCases,
      pendingUnregisteredCases: extracted.pendingUnregisteredCases,
      pendingTotalCases: extracted.pendingTotalCases,
      institutedLastMonthCivilCases: extracted.institutedLastMonth.civilCases,
      institutedLastMonthCriminalCases: extracted.institutedLastMonth.criminalCases,
      institutedLastMonthTotalCases: extracted.institutedLastMonth.totalCases,
      disposedLastMonthCivilCases: extracted.disposedLastMonth.civilCases,
      disposedLastMonthCriminalCases: extracted.disposedLastMonth.criminalCases,
      disposedLastMonthTotalCases: extracted.disposedLastMonth.totalCases,
      institutedCurrentYearCivilCases: extracted.institutedCurrentYear.civilCases,
      institutedCurrentYearCriminalCases: extracted.institutedCurrentYear.criminalCases,
      institutedCurrentYearTotalCases: extracted.institutedCurrentYear.totalCases,
      disposedCurrentYearCivilCases: extracted.disposedCurrentYear.civilCases,
      disposedCurrentYearCriminalCases: extracted.disposedCurrentYear.criminalCases,
      disposedCurrentYearTotalCases: extracted.disposedCurrentYear.totalCases,
    },
    trends: buildTrendPoints(previousSnapshots, extracted),
  });
}

export function materializeSupremeCourtPublishedSnapshot(
  candidate: SupremeCourtSnapshotCandidate,
  publishedAt: string,
  runId: string,
  replayedFromRunId?: string,
): SupremeCourtPublishedSnapshot {
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

function buildTrendPoints(previousSnapshots: SupremeCourtPublishedSnapshot[], extracted: ExtractedSupremeCourtSnapshot) {
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
      pendingTotalCases: extracted.pendingTotalCases,
      institutedLastMonthTotalCases: extracted.institutedLastMonth.totalCases,
      disposedLastMonthTotalCases: extracted.disposedLastMonth.totalCases,
    });
  }

  return points.slice(-5);
}

import type {
  SupremeCourtPublishedSnapshot,
  SupremeCourtTrendPoint,
  SupremeCourtMonthlyFinalized,
} from "../domain/supreme-court-snapshot-schema.js";
import {
  SupremeCourtSnapshotCandidateSchema,
  type SupremeCourtSnapshotCandidate,
} from "../domain/supreme-court-snapshot-candidate-schema.js";
import type { ExtractedSupremeCourtSnapshot } from "../extract/supreme-court-njdg-html.js";
import { freshnessDays } from "../lib/time.js";

const SUPREME_COURT_METHODOLOGY_VERSION = "2026.04-supreme-court-draft";
const TREND_WINDOW_POINTS = 5;

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
    monthlyFinalized: buildMonthlyFinalized(previousSnapshots, extracted),
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

function buildTrendPoints(
  previousSnapshots: SupremeCourtPublishedSnapshot[],
  extracted: ExtractedSupremeCourtSnapshot,
): SupremeCourtTrendPoint[] {
  return buildChronologicalCaptureHistory(previousSnapshots, extracted).slice(-TREND_WINDOW_POINTS);
}

// Returns the full chronological series of distinct captures (ascending by
// referenceDateAt) ending with the current extract. `previousSnapshots` is
// expected ascending; we dedupe by (referenceDateKind, referenceDateAt).
function buildChronologicalCaptureHistory(
  previousSnapshots: SupremeCourtPublishedSnapshot[],
  extracted: ExtractedSupremeCourtSnapshot,
): SupremeCourtTrendPoint[] {
  const referenceDateAt = extracted.sourceSnapshotAt ?? extracted.capturedAt;
  const referenceDateKind = extracted.sourceSnapshotAt ? "source_snapshot_at" : "captured_at";
  const seen = new Set<string>();
  const points: SupremeCourtTrendPoint[] = [];

  for (const snapshot of previousSnapshots) {
    const dedupeKey = `${snapshot.snapshot.referenceDateKind}:${snapshot.snapshot.referenceDateAt}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    points.push({
      referenceDateAt: snapshot.snapshot.referenceDateAt,
      referenceDateKind: snapshot.snapshot.referenceDateKind,
      pendingTotalCases: snapshot.stats.pendingTotalCases,
      institutedLastMonthTotalCases: snapshot.stats.institutedLastMonthTotalCases,
      disposedLastMonthTotalCases: snapshot.stats.disposedLastMonthTotalCases,
    });
  }

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

  return points;
}

// `instituted in last month` / `disposal in last month` are accumulators on the
// NJDG dashboard that reset at each calendar-month boundary. When we observe a
// drop between consecutive captures, the earlier capture holds the last-known
// pre-reset totals for its calendar month. Those become that month's finalized
// values. Months without an observed reset (the currently-accumulating month,
// or months where we lack before/after captures) are intentionally omitted —
// they are not yet comparable.
export function buildMonthlyFinalized(
  previousSnapshots: SupremeCourtPublishedSnapshot[],
  extracted: ExtractedSupremeCourtSnapshot,
): SupremeCourtMonthlyFinalized[] {
  const points = buildChronologicalCaptureHistory(previousSnapshots, extracted);
  const finalized: SupremeCourtMonthlyFinalized[] = [];
  const seenMonths = new Set<string>();

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]!;
    const current = points[index]!;
    if (current.institutedLastMonthTotalCases >= previous.institutedLastMonthTotalCases) {
      continue;
    }

    const yearMonth = toIstYearMonth(previous.referenceDateAt);
    if (seenMonths.has(yearMonth)) {
      continue;
    }
    seenMonths.add(yearMonth);
    finalized.push({
      yearMonth,
      institutedTotalCases: previous.institutedLastMonthTotalCases,
      disposedTotalCases: previous.disposedLastMonthTotalCases,
      derivedFromReferenceDateAt: previous.referenceDateAt,
    });
  }

  return finalized;
}

// NJDG publishes from India; month boundaries we care about are IST. Callers
// pass a UTC ISO string; we shift +05:30 before reading the year/month.
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
function toIstYearMonth(iso: string): string {
  const ist = new Date(new Date(iso).getTime() + IST_OFFSET_MS);
  const year = ist.getUTCFullYear();
  const month = String(ist.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

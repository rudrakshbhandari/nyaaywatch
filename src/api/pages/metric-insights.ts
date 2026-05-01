import type { HighCourtPublishedSnapshot } from "../../domain/high-court-snapshot-schema.js";
import type {
  BacklogConcentrationMetric,
  MetricValue,
  MissingMetricReason,
  OldCaseBurdenMetric,
} from "../../domain/snapshot-schema.js";
import type { SupremeCourtPublishedSnapshot } from "../../domain/supreme-court-snapshot-schema.js";

export function describeBacklogMovement(share: number, windowLabel = "last month"): string {
  if (share > 0) {
    return `Backlog grew by ${share.toFixed(1)}% of the pending pile ${windowLabel}.`;
  }
  if (share < 0) {
    return `Backlog shrank by ${Math.abs(share).toFixed(1)}% of the pending pile ${windowLabel}.`;
  }
  return `Filings and clearances did not move the pending pile ${windowLabel}.`;
}

export function formatBacklogMovementValue(metric: MetricValue): string {
  if (metric.state === "missing") {
    return "N/A";
  }
  const sign = metric.value > 0 ? "+" : "";
  return `${sign}${metric.value.toFixed(1)}%`;
}

export function describeBacklogMovementMetric(metric: MetricValue, windowLabel = "last month"): string {
  if (metric.state === "missing") {
    if (metric.reason === "not-applicable") {
      return "No pending cases on file, so backlog movement can't be computed.";
    }
    return "NJDG hasn't published last month's filings and clearances.";
  }
  return describeBacklogMovement(metric.value, windowLabel);
}

export function describeMissingMetric(reason: MissingMetricReason, inputLabel: string): string {
  switch (reason) {
    case "source-not-published":
      return `NJDG hasn't published ${inputLabel}.`;
    case "insufficient-history":
      return `Need data from another month to start tracking ${inputLabel}.`;
    case "incomplete-breakdown":
      return `NJDG hasn't published a full ${inputLabel} breakdown.`;
    case "not-applicable":
      return `No pending cases on file, so ${inputLabel} can't be computed.`;
  }
}

export function formatOldCaseBurdenValue(metric: OldCaseBurdenMetric): string {
  if (metric.state === "missing") {
    return "N/A";
  }
  return formatShare(metric.value.fivePlusYearsShare);
}

export function describeOldCaseBurdenMetric(metric: OldCaseBurdenMetric): string {
  if (metric.state === "missing") {
    return "NJDG hasn't published the case-age breakdown.";
  }
  return `${metric.value.fivePlusYearsCases.toLocaleString("en-IN")} pending cases are already older than 5 years.`;
}

export function calculateBacklogMovementShare(
  pendingCases: number,
  filedCases: number,
  clearedCases: number,
): number {
  if (pendingCases <= 0) {
    return 0;
  }
  return roundTo1(((filedCases - clearedCases) / pendingCases) * 100);
}

export function calculateBreakEvenClearancesNeeded(filedCases: number, clearedCases: number): number {
  return Math.max(0, filedCases - clearedCases);
}

export function describeBreakEven(clearancesNeeded: number, windowLabel = "last month"): string {
  if (clearancesNeeded <= 0) {
    return `This court cleared enough cases to keep the backlog from growing ${windowLabel}.`;
  }
  return `Needed ${clearancesNeeded.toLocaleString("en-IN")} more clearances ${windowLabel} to break even.`;
}

export function formatBreakEvenValue(metric: MetricValue): string {
  if (metric.state === "missing") {
    return "N/A";
  }
  return metric.value.toLocaleString("en-IN");
}

export function describeBreakEvenMetric(metric: MetricValue, windowLabel = "last month"): string {
  if (metric.state === "missing") {
    return "NJDG hasn't published last month's filings and clearances.";
  }
  return describeBreakEven(metric.value, windowLabel);
}

export function calculateCatchUpClearancesPerMonth(
  pendingCases: number,
  filedCases: number,
  clearedCases: number,
): number {
  const monthlyReductionTarget = Math.ceil((pendingCases * 0.1) / 12);
  return Math.max(0, monthlyReductionTarget + filedCases - clearedCases);
}

export function describeCatchUp(clearancesPerMonth: number): string {
  if (clearancesPerMonth <= 0) {
    return "At last month's pace, the 10% reduction scenario did not require extra clearances.";
  }
  return `A 10% backlog cut in a year would need about ${clearancesPerMonth.toLocaleString("en-IN")} extra clearances per month.`;
}

export function formatCatchUpValue(metric: MetricValue): string {
  if (metric.state === "missing") {
    return "N/A";
  }
  return metric.value.toLocaleString("en-IN");
}

export function describeCatchUpMetric(metric: MetricValue): string {
  if (metric.state === "missing") {
    if (metric.reason === "not-applicable") {
      return "No pending cases on file, so the 10% reduction scenario can't be computed.";
    }
    return "NJDG hasn't published last month's filings and clearances.";
  }
  return describeCatchUp(metric.value);
}

export function formatShare(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatBacklogConcentrationValue(metric: BacklogConcentrationMetric): string {
  if (metric.state === "missing") {
    return "N/A";
  }
  return formatShare(metric.value.topFiveDistrictsShare);
}

export function describeBacklogConcentrationMetric(metric: BacklogConcentrationMetric): string {
  if (metric.state === "missing") {
    if (metric.reason === "not-applicable") {
      return "No pending cases on file, so the top-five district share can't be computed.";
    }
    return "NJDG hasn't published district-level pending-case counts.";
  }
  return "Share of the pending load held by the five largest district backlogs.";
}

type WatchlistPersistenceMetric =
  | { state: "ok"; value: { flagged: number; window: number } }
  | { state: "missing"; reason: "insufficient-history" };

export function buildWatchlistPersistenceMetric(flagged: number, window: number): WatchlistPersistenceMetric {
  if (window <= 1) {
    return { state: "missing", reason: "insufficient-history" };
  }
  return { state: "ok", value: { flagged, window } };
}

export function formatWatchlistPersistenceValue(metric: WatchlistPersistenceMetric): string {
  if (metric.state === "missing") {
    return "N/A";
  }
  return `${metric.value.flagged}/${metric.value.window}`;
}

export function describeWatchlistPersistenceMetric(metric: WatchlistPersistenceMetric): string {
  if (metric.state === "missing") {
    return "Need data from another month to start tracking persistence.";
  }
  return `Flagged in ${metric.value.flagged} of the last ${metric.value.window} published snapshots.`;
}

export function describeWatchlistPersistence(flagged: number, window: number): string {
  return describeWatchlistPersistenceMetric(buildWatchlistPersistenceMetric(flagged, window));
}

export function calculateHighCourtOldCaseShare(snapshot: HighCourtPublishedSnapshot): number {
  const total = Object.values(snapshot.ageBuckets).reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return 0;
  }
  const fivePlus = snapshot.ageBuckets.fiveToTenYears + snapshot.ageBuckets.aboveTenYears;
  return roundTo1((fivePlus / total) * 100);
}

export function summarizeHighCourtCaseTypeConcentration(snapshot: HighCourtPublishedSnapshot): {
  topFiveShare: number;
  topCaseType: string | null;
  topCaseShare: number;
} | null {
  if (!snapshot.caseTypeBreakdown || snapshot.caseTypeBreakdown.length === 0 || snapshot.stats.pendingTotalCases <= 0) {
    return null;
  }

  const sortedCaseTypes = [...snapshot.caseTypeBreakdown].sort((left, right) => right.totalCases - left.totalCases);
  const topFiveCases = sortedCaseTypes.slice(0, 5).reduce((sum, item) => sum + item.totalCases, 0);
  const topCase = sortedCaseTypes[0] ?? null;
  return {
    topFiveShare: roundTo1((topFiveCases / snapshot.stats.pendingTotalCases) * 100),
    topCaseType: topCase?.caseType ?? null,
    topCaseShare: topCase ? roundTo1((topCase.totalCases / snapshot.stats.pendingTotalCases) * 100) : 0,
  };
}

export function summarizeCivilCriminalImbalance(
  pendingCivilCases: number,
  pendingCriminalCases: number,
  clearedCivilCases: number,
  clearedCriminalCases: number,
): { value: string; note: string } {
  const pendingTotal = pendingCivilCases + pendingCriminalCases;
  const clearedTotal = clearedCivilCases + clearedCriminalCases;
  if (pendingTotal <= 0 || clearedTotal <= 0) {
    return {
      value: "—",
      note: "Civil-criminal imbalance needs both pending and clearance totals.",
    };
  }

  const criminalPendingShare = (pendingCriminalCases / pendingTotal) * 100;
  const criminalClearedShare = (clearedCriminalCases / clearedTotal) * 100;
  const gap = roundTo1(criminalPendingShare - criminalClearedShare);
  const direction =
    gap > 0
      ? "Criminal cases make up a larger share of pending cases than clearances."
      : gap < 0
        ? "Criminal cases make up a smaller share of pending cases than clearances."
        : "Criminal pending share and clearance share are aligned.";

  return {
    value: `${gap > 0 ? "+" : gap < 0 ? "−" : ""}${Math.abs(gap).toFixed(1)} pp`,
    note: `${criminalPendingShare.toFixed(1)}% of pending cases are criminal, versus ${criminalClearedShare.toFixed(1)}% of clearances. ${direction}`,
  };
}

export function summarizeHighCourtCivilCriminalImbalance(snapshot: HighCourtPublishedSnapshot) {
  return summarizeCivilCriminalImbalance(
    snapshot.stats.pendingCivilCases,
    snapshot.stats.pendingCriminalCases,
    snapshot.stats.disposedLastMonthCivilCases,
    snapshot.stats.disposedLastMonthCriminalCases,
  );
}

export function summarizeSupremeCourtCivilCriminalImbalance(snapshot: SupremeCourtPublishedSnapshot) {
  return summarizeCivilCriminalImbalance(
    snapshot.stats.pendingCivilTotalCases,
    snapshot.stats.pendingCriminalTotalCases,
    snapshot.stats.disposedLastMonthCivilCases,
    snapshot.stats.disposedLastMonthCriminalCases,
  );
}

function roundTo1(value: number): number {
  return Math.round(value * 10) / 10;
}

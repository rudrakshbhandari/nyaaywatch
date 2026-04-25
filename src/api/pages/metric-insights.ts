import type { HighCourtPublishedSnapshot } from "../../domain/high-court-snapshot-schema.js";
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

export function formatShare(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function describeWatchlistPersistence(flagged: number, window: number): string {
  if (window <= 1) {
    return "Persistence needs more published snapshots.";
  }
  return `Flagged in ${flagged} of the last ${window} published snapshots.`;
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

import type { NjdgStateProfile } from "../../geographies.js";
import type { HighCourtProfile } from "../../high-courts.js";
import type { HighCourtPublishedSnapshot } from "../../domain/high-court-snapshot-schema.js";
import type { PublishedSnapshot } from "../../domain/snapshot-schema.js";
import type { SupremeCourtPublishedSnapshot } from "../../domain/supreme-court-snapshot-schema.js";
import { buildPublicStateRoutes } from "../public-state.js";
import { rankIndiaMapEntriesByPressure, type IndiaMapStateEntry } from "./india-map.js";
import { formatDate, formatLakh } from "./view-model.js";

export interface NationalHighCourtEntry {
  profile: HighCourtProfile;
  snapshot: HighCourtPublishedSnapshot;
}

export function compareHighCourtPressure(
  left: Pick<NationalHighCourtEntry, "profile" | "snapshot">,
  right: Pick<NationalHighCourtEntry, "profile" | "snapshot">,
): number {
  const monthlyGapDifference =
    calculateMonthlyGap(right.snapshot.stats.institutedLastMonthTotalCases, right.snapshot.stats.disposedLastMonthTotalCases) -
    calculateMonthlyGap(left.snapshot.stats.institutedLastMonthTotalCases, left.snapshot.stats.disposedLastMonthTotalCases);
  if (monthlyGapDifference !== 0) {
    return monthlyGapDifference;
  }

  const clearanceDifference =
    calculateClearanceRate(left.snapshot.stats.disposedLastMonthTotalCases, left.snapshot.stats.institutedLastMonthTotalCases) -
    calculateClearanceRate(right.snapshot.stats.disposedLastMonthTotalCases, right.snapshot.stats.institutedLastMonthTotalCases);
  if (clearanceDifference !== 0) {
    return clearanceDifference;
  }

  const pendingDifference = right.snapshot.stats.pendingTotalCases - left.snapshot.stats.pendingTotalCases;
  if (pendingDifference !== 0) {
    return pendingDifference;
  }

  return left.profile.courtName.localeCompare(right.profile.courtName, "en");
}

export type TrendTone = "worsening" | "improving" | "neutral";
export interface TrendSignal {
  tone: TrendTone;
  label: string;
}

export interface NationalHomeViewModel {
  supremeCourt: {
    snapshot: SupremeCourtPublishedSnapshot | null;
    referenceLabel: string | null;
    freshnessLabel: string | null;
    pendingTotalDisplay: string | null;
    clearanceRateDisplay: string | null;
    disposedLastMonthDisplay: string | null;
    monthlyGapDisplay: string | null;
    monthlyGapNote: string | null;
  };
  highCourts: {
    count: number;
    entries: Array<{
      profile: HighCourtProfile;
      snapshot: HighCourtPublishedSnapshot;
      referenceLabel: string;
      pendingDisplay: string;
      clearanceRateDisplay: string;
      clearanceTrend: TrendSignal;
      monthlyGapDisplay: string;
      monthlyGapNote: string;
      pileTrend: TrendSignal;
    }>;
  };
  lowerCourts: {
    pendingDisplay: string;
    flaggedDistricts: number;
    publicStateCount: number;
    topStateName: string;
    topStateHref: string;
    topStateSummary: string;
  };
}

export function buildNationalHomeViewModel(input: {
  supremeCourtSnapshot: SupremeCourtPublishedSnapshot | null;
  highCourtEntries: NationalHighCourtEntry[];
  lowerCourtSnapshot: PublishedSnapshot;
  lowerCourtProfile: NjdgStateProfile;
  stateMapEntries: IndiaMapStateEntry[];
  publicStateCount: number;
}): NationalHomeViewModel {
  const lowerCourtEntries =
    input.stateMapEntries.length > 0
      ? input.stateMapEntries
      : [
          {
            profile: input.lowerCourtProfile,
            stats: input.lowerCourtSnapshot.stats,
            districtCount: input.lowerCourtSnapshot.districts.length,
          },
        ];
  const rankedLowerCourtStates = rankIndiaMapEntriesByPressure(lowerCourtEntries);
  const topState = rankedLowerCourtStates[0]?.entry;
  const aggregatedPendingCases = lowerCourtEntries.reduce((sum, entry) => sum + entry.stats.pendingCases, 0);
  const aggregatedFlaggedDistricts = lowerCourtEntries.reduce((sum, entry) => sum + entry.stats.flaggedDistricts, 0);

  return {
    supremeCourt: {
      snapshot: input.supremeCourtSnapshot,
      referenceLabel: input.supremeCourtSnapshot
        ? describeSupremeCourtReference(input.supremeCourtSnapshot.snapshot)
        : null,
      freshnessLabel: input.supremeCourtSnapshot
        ? describeFreshness(input.supremeCourtSnapshot.snapshot.freshnessDays)
        : null,
      pendingTotalDisplay: input.supremeCourtSnapshot
        ? input.supremeCourtSnapshot.stats.pendingTotalCases.toLocaleString("en-IN")
        : null,
      clearanceRateDisplay: input.supremeCourtSnapshot
        ? formatClearanceRateDisplay(
            input.supremeCourtSnapshot.stats.disposedLastMonthTotalCases,
            input.supremeCourtSnapshot.stats.institutedLastMonthTotalCases,
          )
        : null,
      disposedLastMonthDisplay: input.supremeCourtSnapshot
        ? input.supremeCourtSnapshot.stats.disposedLastMonthTotalCases.toLocaleString("en-IN")
        : null,
      monthlyGapDisplay: input.supremeCourtSnapshot
        ? describePileChange(
            input.supremeCourtSnapshot.stats.institutedLastMonthTotalCases,
            input.supremeCourtSnapshot.stats.disposedLastMonthTotalCases,
          ).display
        : null,
      monthlyGapNote: input.supremeCourtSnapshot
        ? describePileChange(
            input.supremeCourtSnapshot.stats.institutedLastMonthTotalCases,
            input.supremeCourtSnapshot.stats.disposedLastMonthTotalCases,
          ).note
        : null,
    },
    highCourts: {
      count: input.highCourtEntries.length,
      entries: [...input.highCourtEntries]
        .sort(compareHighCourtPressure)
        .map(({ profile, snapshot }) => ({
        profile,
        snapshot,
        referenceLabel:
          snapshot.snapshot.referenceDateKind === "captured_at"
            ? `Captured ${formatDate(snapshot.snapshot.referenceDateAt)}`
            : `Source snapshot ${formatDate(snapshot.snapshot.referenceDateAt)}`,
        pendingDisplay: formatLakh(snapshot.stats.pendingTotalCases),
        clearanceRateDisplay: formatClearanceRateDisplay(
          snapshot.stats.disposedLastMonthTotalCases,
          snapshot.stats.institutedLastMonthTotalCases,
        ),
        clearanceTrend: describeClearanceTrend(
          snapshot.stats.disposedLastMonthTotalCases,
          snapshot.stats.institutedLastMonthTotalCases,
        ),
        monthlyGapDisplay: describePileChange(
          snapshot.stats.institutedLastMonthTotalCases,
          snapshot.stats.disposedLastMonthTotalCases,
        ).display,
        monthlyGapNote: describePileChange(
          snapshot.stats.institutedLastMonthTotalCases,
          snapshot.stats.disposedLastMonthTotalCases,
        ).note,
        pileTrend: describePileTrend(
          snapshot.stats.institutedLastMonthTotalCases,
          snapshot.stats.disposedLastMonthTotalCases,
        ),
      })),
    },
    lowerCourts: {
      pendingDisplay: formatLakh(aggregatedPendingCases),
      flaggedDistricts: aggregatedFlaggedDistricts,
      publicStateCount: input.publicStateCount,
      topStateName: topState?.profile.stateName ?? input.lowerCourtProfile.stateName,
      topStateHref: buildPublicStateRoutes(topState?.profile ?? input.lowerCourtProfile).home,
      topStateSummary: topState
        ? `${topState.profile.stateName} ranks highest on the current lower-court pressure index across States and Union Territories with published data. ${topState.stats.pendingCases.toLocaleString("en-IN")} pending cases, median age ${topState.stats.medianCaseAgeDays.toLocaleString("en-IN")} days, disposal ${topState.stats.disposalRate.toFixed(1)}% in the latest data. Relative ranking only, not a conclusive claim.`
        : "Open any published lower-court page to inspect the latest snapshot and district drilldown.",
    },
  };
}

function formatClearanceRateDisplay(disposedCases: number, institutedCases: number) {
  if (institutedCases <= 0) {
    return "—";
  }

  return calculateClearanceRate(disposedCases, institutedCases).toFixed(1);
}

function describePileChange(institutedCases: number, disposedCases: number) {
  const difference = calculateMonthlyGap(institutedCases, disposedCases);
  if (difference === 0) {
    return {
      display: "0",
      note: "Filings and clearances matched last month.",
    };
  }

  if (difference > 0) {
    return {
      display: `+${difference.toLocaleString("en-IN")}`,
      note: "More cases were filed than cleared last month.",
    };
  }

  return {
    display: `−${Math.abs(difference).toLocaleString("en-IN")}`,
    note: "More cases were cleared than filed last month.",
  };
}

export function describeClearanceTrend(disposedCases: number, institutedCases: number): TrendSignal {
  if (institutedCases <= 0) {
    return { tone: "neutral", label: "No filings this window" };
  }
  const rate = calculateClearanceRate(disposedCases, institutedCases);
  if (rate < 100) {
    return { tone: "worsening", label: "Falling behind" };
  }
  return { tone: "improving", label: "Keeping pace" };
}

export function describePileTrend(institutedCases: number, disposedCases: number): TrendSignal {
  const difference = calculateMonthlyGap(institutedCases, disposedCases);
  if (difference > 0) {
    return { tone: "worsening", label: "Backlog growing" };
  }
  if (difference < 0) {
    return { tone: "improving", label: "Backlog shrinking" };
  }
  return { tone: "neutral", label: "In lockstep" };
}

function describeSupremeCourtReference(snapshot: SupremeCourtPublishedSnapshot["snapshot"]) {
  return snapshot.referenceDateKind === "captured_at"
    ? `Captured ${formatDate(snapshot.referenceDateAt)}`
    : `Source snapshot ${formatDate(snapshot.referenceDateAt)}`;
}

function describeFreshness(freshnessDays: number) {
  if (freshnessDays === 0) {
    return "Same-day source window";
  }

  if (freshnessDays === 1) {
    return "1 day old";
  }

  return `${freshnessDays} days old`;
}

function calculateMonthlyGap(institutedCases: number, disposedCases: number) {
  return institutedCases - disposedCases;
}

function calculateClearanceRate(disposedCases: number, institutedCases: number) {
  if (institutedCases <= 0) {
    return 0;
  }

  return (disposedCases / institutedCases) * 100;
}

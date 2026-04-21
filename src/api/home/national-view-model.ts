import type { NjdgStateProfile } from "../../geographies.js";
import type { HighCourtProfile } from "../../high-courts.js";
import type { HighCourtPublishedSnapshot } from "../../domain/high-court-snapshot-schema.js";
import type { PublishedSnapshot } from "../../domain/snapshot-schema.js";
import type { SupremeCourtPublishedSnapshot } from "../../domain/supreme-court-snapshot-schema.js";
import { formatDate, formatLakh } from "./view-model.js";

export interface NationalHighCourtEntry {
  profile: HighCourtProfile;
  snapshot: HighCourtPublishedSnapshot;
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
      monthlyGapDisplay: string;
      monthlyGapNote: string;
    }>;
  };
  lowerCourts: {
    snapshot: PublishedSnapshot;
    profile: NjdgStateProfile;
    pendingDisplay: string;
    flaggedDistricts: number;
    totalDistricts: number;
    typicalWaitMonths: number;
    publicStateCount: number;
    topDistrictName: string;
    topDistrictSummary: string;
  };
}

export function buildNationalHomeViewModel(input: {
  supremeCourtSnapshot: SupremeCourtPublishedSnapshot | null;
  highCourtEntries: NationalHighCourtEntry[];
  lowerCourtSnapshot: PublishedSnapshot;
  lowerCourtProfile: NjdgStateProfile;
  publicStateCount: number;
}): NationalHomeViewModel {
  const topDistrict = [...input.lowerCourtSnapshot.districts].sort((left, right) => left.rank - right.rank)[0];

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
        .sort((left, right) => left.profile.courtName.localeCompare(right.profile.courtName, "en"))
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
        monthlyGapDisplay: describePileChange(
          snapshot.stats.institutedLastMonthTotalCases,
          snapshot.stats.disposedLastMonthTotalCases,
        ).display,
        monthlyGapNote: describePileChange(
          snapshot.stats.institutedLastMonthTotalCases,
          snapshot.stats.disposedLastMonthTotalCases,
        ).note,
      })),
    },
    lowerCourts: {
      snapshot: input.lowerCourtSnapshot,
      profile: input.lowerCourtProfile,
      pendingDisplay: formatLakh(input.lowerCourtSnapshot.stats.pendingCases),
      flaggedDistricts: input.lowerCourtSnapshot.stats.flaggedDistricts,
      totalDistricts: input.lowerCourtSnapshot.districts.length,
      typicalWaitMonths: Math.round(input.lowerCourtSnapshot.stats.medianCaseAgeDays / 30),
      publicStateCount: input.publicStateCount,
      topDistrictName: topDistrict?.districtName ?? input.lowerCourtProfile.stateName,
      topDistrictSummary: topDistrict?.summary ?? "The latest published snapshot is available for district-level inspection.",
    },
  };
}

function formatClearanceRateDisplay(disposedCases: number, institutedCases: number) {
  if (institutedCases <= 0) {
    return "—";
  }

  return ((disposedCases / institutedCases) * 100).toFixed(1);
}

function describePileChange(institutedCases: number, disposedCases: number) {
  const difference = institutedCases - disposedCases;
  if (difference === 0) {
    return {
      display: "0",
      note: "Filed and cleared moved in lockstep in the latest monthly window.",
    };
  }

  if (difference > 0) {
    return {
      display: `+${difference.toLocaleString("en-IN")}`,
      note: "More matters were filed than cleared in the latest monthly window.",
    };
  }

  return {
    display: `−${Math.abs(difference).toLocaleString("en-IN")}`,
    note: "More matters were cleared than filed in the latest monthly window.",
  };
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

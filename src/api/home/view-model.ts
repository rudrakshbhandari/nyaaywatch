import type { PublishedSnapshot, DistrictSnapshot } from "../../domain/snapshot-schema.js";
import { escapeHtml } from "../../lib/html.js";

/**
 * Canonical view model for the NyaayWatch public site.
 *
 * Every page on the site ultimately needs the same shape: "what does the
 * latest published snapshot look like for a reader?" This module owns that
 * shape so the HTML renderers stay thin — they compose HomeViewModel and
 * copy into markup, nothing more.
 */
export interface HomeViewModel {
  snapshot: PublishedSnapshot;
  pendingCases: number;
  pendingLakh: string;
  pendingShort: string;
  clearanceRate: number;
  clearanceShortfall: number;
  typicalWaitDays: number;
  typicalWaitMonths: number;
  flaggedCount: number;
  totalDistricts: number;
  topDistrict: DistrictSnapshot;
  topThree: DistrictSnapshot[];
  allDistricts: DistrictSnapshot[];
  trendsOldestFirst: PublishedSnapshot["trends"];
  backlogDelta: number;
  backlogDeltaPct: number;
  sourceDateLabel: string;
  methodologyVersion: string;
  sourceAttribution: string;
  freshnessDays: number;
}

export function buildViewModel(snapshot: PublishedSnapshot): HomeViewModel {
  const pending = snapshot.stats.pendingCases;
  const clearance = snapshot.stats.disposalRate;
  const typicalDays = snapshot.stats.medianCaseAgeDays;
  const trends = [...snapshot.trends].sort((left, right) =>
    left.snapshotDate.localeCompare(right.snapshotDate),
  );
  const oldestTrend = trends[0] ?? null;
  const newestTrend = trends[trends.length - 1] ?? null;
  const backlogDelta =
    oldestTrend && newestTrend ? newestTrend.pendingCases - oldestTrend.pendingCases : 0;
  const backlogDeltaPct =
    oldestTrend && newestTrend && oldestTrend.pendingCases > 0
      ? (backlogDelta / oldestTrend.pendingCases) * 100
      : 0;
  const districtsByRank = [...snapshot.districts].sort((left, right) => left.rank - right.rank);

  return {
    snapshot,
    pendingCases: pending,
    pendingLakh: formatLakh(pending),
    pendingShort: formatShortNumber(pending),
    clearanceRate: clearance,
    clearanceShortfall: Math.max(0, 100 - clearance),
    typicalWaitDays: typicalDays,
    typicalWaitMonths: Math.round(typicalDays / 30),
    flaggedCount: snapshot.stats.flaggedDistricts,
    totalDistricts: snapshot.districts.length,
    topDistrict: districtsByRank[0] ?? snapshot.districts[0],
    topThree: districtsByRank.slice(0, 3),
    allDistricts: districtsByRank,
    trendsOldestFirst: trends,
    backlogDelta,
    backlogDeltaPct,
    sourceDateLabel: formatDate(snapshot.snapshot.sourceSnapshotAt),
    methodologyVersion: snapshot.snapshot.methodologyVersion,
    sourceAttribution: snapshot.snapshot.sourceAttribution,
    freshnessDays: snapshot.snapshot.freshnessDays,
  };
}

export function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatMonth(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export function formatLakh(value: number): string {
  if (value >= 10_000_000) {
    return `${(value / 10_000_000).toFixed(value >= 100_000_000 ? 0 : 2)} crore`;
  }
  if (value >= 100_000) {
    return `${(value / 100_000).toFixed(value >= 1_000_000 ? 1 : 2)} lakh`;
  }
  return value.toLocaleString("en-IN");
}

export function formatShortNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return String(value);
}

export function formatDelta(value: number, suffix = ""): string {
  const sign = value > 0 ? "+" : value < 0 ? "\u2212" : "";
  return `${sign}${Math.abs(value).toLocaleString("en-IN")}${suffix}`;
}

export { escapeHtml };

import type {
  AgeBuckets,
  BacklogConcentrationMetric,
  MetricValue,
  OldCaseBurdenMetric,
  PublishedSnapshot,
} from "../domain/snapshot-schema.js";
import { SnapshotCandidateSchema, type SnapshotCandidate } from "../domain/snapshot-candidate-schema.js";
import type { ExtractedNjdgSnapshot } from "../extract/njdg-html.js";
import { freshnessDays, STALE_SNAPSHOT_THRESHOLD_DAYS } from "../lib/time.js";

const DISTRICT_FLAG_LIMIT = 3;
const METHODOLOGY_VERSION = "2026.04-alpha";

const AGE_BUCKET_MEDIAN_DAYS = {
  lessThanOneYear: 183,
  oneToThreeYears: 730,
  threeToFiveYears: 1461,
  fiveToTenYears: 2739,
  aboveTenYears: 4018,
} as const;

export function buildSnapshotCandidate(
  extracted: ExtractedNjdgSnapshot,
  previousSnapshots: PublishedSnapshot[],
): SnapshotCandidate {
  const stateDisposalRate = percentage(extracted.state.disposedLastMonth, extracted.state.institutedLastMonth);
  const stateMedianAgeDays = inferMedianAgeDays(extracted.state.ageBuckets);
  const stateOldCaseBurden = buildOldCaseBurdenMetric(extracted.state.ageBuckets, extracted.state.pendingCases);
  const stateBacklogMovementShare = backlogMovementMetric(
    extracted.state.pendingCases,
    extracted.state.institutedLastMonth,
    extracted.state.disposedLastMonth,
  );
  const stateBreakEvenClearancesNeeded = breakEvenClearancesMetric(
    extracted.state.institutedLastMonth,
    extracted.state.disposedLastMonth,
  );
  const stateCatchUpClearancesPerMonth = catchUpClearancesMetric(
    extracted.state.pendingCases,
    extracted.state.institutedLastMonth,
    extracted.state.disposedLastMonth,
  );
  const stateFreshnessDays = freshnessDays(extracted.sourceSnapshotAt, new Date(extracted.capturedAt));
  const qualityState =
    extracted.districts.length === extracted.expectedDistrictCount && stateFreshnessDays > STALE_SNAPSHOT_THRESHOLD_DAYS
      ? "stale"
      : extracted.districts.length === extracted.expectedDistrictCount
        ? "complete"
        : "partial";

  const districts = extracted.districts
    .map((district) => ({
      districtId: slugifyDistrict(district.districtName),
      districtName: district.districtName,
      backlogCases: district.pendingCases,
      filedLastMonthCases: district.institutedLastMonth,
      clearedLastMonthCases: district.disposedLastMonth,
      disposalRate: percentage(district.disposedLastMonth, district.institutedLastMonth),
      medianAgeDays: inferMedianAgeDays(district.ageBuckets),
      filingVsDisposalGap: percentageGap(district.institutedLastMonth, district.disposedLastMonth),
      ageBuckets: district.ageBuckets,
      oldCaseBurden: buildOldCaseBurden(district.ageBuckets),
      backlogMovementShare: backlogMovementShare(
        district.pendingCases,
        district.institutedLastMonth,
        district.disposedLastMonth,
      ),
      breakEvenClearancesNeeded: breakEvenClearancesNeeded(
        district.institutedLastMonth,
        district.disposedLastMonth,
      ),
      catchUpClearancesPerMonth: catchUpClearancesPerMonth(
        district.pendingCases,
        district.institutedLastMonth,
        district.disposedLastMonth,
      ),
    }))
    .sort((left, right) => {
      return right.backlogCases - left.backlogCases || right.medianAgeDays - left.medianAgeDays;
    })
    .map((district, index) => {
      const isFlagged = index < DISTRICT_FLAG_LIMIT;
      return {
        ...district,
        rank: index + 1,
        watchlistPersistence: buildWatchlistPersistence(
          district.districtId,
          index + 1,
          previousSnapshots,
        ),
        flagReason: buildFlagReason(district, {
          isFlagged,
          stateName: extracted.stateName,
          stateDisposalRate,
          stateMedianAgeDays,
        }),
        summary: buildSummary(district, isFlagged),
      };
    });

  return SnapshotCandidateSchema.parse({
    snapshot: {
      stateCode: extracted.stateCode,
      stateName: extracted.stateName,
      sourceName: extracted.sourceName,
      sourceSnapshotAt: extracted.sourceSnapshotAt,
      methodologyVersion: METHODOLOGY_VERSION,
      qualityState,
      sourceAttribution: extracted.sourceAttribution,
    },
    stats: {
      pendingCases: extracted.state.pendingCases,
      filedLastMonthCases: extracted.state.institutedLastMonth,
      clearedLastMonthCases: extracted.state.disposedLastMonth,
      disposalRate: stateDisposalRate,
      medianCaseAgeDays: stateMedianAgeDays,
      flaggedDistricts: Math.min(DISTRICT_FLAG_LIMIT, districts.length),
      ageBuckets: extracted.state.ageBuckets,
      oldCaseBurden: stateOldCaseBurden,
      backlogMovementShare: stateBacklogMovementShare,
      breakEvenClearancesNeeded: stateBreakEvenClearancesNeeded,
      catchUpClearancesPerMonth: stateCatchUpClearancesPerMonth,
      backlogConcentration: buildBacklogConcentrationMetric(
        districts.map((district) => district.backlogCases),
        extracted.state.pendingCases,
      ),
    },
    districts,
    trends: buildTrends(
      previousSnapshots,
      extracted.sourceSnapshotAt,
      extracted.state.pendingCases,
      extracted.state.institutedLastMonth,
      extracted.state.disposedLastMonth,
      stateDisposalRate,
    ),
  });
}

function buildTrends(
  previousSnapshots: PublishedSnapshot[],
  snapshotDate: string,
  pendingCases: number,
  filedLastMonthCases: number,
  clearedLastMonthCases: number,
  disposalRate: number,
) {
  const seen = new Set<string>();
  const points = previousSnapshots
    .slice()
    .reverse()
    .map((snapshot) => ({
      snapshotDate: snapshot.snapshot.sourceSnapshotAt,
      pendingCases: snapshot.stats.pendingCases,
      filedLastMonthCases: snapshot.stats.filedLastMonthCases,
      clearedLastMonthCases: snapshot.stats.clearedLastMonthCases,
      disposalRate: snapshot.stats.disposalRate,
    }))
    .filter((point) => {
      if (seen.has(point.snapshotDate)) {
        return false;
      }

      seen.add(point.snapshotDate);
      return true;
    });

  if (!seen.has(snapshotDate)) {
    points.push({ snapshotDate, pendingCases, filedLastMonthCases, clearedLastMonthCases, disposalRate });
  }

  return points.slice(-5);
}

function buildFlagReason(
  district: {
    backlogCases: number;
    filingVsDisposalGap: number;
    disposalRate: number;
    medianAgeDays: number;
  },
  context: {
    isFlagged: boolean;
    stateName: string;
    stateDisposalRate: number;
    stateMedianAgeDays: number;
  },
): string {
  if (hasNoRecentDistrictActivity(district)) {
    return "The latest data doesn't show pending-case age or recent filings-vs-clearances for this district.";
  }

  if (district.filingVsDisposalGap > 0 && context.isFlagged) {
    return "New cases are coming in faster than this district is clearing them, and the queue is already among the state's biggest.";
  }

  if (district.medianAgeDays > context.stateMedianAgeDays && context.isFlagged) {
    return `People appear to be waiting longer here than in much of ${context.stateName}.`;
  }

  if (district.disposalRate < context.stateDisposalRate) {
    return `This district is clearing cases more slowly than the ${context.stateName} average.`;
  }

  return "This district isn't among the clearest pressure signals right now.";
}

function buildSummary(
  district: {
    districtName: string;
    backlogCases: number;
    medianAgeDays: number;
    disposalRate: number;
    filingVsDisposalGap: number;
  },
  isFlagged: boolean,
): string {
  if (hasNoRecentDistrictActivity(district)) {
    return `${district.districtName} has no pending cases in the latest data, and the source didn't report a pending-age distribution or recent filings-vs-clearances for this district.`;
  }

  const sentence = `${district.districtName} has ${district.backlogCases.toLocaleString("en-IN")} cases waiting. A typical pending case falls around ${district.medianAgeDays} days old, and the district cleared ${district.disposalRate.toFixed(1)}% as many cases as it received last month.`;
  return isFlagged ? `${sentence} It stays on the list of districts to watch in this snapshot.` : sentence;
}

function inferMedianAgeDays(ageBuckets: {
  lessThanOneYear: number;
  oneToThreeYears: number;
  threeToFiveYears: number;
  fiveToTenYears: number;
  aboveTenYears: number;
}): number {
  const total = Object.values(ageBuckets).reduce((sum, count) => sum + count, 0);
  if (total <= 0) {
    return 0;
  }

  const midpoint = total / 2;
  let running = 0;

  for (const [bucket, days] of Object.entries(AGE_BUCKET_MEDIAN_DAYS)) {
    running += ageBuckets[bucket as keyof typeof ageBuckets];
    if (running >= midpoint) {
      return days;
    }
  }

  return AGE_BUCKET_MEDIAN_DAYS.aboveTenYears;
}

function buildOldCaseBurden(ageBuckets: AgeBuckets) {
  const total = Object.values(ageBuckets).reduce((sum, count) => sum + count, 0);
  const threePlusYearsCases = ageBuckets.threeToFiveYears + ageBuckets.fiveToTenYears + ageBuckets.aboveTenYears;
  const fivePlusYearsCases = ageBuckets.fiveToTenYears + ageBuckets.aboveTenYears;
  const tenPlusYearsCases = ageBuckets.aboveTenYears;

  return {
    threePlusYearsCases,
    fivePlusYearsCases,
    tenPlusYearsCases,
    threePlusYearsShare: percentage(threePlusYearsCases, total),
    fivePlusYearsShare: percentage(fivePlusYearsCases, total),
    tenPlusYearsShare: percentage(tenPlusYearsCases, total),
  };
}

function buildOldCaseBurdenMetric(ageBuckets: AgeBuckets, pendingCases: number): OldCaseBurdenMetric {
  const total = Object.values(ageBuckets).reduce((sum, count) => sum + count, 0);
  if (total <= 0) {
    if (pendingCases <= 0) {
      return { state: "missing", reason: "not-applicable" };
    }

    return { state: "missing", reason: "source-not-published" };
  }

  return { state: "ok", value: buildOldCaseBurden(ageBuckets) };
}

function backlogMovementShare(
  pendingCases: number,
  institutedLastMonth: number,
  disposedLastMonth: number,
): number {
  if (pendingCases <= 0) {
    return 0;
  }

  return round(((institutedLastMonth - disposedLastMonth) / pendingCases) * 100);
}

function backlogMovementMetric(
  pendingCases: number,
  institutedLastMonth: number,
  disposedLastMonth: number,
): MetricValue {
  if (pendingCases <= 0) {
    return { state: "missing", reason: "not-applicable" };
  }

  return {
    state: "ok",
    value: round(((institutedLastMonth - disposedLastMonth) / pendingCases) * 100),
  };
}

function breakEvenClearancesNeeded(institutedLastMonth: number, disposedLastMonth: number): number {
  return Math.max(0, institutedLastMonth - disposedLastMonth);
}

function breakEvenClearancesMetric(institutedLastMonth: number, disposedLastMonth: number): MetricValue {
  return { state: "ok", value: breakEvenClearancesNeeded(institutedLastMonth, disposedLastMonth) };
}

function catchUpClearancesPerMonth(
  pendingCases: number,
  institutedLastMonth: number,
  disposedLastMonth: number,
): number {
  const monthlyReductionTarget = Math.ceil((pendingCases * 0.1) / 12);
  return Math.max(0, monthlyReductionTarget + institutedLastMonth - disposedLastMonth);
}

function catchUpClearancesMetric(
  pendingCases: number,
  institutedLastMonth: number,
  disposedLastMonth: number,
): MetricValue {
  if (pendingCases <= 0) {
    return { state: "missing", reason: "not-applicable" };
  }

  return {
    state: "ok",
    value: catchUpClearancesPerMonth(pendingCases, institutedLastMonth, disposedLastMonth),
  };
}

function buildBacklogConcentration(backlogCases: number[], totalPendingCases: number) {
  const sorted = [...backlogCases].sort((left, right) => right - left);
  return {
    topFiveDistrictsShare: percentage(sumTop(sorted, 5), totalPendingCases),
    topTenDistrictsShare: percentage(sumTop(sorted, 10), totalPendingCases),
  };
}

function buildBacklogConcentrationMetric(
  backlogCases: number[],
  totalPendingCases: number,
): BacklogConcentrationMetric {
  if (totalPendingCases <= 0) {
    return { state: "missing", reason: "not-applicable" };
  }
  if (backlogCases.length === 0) {
    return { state: "missing", reason: "incomplete-breakdown" };
  }

  return { state: "ok", value: buildBacklogConcentration(backlogCases, totalPendingCases) };
}

function sumTop(values: number[], limit: number) {
  return values.slice(0, limit).reduce((sum, value) => sum + value, 0);
}

function buildWatchlistPersistence(
  districtId: string,
  currentRank: number,
  previousSnapshots: PublishedSnapshot[],
) {
  const flags = [
    ...previousSnapshots.map((snapshot) => {
      const district = snapshot.districts.find((item) => item.districtId === districtId);
      if (!district) {
        return null;
      }

      return district.rank <= Math.max(1, snapshot.stats.flaggedDistricts);
    }),
    currentRank <= DISTRICT_FLAG_LIMIT,
  ].filter((flag): flag is boolean => flag !== null);

  const lastThree = flags.slice(-3);
  const lastSix = flags.slice(-6);
  return {
    flaggedInLastThree: lastThree.filter(Boolean).length,
    lastThreeWindow: lastThree.length,
    flaggedInLastSix: lastSix.filter(Boolean).length,
    lastSixWindow: lastSix.length,
  };
}

function percentage(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }

  return round((numerator / denominator) * 100);
}

function percentageGap(institutedLastMonth: number, disposedLastMonth: number): number {
  if (institutedLastMonth <= 0) {
    return 0;
  }

  return round(((institutedLastMonth - disposedLastMonth) / institutedLastMonth) * 100);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function slugifyDistrict(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hasNoRecentDistrictActivity(district: {
  backlogCases: number;
  medianAgeDays: number;
  disposalRate: number;
  filingVsDisposalGap: number;
}) {
  return (
    district.backlogCases === 0 &&
    district.medianAgeDays === 0 &&
    district.disposalRate === 0 &&
    district.filingVsDisposalGap === 0
  );
}

import type { PublishedSnapshot } from "../domain/snapshot-schema.js";
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
      disposalRate: percentage(district.disposedLastMonth, district.institutedLastMonth),
      medianAgeDays: inferMedianAgeDays(district.ageBuckets),
      filingVsDisposalGap: percentageGap(district.institutedLastMonth, district.disposedLastMonth),
    }))
    .sort((left, right) => {
      return right.backlogCases - left.backlogCases || right.medianAgeDays - left.medianAgeDays;
    })
    .map((district, index) => {
      const isFlagged = index < DISTRICT_FLAG_LIMIT;
      return {
        ...district,
        rank: index + 1,
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
      disposalRate: stateDisposalRate,
      medianCaseAgeDays: stateMedianAgeDays,
      flaggedDistricts: Math.min(DISTRICT_FLAG_LIMIT, districts.length),
    },
    districts,
    trends: buildTrends(previousSnapshots, extracted.sourceSnapshotAt, extracted.state.pendingCases, stateDisposalRate),
  });
}

function buildTrends(
  previousSnapshots: PublishedSnapshot[],
  snapshotDate: string,
  pendingCases: number,
  disposalRate: number,
) {
  const seen = new Set<string>();
  const points = previousSnapshots
    .slice()
    .reverse()
    .map((snapshot) => ({
      snapshotDate: snapshot.snapshot.sourceSnapshotAt,
      pendingCases: snapshot.stats.pendingCases,
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
    points.push({ snapshotDate, pendingCases, disposalRate });
  }

  return points.slice(-5);
}

function buildFlagReason(
  district: {
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
  if (district.filingVsDisposalGap > 0 && context.isFlagged) {
    return "New cases are coming in faster than this district is clearing them, and the queue is already among the state's biggest.";
  }

  if (district.medianAgeDays > context.stateMedianAgeDays && context.isFlagged) {
    return `People appear to be waiting longer here than in much of ${context.stateName}, based on the latest published snapshot.`;
  }

  if (district.disposalRate < context.stateDisposalRate) {
    return `This district is clearing cases more slowly than the ${context.stateName} average in the latest published snapshot.`;
  }

  return "This district is not among the clearest pressure signals in the current published snapshot.";
}

function buildSummary(
  district: {
    districtName: string;
    backlogCases: number;
    medianAgeDays: number;
    disposalRate: number;
  },
  isFlagged: boolean,
): string {
  const sentence = `${district.districtName} has ${district.backlogCases.toLocaleString("en-IN")} cases waiting. A typical pending case falls around ${district.medianAgeDays} days old, and the district cleared ${district.disposalRate.toFixed(1)}% as many cases as it received last month.`;
  return isFlagged ? `${sentence} It stays on the watchlist in this snapshot.` : sentence;
}

function inferMedianAgeDays(ageBuckets: {
  lessThanOneYear: number;
  oneToThreeYears: number;
  threeToFiveYears: number;
  fiveToTenYears: number;
  aboveTenYears: number;
}): number {
  const total = Object.values(ageBuckets).reduce((sum, count) => sum + count, 0);
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

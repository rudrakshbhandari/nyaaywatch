import type { DistrictSnapshot, PublishedSnapshot } from "../domain/snapshot-schema.js";
import type { DistrictHistoryPoint } from "../services/published-snapshot-service.js";
import type { PublicPageContext } from "./public-state.js";
import { formatDate } from "./home/view-model.js";
import { SITE_ORIGIN } from "./share/site-origin.js";

const EVIDENCE_PACK_VERSION = "lower-court-evidence-pack.v1";

export function buildDistrictEvidencePack(
  snapshot: PublishedSnapshot["snapshot"],
  district: DistrictSnapshot,
  history: DistrictHistoryPoint[],
  context: PublicPageContext,
) {
  const pagePath = context.routes.district(district.districtId);
  const packPath = context.routes.districtEvidencePack(district.districtId);
  const snapshotDate = formatDate(snapshot.sourceSnapshotAt);

  return {
    packType: "district_evidence_pack",
    version: EVIDENCE_PACK_VERSION,
    geography: {
      type: context.lowerCourtCopy.geographyLabel,
      stateCode: snapshot.stateCode,
      stateName: snapshot.stateName,
    },
    district: {
      id: district.districtId,
      name: district.districtName,
      pageUrl: `${SITE_ORIGIN}${pagePath}`,
      evidencePackUrl: `${SITE_ORIGIN}${packPath}`,
    },
    snapshot: buildSnapshotEvidence(snapshot),
    metrics: {
      rank: district.rank,
      backlogCases: district.backlogCases,
      filedLastMonthCases: district.filedLastMonthCases,
      clearedLastMonthCases: district.clearedLastMonthCases,
      clearedPer100Filed: district.disposalRate,
      typicalWaitMonths: Math.round(district.medianAgeDays / 30),
      medianAgeDays: district.medianAgeDays,
      filingVsDisposalGap: district.filingVsDisposalGap,
      oldCaseBurden: district.oldCaseBurden,
      ageBuckets: district.ageBuckets,
      backlogMovementShare: district.backlogMovementShare,
      breakEvenClearancesNeeded: district.breakEvenClearancesNeeded,
      catchUpClearancesPerMonth: district.catchUpClearancesPerMonth,
      watchlistPersistence: district.watchlistPersistence,
      flagReason: district.flagReason,
      summary: district.summary,
    },
    recentHistory: history.map((point) => ({
      snapshotDate: point.snapshotDate,
      publishedAt: point.publishedAt,
      methodologyVersion: point.methodologyVersion,
      qualityState: point.qualityState,
      freshnessDays: point.freshnessDays,
      rank: point.rank,
      backlogCases: point.backlogCases,
      filedLastMonthCases: point.filedLastMonthCases,
      clearedLastMonthCases: point.clearedLastMonthCases,
      clearedPer100Filed: point.disposalRate,
      medianAgeDays: point.medianAgeDays,
      filingVsDisposalGap: point.filingVsDisposalGap,
      oldCasesFivePlusShare: point.oldCaseBurdenFivePlusShare,
      backlogMovementShare: point.backlogMovementShare,
      breakEvenClearancesNeeded: point.breakEvenClearancesNeeded,
      watchlistFlaggedLastSix: point.watchlistFlaggedInLastSix,
      watchlistLastSixWindow: point.watchlistLastSixWindow,
    })),
    links: {
      page: pagePath,
      evidencePack: packPath,
      districtHistoryCsv: context.routes.districtCsv(district.districtId),
      allDistrictsCsv: context.routes.districtsCsv,
      stateEvidencePack: context.routes.stateEvidencePack,
      data: context.routes.data,
      methodology: context.routes.methodology,
      api: context.routes.api,
      statsApi: context.routes.statsApi,
      districtsApi: context.routes.districtsApi,
      trendsApi: context.routes.trendsApi,
    },
    citation: {
      plain: `NyaayWatch. "${district.districtName} District Court Backlog." ${snapshotDate}. ${snapshot.sourceAttribution}. ${SITE_ORIGIN}${pagePath}`,
      note: "Cite the district evidence page as the source of the public number. Use this JSON pack to keep the source date, methodology, CSV, and caveats together.",
    },
    caveats: buildEvidenceCaveats(),
    safety: buildEvidenceSafety(),
  };
}

export function buildStateEvidencePack(snapshot: PublishedSnapshot, context: PublicPageContext) {
  const highestBacklog = [...snapshot.districts].sort((left, right) => right.backlogCases - left.backlogCases)[0];
  const slowestClearance = [...snapshot.districts].sort((left, right) => left.disposalRate - right.disposalRate)[0];
  const comparison =
    highestBacklog && slowestClearance && highestBacklog.districtId !== slowestClearance.districtId
      ? {
          label: `${highestBacklog.districtName} vs ${slowestClearance.districtName}`,
          url: `${SITE_ORIGIN}${context.routes.compare(highestBacklog.districtId, slowestClearance.districtId)}`,
        }
      : null;
  const topDistricts = [...snapshot.districts]
    .sort((left, right) => left.rank - right.rank)
    .slice(0, 5)
    .map((district) => ({
      id: district.districtId,
      name: district.districtName,
      rank: district.rank,
      backlogCases: district.backlogCases,
      clearedPer100Filed: district.disposalRate,
      typicalWaitMonths: Math.round(district.medianAgeDays / 30),
      filingVsDisposalGap: district.filingVsDisposalGap,
      oldCasesFivePlusShare: district.oldCaseBurden.fivePlusYearsShare,
      flagReason: district.flagReason,
      pageUrl: `${SITE_ORIGIN}${context.routes.district(district.districtId)}`,
      evidencePackUrl: `${SITE_ORIGIN}${context.routes.districtEvidencePack(district.districtId)}`,
    }));

  return {
    packType: "state_evidence_pack",
    version: EVIDENCE_PACK_VERSION,
    geography: {
      type: context.lowerCourtCopy.geographyLabel,
      stateCode: snapshot.snapshot.stateCode,
      stateName: snapshot.snapshot.stateName,
      pageUrl: `${SITE_ORIGIN}${context.routes.home}`,
      evidencePackUrl: `${SITE_ORIGIN}${context.routes.stateEvidencePack}`,
    },
    snapshot: buildSnapshotEvidence(snapshot.snapshot),
    metrics: {
      pendingCases: snapshot.stats.pendingCases,
      filedLastMonthCases: snapshot.stats.filedLastMonthCases,
      clearedLastMonthCases: snapshot.stats.clearedLastMonthCases,
      clearedPer100Filed: snapshot.stats.disposalRate,
      medianCaseAgeDays: snapshot.stats.medianCaseAgeDays,
      typicalWaitMonths: Math.round(snapshot.stats.medianCaseAgeDays / 30),
      flaggedDistricts: snapshot.stats.flaggedDistricts,
      oldCaseBurden: snapshot.stats.oldCaseBurden,
      ageBuckets: snapshot.stats.ageBuckets,
      backlogMovementShare: snapshot.stats.backlogMovementShare,
      breakEvenClearancesNeeded: snapshot.stats.breakEvenClearancesNeeded,
      catchUpClearancesPerMonth: snapshot.stats.catchUpClearancesPerMonth,
      backlogConcentration: snapshot.stats.backlogConcentration,
    },
    topDistricts,
    starterLinks: {
      districts: `${SITE_ORIGIN}${context.routes.districts}`,
      movers: `${SITE_ORIGIN}${context.routes.movers}`,
      comparison,
      data: `${SITE_ORIGIN}${context.routes.data}`,
      methodology: `${SITE_ORIGIN}${context.routes.methodology}`,
    },
    links: {
      page: context.routes.home,
      evidencePack: context.routes.stateEvidencePack,
      districts: context.routes.districts,
      movers: context.routes.movers,
      allDistrictsCsv: context.routes.districtsCsv,
      data: context.routes.data,
      methodology: context.routes.methodology,
      api: context.routes.api,
      statsApi: context.routes.statsApi,
      districtsApi: context.routes.districtsApi,
      trendsApi: context.routes.trendsApi,
    },
    citation: {
      plain: `NyaayWatch. "${snapshot.snapshot.stateName} Lower-Court Backlog." ${formatDate(snapshot.snapshot.sourceSnapshotAt)}. ${snapshot.snapshot.sourceAttribution}. ${SITE_ORIGIN}${context.routes.home}`,
      note: "Cite the state or Union Territory page as the source of the public number. Use this JSON pack to keep the source date, methodology, CSV, and caveats together.",
    },
    caveats: buildEvidenceCaveats(),
    safety: buildEvidenceSafety(),
  };
}

function buildSnapshotEvidence(snapshot: PublishedSnapshot["snapshot"]) {
  return {
    sourceSnapshotAt: snapshot.sourceSnapshotAt,
    publishedAt: snapshot.publishedAt,
    methodologyVersion: snapshot.methodologyVersion,
    qualityState: snapshot.qualityState,
    freshnessDays: snapshot.freshnessDays,
    sourceName: snapshot.sourceName,
    sourceAttribution: snapshot.sourceAttribution,
    publishedFromRunId: snapshot.publishedFromRunId ?? null,
    replayedFromRunId: snapshot.replayedFromRunId ?? null,
  };
}

function buildEvidenceCaveats() {
  return [
    "These numbers are from the current public publication, not a continuously updating feed.",
    "Signals describe backlog pressure and movement. They do not assign responsibility or judge performance.",
    "Use the methodology link before comparing numbers across court layers or geographies.",
  ];
}

function buildEvidenceSafety() {
  return {
    containsRawCaptureArtifacts: false,
    containsOperatorOnlyEvidence: false,
    redistributionBoundary:
      "This pack contains only normalized fields already available on public pages, CSV downloads, or JSON APIs. Raw upstream captures and operator artifacts are not included.",
  };
}

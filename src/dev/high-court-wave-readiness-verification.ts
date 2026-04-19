import { listHighCourtProfiles, type HighCourtSourceReviewStatus } from "../high-courts.js";
import { verifyHighCourtInternalReadiness, type HighCourtInternalReadinessSummary } from "./high-court-readiness-verification.js";

export interface HighCourtWaveReadinessSummary {
  baseUrl: string;
  checkedAt: string;
  scope: {
    courtSlugs: string[];
    sourceReviewStatus: HighCourtSourceReviewStatus | "all";
  };
  totals: {
    configuredCourts: number;
    readyCourts: number;
    publishedCourts: number;
    replayReadyCourts: number;
    rollbackReadyCourts: number;
  };
  courts: HighCourtInternalReadinessSummary[];
}

export async function verifyHighCourtInternalWaveReadiness(
  baseUrl: string,
  operatorToken: string,
  options: {
    courtSlugs?: string[];
    sourceReviewStatus?: HighCourtSourceReviewStatus | "all";
    now?: Date;
  } = {},
): Promise<HighCourtWaveReadinessSummary> {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const selectedCourtSlugs = resolveSelectedCourtSlugs(options);
  const checkedAt = options.now ?? new Date();
  const courts = await Promise.all(
    selectedCourtSlugs.map((courtSlug) =>
      verifyHighCourtInternalReadiness(normalizedBaseUrl, operatorToken, {
        courtSlug,
        now: checkedAt,
      }),
    ),
  );

  return {
    baseUrl: normalizedBaseUrl,
    checkedAt: checkedAt.toISOString(),
    scope: {
      courtSlugs: selectedCourtSlugs,
      sourceReviewStatus: options.sourceReviewStatus ?? "all",
    },
    totals: {
      configuredCourts: courts.length,
      readyCourts: courts.filter((court) => court.gates.internalProofBarSatisfied).length,
      publishedCourts: courts.filter((court) => court.gates.hasPublishedSnapshot).length,
      replayReadyCourts: courts.filter((court) => court.gates.hasReplayEvidence).length,
      rollbackReadyCourts: courts.filter((court) => court.gates.hasRollbackEvidence).length,
    },
    courts,
  };
}

export function readCourtSlugs(rawValue?: string) {
  if (!rawValue) {
    return undefined;
  }

  const slugs = rawValue
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return slugs.length > 0 ? slugs : undefined;
}

export function resolveSourceReviewStatus(rawValue?: string): HighCourtSourceReviewStatus | "all" {
  if (!rawValue) {
    return "all";
  }

  const normalized = rawValue.trim().toLowerCase();
  if (normalized === "reviewed" || normalized === "queued" || normalized === "all") {
    return normalized;
  }

  throw new Error(`Unsupported source review status: ${rawValue}`);
}

function resolveSelectedCourtSlugs(options: {
  courtSlugs?: string[];
  sourceReviewStatus?: HighCourtSourceReviewStatus | "all";
}) {
  const requested = options.courtSlugs?.map((courtSlug) => courtSlug.trim()).filter((courtSlug) => courtSlug.length > 0) ?? [];
  if (requested.length > 0) {
    return requested;
  }

  const sourceReviewStatus = options.sourceReviewStatus ?? "all";
  return listHighCourtProfiles()
    .filter((profile) => sourceReviewStatus === "all" || profile.sourceReviewStatus === sourceReviewStatus)
    .map((profile) => profile.courtSlug);
}

function normalizeBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.trim();
  if (trimmed.length === 0) {
    throw new Error("A base URL is required.");
  }

  return trimmed.replace(/\/+$/, "");
}

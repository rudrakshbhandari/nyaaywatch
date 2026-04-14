import type {
  DistrictDetailPayload,
  HimachalStatsPayload,
  OperatorRunStatus,
  SnapshotRun,
  SnapshotTrustMetadata,
} from "../../../shared/src/contracts";
import type { SnapshotStore } from "../store/snapshot-store";
import { PublishService } from "./publish-service";

const STALE_AFTER_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export class PublishedSnapshotService {
  constructor(
    private readonly store: SnapshotStore,
    private readonly now: () => Date,
  ) {}

  async getHimachalStats(): Promise<HimachalStatsPayload | null> {
    const published = await this.getPublishedRun();

    if (!published) {
      return null;
    }

    return {
      geography: {
        code: "hp",
        name: "Himachal Pradesh",
      },
      snapshot: this.getTrustMetadata(published.run, published.publishedAt),
      metrics: published.run.summary,
      trend: published.run.trend,
      flaggedSignals: published.run.flaggedSignals,
      districtsPreview: [...published.run.districts]
        .sort((left, right) => left.rank - right.rank)
        .slice(0, 6)
        .map((district) => ({
          slug: district.slug,
          name: district.name,
          rank: district.rank,
          pendingCases: district.pendingCases,
          backlogChangePct: district.backlogChangePct,
          disposalRatePct: district.disposalRatePct,
          timeToJusticeIndex: district.timeToJusticeIndex,
          flagged: district.flagged,
          signalSummary: district.signalSummary,
          qualityStatus: district.qualityStatus,
        })),
    };
  }

  async getDistrictDetail(slug: string): Promise<DistrictDetailPayload | null> {
    const published = await this.getPublishedRun();

    if (!published) {
      return null;
    }

    const district = published.run.districts.find((entry) => entry.slug === slug);

    if (!district) {
      return null;
    }

    return {
      geography: {
        code: "hp",
        name: "Himachal Pradesh",
      },
      snapshot: this.getTrustMetadata(published.run, published.publishedAt),
      district,
    };
  }

  async listOperatorRuns(): Promise<OperatorRunStatus[]> {
    const runs = await this.store.getRuns();
    const state = await this.store.getPublishedState();
    const publishService = new PublishService(this.store, this.now);

    return Promise.all(
      runs.map(async (run) => {
        const result = await publishService.validateRun(run.runId);
        return {
          runId: run.runId,
          status: run.status,
          snapshotDate: run.snapshotDate,
          qualityStatus: run.qualityStatus,
          publishable: result.publishable,
          reasons: result.reasons,
          currentlyPublished: state.publishedRunId === run.runId,
        };
      }),
    );
  }

  async getPublishedRun(): Promise<{ run: SnapshotRun; publishedAt: string } | null> {
    const state = await this.store.getPublishedState();

    if (!state.publishedRunId || !state.publishedAt) {
      return null;
    }

    const run = await this.store.getRun(state.publishedRunId);

    if (!run) {
      return null;
    }

    return {
      run,
      publishedAt: state.publishedAt,
    };
  }

  private getTrustMetadata(run: SnapshotRun, publishedAt: string): SnapshotTrustMetadata {
    const snapshotInstant = new Date(`${run.snapshotDate}T00:00:00Z`);
    const ageDays = Math.max(0, Math.floor((this.now().getTime() - snapshotInstant.getTime()) / MS_PER_DAY));

    return {
      runId: run.runId,
      snapshotDate: run.snapshotDate,
      publishedAt,
      methodologyVersion: run.methodologyVersion,
      sourceName: run.sourceName,
      freshnessStatus: ageDays > STALE_AFTER_DAYS ? "stale" : "fresh",
      ageDays,
      qualityStatus: run.qualityStatus,
    };
  }
}

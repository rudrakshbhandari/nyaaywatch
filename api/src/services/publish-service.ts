import type { SnapshotRun } from "../../../shared/src/contracts";
import type { SnapshotStore } from "../store/snapshot-store";

export interface PublishValidationResult {
  publishable: boolean;
  reasons: string[];
  run: SnapshotRun | null;
}

export class PublishService {
  constructor(
    private readonly store: SnapshotStore,
    private readonly now: () => Date,
  ) {}

  async validateRun(runId: string): Promise<PublishValidationResult> {
    const run = await this.store.getRun(runId);

    if (!run) {
      return {
        publishable: false,
        reasons: ["Run not found."],
        run: null,
      };
    }

    const reasons = this.getPublishBlockers(run);

    return {
      publishable: reasons.length === 0,
      reasons,
      run,
    };
  }

  async publish(runId: string): Promise<PublishValidationResult> {
    const result = await this.validateRun(runId);

    if (!result.publishable) {
      return result;
    }

    await this.store.setPublishedRun(runId, this.now().toISOString());
    return result;
  }

  getPublishBlockers(run: SnapshotRun): string[] {
    const reasons: string[] = [];

    if (run.status !== "completed") {
      reasons.push("Run is not completed.");
    }

    if (run.geographySlug !== "himachal-pradesh") {
      reasons.push("Run does not target the Himachal Pradesh public slice.");
    }

    if (run.summary.pendingCases <= 0) {
      reasons.push("Run summary has no pending cases to publish.");
    }

    if (run.districts.length === 0) {
      reasons.push("Run has no district evidence rows.");
    }

    if (run.trend.length === 0) {
      reasons.push("Run has no statewide trend history.");
    }

    if (run.districts.some((district) => district.trend.length === 0)) {
      reasons.push("At least one district is missing trend evidence.");
    }

    if (run.methodologyVersion.trim().length === 0) {
      reasons.push("Run is missing a methodology version.");
    }

    if (run.sourceName.trim().length === 0) {
      reasons.push("Run is missing source attribution.");
    }

    return reasons;
  }
}

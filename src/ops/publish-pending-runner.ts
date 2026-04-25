import { Pool } from "pg";

import { loadConfig } from "../config/env.js";
import { SUPPORTED_STATE_CODES } from "../geographies.js";
import { listReviewedHighCourtProfilesForScheduledFetch, getReviewedSupremeCourtProfileForScheduledFetch } from "../dev/scheduled-fetch-targets.js";
import { runOperatorInvocation, type OperatorInvocation } from "../dev/operator-ops.js";
import { PgWarehouseStore, type RunRecord, type ScopeType } from "../storage/postgres.js";
import { runAutoPublish, type AutoPublishAction } from "./auto-publish-runner.js";

const LOOKBACK_DAYS = 3;

export interface PublishPendingResult {
  scopeLabel: string;
  scopeCode: string;
  scopeType: ScopeType;
  runId: string;
  ok: boolean;
  autoPublish?: AutoPublishAction;
  autoPublishReason?: string;
  error?: string;
}

export interface PublishPendingSummary {
  totalScopes: number;
  candidatesFound: number;
  publishedCount: number;
  skippedCount: number;
  failedCount: number;
  results: PublishPendingResult[];
}

interface SweepScope {
  scopeLabel: string;
  scopeCode: string;
  scopeType: ScopeType;
  selector: Pick<OperatorInvocation, "stateCode" | "highCourtCode" | "supremeCourt">;
  pendingField: "pendingCases" | "pendingTotalCases";
}

function buildSweepScopes(): SweepScope[] {
  const scopes: SweepScope[] = [];

  for (const stateCode of SUPPORTED_STATE_CODES) {
    scopes.push({
      scopeLabel: `State (${stateCode})`,
      scopeCode: stateCode,
      scopeType: "lower_court_state",
      selector: { stateCode },
      pendingField: "pendingCases",
    });
  }

  for (const profile of listReviewedHighCourtProfilesForScheduledFetch()) {
    scopes.push({
      scopeLabel: `High Court (${profile.courtSlug})`,
      scopeCode: profile.courtCode,
      scopeType: "high_court",
      selector: { highCourtCode: profile.courtCode },
      pendingField: "pendingTotalCases",
    });
  }

  try {
    getReviewedSupremeCourtProfileForScheduledFetch();
    scopes.push({
      scopeLabel: "Supreme Court",
      scopeCode: "SCI",
      scopeType: "supreme_court",
      selector: { supremeCourt: true },
      pendingField: "pendingTotalCases",
    });
  } catch {
    // Supreme Court not yet reviewed — skip
  }

  return scopes;
}

export function findUnpublishedCompleteRuns(runs: RunRecord[], since: string): RunRecord[] {
  // runs are sorted DESC by created_at. Anything older than the most recent
  // published/replayed run is considered superseded — publishing it would
  // regress freshness or undo an intentional replay.
  const latestPublication = runs.find(
    (run) => run.status === "published" || run.status === "replayed",
  );
  const publicationFloor = latestPublication?.createdAt;

  return runs
    .filter(
      (run) =>
        run.status === "completed" &&
        run.qualityState === "complete" &&
        run.createdAt >= since &&
        (publicationFloor === undefined || run.createdAt > publicationFloor),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function runPublishPendingSweep(
  rawEnv: NodeJS.ProcessEnv = process.env,
): Promise<PublishPendingSummary> {
  const config = loadConfig(rawEnv);
  const pool = new Pool({ connectionString: config.DATABASE_URL });
  const results: PublishPendingResult[] = [];
  const scopes = buildSweepScopes();
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

  try {
    const store = PgWarehouseStore.fromPool(pool);

    for (const scope of scopes) {
      const runs = await store.listRuns(scope.scopeCode, scope.scopeType);
      const candidates = findUnpublishedCompleteRuns(runs, since);
      if (candidates.length === 0) {
        continue;
      }

      console.log(
        `Publish-pending candidates for ${scope.scopeLabel}: ${candidates.length} run(s) — ${candidates.map((c) => c.id).join(", ")}`,
      );

      for (const candidate of candidates) {
        try {
          const inspectResult = await runOperatorInvocation(
            { ...scope.selector, command: "inspect", targetId: candidate.id },
            rawEnv,
          );

          const outcome = await runAutoPublish(
            {
              scopeLabel: scope.scopeLabel,
              selector: scope.selector,
              fetchResult: inspectResult,
              pendingField: scope.pendingField,
              note: "Daily publish-pending sweep",
            },
            { rawEnv },
          );

          const sweepFailed = outcome.action === "publish_failed" || outcome.action === "gate_inputs_missing";
          console.log(
            `Publish-pending outcome for ${scope.scopeLabel} run ${candidate.id}: ${outcome.action}${outcome.decision?.reason ? ` (${outcome.decision.reason})` : ""}`,
          );

          if (sweepFailed) {
            console.error(
              `Publish-pending error for ${scope.scopeLabel} run ${candidate.id}: ${outcome.action}${outcome.error ? ` — ${outcome.error}` : ""}`,
            );
          }

          results.push({
            scopeLabel: scope.scopeLabel,
            scopeCode: scope.scopeCode,
            scopeType: scope.scopeType,
            runId: candidate.id,
            ok: !sweepFailed,
            autoPublish: outcome.action,
            autoPublishReason: outcome.decision?.reason,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Publish-pending failed for ${scope.scopeLabel} run ${candidate.id}: ${message}`);
          results.push({
            scopeLabel: scope.scopeLabel,
            scopeCode: scope.scopeCode,
            scopeType: scope.scopeType,
            runId: candidate.id,
            ok: false,
            error: message,
          });
        }
      }
    }
  } finally {
    await pool.end();
  }

  return {
    totalScopes: scopes.length,
    candidatesFound: results.length,
    publishedCount: results.filter((r) => r.autoPublish === "published").length,
    skippedCount: results.filter((r) => r.ok && r.autoPublish !== "published").length,
    failedCount: results.filter((r) => !r.ok).length,
    results,
  };
}

export function assertPublishPendingSweepSucceeded(summary: PublishPendingSummary) {
  if (summary.failedCount === 0) {
    return;
  }

  const failed = summary.results.filter((r) => !r.ok).map((r) => `${r.scopeLabel} (${r.runId})`);
  throw new Error(`Publish-pending sweep failed for ${summary.failedCount} run(s): ${failed.join(", ")}`);
}

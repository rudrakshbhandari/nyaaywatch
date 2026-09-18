import { Pool } from "pg";

import { loadConfig } from "../config/env.js";
import { SUPPORTED_STATE_CODES } from "../geographies.js";
import { listReviewedHighCourtProfilesForScheduledFetch, getReviewedSupremeCourtProfileForScheduledFetch } from "../dev/scheduled-fetch-targets.js";
import { runOperatorInvocation, type OperatorInvocation } from "../dev/operator-ops.js";
import { PgWarehouseStore, type RunRecord, type ScopeType } from "../storage/postgres.js";
import { formatReviewDetails, runAutoPublish, type AutoPublishAction, type AutoPublishReview } from "./auto-publish-runner.js";
import { createAlarmNotifier } from "./alarm-notifier.js";

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
    const notifier = createAlarmNotifier(rawEnv);

    for (const scope of scopes) {
      const runs = await store.listRuns(scope.scopeCode, scope.scopeType);
      const candidates = findUnpublishedCompleteRuns(runs, since);
      if (candidates.length === 0) {
        continue;
      }

      console.log(
        `Publish-pending candidates for ${scope.scopeLabel}: ${candidates.length} run(s) — ${candidates.map((c) => c.id).join(", ")}`,
      );

      // The candidate's trends array — and therefore its previousPending baseline —
      // is captured at fetch time. When we publish multiple candidates in one
      // sweep, runs after the first need to be evaluated against the run we just
      // published, not against whatever was the latest publication when this run
      // was first captured. Track the running pending value here and feed it into
      // the gate as previousPendingOverride.
      let runningPreviousPending: number | undefined;
      const heldReviews: AutoPublishReview[] = [];

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
              previousPendingOverride: runningPreviousPending,
            },
            {
              rawEnv,
              notifier,
              onReview: (review) => { heldReviews.push(review); },
            },
          );

          if (outcome.action === "published") {
            // Candidates are chronological. A later successful publication
            // supersedes earlier held runs, which no longer require review.
            heldReviews.length = 0;
            runningPreviousPending = outcome.decision?.currentPending;
          } else if (outcome.action === "publish_failed") {
            // Publishing commits the database state before cache invalidation. If
            // invalidation fails, keep the committed publication as the baseline
            // for later candidates while still reporting the operational failure.
            const latest = await loadLatestPublishedRun(store, scope.scopeCode, scope.scopeType);
            if (latest?.runId === candidate.id) {
              heldReviews.length = 0;
              runningPreviousPending = await loadPreviousPending(store, scope.scopeCode, scope.scopeType, scope.pendingField);
            }
          }

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

      if (heldReviews.length > 0) {
        try {
          await notifier.publish(
            `NyaayWatch review required: ${scope.scopeLabel}`,
            [
              `Scope: ${scope.scopeLabel}`,
              `Held runs requiring review: ${heldReviews.length}`,
              "",
              ...heldReviews.map((review) => formatReviewDetails(review.runId, review.decision) + "\n"),
              "Inspect these runs via the operator CLI and publish or discard manually once reviewed.",
              "Unresolved runs within the 3-day lookback are included in each daily sweep reminder.",
            ].join("\n"),
          );
        } catch (error) {
          const message = `Review digest notification failed: ${error instanceof Error ? error.message : String(error)}`;
          console.error(`Publish-pending failed for ${scope.scopeLabel}: ${message}`);
          const heldRunIds = new Set(heldReviews.map((review) => review.runId));
          for (const result of results) {
            if (result.scopeType === scope.scopeType && result.scopeCode === scope.scopeCode && heldRunIds.has(result.runId)) {
              result.ok = false;
              result.error = message;
            }
          }
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

async function loadLatestPublishedRun(
  store: PgWarehouseStore,
  scopeCode: string,
  scopeType: ScopeType,
): Promise<{ runId: string } | null> {
  const latest =
    scopeType === "lower_court_state"
      ? await store.getLatestPublishedSnapshot(scopeCode, scopeType)
      : scopeType === "high_court"
        ? await store.getLatestHighCourtPublishedSnapshot(scopeCode, scopeType)
        : await store.getLatestSupremeCourtPublishedSnapshot(scopeCode, scopeType);
  return latest ? { runId: latest.runId } : null;
}

async function loadPreviousPending(
  store: PgWarehouseStore,
  scopeCode: string,
  scopeType: ScopeType,
  pendingField: SweepScope["pendingField"],
): Promise<number | undefined> {
  const latest =
    scopeType === "lower_court_state"
      ? await store.getLatestPublishedSnapshot(scopeCode, scopeType)
      : scopeType === "high_court"
        ? await store.getLatestHighCourtPublishedSnapshot(scopeCode, scopeType)
        : await store.getLatestSupremeCourtPublishedSnapshot(scopeCode, scopeType);
  const stats = latest?.payload.stats as Record<string, unknown> | undefined;
  const pending = stats?.[pendingField];
  return typeof pending === "number" && Number.isFinite(pending) ? pending : undefined;
}

import { runAutoPublish, type AutoPublishAction } from "../ops/auto-publish-runner.js";
import type { SupremeCourtProfile } from "../supreme-court.js";
import { runOperatorInvocation } from "./operator-ops.js";
import { getReviewedSupremeCourtProfileForScheduledFetch } from "./scheduled-fetch-targets.js";

const DEFAULT_SCHEDULED_SUPREME_COURT_FETCH_NOTE_PREFIX = "Scheduled daily Supreme Court internal raw fetch";

export interface ScheduledSupremeCourtFetchSummary {
  notePrefix: string;
  target: {
    courtCode: SupremeCourtProfile["courtCode"];
    courtSlug: SupremeCourtProfile["courtSlug"];
    courtName: SupremeCourtProfile["courtName"];
  };
  ok: boolean;
  runId?: string;
  error?: string;
  autoPublish?: AutoPublishAction;
  autoPublishReason?: string;
}

export function normalizeScheduledSupremeCourtFetchNotePrefix(notePrefix?: string) {
  return notePrefix?.trim() || DEFAULT_SCHEDULED_SUPREME_COURT_FETCH_NOTE_PREFIX;
}

export function buildScheduledSupremeCourtFetchNote(profile: SupremeCourtProfile, notePrefix?: string) {
  return `${normalizeScheduledSupremeCourtFetchNotePrefix(notePrefix)} for ${profile.courtName}`;
}

export async function runScheduledSupremeCourtFetch(
  notePrefix?: string,
  rawEnv: NodeJS.ProcessEnv = process.env,
): Promise<ScheduledSupremeCourtFetchSummary> {
  const profile = getReviewedSupremeCourtProfileForScheduledFetch();
  const normalizedNotePrefix = normalizeScheduledSupremeCourtFetchNotePrefix(notePrefix);
  const note = buildScheduledSupremeCourtFetchNote(profile, normalizedNotePrefix);

  console.log(`Starting scheduled internal Supreme Court fetch for ${profile.courtSlug}`);

  try {
    const result = await runOperatorInvocation(
      {
        command: "fetch",
        supremeCourt: true,
        note,
      },
      rawEnv,
    );

    const runId = extractRunId(result);
    console.log(`Completed scheduled internal Supreme Court fetch for ${profile.courtSlug}${runId ? ` (${runId})` : ""}`);

    const autoPublishOutcome = await runAutoPublish(
      {
        scopeLabel: `Supreme Court (${profile.courtSlug})`,
        selector: { supremeCourt: true },
        fetchResult: result,
        pendingField: "pendingTotalCases",
        note: `${normalizedNotePrefix} auto-publish`,
      },
      { rawEnv },
    );
    console.log(
      `Auto-publish outcome for ${profile.courtSlug}: ${autoPublishOutcome.action}${autoPublishOutcome.decision?.reason ? ` (${autoPublishOutcome.decision.reason})` : ""}`,
    );

    return {
      notePrefix: normalizedNotePrefix,
      target: {
        courtCode: profile.courtCode,
        courtSlug: profile.courtSlug,
        courtName: profile.courtName,
      },
      ok: true,
      runId,
      autoPublish: autoPublishOutcome.action,
      autoPublishReason: autoPublishOutcome.decision?.reason,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Scheduled internal Supreme Court fetch failed for ${profile.courtSlug}: ${message}`);
    return {
      notePrefix: normalizedNotePrefix,
      target: {
        courtCode: profile.courtCode,
        courtSlug: profile.courtSlug,
        courtName: profile.courtName,
      },
      ok: false,
      error: message,
    };
  }
}

export function assertScheduledSupremeCourtFetchSucceeded(summary: ScheduledSupremeCourtFetchSummary) {
  if (summary.ok) {
    return;
  }

  throw new Error(`Scheduled internal Supreme Court fetch failed: ${summary.error ?? "Unknown error"}`);
}

function extractRunId(result: unknown) {
  if (!result || typeof result !== "object") {
    return undefined;
  }

  if ("run" in result && result.run && typeof result.run === "object" && "id" in result.run && typeof result.run.id === "string") {
    return result.run.id;
  }

  if ("id" in result && typeof result.id === "string") {
    return result.id;
  }

  return undefined;
}

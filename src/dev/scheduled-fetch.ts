import { listInternalFetchStateProfiles, type NjdgStateProfile } from "../geographies.js";
import { runOperatorInvocation } from "./operator-ops.js";

const DEFAULT_SCHEDULED_FETCH_NOTE_PREFIX = "Scheduled daily lower-court internal raw fetch";

export interface ScheduledFetchStateResult {
  stateCode: string;
  stateName: string;
  ok: boolean;
  runId?: string;
  error?: string;
}

export interface ScheduledFetchSummary {
  notePrefix: string;
  totalStates: number;
  successfulStateCodes: string[];
  failedStateCodes: string[];
  results: ScheduledFetchStateResult[];
}

export function normalizeScheduledFetchNotePrefix(notePrefix?: string) {
  return notePrefix?.trim() || DEFAULT_SCHEDULED_FETCH_NOTE_PREFIX;
}

export function buildScheduledFetchNote(profile: NjdgStateProfile, notePrefix?: string) {
  return `${normalizeScheduledFetchNotePrefix(notePrefix)} for ${profile.stateName} [${profile.stateCode}]`;
}

export async function runScheduledFetches(
  notePrefix?: string,
  rawEnv: NodeJS.ProcessEnv = process.env,
): Promise<ScheduledFetchSummary> {
  const normalizedNotePrefix = normalizeScheduledFetchNotePrefix(notePrefix);
  const profiles = listInternalFetchStateProfiles();
  const results: ScheduledFetchStateResult[] = [];

  for (const profile of profiles) {
    const note = buildScheduledFetchNote(profile, normalizedNotePrefix);
    console.log(`Starting scheduled internal fetch for ${profile.stateCode}`);

    try {
      const result = await runOperatorInvocation(
        {
          command: "fetch",
          stateCode: profile.stateCode,
          note,
        },
        rawEnv,
      );

      const runId = extractRunId(result);
      results.push({
        stateCode: profile.stateCode,
        stateName: profile.stateName,
        ok: true,
        runId,
      });

      console.log(`Completed scheduled internal fetch for ${profile.stateCode}${runId ? ` (${runId})` : ""}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        stateCode: profile.stateCode,
        stateName: profile.stateName,
        ok: false,
        error: message,
      });

      console.error(`Scheduled internal fetch failed for ${profile.stateCode}: ${message}`);
    }
  }

  return {
    notePrefix: normalizedNotePrefix,
    totalStates: profiles.length,
    successfulStateCodes: results.filter((result) => result.ok).map((result) => result.stateCode),
    failedStateCodes: results.filter((result) => !result.ok).map((result) => result.stateCode),
    results,
  };
}

export function assertScheduledFetchSucceeded(summary: ScheduledFetchSummary) {
  if (summary.failedStateCodes.length === 0) {
    return;
  }

  throw new Error(
    `Scheduled internal fetch failed for ${summary.failedStateCodes.length} state(s): ${summary.failedStateCodes.join(", ")}`,
  );
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

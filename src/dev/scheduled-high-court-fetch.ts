import type { HighCourtProfile } from "../high-courts.js";
import { runOperatorInvocation } from "./operator-ops.js";
import { listReviewedHighCourtProfilesForScheduledFetch } from "./scheduled-fetch-targets.js";

const DEFAULT_SCHEDULED_HIGH_COURT_FETCH_NOTE_PREFIX = "Scheduled daily High Court internal raw fetch";

export interface ScheduledHighCourtFetchResult {
  courtCode: string;
  courtSlug: string;
  courtName: string;
  coveredGeographies: HighCourtProfile["coveredGeographies"];
  ok: boolean;
  runId?: string;
  error?: string;
}

export interface ScheduledHighCourtFetchSummary {
  notePrefix: string;
  totalCourts: number;
  successfulCourtSlugs: string[];
  failedCourtSlugs: string[];
  results: ScheduledHighCourtFetchResult[];
}

export function normalizeScheduledHighCourtFetchNotePrefix(notePrefix?: string) {
  return notePrefix?.trim() || DEFAULT_SCHEDULED_HIGH_COURT_FETCH_NOTE_PREFIX;
}

export function buildScheduledHighCourtFetchNote(profile: HighCourtProfile, notePrefix?: string) {
  return `${normalizeScheduledHighCourtFetchNotePrefix(notePrefix)} for ${profile.courtName} [${profile.courtSlug}]`;
}

export async function runScheduledHighCourtFetches(
  notePrefix?: string,
  rawEnv: NodeJS.ProcessEnv = process.env,
): Promise<ScheduledHighCourtFetchSummary> {
  const normalizedNotePrefix = normalizeScheduledHighCourtFetchNotePrefix(notePrefix);
  const profiles = listReviewedHighCourtProfilesForScheduledFetch();
  const results: ScheduledHighCourtFetchResult[] = [];

  for (const profile of profiles) {
    const note = buildScheduledHighCourtFetchNote(profile, normalizedNotePrefix);
    console.log(`Starting scheduled internal High Court fetch for ${profile.courtSlug}`);

    try {
      const result = await runOperatorInvocation(
        {
          command: "fetch",
          highCourtCode: profile.courtCode,
          note,
        },
        rawEnv,
      );

      const runId = extractRunId(result);
      console.log(`Completed scheduled internal High Court fetch for ${profile.courtSlug}${runId ? ` (${runId})` : ""}`);

      results.push({
        courtCode: profile.courtCode,
        courtSlug: profile.courtSlug,
        courtName: profile.courtName,
        coveredGeographies: profile.coveredGeographies,
        ok: true,
        runId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        courtCode: profile.courtCode,
        courtSlug: profile.courtSlug,
        courtName: profile.courtName,
        coveredGeographies: profile.coveredGeographies,
        ok: false,
        error: message,
      });

      console.error(`Scheduled internal High Court fetch failed for ${profile.courtSlug}: ${message}`);
    }
  }

  return {
    notePrefix: normalizedNotePrefix,
    totalCourts: profiles.length,
    successfulCourtSlugs: results.filter((result) => result.ok).map((result) => result.courtSlug),
    failedCourtSlugs: results.filter((result) => !result.ok).map((result) => result.courtSlug),
    results,
  };
}

export function assertScheduledHighCourtFetchSucceeded(summary: ScheduledHighCourtFetchSummary) {
  if (summary.failedCourtSlugs.length === 0) {
    return;
  }

  throw new Error(
    `Scheduled internal High Court fetch failed for ${summary.failedCourtSlugs.length} court(s): ${summary.failedCourtSlugs.join(", ")}`,
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

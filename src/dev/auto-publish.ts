import { listPublicHighCourtProfiles } from "../high-courts.js";
import { getSupremeCourtProfile } from "../supreme-court.js";
import { readFlag } from "./cli-flag-utils.js";

export interface AutoPublishScopeResult {
  scope: "supreme-court" | "high-court";
  courtCode: string;
  courtSlug: string;
  courtName: string;
  status: "published" | "skipped" | "failed";
  runId?: string;
  publicationId?: string;
  reason?: string;
  error?: string;
}

export interface AutoPublishSummary {
  attemptedCount: number;
  publishedCount: number;
  skippedCount: number;
  failedCount: number;
  results: AutoPublishScopeResult[];
}

interface CandidateRun {
  id: string;
  status: string;
  qualityState: string;
  createdAt: string;
}

const DEFAULT_LIST_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_PUBLISH_TIMEOUT_MS = 10 * 60 * 1000;

export interface AutoPublishOptions {
  baseUrl: string;
  operatorToken: string;
  note?: string;
  listTimeoutMs?: number;
  publishTimeoutMs?: number;
}

export async function runAutoPublish(options: AutoPublishOptions): Promise<AutoPublishSummary> {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const note = options.note?.trim() || defaultAutoPublishNote();
  const results: AutoPublishScopeResult[] = [];

  const supremeCourt = getSupremeCourtProfile();
  results.push(
    await publishLatestForScope({
      scope: "supreme-court",
      courtCode: supremeCourt.courtCode,
      courtSlug: supremeCourt.courtSlug,
      courtName: supremeCourt.courtName,
      runsUrl: `${baseUrl}/operator/supreme-court/runs`,
      publishUrl: (runId) =>
        `${baseUrl}/operator/supreme-court/runs/${encodeURIComponent(runId)}/publish`,
      options,
      note,
    }),
  );

  for (const profile of listPublicHighCourtProfiles()) {
    results.push(
      await publishLatestForScope({
        scope: "high-court",
        courtCode: profile.courtCode,
        courtSlug: profile.courtSlug,
        courtName: profile.courtName,
        runsUrl: `${baseUrl}/operator/high-courts/${encodeURIComponent(profile.courtSlug)}/runs`,
        publishUrl: (runId) =>
          `${baseUrl}/operator/high-courts/${encodeURIComponent(profile.courtSlug)}/runs/${encodeURIComponent(runId)}/publish`,
        options,
        note,
      }),
    );
  }

  return {
    attemptedCount: results.length,
    publishedCount: results.filter((result) => result.status === "published").length,
    skippedCount: results.filter((result) => result.status === "skipped").length,
    failedCount: results.filter((result) => result.status === "failed").length,
    results,
  };
}

async function publishLatestForScope(args: {
  scope: "supreme-court" | "high-court";
  courtCode: string;
  courtSlug: string;
  courtName: string;
  runsUrl: string;
  publishUrl: (runId: string) => string;
  options: AutoPublishOptions;
  note: string;
}): Promise<AutoPublishScopeResult> {
  const base = {
    scope: args.scope,
    courtCode: args.courtCode,
    courtSlug: args.courtSlug,
    courtName: args.courtName,
  };

  try {
    const runs = await fetchRuns(args.runsUrl, args.options);
    const target = findLatestPublishableRun(runs);
    if (!target) {
      return {
        ...base,
        status: "skipped",
        reason: "No completed, high-quality run awaiting publication.",
      };
    }

    const publishResult = await postPublish(args.publishUrl(target.id), args.options, args.note);
    const publicationId = extractPublicationId(publishResult);
    return {
      ...base,
      status: "published",
      runId: target.id,
      publicationId,
    };
  } catch (error) {
    return {
      ...base,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function findLatestPublishableRun(runs: CandidateRun[]): CandidateRun | undefined {
  return [...runs]
    .filter((run) => run.status === "completed" && run.qualityState !== "partial")
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
}

async function fetchRuns(url: string, options: AutoPublishOptions): Promise<CandidateRun[]> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-operator-token": options.operatorToken,
    },
    signal: AbortSignal.timeout(options.listTimeoutMs ?? DEFAULT_LIST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status} ${await response.text()}`);
  }

  const body = (await response.json()) as { runs?: CandidateRun[] } | null;
  return Array.isArray(body?.runs) ? body!.runs : [];
}

async function postPublish(url: string, options: AutoPublishOptions, note: string): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-operator-token": options.operatorToken,
    },
    body: JSON.stringify({ note }),
    signal: AbortSignal.timeout(options.publishTimeoutMs ?? DEFAULT_PUBLISH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`POST ${url} failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

function extractPublicationId(result: unknown): string | undefined {
  if (!result || typeof result !== "object") {
    return undefined;
  }

  const publication = (result as { publication?: unknown }).publication;
  if (!publication || typeof publication !== "object") {
    return undefined;
  }

  const id = (publication as { id?: unknown }).id;
  return typeof id === "string" ? id : undefined;
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (trimmed.length === 0) {
    throw new Error("A base URL is required.");
  }

  return trimmed.replace(/\/+$/, "");
}

function defaultAutoPublishNote(): string {
  return `Auto-published daily snapshot at ${new Date().toISOString()}.`;
}

export async function runAutoPublishCli(rawArgs: string[], rawEnv: NodeJS.ProcessEnv = process.env): Promise<AutoPublishSummary> {
  const baseUrl = readFlag(rawArgs, "--base-url") ?? rawEnv.OPERATOR_BASE_URL ?? rawEnv.BASE_URL;
  const operatorToken = rawEnv.OPERATOR_API_TOKEN;
  const note = readFlag(rawArgs, "--note");

  if (!baseUrl) {
    throw new Error(
      "Usage: tsx src/dev/auto-publish.ts --base-url <https://nyaaywatch.in> [--note <note>] (OPERATOR_API_TOKEN env required)",
    );
  }

  if (!operatorToken) {
    throw new Error("OPERATOR_API_TOKEN environment variable is required to authenticate auto-publish.");
  }

  return runAutoPublish({
    baseUrl,
    operatorToken,
    note,
  });
}

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import type { PublishedSnapshotService, PublicationHistoryEntry, RunInspection } from "../services/published-snapshot-service.js";
import { verifyPublicRelease, type ReleaseVerificationSummary } from "./release-verification.js";

export interface PrepublishSummary {
  checkedAt: string;
  baseUrl: string;
  targetRun: {
    id: string;
    status: string;
    qualityState: string;
    sourceSnapshotAt: string;
    methodologyVersion: string;
    candidateReady: boolean;
    artifactTypes: string[];
  };
  currentPublicRelease: ReleaseVerificationSummary;
  rollbackTarget: PublicationHistoryEntry | null;
}

export interface PostpublishSummary {
  checkedAt: string;
  baseUrl: string;
  publication: PublicationHistoryEntry;
  currentPublicRelease: ReleaseVerificationSummary;
  rollbackTarget: PublicationHistoryEntry | null;
  evidencePath: string;
  evidenceJsonPath: string;
}

export interface ReleaseRecordSummary extends PostpublishSummary {
  historyPath: string;
  reviewer: string;
  note: string | null;
}

export async function buildPrepublishSummary(
  service: PublishedSnapshotService,
  baseUrl: string,
  runId: string,
): Promise<PrepublishSummary> {
  const [currentPublicRelease, inspection, publicationHistory] = await Promise.all([
    verifyPublicRelease(baseUrl),
    service.inspectRun(runId),
    service.listPublicationHistory(),
  ]);

  assertInspectableRun(runId, inspection);

  return {
    checkedAt: new Date().toISOString(),
    baseUrl: currentPublicRelease.baseUrl,
    targetRun: {
      id: inspection.run.id,
      status: inspection.run.status,
      qualityState: inspection.run.qualityState,
      sourceSnapshotAt: inspection.run.sourceSnapshotAt,
      methodologyVersion: inspection.run.methodologyVersion,
      candidateReady: inspection.candidate !== null,
      artifactTypes: inspection.artifacts.map((artifact) => artifact.artifactType),
    },
    currentPublicRelease,
    rollbackTarget: publicationHistory[0] ?? null,
  };
}

export async function buildPostpublishSummary(
  service: PublishedSnapshotService,
  baseUrl: string,
  publicationId: string,
  outputPath?: string,
): Promise<PostpublishSummary> {
  const [currentPublicRelease, publicationHistory] = await Promise.all([
    verifyPublicRelease(baseUrl),
    service.listPublicationHistory(),
  ]);
  const publication = publicationHistory.find((entry) => entry.publication.id === publicationId);
  if (!publication) {
    throw new Error(`Publication ${publicationId} was not found.`);
  }

  if (!publication.isActive) {
    throw new Error(`Publication ${publicationId} is not the active publication.`);
  }

  const summaryBase = {
    checkedAt: new Date().toISOString(),
    baseUrl: currentPublicRelease.baseUrl,
    publication,
    currentPublicRelease,
    rollbackTarget: publicationHistory[1] ?? null,
  };
  const evidencePath = await writeReleaseEvidenceFile(summaryBase, outputPath);
  const evidenceJsonPath = await writeReleaseEvidenceJson(summaryBase, changeExtension(evidencePath, ".json"));

  return {
    ...summaryBase,
    evidencePath,
    evidenceJsonPath,
  };
}

export async function recordReleaseHistory(
  service: PublishedSnapshotService,
  input: {
    baseUrl: string;
    publicationId: string;
    reviewer: string;
    note?: string;
    outputPath?: string;
    historyPath?: string;
  },
): Promise<ReleaseRecordSummary> {
  const summary = await buildPostpublishSummary(service, input.baseUrl, input.publicationId, input.outputPath);
  const historyPath = resolve(input.historyPath ?? join(process.cwd(), "docs", "RELEASE_HISTORY.md"));
  const reviewer = input.reviewer.trim();

  if (reviewer.length === 0) {
    throw new Error("A reviewer is required.");
  }

  const note = input.note?.trim() || null;
  await upsertReleaseHistory(historyPath, {
    ...summary,
    reviewer,
    note,
  });

  return {
    ...summary,
    historyPath,
    reviewer,
    note,
  };
}

function assertInspectableRun(runId: string, inspection: RunInspection | null): asserts inspection is RunInspection {
  if (!inspection) {
    throw new Error(`Run ${runId} was not found.`);
  }

  if (inspection.run.status !== "completed") {
    throw new Error(`Run ${runId} is not ready for publish review. Current status: ${inspection.run.status}.`);
  }

  if (!inspection.candidate) {
    throw new Error(`Run ${runId} does not have a stored snapshot candidate.`);
  }
}

async function writeReleaseEvidenceFile(
  summary: Omit<PostpublishSummary, "evidencePath" | "evidenceJsonPath">,
  outputPath?: string,
): Promise<string> {
  const resolvedPath = resolve(
    outputPath ?? join(process.cwd(), "output", "release-evidence", `${summary.publication.publication.id}.md`),
  );
  await mkdir(dirname(resolvedPath), { recursive: true });
  await writeFile(resolvedPath, renderReleaseEvidence(summary), "utf8");
  return resolvedPath;
}

async function writeReleaseEvidenceJson(
  summary: Omit<PostpublishSummary, "evidencePath" | "evidenceJsonPath">,
  outputPath: string,
): Promise<string> {
  const resolvedPath = resolve(outputPath);
  await mkdir(dirname(resolvedPath), { recursive: true });
  await writeFile(resolvedPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  return resolvedPath;
}

function renderReleaseEvidence(summary: Omit<PostpublishSummary, "evidencePath" | "evidenceJsonPath">) {
  const lines = [
    "# Release Evidence",
    "",
    `- Checked at: \`${summary.checkedAt}\``,
    `- Base URL: \`${summary.baseUrl}\``,
    `- Publication id: \`${summary.publication.publication.id}\``,
    `- Action: \`${summary.publication.publication.action}\``,
    `- Snapshot id: \`${summary.publication.snapshot.id}\``,
    `- Published from run id: \`${summary.publication.snapshot.publishedFromRunId ?? summary.publication.run.id}\``,
    `- Source snapshot date: \`${summary.publication.snapshot.sourceSnapshotAt}\``,
    `- Published at: \`${summary.publication.snapshot.publishedAt}\``,
    `- Methodology version: \`${summary.publication.snapshot.methodologyVersion}\``,
    `- Quality state: \`${summary.publication.snapshot.qualityState}\``,
    `- Rollback target: \`${summary.rollbackTarget?.publication.id ?? "none"}\``,
    "",
    "## Verification Summary",
    "",
    "```json",
    JSON.stringify(summary.currentPublicRelease, null, 2),
    "```",
  ];

  return lines.join("\n");
}

async function upsertReleaseHistory(
  historyPath: string,
  summary: Omit<ReleaseRecordSummary, "historyPath">,
) {
  const releaseId = summary.publication.publication.id;
  const startMarker = `<!-- release:${releaseId}:start -->`;
  const endMarker = `<!-- release:${releaseId}:end -->`;
  const nextEntry = [startMarker, renderReleaseHistoryEntry(summary), endMarker].join("\n");
  const existing = await readOrCreateReleaseHistory(historyPath);
  const markerPattern = new RegExp(`${escapeRegExp(startMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}\\n?`, "g");

  let updated = existing.replace(markerPattern, "");
  updated = insertReleaseEntry(updated, nextEntry);
  await writeFile(historyPath, updated, "utf8");
}

async function readOrCreateReleaseHistory(historyPath: string) {
  try {
    return await readFile(historyPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    return defaultReleaseHistoryDocument();
  }
}

function insertReleaseEntry(existing: string, entry: string) {
  const marker = "<!-- release-history:entries -->";
  if (existing.includes(marker)) {
    return existing.replace(marker, `${marker}\n\n${entry}`);
  }

  return `${existing.trimEnd()}\n\n${entry}\n`;
}

function renderReleaseHistoryEntry(summary: Omit<ReleaseRecordSummary, "historyPath">) {
  const noteLine = summary.note ? `- Note: ${summary.note}` : "- Note: none recorded";
  return [
    `## ${summary.publication.publication.id}`,
    "",
    `- Reviewed at: \`${summary.checkedAt}\``,
    `- Reviewer: \`${summary.reviewer}\``,
    `- Public URL: \`${summary.baseUrl}\``,
    `- Action: \`${summary.publication.publication.action}\``,
    `- Source snapshot date: \`${summary.publication.snapshot.sourceSnapshotAt}\``,
    `- Published at: \`${summary.publication.snapshot.publishedAt}\``,
    `- Methodology version: \`${summary.publication.snapshot.methodologyVersion}\``,
    `- Quality state: \`${summary.publication.snapshot.qualityState}\``,
    `- Published from run: \`${summary.publication.snapshot.publishedFromRunId ?? summary.publication.run.id}\``,
    `- Rollback target: \`${summary.rollbackTarget?.publication.id ?? "none"}\``,
    `- Markdown evidence: \`${summary.evidencePath}\``,
    `- JSON evidence: \`${summary.evidenceJsonPath}\``,
    noteLine,
    "",
  ].join("\n");
}

function defaultReleaseHistoryDocument() {
  return `# Release History

Tracked history of public NyaayWatch publishes.

Use \`npm run release:record\` after each successful publish to keep this file aligned with the generated evidence artifacts in \`output/release-evidence/\`.

<!-- release-history:entries -->
`;
}

function changeExtension(path: string, extension: string) {
  const index = path.lastIndexOf(".");
  return index >= 0 ? `${path.slice(0, index)}${extension}` : `${path}${extension}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

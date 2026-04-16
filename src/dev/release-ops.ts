import { mkdir, writeFile } from "node:fs/promises";
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

  const evidencePath = await writeReleaseEvidenceFile(
    {
      checkedAt: new Date().toISOString(),
      baseUrl: currentPublicRelease.baseUrl,
      publication,
      currentPublicRelease,
      rollbackTarget: publicationHistory[1] ?? null,
    },
    outputPath,
  );

  return {
    checkedAt: new Date().toISOString(),
    baseUrl: currentPublicRelease.baseUrl,
    publication,
    currentPublicRelease,
    rollbackTarget: publicationHistory[1] ?? null,
    evidencePath,
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
  summary: Omit<PostpublishSummary, "evidencePath">,
  outputPath?: string,
): Promise<string> {
  const resolvedPath = resolve(
    outputPath ?? join(process.cwd(), "output", "release-evidence", `${summary.publication.publication.id}.md`),
  );
  await mkdir(dirname(resolvedPath), { recursive: true });
  await writeFile(resolvedPath, renderReleaseEvidence(summary), "utf8");
  return resolvedPath;
}

function renderReleaseEvidence(summary: Omit<PostpublishSummary, "evidencePath">) {
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

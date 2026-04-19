import { Pool } from "pg";

import { loadConfig } from "../config/env.js";
import { getStateProfile } from "../geographies.js";
import { getHighCourtProfile, getHighCourtProfileBySlug, listHighCourtProfiles } from "../high-courts.js";
import { NjdgStateSourceClient } from "../ingest/himachal-source-client.js";
import { createHighCourtSourceClient } from "../ingest/high-court-source-client.js";
import { createSupremeCourtSourceClient } from "../ingest/supreme-court-source-client.js";
import { PublishedHighCourtSnapshotService } from "../services/published-high-court-snapshot-service.js";
import { PublishedSupremeCourtSnapshotService } from "../services/published-supreme-court-snapshot-service.js";
import { PublishedSnapshotService } from "../services/published-snapshot-service.js";
import { S3ArtifactStore } from "../storage/artifact-store.js";
import { PgWarehouseStore } from "../storage/postgres.js";
import { getSupremeCourtProfile } from "../supreme-court.js";

const SUPPORTED_OPERATOR_COMMANDS = ["fetch", "inspect", "publications", "publish", "replay", "rollback"] as const;

export type OperatorCommand = (typeof SUPPORTED_OPERATOR_COMMANDS)[number];

export interface OperatorInvocation {
  stateCode?: string;
  highCourtCode?: string;
  supremeCourt?: boolean;
  command: OperatorCommand;
  targetId?: string;
  note?: string;
}

export function parseOperatorInvocation(args: string[]): OperatorInvocation {
  const stateCode = readFlag(args, "--state");
  const highCourtCode = resolveHighCourtCode(readFlag(args, "--high-court"));
  const supremeCourt = args.includes("--supreme-court");
  const positionals = ["--state", "--high-court", "--supreme-court"].reduce((currentArgs, flag) => stripFlag(currentArgs, flag), args);
  const [rawCommand, rawTargetId, ...rest] = positionals;

  if (!rawCommand) {
    throw new Error(
      "Usage: operator [--state <STATE_CODE> | --high-court <court-slug>] fetch [note] | inspect <run-id> | publications | publish <run-id> [note] | replay <run-id> [note] | rollback <publication-id> [note]",
    );
  }

  if (!SUPPORTED_OPERATOR_COMMANDS.includes(rawCommand as OperatorCommand)) {
    throw new Error(`Unsupported operator command: ${rawCommand}`);
  }

  if ([Boolean(stateCode), Boolean(highCourtCode), supremeCourt].filter(Boolean).length > 1) {
    throw new Error("Select either --state, --high-court, or --supreme-court, not multiple targets.");
  }

  const command = rawCommand as OperatorCommand;

  if (command === "fetch") {
    return {
      stateCode,
      highCourtCode,
      supremeCourt,
      command: "fetch",
      note: [rawTargetId, ...rest].join(" ").trim() || undefined,
    };
  }

  if (command === "publications") {
    return {
      stateCode,
      highCourtCode,
      supremeCourt,
      command: "publications",
    };
  }

  if (!rawTargetId) {
    throw new Error("This operator command requires a target id.");
  }

  return {
    stateCode,
    highCourtCode,
    supremeCourt,
    command,
    targetId: rawTargetId,
    note: rest.join(" ").trim() || undefined,
  };
}

export async function runOperatorInvocation(
  invocation: OperatorInvocation,
  rawEnv: NodeJS.ProcessEnv = process.env,
): Promise<unknown> {
  const config = loadConfig({
    ...rawEnv,
    ...(invocation.stateCode ? { STATE_CODE: invocation.stateCode } : {}),
  });
  const profile = getStateProfile(config.STATE_CODE);
  const pool = new Pool({ connectionString: config.DATABASE_URL });

  try {
    const store = PgWarehouseStore.fromPool(pool);
    const artifactStore = new S3ArtifactStore(config);
    if (invocation.supremeCourt) {
      const supremeCourtService = new PublishedSupremeCourtSnapshotService(
        config,
        getSupremeCourtProfile(),
        store,
        artifactStore,
        createSupremeCourtSourceClient(),
      );

      switch (invocation.command) {
        case "fetch":
          return await supremeCourtService.captureRun(invocation.note);
        case "publications":
          return await supremeCourtService.listPublicationHistory();
        case "inspect":
          return await supremeCourtService.inspectRun(invocation.targetId!);
        case "publish":
          return await supremeCourtService.publishRun(invocation.targetId!, invocation.note);
        case "replay":
          return await supremeCourtService.replayRun(invocation.targetId!, invocation.note);
        case "rollback":
          return await supremeCourtService.rollbackPublication(invocation.targetId!, invocation.note);
      }
    }

    if (invocation.highCourtCode) {
      const highCourtProfile = getRequiredHighCourtProfile(invocation.highCourtCode);
      const highCourtService = new PublishedHighCourtSnapshotService(
        config,
        highCourtProfile,
        store,
        artifactStore,
        createHighCourtSourceClient(highCourtProfile.courtCode),
      );

      switch (invocation.command) {
        case "fetch":
          return await highCourtService.captureRun(invocation.note);
        case "publications":
          return await highCourtService.listPublicationHistory();
        case "inspect":
          return await highCourtService.inspectRun(invocation.targetId!);
        case "publish":
          return await highCourtService.publishRun(invocation.targetId!, invocation.note);
        case "replay":
          return await highCourtService.replayRun(invocation.targetId!, invocation.note);
        case "rollback":
          return await highCourtService.rollbackPublication(invocation.targetId!, invocation.note);
      }
    }

    const sourceClient = new NjdgStateSourceClient(profile);
    const service = new PublishedSnapshotService(config, profile, store, artifactStore, sourceClient);

    switch (invocation.command) {
      case "fetch":
        return await service.captureRun(invocation.note);
      case "publications":
        return await service.listPublicationHistory();
      case "inspect":
        return await service.inspectRun(invocation.targetId!);
      case "publish":
        return await service.publishRun(invocation.targetId!, invocation.note);
      case "replay":
        return await service.replayRun(invocation.targetId!, invocation.note);
      case "rollback":
        return await service.rollbackPublication(invocation.targetId!, invocation.note);
    }
  } finally {
    await pool.end();
  }
}

function readFlag(args: string[], flag: string) {
  const index = args.findIndex((value) => value === flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function stripFlag(args: string[], flag: string) {
  const index = args.findIndex((value) => value === flag);
  if (index < 0) {
    return args;
  }

  return args.filter((_, currentIndex) => currentIndex !== index && currentIndex !== index + 1);
}

function resolveHighCourtCode(selected?: string) {
  const trimmed = selected?.trim();
  if (!trimmed) {
    return undefined;
  }

  return getRequiredHighCourtProfile(trimmed).courtCode;
}

function getRequiredHighCourtProfile(selected: string) {
  const normalized = selected.trim().toLowerCase();
  const profile = getHighCourtProfileBySlug(normalized);
  if (profile) {
    return profile;
  }

  const profileByCode = listHighCourtProfiles().find((candidate) => candidate.courtCode.toLowerCase() === normalized);
  if (profileByCode) {
    return getHighCourtProfile(profileByCode.courtCode);
  }

  throw new Error(`Unsupported High Court selector: ${selected}`);
}

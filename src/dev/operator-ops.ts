import { Pool } from "pg";

import { loadConfig } from "../config/env.js";
import { getStateProfile } from "../geographies.js";
import { NjdgStateSourceClient } from "../ingest/himachal-source-client.js";
import { PublishedSnapshotService } from "../services/published-snapshot-service.js";
import { S3ArtifactStore } from "../storage/artifact-store.js";
import { PgWarehouseStore } from "../storage/postgres.js";

const SUPPORTED_OPERATOR_COMMANDS = ["fetch", "inspect", "publications", "publish", "replay", "rollback"] as const;

export type OperatorCommand = (typeof SUPPORTED_OPERATOR_COMMANDS)[number];

export interface OperatorInvocation {
  stateCode?: string;
  command: OperatorCommand;
  targetId?: string;
  note?: string;
}

export function parseOperatorInvocation(args: string[]): OperatorInvocation {
  const stateCode = readFlag(args, "--state");
  const positionals = stripFlag(args, "--state");
  const [rawCommand, rawTargetId, ...rest] = positionals;

  if (!rawCommand) {
    throw new Error(
      "Usage: operator [--state <STATE_CODE>] fetch [note] | inspect <run-id> | publications | publish <run-id> [note] | replay <run-id> [note] | rollback <publication-id> [note]",
    );
  }

  if (!SUPPORTED_OPERATOR_COMMANDS.includes(rawCommand as OperatorCommand)) {
    throw new Error(`Unsupported operator command: ${rawCommand}`);
  }

  const command = rawCommand as OperatorCommand;

  if (command === "fetch") {
    return {
      stateCode,
      command: "fetch",
      note: [rawTargetId, ...rest].join(" ").trim() || undefined,
    };
  }

  if (command === "publications") {
    return {
      stateCode,
      command: "publications",
    };
  }

  if (!rawTargetId) {
    throw new Error("This operator command requires a target id.");
  }

  return {
    stateCode,
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

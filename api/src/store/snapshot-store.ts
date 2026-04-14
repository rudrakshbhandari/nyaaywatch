import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  PublishStateSchema,
  SnapshotRunSchema,
  type PublishState,
  type SnapshotRun,
} from "../../../shared/src/contracts";

export interface SnapshotStore {
  getRuns(): Promise<SnapshotRun[]>;
  getRun(runId: string): Promise<SnapshotRun | null>;
  getPublishedState(): Promise<PublishState>;
  setPublishedRun(runId: string, publishedAt: string): Promise<void>;
}

const defaultState: PublishState = {
  publishedRunId: null,
  publishedAt: null,
};

export class FileSnapshotStore implements SnapshotStore {
  constructor(
    private readonly runDirectory = path.resolve(process.cwd(), "warehouse/fixtures/runs"),
    private readonly stateFile = path.resolve(process.cwd(), "warehouse/state/published-state.json"),
  ) {}

  async getRuns(): Promise<SnapshotRun[]> {
    const entries = await readdir(this.runDirectory, { withFileTypes: true });
    const runs = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map(async (entry) => {
          const raw = await readFile(path.join(this.runDirectory, entry.name), "utf8");
          return SnapshotRunSchema.parse(JSON.parse(raw));
        }),
    );

    return runs.sort((left, right) => right.snapshotDate.localeCompare(left.snapshotDate));
  }

  async getRun(runId: string): Promise<SnapshotRun | null> {
    const runs = await this.getRuns();
    return runs.find((run) => run.runId === runId) ?? null;
  }

  async getPublishedState(): Promise<PublishState> {
    try {
      const raw = await readFile(this.stateFile, "utf8");
      return PublishStateSchema.parse(JSON.parse(raw));
    } catch {
      return defaultState;
    }
  }

  async setPublishedRun(runId: string, publishedAt: string): Promise<void> {
    await mkdir(path.dirname(this.stateFile), { recursive: true });
    await writeFile(
      this.stateFile,
      `${JSON.stringify({ publishedRunId: runId, publishedAt }, null, 2)}\n`,
      "utf8",
    );
  }
}

export class MemorySnapshotStore implements SnapshotStore {
  private runs: SnapshotRun[];

  private publishState: PublishState;

  constructor(runs: SnapshotRun[], publishState: PublishState = defaultState) {
    this.runs = clone(runs);
    this.publishState = clone(publishState);
  }

  async getRuns(): Promise<SnapshotRun[]> {
    return clone(this.runs).sort((left, right) => right.snapshotDate.localeCompare(left.snapshotDate));
  }

  async getRun(runId: string): Promise<SnapshotRun | null> {
    return clone(this.runs.find((run) => run.runId === runId) ?? null);
  }

  async getPublishedState(): Promise<PublishState> {
    return clone(this.publishState);
  }

  async setPublishedRun(runId: string, publishedAt: string): Promise<void> {
    this.publishState = {
      publishedRunId: runId,
      publishedAt,
    };
  }
}

function clone<T>(value: T): T {
  return value === null ? value : JSON.parse(JSON.stringify(value));
}

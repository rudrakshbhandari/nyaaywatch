import { afterEach, describe, expect, it, vi } from "vitest";

const poolEnd = vi.fn(async () => undefined);
const poolConstructor = vi.fn(() => ({ end: poolEnd }));
const captureRun = vi.fn();
const listPublicationHistory = vi.fn();
const inspectRun = vi.fn();
const publishRun = vi.fn();
const replayRun = vi.fn();
const rollbackPublication = vi.fn();
const highCourtCaptureRun = vi.fn();
const highCourtListPublicationHistory = vi.fn();
const highCourtInspectRun = vi.fn();
const highCourtPublishRun = vi.fn();
const highCourtReplayRun = vi.fn();
const highCourtRollbackPublication = vi.fn();

vi.mock("pg", () => ({
  Pool: poolConstructor,
}));

vi.mock("../src/config/env.js", () => ({
  loadConfig: vi.fn(() => ({
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/nyaaywatch",
    STATE_CODE: "UP",
  })),
}));

vi.mock("../src/geographies.js", () => ({
  getStateProfile: vi.fn(() => ({
    stateCode: "UP",
    stateName: "Uttar Pradesh",
    stateSlug: "uttar-pradesh",
  })),
}));

vi.mock("../src/high-courts.js", () => ({
  getHighCourtProfile: vi.fn(() => ({
    courtCode: "HPHC",
    courtSlug: "himachal",
    courtName: "High Court of Himachal Pradesh",
    stateCode: "HP",
    stateName: "Himachal Pradesh",
  })),
  getHighCourtProfileBySlug: vi.fn((slug: string) =>
    slug === "himachal"
      ? {
          courtCode: "HPHC",
          courtSlug: "himachal",
          courtName: "High Court of Himachal Pradesh",
          stateCode: "HP",
          stateName: "Himachal Pradesh",
        }
      : null,
  ),
  listHighCourtProfiles: vi.fn(() => [
    {
      courtCode: "HPHC",
      courtSlug: "himachal",
      courtName: "High Court of Himachal Pradesh",
      stateCode: "HP",
      stateName: "Himachal Pradesh",
    },
  ]),
}));

vi.mock("../src/ingest/himachal-source-client.js", () => ({
  NjdgStateSourceClient: vi.fn(),
}));

vi.mock("../src/ingest/high-court-source-client.js", () => ({
  createHighCourtSourceClient: vi.fn(),
}));

vi.mock("../src/storage/artifact-store.js", () => ({
  S3ArtifactStore: vi.fn(),
}));

vi.mock("../src/storage/postgres.js", () => ({
  PgWarehouseStore: {
    fromPool: vi.fn(() => ({ kind: "mock-store" })),
  },
}));

vi.mock("../src/services/published-snapshot-service.js", () => ({
  PublishedSnapshotService: vi.fn(() => ({
    captureRun,
    listPublicationHistory,
    inspectRun,
    publishRun,
    replayRun,
    rollbackPublication,
  })),
}));

vi.mock("../src/services/published-high-court-snapshot-service.js", () => ({
  PublishedHighCourtSnapshotService: vi.fn(() => ({
    captureRun: highCourtCaptureRun,
    listPublicationHistory: highCourtListPublicationHistory,
    inspectRun: highCourtInspectRun,
    publishRun: highCourtPublishRun,
    replayRun: highCourtReplayRun,
    rollbackPublication: highCourtRollbackPublication,
  })),
}));

describe("operator ops", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("waits for fetch completion before ending the pool", async () => {
    const { runOperatorInvocation } = await import("../src/dev/operator-ops.js");
    let resolveCapture: ((value: { ok: true }) => void) | undefined;
    const capturePromise = new Promise<{ ok: true }>((resolve) => {
      resolveCapture = resolve;
    });
    captureRun.mockReturnValueOnce(capturePromise);

    const invocationPromise = runOperatorInvocation({
      command: "fetch",
      stateCode: "UP",
      note: "Heavy-state fetch",
    });

    await Promise.resolve();

    expect(captureRun).toHaveBeenCalledWith("Heavy-state fetch");
    expect(poolEnd).not.toHaveBeenCalled();

    resolveCapture?.({ ok: true });

    await expect(invocationPromise).resolves.toEqual({ ok: true });
    expect(poolEnd).toHaveBeenCalledTimes(1);
  });

  it("routes High Court invocations to the High Court operator service", async () => {
    const { runOperatorInvocation } = await import("../src/dev/operator-ops.js");
    highCourtListPublicationHistory.mockResolvedValueOnce([{ publication: { id: "publication_high_court_1" } }]);

    await expect(
      runOperatorInvocation({
        command: "publications",
        highCourtCode: "HPHC",
      }),
    ).resolves.toEqual([{ publication: { id: "publication_high_court_1" } }]);

    expect(highCourtListPublicationHistory).toHaveBeenCalledTimes(1);
    expect(listPublicationHistory).not.toHaveBeenCalled();
    expect(poolEnd).toHaveBeenCalledTimes(1);
  });
});

import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../api/src/app";
import { MemorySnapshotStore } from "../api/src/store/snapshot-store";
import { SnapshotRunSchema } from "../shared/src/contracts";
import validRun from "../warehouse/fixtures/runs/run-hp-2026-04-07.json";

const parsedValidRun = SnapshotRunSchema.parse(validRun);

describe("public routes", () => {
  it("shows an empty homepage state when no published snapshot exists", async () => {
    const app = createApp({
      store: new MemorySnapshotStore([parsedValidRun]),
      now: () => new Date("2026-04-14T00:00:00.000Z"),
    });

    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.text).toContain("No published Himachal snapshot yet.");
  });

  it("shows stale state while preserving the last published snapshot", async () => {
    const app = createApp({
      store: new MemorySnapshotStore([parsedValidRun], {
        publishedRunId: parsedValidRun.runId,
        publishedAt: "2026-04-08T09:00:00.000Z",
      }),
      now: () => new Date("2026-05-10T00:00:00.000Z"),
    });

    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.text).toContain("This snapshot is stale.");
    expect(response.text).toContain("56,240");
  });

  it("keeps district pages available for the published snapshot", async () => {
    const app = createApp({
      store: new MemorySnapshotStore([parsedValidRun], {
        publishedRunId: parsedValidRun.runId,
        publishedAt: "2026-04-08T09:00:00.000Z",
      }),
      now: () => new Date("2026-04-14T00:00:00.000Z"),
    });

    const response = await request(app).get("/districts/mandi");

    expect(response.status).toBe(200);
    expect(response.text).toContain("Mandi");
    expect(response.text).toContain(parsedValidRun.districts[1].plainLanguageSummary);
  });

  it("keeps homepage toplines in parity with the Himachal stats API", async () => {
    const store = new MemorySnapshotStore([parsedValidRun], {
      publishedRunId: parsedValidRun.runId,
      publishedAt: "2026-04-08T09:00:00.000Z",
    });
    const app = createApp({
      store,
      now: () => new Date("2026-04-14T00:00:00.000Z"),
    });

    const [htmlResponse, apiResponse] = await Promise.all([
      request(app).get("/"),
      request(app).get("/v1/stats/himachal"),
    ]);

    expect(apiResponse.status).toBe(200);
    expect(htmlResponse.text).toContain("56,240");
    expect(htmlResponse.text).toContain("6.3%");
    expect(htmlResponse.text).toContain("4");
    expect(apiResponse.body.metrics.pendingCases).toBe(parsedValidRun.summary.pendingCases);
    expect(apiResponse.body.metrics.filingDisposalGapPct).toBe(parsedValidRun.summary.filingDisposalGapPct);
    expect(apiResponse.body.metrics.districtsFlagged).toBe(parsedValidRun.summary.districtsFlagged);
  });
});

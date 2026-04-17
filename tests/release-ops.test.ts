import { mkdtemp, readFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import { buildPunjabTestSnapshot, createTestApp, createTestContext, insertPublishedSnapshot, seedTestSnapshot } from "./helpers.js";
import { buildPostpublishSummary, buildPrepublishSummary, recordReleaseHistory } from "../src/dev/release-ops.js";

describe("release ops helpers", () => {
  const pools: Array<{ end: () => Promise<void> }> = [];
  const servers: Server[] = [];

  afterEach(async () => {
    while (servers.length > 0) {
      await new Promise<void>((resolve, reject) => {
        const server = servers.pop();
        server?.close((error) => (error ? reject(error) : resolve()));
      });
    }

    while (pools.length > 0) {
      await pools.pop()?.end();
    }
  });

  it("builds a prepublish summary with the current rollback target", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    const initial = await seedTestSnapshot(context.service);
    const captured = await context.service.captureRun("Second run for prepublish review.");
    const app = createTestApp(context.config, context.service);
    const server = createServer(app);
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an ephemeral TCP port.");
    }

    const summary = await buildPrepublishSummary(
      context.service,
      `http://127.0.0.1:${address.port}`,
      captured.run.id,
    );

    expect(summary.targetRun.id).toBe(captured.run.id);
    expect(summary.targetRun.status).toBe("completed");
    expect(summary.targetRun.candidateReady).toBe(true);
    expect(summary.rollbackTarget?.publication.id).toBe(initial.publication.id);
  });

  it("writes a postpublish evidence file for the active publication", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    const captured = await context.service.captureRun("Second run for publish.");
    const published = await context.service.publishRun(captured.run.id, "Publish second run.");
    const app = createTestApp(context.config, context.service);
    const server = createServer(app);
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an ephemeral TCP port.");
    }

    const outputDir = await mkdtemp(join(tmpdir(), "nyaaywatch-release-evidence-"));
    const outputPath = join(outputDir, `${published.publication.id}.md`);
    const summary = await buildPostpublishSummary(
      context.service,
      `http://127.0.0.1:${address.port}`,
      published.publication.id,
      outputPath,
    );
    const fileContents = await readFile(outputPath, "utf8");

    expect(summary.publication.publication.id).toBe(published.publication.id);
    expect(summary.evidencePath).toBe(outputPath);
    expect(summary.evidenceJsonPath).toBe(join(outputDir, `${published.publication.id}.json`));
    expect(fileContents).toContain("# Release Evidence");
    expect(fileContents).toContain(published.publication.id);
  });

  it("records a tracked release-history entry for the active publication", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    const captured = await context.service.captureRun("Second run for tracked history.");
    const published = await context.service.publishRun(captured.run.id, "Publish tracked history run.");
    const app = createTestApp(context.config, context.service);
    const server = createServer(app);
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an ephemeral TCP port.");
    }

    const outputDir = await mkdtemp(join(tmpdir(), "nyaaywatch-release-record-"));
    const historyPath = join(outputDir, "RELEASE_HISTORY.md");
    const result = await recordReleaseHistory(context.service, {
      baseUrl: `http://127.0.0.1:${address.port}`,
      publicationId: published.publication.id,
      reviewer: "codex",
      note: "Tracked publish",
      historyPath,
      outputPath: join(outputDir, `${published.publication.id}.md`),
    });
    const historyContents = await readFile(historyPath, "utf8");
    const jsonContents = await readFile(result.evidenceJsonPath, "utf8");

    expect(result.historyPath).toBe(historyPath);
    expect(historyContents).toContain(published.publication.id);
    expect(historyContents).toContain("Tracked publish");
    expect(jsonContents).toContain("\"publication\"");
  });

  it("records the state-scoped public URL for Punjab release history", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    await insertPublishedSnapshot(context.pool, {
      publicationId: "publication_pb_release_record",
      snapshotId: "snapshot_pb_release_record",
      runId: "run_pb_release_record",
      stateCode: "PB",
      payload: buildPunjabTestSnapshot(),
    });
    const app = createTestApp(context.config, context.service, context.publicServices);
    const server = createServer(app);
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an ephemeral TCP port.");
    }

    const outputDir = await mkdtemp(join(tmpdir(), "nyaaywatch-release-record-pb-"));
    const historyPath = join(outputDir, "RELEASE_HISTORY.md");
    const result = await recordReleaseHistory(context.publicServices.PB!, {
      baseUrl: `http://127.0.0.1:${address.port}`,
      publicationId: "publication_pb_release_record",
      reviewer: "codex",
      historyPath,
      outputPath: join(outputDir, "publication_pb_release_record.md"),
    });
    const historyContents = await readFile(historyPath, "utf8");

    expect(result.currentPublicRelease.target.stateCode).toBe("PB");
    expect(historyContents).toContain(`Public URL: \`http://127.0.0.1:${address.port}/states/punjab\``);
  });
});

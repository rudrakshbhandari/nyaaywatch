import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

import { afterEach, describe, expect, it } from "vitest";

import { findLatestPublishableRun, runAutoPublish } from "../src/dev/auto-publish.js";
import { listPublicHighCourtProfiles } from "../src/high-courts.js";
import { getSupremeCourtProfile } from "../src/supreme-court.js";

describe("findLatestPublishableRun", () => {
  it("returns the most recent completed run whose quality is not partial", () => {
    const runs = [
      { id: "old", status: "completed", qualityState: "complete", createdAt: "2026-04-20T05:00:00Z" },
      { id: "newer-partial", status: "completed", qualityState: "partial", createdAt: "2026-04-23T05:00:00Z" },
      { id: "newest", status: "completed", qualityState: "complete", createdAt: "2026-04-22T05:00:00Z" },
      { id: "pending", status: "pending", qualityState: "complete", createdAt: "2026-04-24T05:00:00Z" },
      { id: "published", status: "published", qualityState: "complete", createdAt: "2026-04-23T06:00:00Z" },
    ];

    expect(findLatestPublishableRun(runs)?.id).toBe("newest");
  });

  it("returns undefined when no run is publishable", () => {
    const runs = [
      { id: "pending", status: "pending", qualityState: "complete", createdAt: "2026-04-24T05:00:00Z" },
      { id: "partial", status: "completed", qualityState: "partial", createdAt: "2026-04-23T05:00:00Z" },
    ];

    expect(findLatestPublishableRun(runs)).toBeUndefined();
  });
});

describe("runAutoPublish", () => {
  const servers: Server[] = [];

  afterEach(async () => {
    while (servers.length > 0) {
      await new Promise<void>((resolve, reject) => {
        const server = servers.pop();
        server?.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  async function startTestServer(handler: (request: IncomingMessage, response: ServerResponse, body: string) => void) {
    const server = createServer((request, response) => {
      let body = "";
      request.on("data", (chunk) => {
        body += chunk.toString();
      });
      request.on("end", () => handler(request, response, body));
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected a TCP address.");
    }
    return `http://127.0.0.1:${address.port}`;
  }

  it("publishes the latest publishable run for the Supreme Court and every public High Court", async () => {
    const publishedRunIds: string[] = [];
    const publishedPaths: string[] = [];
    const receivedTokens = new Set<string>();

    const baseUrl = await startTestServer((request, response, body) => {
      receivedTokens.add(request.headers["x-operator-token"]?.toString() ?? "");
      if (request.method === "GET" && request.url?.endsWith("/runs")) {
        response.setHeader("content-type", "application/json");
        response.end(
          JSON.stringify({
            runs: [
              { id: "run-old", status: "completed", qualityState: "complete", createdAt: "2026-04-19T05:00:00Z" },
              { id: "run-partial", status: "completed", qualityState: "partial", createdAt: "2026-04-23T04:00:00Z" },
              { id: "run-latest", status: "completed", qualityState: "complete", createdAt: "2026-04-23T05:00:00Z" },
            ],
          }),
        );
        return;
      }

      if (request.method === "POST" && request.url?.endsWith("/publish")) {
        publishedPaths.push(request.url!);
        const runId = decodeURIComponent(request.url!.split("/runs/")[1]!.replace("/publish", ""));
        publishedRunIds.push(runId);
        const parsed = body ? JSON.parse(body) : {};
        expect(parsed.note).toMatch(/Auto-published/);
        response.statusCode = 201;
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify({ publication: { id: `publication-${runId}` } }));
        return;
      }

      response.statusCode = 404;
      response.end();
    });

    const summary = await runAutoPublish({
      baseUrl,
      operatorToken: "test-token",
    });

    const expectedAttempted = 1 + listPublicHighCourtProfiles().length;
    expect(summary.attemptedCount).toBe(expectedAttempted);
    expect(summary.publishedCount).toBe(expectedAttempted);
    expect(summary.skippedCount).toBe(0);
    expect(summary.failedCount).toBe(0);

    const supremeCourtEntry = summary.results.find((result) => result.scope === "supreme-court");
    expect(supremeCourtEntry?.status).toBe("published");
    expect(supremeCourtEntry?.runId).toBe("run-latest");
    expect(supremeCourtEntry?.publicationId).toBe("publication-run-latest");
    expect(supremeCourtEntry?.courtSlug).toBe(getSupremeCourtProfile().courtSlug);

    const expectedSlugs = new Set(listPublicHighCourtProfiles().map((profile) => profile.courtSlug));
    const highCourtEntries = summary.results.filter((result) => result.scope === "high-court");
    expect(new Set(highCourtEntries.map((entry) => entry.courtSlug))).toEqual(expectedSlugs);
    for (const entry of highCourtEntries) {
      expect(entry.status).toBe("published");
      expect(entry.runId).toBe("run-latest");
    }

    expect(publishedRunIds.length).toBe(expectedAttempted);
    expect(publishedPaths.some((path) => path.includes("/operator/supreme-court/"))).toBe(true);
    expect(publishedPaths.some((path) => path.includes(`/operator/high-courts/${getSupremeCourtProfile().courtSlug}`))).toBe(false);
    expect(receivedTokens).toEqual(new Set(["test-token"]));
  });

  it("skips scopes with no publishable run and reports failures without aborting the rest", async () => {
    const baseUrl = await startTestServer((request, response, _body) => {
      if (request.method === "GET" && request.url === "/operator/supreme-court/runs") {
        response.statusCode = 500;
        response.end("boom");
        return;
      }

      if (request.method === "GET" && request.url?.endsWith("/runs")) {
        response.setHeader("content-type", "application/json");
        response.end(
          JSON.stringify({
            runs: [
              { id: "partial-run", status: "completed", qualityState: "partial", createdAt: "2026-04-23T04:00:00Z" },
            ],
          }),
        );
        return;
      }

      response.statusCode = 404;
      response.end();
    });

    const summary = await runAutoPublish({
      baseUrl,
      operatorToken: "test-token",
    });

    const expectedAttempted = 1 + listPublicHighCourtProfiles().length;
    expect(summary.attemptedCount).toBe(expectedAttempted);
    expect(summary.publishedCount).toBe(0);
    expect(summary.failedCount).toBe(1);
    expect(summary.skippedCount).toBe(expectedAttempted - 1);

    const supremeCourtEntry = summary.results.find((result) => result.scope === "supreme-court");
    expect(supremeCourtEntry?.status).toBe("failed");
    expect(supremeCourtEntry?.error).toContain("500");

    for (const entry of summary.results.filter((result) => result.scope === "high-court")) {
      expect(entry.status).toBe("skipped");
      expect(entry.reason).toBeDefined();
    }
  });
});

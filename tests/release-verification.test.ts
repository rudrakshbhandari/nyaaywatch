import { createServer, type Server } from "node:http";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildLadakhTestSnapshot,
  buildPunjabTestSnapshot,
  createTestApp,
  createTestContext,
  insertPublishedSnapshot,
  seedTestHighCourtSnapshot,
  seedTestSnapshot,
  seedTestSupremeCourtSnapshot,
} from "./helpers.js";
import { verifyPublicRelease } from "../src/dev/release-verification.js";

vi.setConfig({ testTimeout: 15_000 });

describe("verifyPublicRelease", () => {
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

  it("verifies the public hostname, metadata parity, and operator auth boundary", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    const app = createTestApp(context.config, context.service);
    const server = createServer(app);
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an ephemeral TCP port.");
    }

    const result = await verifyPublicRelease(`http://127.0.0.1:${address.port}`);

    expect(result.health.stateCode).toBe("HP");
    expect(result.target.stateCode).toBe("HP");
    expect(result.districtCount).toBe(12);
    expect(result.trendCount).toBeGreaterThan(0);
    expect(result.csvMetadataParity).toBe(true);
    expect(result.publicDataCacheProtected).toBe(true);
    expect(result.operatorAuthProtected).toBe(true);
    expect(result.snapshot.methodologyVersion).toBe("2026.04-alpha");
  });

  it("verifies state-scoped Punjab public routes once Punjab is published", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    await insertPublishedSnapshot(context.pool, {
      publicationId: "publication_pb_release_verify",
      snapshotId: "snapshot_pb_release_verify",
      runId: "run_pb_release_verify",
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

    const result = await verifyPublicRelease(`http://127.0.0.1:${address.port}`, { stateSlug: "punjab" });

    expect(result.target.stateCode).toBe("PB");
    expect(result.target.stateSlug).toBe("punjab");
    expect(result.snapshot.methodologyVersion).toBe("2026.04-alpha");
    expect(result.districtCount).toBe(3);
    expect(result.trendCount).toBeGreaterThan(0);
    expect(result.csvMetadataParity).toBe(true);
    expect(result.publicDataCacheProtected).toBe(true);
  });

  it("verifies Union Territory public routes once Ladakh is published", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    await insertPublishedSnapshot(context.pool, {
      publicationId: "publication_la_release_verify",
      snapshotId: "snapshot_la_release_verify",
      runId: "run_la_release_verify",
      stateCode: "LA",
      payload: buildLadakhTestSnapshot(),
    });

    const app = createTestApp(context.config, context.service, context.publicServices);
    const server = createServer(app);
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an ephemeral TCP port.");
    }

    const result = await verifyPublicRelease(`http://127.0.0.1:${address.port}`, { stateSlug: "ladakh" });

    expect(result.target.stateCode).toBe("LA");
    expect(result.target.stateSlug).toBe("ladakh");
    expect(result.snapshot.methodologyVersion).toBe("2026.04-alpha");
    expect(result.districtCount).toBe(2);
    expect(result.trendCount).toBeGreaterThan(0);
    expect(result.csvMetadataParity).toBe(true);
    expect(result.publicDataCacheProtected).toBe(true);
  });

  it("verifies public High Court and Supreme Court release targets", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    await seedTestHighCourtSnapshot(context.highCourtServices.HPHC!);
    await seedTestSupremeCourtSnapshot(context.supremeCourtService);

    const app = createTestApp(
      context.config,
      context.service,
      context.publicServices,
      context.highCourtServices,
      context.supremeCourtService,
    );
    const server = createServer(app);
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an ephemeral TCP port.");
    }

    const baseUrl = `http://127.0.0.1:${address.port}`;
    const highCourt = await verifyPublicRelease(baseUrl, { highCourtSlug: "himachal" });
    const supremeCourt = await verifyPublicRelease(baseUrl, { supremeCourt: true });

    expect(highCourt.target).toMatchObject({
      tier: "high_court",
      courtCode: "HPHC",
      courtSlug: "himachal",
      operatorAuthPath: "/operator/high-courts/himachal/publications",
    });
    expect(highCourt.districtCount).toBeNull();
    expect(highCourt.trendCount).toBeGreaterThan(0);
    expect(highCourt.csvMetadataParity).toBeNull();
    expect(highCourt.publicDataCacheProtected).toBe(true);
    expect(highCourt.operatorAuthProtected).toBe(true);

    expect(supremeCourt.target).toMatchObject({
      tier: "supreme_court",
      courtCode: "SCI",
      courtSlug: "supreme-court",
      operatorAuthPath: "/operator/supreme-court/publications",
    });
    expect(supremeCourt.districtCount).toBeNull();
    expect(supremeCourt.trendCount).toBeGreaterThan(0);
    expect(supremeCourt.csvMetadataParity).toBeNull();
    expect(supremeCourt.publicDataCacheProtected).toBe(true);
    expect(supremeCourt.operatorAuthProtected).toBe(true);
  });

  it("fails when release metadata drifts between public endpoints", async () => {
    const server = createServer((_request, response) => {
      const path = _request.url ?? "/";
      if (path === "/health") {
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify({ ok: true, region: "ap-south-1", stateCode: "HP" }));
        return;
      }

      if (path === "/v1/stats/himachal") {
        response.setHeader("content-type", "application/json");
        response.end(
          JSON.stringify({
            snapshot: {
              stateCode: "HP",
              stateName: "Himachal Pradesh",
              sourceName: "NJDG",
              sourceSnapshotAt: "2026-04-10T00:00:00.000Z",
              publishedAt: "2026-04-15T04:44:05.159Z",
              methodologyVersion: "2026.04-alpha",
              qualityState: "complete",
              freshnessDays: 5,
              sourceAttribution: "NJDG",
            },
            stats: {
              pendingCases: 1,
              disposalRate: 1,
              medianCaseAgeDays: 1,
              flaggedDistricts: 1,
            },
          }),
        );
        return;
      }

      if (path === "/v1/districts") {
        response.setHeader("content-type", "application/json");
        response.end(
          JSON.stringify({
            snapshot: {
              stateCode: "HP",
              stateName: "Himachal Pradesh",
              sourceName: "NJDG",
              sourceSnapshotAt: "2026-04-10T00:00:00.000Z",
              publishedAt: "2026-04-15T04:44:05.159Z",
              methodologyVersion: "2026.04-alpha",
              qualityState: "complete",
              freshnessDays: 5,
              sourceAttribution: "NJDG",
            },
            districts: [{ districtId: "kangra", districtName: "Kangra", rank: 1 }],
          }),
        );
        return;
      }

      if (path === "/v1/trends") {
        response.setHeader("content-type", "application/json");
        response.end(
          JSON.stringify({
            snapshot: {
              stateCode: "HP",
              stateName: "Himachal Pradesh",
              sourceName: "NJDG",
              sourceSnapshotAt: "2026-04-10T00:00:00.000Z",
              publishedAt: "2026-04-16T04:44:05.159Z",
              methodologyVersion: "2026.04-alpha",
              qualityState: "complete",
              freshnessDays: 6,
              sourceAttribution: "NJDG",
            },
            trends: [{ snapshotDate: "2026-04-10T00:00:00.000Z", pendingCases: 1, disposalRate: 1 }],
          }),
        );
        return;
      }

      if (path === "/operator/publications") {
        response.statusCode = 401;
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify({ error: "Operator token required." }));
        return;
      }

      if (path === "/data") {
        response.setHeader("content-type", "text/html");
        response.setHeader("cache-control", "no-store, max-age=0, must-revalidate");
        response.end("<html><body>data</body></html>");
        return;
      }

      if (path === "/data/districts.csv") {
        response.setHeader("content-type", "text/csv");
        response.setHeader("cache-control", "no-store, max-age=0, must-revalidate");
        response.end(
          "snapshot_date,published_at,methodology_version,district_id\n2026-04-10T00:00:00.000Z,2026-04-15T04:44:05.159Z,2026.04-alpha,kangra\n",
        );
        return;
      }

      response.statusCode = 404;
      response.end("not found");
    });
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an ephemeral TCP port.");
    }

    await expect(verifyPublicRelease(`http://127.0.0.1:${address.port}`)).rejects.toThrow(
      "Snapshot metadata mismatch for trends.",
    );
  });

  it("fails when public data endpoints remain cacheable", async () => {
    const server = createServer((_request, response) => {
      const path = _request.url ?? "/";
      if (path === "/health") {
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify({ ok: true, region: "ap-south-1", stateCode: "HP" }));
        return;
      }

      if (path === "/v1/stats/himachal") {
        response.setHeader("content-type", "application/json");
        response.end(
          JSON.stringify({
            snapshot: {
              stateCode: "HP",
              stateName: "Himachal Pradesh",
              sourceName: "NJDG",
              sourceSnapshotAt: "2026-04-10T00:00:00.000Z",
              publishedAt: "2026-04-15T04:44:05.159Z",
              methodologyVersion: "2026.04-alpha",
              qualityState: "complete",
              freshnessDays: 5,
              sourceAttribution: "NJDG",
            },
            stats: {
              pendingCases: 1,
              disposalRate: 1,
              medianCaseAgeDays: 1,
              flaggedDistricts: 1,
            },
          }),
        );
        return;
      }

      if (path === "/v1/districts") {
        response.setHeader("content-type", "application/json");
        response.end(
          JSON.stringify({
            snapshot: {
              stateCode: "HP",
              stateName: "Himachal Pradesh",
              sourceName: "NJDG",
              sourceSnapshotAt: "2026-04-10T00:00:00.000Z",
              publishedAt: "2026-04-15T04:44:05.159Z",
              methodologyVersion: "2026.04-alpha",
              qualityState: "complete",
              freshnessDays: 5,
              sourceAttribution: "NJDG",
            },
            districts: [{ districtId: "kangra", districtName: "Kangra", rank: 1 }],
          }),
        );
        return;
      }

      if (path === "/v1/trends") {
        response.setHeader("content-type", "application/json");
        response.end(
          JSON.stringify({
            snapshot: {
              stateCode: "HP",
              stateName: "Himachal Pradesh",
              sourceName: "NJDG",
              sourceSnapshotAt: "2026-04-10T00:00:00.000Z",
              publishedAt: "2026-04-15T04:44:05.159Z",
              methodologyVersion: "2026.04-alpha",
              qualityState: "complete",
              freshnessDays: 5,
              sourceAttribution: "NJDG",
            },
            trends: [{ snapshotDate: "2026-04-10T00:00:00.000Z", pendingCases: 1, disposalRate: 1 }],
          }),
        );
        return;
      }

      if (path === "/operator/publications") {
        response.statusCode = 401;
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify({ error: "Operator token required." }));
        return;
      }

      if (path === "/data") {
        response.setHeader("content-type", "text/html");
        response.setHeader("cache-control", "public, max-age=600");
        response.end("<html><body>data</body></html>");
        return;
      }

      if (path === "/data/districts.csv") {
        response.setHeader("content-type", "text/csv");
        response.setHeader("cache-control", "public, max-age=600");
        response.end(
          "snapshot_date,published_at,methodology_version,district_id\n2026-04-10T00:00:00.000Z,2026-04-15T04:44:05.159Z,2026.04-alpha,kangra\n",
        );
        return;
      }

      response.statusCode = 404;
      response.end("not found");
    });
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an ephemeral TCP port.");
    }

    await expect(verifyPublicRelease(`http://127.0.0.1:${address.port}`)).rejects.toThrow(
      "public data page is missing a no-store Cache-Control header.",
    );
  });
});

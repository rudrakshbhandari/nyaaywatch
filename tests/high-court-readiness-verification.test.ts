import { createServer, type Server } from "node:http";

import { afterEach, describe, expect, it } from "vitest";

import { createTestApp, createTestContext, seedTestHighCourtSnapshot } from "./helpers.js";
import { verifyHighCourtInternalReadiness } from "../src/dev/high-court-readiness-verification.js";

describe("verifyHighCourtInternalReadiness", () => {
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

  it("verifies the internal Himachal High Court operator namespace and proof-cycle evidence", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    const highCourtService = context.highCourtServices.HPHC;
    if (!highCourtService) {
      throw new Error("Expected Himachal High Court test service.");
    }

    const published = await seedTestHighCourtSnapshot(highCourtService);
    await highCourtService.replayRun(published.run.id, "Replay High Court proof cycle");
    await highCourtService.rollbackPublication(published.publication.id, "Rollback High Court proof cycle");

    const app = createTestApp(context.config, context.service, context.publicServices, context.highCourtServices);
    const server = createServer(app);
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an ephemeral TCP port.");
    }

    const result = await verifyHighCourtInternalReadiness(
      `http://127.0.0.1:${address.port}`,
      context.config.OPERATOR_API_TOKEN,
      { courtSlug: "himachal" },
    );

    expect(result.target.courtCode).toBe("HPHC");
    expect(result.operatorAuthProtected).toBe(true);
    expect(result.snapshot?.referenceDateKind).toBe("captured_at");
    expect(result.internalEvidence.runCount).toBeGreaterThanOrEqual(2);
    expect(result.internalEvidence.publishCount).toBeGreaterThanOrEqual(2);
    expect(result.internalEvidence.rollbackCount).toBeGreaterThanOrEqual(1);
    expect(result.internalEvidence.replayedRunCount).toBeGreaterThanOrEqual(1);
    expect(result.gates.hasPublishedSnapshot).toBe(true);
    expect(result.gates.hasReplayEvidence).toBe(true);
    expect(result.gates.hasRollbackEvidence).toBe(true);
    expect(result.gates.referenceDateContractDefensible).toBe(true);
    expect(result.gates.internalProofBarSatisfied).toBe(true);
  });
});

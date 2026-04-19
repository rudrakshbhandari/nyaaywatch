import { createServer } from "node:http";

import {
  createTestApp,
  createTestContext,
  insertHistoricalPublishedSnapshot,
  seedTestHighCourtSnapshot,
  seedTestSnapshot,
  seedTestSupremeCourtSnapshot,
} from "../helpers.js";

const port = Number(process.env.E2E_PORT ?? 4211);

const context = await createTestContext();
await insertHistoricalPublishedSnapshot(context.pool, {
  runId: "run_e2e_history",
  snapshotId: "snapshot_e2e_history",
  publicationId: "publication_e2e_history",
  sourceSnapshotAt: "2026-03-31T00:00:00.000Z",
  publishedAt: "2026-04-01T09:00:00.000Z",
  methodologyVersion: "2026.03-alpha",
  districtOverrides: {
    kangra: {
      rank: 2,
      backlogCases: 22880,
      disposalRate: 87.1,
      medianAgeDays: 460,
      filingVsDisposalGap: 12.7,
    },
  },
});
await seedTestSnapshot(context.service);
await seedTestSupremeCourtSnapshot(context.supremeCourtService);
await seedTestHighCourtSnapshot(context.highCourtServices.HPHC!);
await seedTestHighCourtSnapshot(context.highCourtServices.APHC!);

const app = createTestApp(
  context.config,
  context.service,
  context.publicServices,
  context.highCourtServices,
  context.supremeCourtService,
);
const server = createServer(app);

server.listen(port, "127.0.0.1", () => {
  console.log(`NyaayWatch E2E server listening on http://127.0.0.1:${port}`);
});

async function shutdown() {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  await context.pool.end();
}

process.on("SIGINT", () => {
  void shutdown().finally(() => process.exit(0));
});

process.on("SIGTERM", () => {
  void shutdown().finally(() => process.exit(0));
});

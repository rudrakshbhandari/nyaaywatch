import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import {
  buildHaryanaTestSnapshot,
  buildPunjabTestSnapshot,
  createTestApp,
  createTestContext,
  insertPublishedSnapshot,
  seedTestHighCourtSnapshot,
  seedTestSupremeCourtSnapshot,
  seedTestSnapshot,
} from "./helpers.js";

const disallowedPublicPhrases = [
  /\breal-?time\b/i,
  /\blive (?:feed|status|data|dashboard|monitoring)\b/i,
  /\bpredictive\b/i,
  /\bverdicts?\b/i,
];

describe("public copy guardrails", () => {
  const pools: Array<{ end: () => Promise<void> }> = [];

  afterEach(async () => {
    while (pools.length > 0) {
      await pools.pop()?.end();
    }
  });

  it("keeps public routes inside the published-snapshot and citation posture", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    await seedTestSupremeCourtSnapshot(context.supremeCourtService);
    await seedTestHighCourtSnapshot(context.highCourtServices.HPHC!);
    await insertPublishedSnapshot(context.pool, {
      publicationId: "publication_pb_guardrails_default",
      snapshotId: "snapshot_pb_guardrails_default",
      runId: "run_pb_guardrails_default",
      stateCode: "PB",
      payload: buildPunjabTestSnapshot(),
    });
    await insertPublishedSnapshot(context.pool, {
      publicationId: "publication_hr_guardrails_default",
      snapshotId: "snapshot_hr_guardrails_default",
      runId: "run_hr_guardrails_default",
      stateCode: "HR",
      payload: buildHaryanaTestSnapshot(),
    });

    const app = createTestApp(context.config, context.service, context.publicServices, context.highCourtServices, context.supremeCourtService);
    const routes = [
      {
        path: "/",
        requiredText: "The courts, in the latest published snapshots.",
      },
      {
        path: "/states/himachal",
        requiredText: "The national homepage lives at /",
      },
      {
        path: "/districts",
        requiredText: "Scan the districts under the most pressure.",
      },
      {
        path: "/districts/kangra",
        requiredText: "do not assign responsibility, explain intent, or guarantee that upstream court records have already refreshed",
      },
      {
        path: "/data",
        requiredText: "Raw capture bundles and operator evidence artifacts stay outside the public download boundary",
      },
      {
        path: "/methodology",
        requiredText: "Current public scope",
      },
      {
        path: "/api",
        requiredText: "latest published snapshot",
      },
    ] as const;

    for (const route of routes) {
      const response = await request(app).get(route.path);
      expect(response.status, route.path).toBe(200);
      expect(response.text, route.path).toContain(route.requiredText);
      expect(response.text, `${route.path} should not dump a joined state list`).not.toContain(
        "Himachal Pradesh and Punjab and Haryana",
      );

      for (const pattern of disallowedPublicPhrases) {
        expect(response.text, `${route.path} should not match ${pattern}`).not.toMatch(pattern);
      }
    }

    const methodology = await request(app).get("/methodology");
    expect(methodology.text).not.toContain("Alpha scope");
    expect(methodology.text).not.toContain("Himachal Pradesh only on this page");
  });

  it("keeps Punjab state-scoped public routes inside the same trust posture", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    await insertPublishedSnapshot(context.pool, {
      publicationId: "publication_pb_guardrails",
      snapshotId: "snapshot_pb_guardrails",
      runId: "run_pb_guardrails",
      stateCode: "PB",
      payload: buildPunjabTestSnapshot(),
    });

    const app = createTestApp(context.config, context.service, context.publicServices);
    const routes = [
      {
        path: "/states/punjab",
        requiredText: "All numbers on this site come from the NJDG public district dashboards",
      },
      {
        path: "/states/punjab/districts",
        requiredText: "Scan the districts under the most pressure.",
      },
      {
        path: "/states/punjab/districts/ludhiana",
        requiredText: "do not assign responsibility, explain intent, or guarantee that upstream court records have already refreshed",
      },
      {
        path: "/states/punjab/data",
        requiredText: "Raw capture bundles and operator evidence artifacts stay outside the public download boundary",
      },
      {
        path: "/states/punjab/methodology",
        requiredText: "publishes dated aggregates after operator review",
      },
      {
        path: "/states/punjab/api",
        requiredText: "latest published snapshot",
      },
    ] as const;

    for (const route of routes) {
      const response = await request(app).get(route.path);
      expect(response.status, route.path).toBe(200);
      expect(response.text, route.path).toContain(route.requiredText);

      for (const pattern of disallowedPublicPhrases) {
        expect(response.text, `${route.path} should not match ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});

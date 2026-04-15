import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { createTestApp, createTestContext, seedTestSnapshot } from "./helpers.js";

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

    const app = createTestApp(context.config, context.service);
    const routes = [
      {
        path: "/",
        requiredText: "published Himachal Pradesh snapshot",
      },
      {
        path: "/districts",
        requiredText: "current snapshot flags for closer inspection",
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
        requiredText: "publishes dated aggregates after operator review",
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

      for (const pattern of disallowedPublicPhrases) {
        expect(response.text, `${route.path} should not match ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});

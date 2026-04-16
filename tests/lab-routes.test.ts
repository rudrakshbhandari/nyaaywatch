import request from "supertest";
import { describe, expect, it } from "vitest";

import { createPreviewRuntime } from "../src/preview/runtime.js";

const disallowedPublicPhrases = [
  /\breal-?time\b/i,
  /\blive (?:feed|status|data|dashboard|monitoring)\b/i,
  /\bpredictive\b/i,
  /\bverdicts?\b/i,
];

const variantRoutes = [
  { path: "/lab", marker: "NyaayWatch design lab" },
  { path: "/lab/editorial", marker: "How long is the wait for justice in Himachal?" },
  { path: "/lab/terminal", marker: "NYAAYWATCH" },
  { path: "/lab/product", marker: "Watch how Himachal" },
  { path: "/lab/civic", marker: "Court delays in Himachal Pradesh" },
];

describe("lab routes", () => {
  it("serves all four homepage variants plus the lab index on the preview runtime", async () => {
    const runtime = await createPreviewRuntime({
      NODE_ENV: "test",
      PORT: "3000",
      APP_MODE: "preview",
    });

    try {
      for (const route of variantRoutes) {
        const response = await request(runtime.app).get(route.path);
        expect(response.status, route.path).toBe(200);
        expect(response.text, route.path).toContain(route.marker);

        for (const pattern of disallowedPublicPhrases) {
          expect(response.text, `${route.path} should not match ${pattern}`).not.toMatch(pattern);
        }
      }

      const unknownVariant = await request(runtime.app).get("/lab/nope");
      expect(unknownVariant.status).toBe(404);
    } finally {
      await runtime.close();
    }
  });

  it("does not leak methodology jargon into hero copy on any variant", async () => {
    const runtime = await createPreviewRuntime({
      NODE_ENV: "test",
      PORT: "3000",
      APP_MODE: "preview",
    });

    try {
      // The user complained that technical/audit language was the first thing readers saw.
      // These heroes should lead with what the data says, not the data pipeline. Full
      // methodology language is still allowed in footers, info popovers, and lower sections.
      const heroForbidden = [
        "Stored evidence, not live scraping",
        "operator-published",
        "publication_",
        "methodology version",
      ];

      for (const route of variantRoutes.slice(1)) {
        const response = await request(runtime.app).get(route.path);
        expect(response.status, route.path).toBe(200);
        // Extract the top ~4kb of body to approximate "above the fold".
        const bodyStart = response.text.indexOf("<body");
        const aboveFold = response.text.slice(bodyStart, bodyStart + 4096);
        for (const phrase of heroForbidden) {
          expect(aboveFold, `${route.path} hero should not contain "${phrase}"`).not.toContain(phrase);
        }
      }
    } finally {
      await runtime.close();
    }
  });
});

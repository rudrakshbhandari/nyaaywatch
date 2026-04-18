import request from "supertest";
import { describe, expect, it } from "vitest";

import { createPreviewRuntime } from "../src/preview/runtime.js";

describe("preview runtime", () => {
  it("serves fixture-backed public routes without external storage", async () => {
    const runtime = await createPreviewRuntime({
      NODE_ENV: "test",
      PORT: "3000",
      APP_MODE: "preview",
    });

    try {
      const home = await request(runtime.app).get("/");
      expect(home.status).toBe(200);
      expect(home.text).toContain("published snapshot");

      const districts = await request(runtime.app).get("/v1/districts");
      expect(districts.status).toBe(200);
      expect(districts.body.snapshot.stateCode).toBe("HP");

      const operator = await request(runtime.app).get("/operator/publications");
      expect(operator.status).toBe(404);

      expect(home.text).not.toContain("/states/punjab");

      const punjab = await request(runtime.app).get("/states/punjab");
      expect(punjab.status).toBe(503);
    } finally {
      await runtime.close();
    }
  });
});

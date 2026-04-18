import { describe, expect, it } from "vitest";

import { createFixtureSourceClient } from "../src/dev/fixtures.js";

describe("fixture source clients", () => {
  it("loads a real Punjab fixture set instead of reusing Himachal HTML", async () => {
    const bundle = await createFixtureSourceClient("PB").captureLatest();

    expect(bundle.stateCode).toBe("PB");
    expect(bundle.stateName).toBe("Punjab");
    expect(bundle.expectedDistrictCount).toBe(22);
    expect(bundle.districtPages).toHaveLength(22);
    expect(bundle.districtPages.some((page) => page.districtName === "Ludhiana")).toBe(true);
    expect(bundle.districtPages.some((page) => page.districtName === "Kangra")).toBe(false);
  });

  it("fails loudly when a state fixture set is not checked in", async () => {
    await expect(createFixtureSourceClient("HR").captureLatest()).rejects.toThrow(
      "No checked-in fixture set is available for HR (Haryana).",
    );
  });
});

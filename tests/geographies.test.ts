import { describe, expect, it } from "vitest";

import {
  getPublicStateProfileBySlug,
  getStateProfile,
  getStateProfileByCode,
  getStateProfileByCodeOrSlug,
  listPublicStateProfiles,
  listStateProfiles,
} from "../src/geographies.js";

describe("state profiles", () => {
  it("keeps Haryana and Uttarakhand available for internal trial work without exposing them publicly", () => {
    expect(getStateProfile("HR")).toMatchObject({
      stateCode: "HR",
      stateName: "Haryana",
      stateSlug: "haryana",
      njdgStateValue: "6~14",
      publicAlpha: false,
    });

    expect(getStateProfile("UK")).toMatchObject({
      stateCode: "UK",
      stateName: "Uttarakhand",
      stateSlug: "uttarakhand",
      njdgStateValue: "5~15",
      publicAlpha: false,
    });

    expect(listStateProfiles().map((profile) => profile.stateCode)).toEqual(["HP", "PB", "HR", "UK"]);
    expect(listPublicStateProfiles().map((profile) => profile.stateCode)).toEqual(["HP", "PB"]);
    expect(getStateProfileByCode("hr")?.stateName).toBe("Haryana");
    expect(getStateProfileByCode("uk")?.stateName).toBe("Uttarakhand");
    expect(getStateProfileByCodeOrSlug("haryana")?.stateCode).toBe("HR");
    expect(getStateProfileByCodeOrSlug("uttarakhand")?.stateCode).toBe("UK");
    expect(getPublicStateProfileBySlug("haryana")).toBeNull();
    expect(getPublicStateProfileBySlug("uttarakhand")).toBeNull();
  });
});

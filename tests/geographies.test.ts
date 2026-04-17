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
  it("keeps the internal trial candidates available without exposing them publicly", () => {
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

    expect(getStateProfile("RJ")).toMatchObject({
      stateCode: "RJ",
      stateName: "Rajasthan",
      stateSlug: "rajasthan",
      njdgStateValue: "8~9",
      publicAlpha: false,
    });

    expect(getStateProfile("UP")).toMatchObject({
      stateCode: "UP",
      stateName: "Uttar Pradesh",
      stateSlug: "uttar-pradesh",
      njdgStateValue: "9~13",
      publicAlpha: false,
    });

    expect(listStateProfiles().map((profile) => profile.stateCode)).toEqual(["HP", "PB", "HR", "UK", "RJ", "UP"]);
    expect(listPublicStateProfiles().map((profile) => profile.stateCode)).toEqual(["HP", "PB"]);
    expect(getStateProfileByCode("hr")?.stateName).toBe("Haryana");
    expect(getStateProfileByCode("uk")?.stateName).toBe("Uttarakhand");
    expect(getStateProfileByCode("rj")?.stateName).toBe("Rajasthan");
    expect(getStateProfileByCode("up")?.stateName).toBe("Uttar Pradesh");
    expect(getStateProfileByCodeOrSlug("haryana")?.stateCode).toBe("HR");
    expect(getStateProfileByCodeOrSlug("uttarakhand")?.stateCode).toBe("UK");
    expect(getStateProfileByCodeOrSlug("rajasthan")?.stateCode).toBe("RJ");
    expect(getStateProfileByCodeOrSlug("uttar-pradesh")?.stateCode).toBe("UP");
    expect(getPublicStateProfileBySlug("haryana")).toBeNull();
    expect(getPublicStateProfileBySlug("uttarakhand")).toBeNull();
    expect(getPublicStateProfileBySlug("rajasthan")).toBeNull();
    expect(getPublicStateProfileBySlug("uttar-pradesh")).toBeNull();
  });
});

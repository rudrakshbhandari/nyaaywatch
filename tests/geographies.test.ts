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
  it("keeps internal candidates available while exposing only the approved public states", () => {
    expect(getStateProfile("HR")).toMatchObject({
      stateCode: "HR",
      stateName: "Haryana",
      stateSlug: "haryana",
      njdgStateValue: "6~14",
      publicAlpha: true,
    });

    expect(getStateProfile("TN")).toMatchObject({
      stateCode: "TN",
      stateName: "Tamil Nadu",
      stateSlug: "tamil-nadu",
      njdgStateValue: "33~10",
      publicAlpha: true,
    });

    expect(getStateProfile("AS")).toMatchObject({
      stateCode: "AS",
      stateName: "Assam",
      stateSlug: "assam",
      njdgStateValue: "18~6",
      publicAlpha: false,
    });

    expect(getStateProfile("KL")).toMatchObject({
      stateCode: "KL",
      stateName: "Kerala",
      stateSlug: "kerala",
      njdgStateValue: "32~4",
      publicAlpha: false,
    });

    expect(getStateProfile("ML")).toMatchObject({
      stateCode: "ML",
      stateName: "Meghalaya",
      stateSlug: "meghalaya",
      njdgStateValue: "17~21",
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

    expect(listStateProfiles().map((profile) => profile.stateCode)).toEqual(["HP", "PB", "HR", "TN", "AS", "KL", "ML", "UK", "RJ", "UP"]);
    expect(listPublicStateProfiles().map((profile) => profile.stateCode)).toEqual(["HP", "PB", "HR", "TN"]);
    expect(getStateProfileByCode("hr")?.stateName).toBe("Haryana");
    expect(getStateProfileByCode("tn")?.stateName).toBe("Tamil Nadu");
    expect(getStateProfileByCode("as")?.stateName).toBe("Assam");
    expect(getStateProfileByCode("kl")?.stateName).toBe("Kerala");
    expect(getStateProfileByCode("ml")?.stateName).toBe("Meghalaya");
    expect(getStateProfileByCode("uk")?.stateName).toBe("Uttarakhand");
    expect(getStateProfileByCode("rj")?.stateName).toBe("Rajasthan");
    expect(getStateProfileByCode("up")?.stateName).toBe("Uttar Pradesh");
    expect(getStateProfileByCodeOrSlug("haryana")?.stateCode).toBe("HR");
    expect(getStateProfileByCodeOrSlug("tamil-nadu")?.stateCode).toBe("TN");
    expect(getStateProfileByCodeOrSlug("assam")?.stateCode).toBe("AS");
    expect(getStateProfileByCodeOrSlug("kerala")?.stateCode).toBe("KL");
    expect(getStateProfileByCodeOrSlug("meghalaya")?.stateCode).toBe("ML");
    expect(getStateProfileByCodeOrSlug("uttarakhand")?.stateCode).toBe("UK");
    expect(getStateProfileByCodeOrSlug("rajasthan")?.stateCode).toBe("RJ");
    expect(getStateProfileByCodeOrSlug("uttar-pradesh")?.stateCode).toBe("UP");
    expect(getPublicStateProfileBySlug("haryana")?.stateCode).toBe("HR");
    expect(getPublicStateProfileBySlug("tamil-nadu")?.stateCode).toBe("TN");
    expect(getPublicStateProfileBySlug("assam")).toBeNull();
    expect(getPublicStateProfileBySlug("kerala")).toBeNull();
    expect(getPublicStateProfileBySlug("meghalaya")).toBeNull();
    expect(getPublicStateProfileBySlug("uttarakhand")).toBeNull();
    expect(getPublicStateProfileBySlug("rajasthan")).toBeNull();
    expect(getPublicStateProfileBySlug("uttar-pradesh")).toBeNull();
  });
});

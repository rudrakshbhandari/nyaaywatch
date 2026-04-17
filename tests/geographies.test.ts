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
      publicAlpha: true,
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

    expect(getStateProfile("KA")).toMatchObject({
      stateCode: "KA",
      stateName: "Karnataka",
      stateSlug: "karnataka",
      njdgStateValue: "29~3",
      publicAlpha: false,
    });

    expect(getStateProfile("TR")).toMatchObject({
      stateCode: "TR",
      stateName: "Tripura",
      stateSlug: "tripura",
      njdgStateValue: "16~20",
      publicAlpha: false,
    });

    expect(getStateProfile("NL")).toMatchObject({
      stateCode: "NL",
      stateName: "Nagaland",
      stateSlug: "nagaland",
      njdgStateValue: "13~34",
      publicAlpha: false,
    });

    expect(getStateProfile("TS")).toMatchObject({
      stateCode: "TS",
      stateName: "Telangana",
      stateSlug: "telangana",
      njdgStateValue: "36~29",
      publicAlpha: false,
    });

    expect(getStateProfile("AP")).toMatchObject({
      stateCode: "AP",
      stateName: "Andhra Pradesh",
      stateSlug: "andhra-pradesh",
      njdgStateValue: "28~2",
      publicAlpha: false,
    });

    expect(getStateProfile("AR")).toMatchObject({
      stateCode: "AR",
      stateName: "Arunachal Pradesh",
      stateSlug: "arunachal-pradesh",
      njdgStateValue: "12~36",
      publicAlpha: false,
    });

    expect(getStateProfile("MN")).toMatchObject({
      stateCode: "MN",
      stateName: "Manipur",
      stateSlug: "manipur",
      njdgStateValue: "14~25",
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

    expect(listStateProfiles().map((profile) => profile.stateCode)).toEqual([
      "HP",
      "PB",
      "HR",
      "TN",
      "AS",
      "KL",
      "ML",
      "KA",
      "TR",
      "NL",
      "TS",
      "AP",
      "AR",
      "MN",
      "UK",
      "RJ",
      "UP",
    ]);
    expect(listPublicStateProfiles().map((profile) => profile.stateCode)).toEqual(["HP", "PB", "HR", "TN", "AS"]);
    expect(getStateProfileByCode("hr")?.stateName).toBe("Haryana");
    expect(getStateProfileByCode("tn")?.stateName).toBe("Tamil Nadu");
    expect(getStateProfileByCode("as")?.stateName).toBe("Assam");
    expect(getStateProfileByCode("kl")?.stateName).toBe("Kerala");
    expect(getStateProfileByCode("ml")?.stateName).toBe("Meghalaya");
    expect(getStateProfileByCode("ka")?.stateName).toBe("Karnataka");
    expect(getStateProfileByCode("tr")?.stateName).toBe("Tripura");
    expect(getStateProfileByCode("nl")?.stateName).toBe("Nagaland");
    expect(getStateProfileByCode("ts")?.stateName).toBe("Telangana");
    expect(getStateProfileByCode("ap")?.stateName).toBe("Andhra Pradesh");
    expect(getStateProfileByCode("ar")?.stateName).toBe("Arunachal Pradesh");
    expect(getStateProfileByCode("mn")?.stateName).toBe("Manipur");
    expect(getStateProfileByCode("uk")?.stateName).toBe("Uttarakhand");
    expect(getStateProfileByCode("rj")?.stateName).toBe("Rajasthan");
    expect(getStateProfileByCode("up")?.stateName).toBe("Uttar Pradesh");
    expect(getStateProfileByCodeOrSlug("haryana")?.stateCode).toBe("HR");
    expect(getStateProfileByCodeOrSlug("tamil-nadu")?.stateCode).toBe("TN");
    expect(getStateProfileByCodeOrSlug("assam")?.stateCode).toBe("AS");
    expect(getStateProfileByCodeOrSlug("kerala")?.stateCode).toBe("KL");
    expect(getStateProfileByCodeOrSlug("meghalaya")?.stateCode).toBe("ML");
    expect(getStateProfileByCodeOrSlug("karnataka")?.stateCode).toBe("KA");
    expect(getStateProfileByCodeOrSlug("tripura")?.stateCode).toBe("TR");
    expect(getStateProfileByCodeOrSlug("nagaland")?.stateCode).toBe("NL");
    expect(getStateProfileByCodeOrSlug("telangana")?.stateCode).toBe("TS");
    expect(getStateProfileByCodeOrSlug("andhra-pradesh")?.stateCode).toBe("AP");
    expect(getStateProfileByCodeOrSlug("arunachal-pradesh")?.stateCode).toBe("AR");
    expect(getStateProfileByCodeOrSlug("manipur")?.stateCode).toBe("MN");
    expect(getStateProfileByCodeOrSlug("uttarakhand")?.stateCode).toBe("UK");
    expect(getStateProfileByCodeOrSlug("rajasthan")?.stateCode).toBe("RJ");
    expect(getStateProfileByCodeOrSlug("uttar-pradesh")?.stateCode).toBe("UP");
    expect(getPublicStateProfileBySlug("haryana")?.stateCode).toBe("HR");
    expect(getPublicStateProfileBySlug("tamil-nadu")?.stateCode).toBe("TN");
    expect(getPublicStateProfileBySlug("assam")?.stateCode).toBe("AS");
    expect(getPublicStateProfileBySlug("kerala")).toBeNull();
    expect(getPublicStateProfileBySlug("meghalaya")).toBeNull();
    expect(getPublicStateProfileBySlug("karnataka")).toBeNull();
    expect(getPublicStateProfileBySlug("tripura")).toBeNull();
    expect(getPublicStateProfileBySlug("nagaland")).toBeNull();
    expect(getPublicStateProfileBySlug("telangana")).toBeNull();
    expect(getPublicStateProfileBySlug("andhra-pradesh")).toBeNull();
    expect(getPublicStateProfileBySlug("arunachal-pradesh")).toBeNull();
    expect(getPublicStateProfileBySlug("manipur")).toBeNull();
    expect(getPublicStateProfileBySlug("uttarakhand")).toBeNull();
    expect(getPublicStateProfileBySlug("rajasthan")).toBeNull();
    expect(getPublicStateProfileBySlug("uttar-pradesh")).toBeNull();
  });
});

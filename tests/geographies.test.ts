import { describe, expect, it } from "vitest";

import {
  getPublicStateProfileBySlug,
  getStateProfile,
  getStateProfileByCode,
  getStateProfileByCodeOrSlug,
  listInternalFetchStateProfiles,
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

    expect(getStateProfile("TS")).toMatchObject({
      stateCode: "TS",
      stateName: "Telangana",
      stateSlug: "telangana",
      njdgStateValue: "36~29",
      publicAlpha: true,
    });

    expect(getStateProfile("AP")).toMatchObject({
      stateCode: "AP",
      stateName: "Andhra Pradesh",
      stateSlug: "andhra-pradesh",
      njdgStateValue: "28~2",
      publicAlpha: true,
    });

    expect(getStateProfile("AR")).toMatchObject({
      stateCode: "AR",
      stateName: "Arunachal Pradesh",
      stateSlug: "arunachal-pradesh",
      njdgStateValue: "12~36",
      publicAlpha: true,
    });

    expect(getStateProfile("MN")).toMatchObject({
      stateCode: "MN",
      stateName: "Manipur",
      stateSlug: "manipur",
      njdgStateValue: "14~25",
      publicAlpha: true,
    });

    expect(getStateProfile("KL")).toMatchObject({
      stateCode: "KL",
      stateName: "Kerala",
      stateSlug: "kerala",
      njdgStateValue: "32~4",
      publicAlpha: true,
    });

    expect(getStateProfile("ML")).toMatchObject({
      stateCode: "ML",
      stateName: "Meghalaya",
      stateSlug: "meghalaya",
      njdgStateValue: "17~21",
      publicAlpha: true,
    });

    expect(getStateProfile("KA")).toMatchObject({
      stateCode: "KA",
      stateName: "Karnataka",
      stateSlug: "karnataka",
      njdgStateValue: "29~3",
      publicAlpha: true,
    });

    expect(getStateProfile("TR")).toMatchObject({
      stateCode: "TR",
      stateName: "Tripura",
      stateSlug: "tripura",
      njdgStateValue: "16~20",
      publicAlpha: true,
    });

    expect(getStateProfile("NL")).toMatchObject({
      stateCode: "NL",
      stateName: "Nagaland",
      stateSlug: "nagaland",
      njdgStateValue: "13~34",
      publicAlpha: true,
    });

    expect(getStateProfile("UK")).toMatchObject({
      stateCode: "UK",
      stateName: "Uttarakhand",
      stateSlug: "uttarakhand",
      njdgStateValue: "5~15",
      publicAlpha: true,
    });

    expect(getStateProfile("RJ")).toMatchObject({
      stateCode: "RJ",
      stateName: "Rajasthan",
      stateSlug: "rajasthan",
      njdgStateValue: "8~9",
      publicAlpha: true,
    });

    expect(getStateProfile("UP")).toMatchObject({
      stateCode: "UP",
      stateName: "Uttar Pradesh",
      stateSlug: "uttar-pradesh",
      njdgStateValue: "9~13",
      publicAlpha: true,
    });

    expect(getStateProfile("MP")).toMatchObject({
      stateCode: "MP",
      stateName: "Madhya Pradesh",
      stateSlug: "madhya-pradesh",
      njdgStateValue: "23~23",
      publicAlpha: true,
    });

    expect(getStateProfile("MH")).toMatchObject({
      stateCode: "MH",
      stateName: "Maharashtra",
      stateSlug: "maharashtra",
      njdgStateValue: "27~1",
      publicAlpha: true,
    });

    expect(getStateProfile("BR")).toMatchObject({
      stateCode: "BR",
      stateName: "Bihar",
      stateSlug: "bihar",
      njdgStateValue: "10~8",
      publicAlpha: true,
    });

    expect(getStateProfile("GJ")).toMatchObject({
      stateCode: "GJ",
      stateName: "Gujarat",
      stateSlug: "gujarat",
      njdgStateValue: "24~17",
      publicAlpha: true,
    });

    expect(getStateProfile("OD")).toMatchObject({
      stateCode: "OD",
      stateName: "Odisha",
      stateSlug: "odisha",
      njdgStateValue: "21~11",
      publicAlpha: true,
    });

    expect(getStateProfile("WB")).toMatchObject({
      stateCode: "WB",
      stateName: "West Bengal",
      stateSlug: "west-bengal",
      njdgStateValue: "19~16",
      publicAlpha: true,
    });

    expect(getStateProfile("JH")).toMatchObject({
      stateCode: "JH",
      stateName: "Jharkhand",
      stateSlug: "jharkhand",
      njdgStateValue: "20~7",
      publicAlpha: true,
    });

    expect(getStateProfile("CG")).toMatchObject({
      stateCode: "CG",
      stateName: "Chhattisgarh",
      stateSlug: "chhattisgarh",
      njdgStateValue: "22~18",
      publicAlpha: true,
    });

    expect(getStateProfile("GA")).toMatchObject({
      stateCode: "GA",
      stateName: "Goa",
      stateSlug: "goa",
      njdgStateValue: "30~30",
      publicAlpha: true,
    });

    expect(getStateProfile("SK")).toMatchObject({
      stateCode: "SK",
      stateName: "Sikkim",
      stateSlug: "sikkim",
      njdgStateValue: "11~24",
      publicAlpha: true,
    });

    expect(getStateProfile("MZ")).toMatchObject({
      stateCode: "MZ",
      stateName: "Mizoram",
      stateSlug: "mizoram",
      njdgStateValue: "15~19",
      publicAlpha: true,
    });

    expect(getStateProfile("AN")).toMatchObject({
      stateCode: "AN",
      stateName: "Andaman and Nicobar Islands",
      stateSlug: "andaman-and-nicobar-islands",
      njdgStateValue: "35~28",
      publicAlpha: false,
      internalFetchEnabled: true,
    });

    expect(getStateProfile("CHD")).toMatchObject({
      stateCode: "CHD",
      stateName: "Chandigarh",
      stateSlug: "chandigarh",
      njdgStateValue: "4~27",
      publicAlpha: false,
      internalFetchEnabled: true,
    });

    expect(getStateProfile("DL")).toMatchObject({
      stateCode: "DL",
      stateName: "Delhi",
      stateSlug: "delhi",
      njdgStateValue: "7~26",
      publicAlpha: false,
      internalFetchEnabled: true,
    });

    expect(getStateProfile("JK")).toMatchObject({
      stateCode: "JK",
      stateName: "Jammu and Kashmir",
      stateSlug: "jammu-and-kashmir",
      njdgStateValue: "1~12",
      publicAlpha: false,
      internalFetchEnabled: true,
    });

    expect(getStateProfile("LA")).toMatchObject({
      stateCode: "LA",
      stateName: "Ladakh",
      stateSlug: "ladakh",
      njdgStateValue: "37~33",
      publicAlpha: false,
      internalFetchEnabled: true,
    });

    expect(getStateProfile("LD")).toMatchObject({
      stateCode: "LD",
      stateName: "Lakshadweep",
      stateSlug: "lakshadweep",
      njdgStateValue: "31~37",
      publicAlpha: false,
      internalFetchEnabled: true,
    });

    expect(getStateProfile("PY")).toMatchObject({
      stateCode: "PY",
      stateName: "Puducherry",
      stateSlug: "puducherry",
      njdgStateValue: "34~35",
      publicAlpha: false,
      internalFetchEnabled: true,
    });

    expect(getStateProfile("DNHDD")).toMatchObject({
      stateCode: "DNHDD",
      stateName: "Dadra and Nagar Haveli and Daman and Diu",
      stateSlug: "dadra-and-nagar-haveli-and-daman-and-diu",
      njdgStateValue: "38~38",
      publicAlpha: false,
      internalFetchEnabled: true,
    });

    expect(listStateProfiles().map((profile) => profile.stateCode)).toEqual([
      "HP",
      "PB",
      "HR",
      "TN",
      "AS",
      "TS",
      "AP",
      "AR",
      "MN",
      "KL",
      "ML",
      "KA",
      "TR",
      "NL",
      "UK",
      "RJ",
      "UP",
      "MP",
      "MH",
      "BR",
      "GJ",
      "OD",
      "WB",
      "JH",
      "CG",
      "GA",
      "SK",
      "MZ",
      "AN",
      "CHD",
      "DL",
      "JK",
      "LA",
      "LD",
      "PY",
      "DNHDD",
    ]);
    expect(listPublicStateProfiles().map((profile) => profile.stateCode)).toEqual([
      "HP",
      "PB",
      "HR",
      "TN",
      "AS",
      "TS",
      "AP",
      "AR",
      "MN",
      "KL",
      "ML",
      "KA",
      "TR",
      "NL",
      "UK",
      "RJ",
      "UP",
      "MP",
      "MH",
      "BR",
      "GJ",
      "OD",
      "WB",
      "JH",
      "CG",
      "GA",
      "SK",
      "MZ",
    ]);
    expect(listInternalFetchStateProfiles().map((profile) => profile.stateCode)).toEqual([
      "HP",
      "PB",
      "HR",
      "TN",
      "AS",
      "TS",
      "AP",
      "AR",
      "MN",
      "KL",
      "ML",
      "KA",
      "TR",
      "NL",
      "UK",
      "RJ",
      "UP",
      "MP",
      "MH",
      "BR",
      "GJ",
      "OD",
      "WB",
      "JH",
      "CG",
      "GA",
      "SK",
      "MZ",
      "AN",
      "CHD",
      "DL",
      "JK",
      "LA",
      "LD",
      "PY",
      "DNHDD",
    ]);
    expect(getStateProfileByCode("hr")?.stateName).toBe("Haryana");
    expect(getStateProfileByCode("tn")?.stateName).toBe("Tamil Nadu");
    expect(getStateProfileByCode("as")?.stateName).toBe("Assam");
    expect(getStateProfileByCode("ts")?.stateName).toBe("Telangana");
    expect(getStateProfileByCode("ap")?.stateName).toBe("Andhra Pradesh");
    expect(getStateProfileByCode("ar")?.stateName).toBe("Arunachal Pradesh");
    expect(getStateProfileByCode("mn")?.stateName).toBe("Manipur");
    expect(getStateProfileByCode("kl")?.stateName).toBe("Kerala");
    expect(getStateProfileByCode("ml")?.stateName).toBe("Meghalaya");
    expect(getStateProfileByCode("ka")?.stateName).toBe("Karnataka");
    expect(getStateProfileByCode("tr")?.stateName).toBe("Tripura");
    expect(getStateProfileByCode("nl")?.stateName).toBe("Nagaland");
    expect(getStateProfileByCode("uk")?.stateName).toBe("Uttarakhand");
    expect(getStateProfileByCode("rj")?.stateName).toBe("Rajasthan");
    expect(getStateProfileByCode("up")?.stateName).toBe("Uttar Pradesh");
    expect(getStateProfileByCode("mp")?.stateName).toBe("Madhya Pradesh");
    expect(getStateProfileByCode("mh")?.stateName).toBe("Maharashtra");
    expect(getStateProfileByCode("br")?.stateName).toBe("Bihar");
    expect(getStateProfileByCode("gj")?.stateName).toBe("Gujarat");
    expect(getStateProfileByCode("od")?.stateName).toBe("Odisha");
    expect(getStateProfileByCode("wb")?.stateName).toBe("West Bengal");
    expect(getStateProfileByCode("jh")?.stateName).toBe("Jharkhand");
    expect(getStateProfileByCode("cg")?.stateName).toBe("Chhattisgarh");
    expect(getStateProfileByCode("ga")?.stateName).toBe("Goa");
    expect(getStateProfileByCode("sk")?.stateName).toBe("Sikkim");
    expect(getStateProfileByCode("mz")?.stateName).toBe("Mizoram");
    expect(getStateProfileByCode("an")?.stateName).toBe("Andaman and Nicobar Islands");
    expect(getStateProfileByCode("chd")?.stateName).toBe("Chandigarh");
    expect(getStateProfileByCode("dl")?.stateName).toBe("Delhi");
    expect(getStateProfileByCode("jk")?.stateName).toBe("Jammu and Kashmir");
    expect(getStateProfileByCode("la")?.stateName).toBe("Ladakh");
    expect(getStateProfileByCode("ld")?.stateName).toBe("Lakshadweep");
    expect(getStateProfileByCode("py")?.stateName).toBe("Puducherry");
    expect(getStateProfileByCode("dnhdd")?.stateName).toBe("Dadra and Nagar Haveli and Daman and Diu");
    expect(getStateProfileByCodeOrSlug("haryana")?.stateCode).toBe("HR");
    expect(getStateProfileByCodeOrSlug("tamil-nadu")?.stateCode).toBe("TN");
    expect(getStateProfileByCodeOrSlug("assam")?.stateCode).toBe("AS");
    expect(getStateProfileByCodeOrSlug("telangana")?.stateCode).toBe("TS");
    expect(getStateProfileByCodeOrSlug("andhra-pradesh")?.stateCode).toBe("AP");
    expect(getStateProfileByCodeOrSlug("arunachal-pradesh")?.stateCode).toBe("AR");
    expect(getStateProfileByCodeOrSlug("manipur")?.stateCode).toBe("MN");
    expect(getStateProfileByCodeOrSlug("kerala")?.stateCode).toBe("KL");
    expect(getStateProfileByCodeOrSlug("meghalaya")?.stateCode).toBe("ML");
    expect(getStateProfileByCodeOrSlug("karnataka")?.stateCode).toBe("KA");
    expect(getStateProfileByCodeOrSlug("tripura")?.stateCode).toBe("TR");
    expect(getStateProfileByCodeOrSlug("nagaland")?.stateCode).toBe("NL");
    expect(getStateProfileByCodeOrSlug("uttarakhand")?.stateCode).toBe("UK");
    expect(getStateProfileByCodeOrSlug("rajasthan")?.stateCode).toBe("RJ");
    expect(getStateProfileByCodeOrSlug("uttar-pradesh")?.stateCode).toBe("UP");
    expect(getStateProfileByCodeOrSlug("madhya-pradesh")?.stateCode).toBe("MP");
    expect(getStateProfileByCodeOrSlug("maharashtra")?.stateCode).toBe("MH");
    expect(getStateProfileByCodeOrSlug("bihar")?.stateCode).toBe("BR");
    expect(getStateProfileByCodeOrSlug("gujarat")?.stateCode).toBe("GJ");
    expect(getStateProfileByCodeOrSlug("odisha")?.stateCode).toBe("OD");
    expect(getStateProfileByCodeOrSlug("west-bengal")?.stateCode).toBe("WB");
    expect(getStateProfileByCodeOrSlug("jharkhand")?.stateCode).toBe("JH");
    expect(getStateProfileByCodeOrSlug("chhattisgarh")?.stateCode).toBe("CG");
    expect(getStateProfileByCodeOrSlug("goa")?.stateCode).toBe("GA");
    expect(getStateProfileByCodeOrSlug("sikkim")?.stateCode).toBe("SK");
    expect(getStateProfileByCodeOrSlug("mizoram")?.stateCode).toBe("MZ");
    expect(getStateProfileByCodeOrSlug("andaman-and-nicobar-islands")?.stateCode).toBe("AN");
    expect(getStateProfileByCodeOrSlug("chandigarh")?.stateCode).toBe("CHD");
    expect(getStateProfileByCodeOrSlug("delhi")?.stateCode).toBe("DL");
    expect(getStateProfileByCodeOrSlug("jammu-and-kashmir")?.stateCode).toBe("JK");
    expect(getStateProfileByCodeOrSlug("ladakh")?.stateCode).toBe("LA");
    expect(getStateProfileByCodeOrSlug("lakshadweep")?.stateCode).toBe("LD");
    expect(getStateProfileByCodeOrSlug("puducherry")?.stateCode).toBe("PY");
    expect(getStateProfileByCodeOrSlug("dadra-and-nagar-haveli-and-daman-and-diu")?.stateCode).toBe("DNHDD");
    expect(getPublicStateProfileBySlug("haryana")?.stateCode).toBe("HR");
    expect(getPublicStateProfileBySlug("tamil-nadu")?.stateCode).toBe("TN");
    expect(getPublicStateProfileBySlug("assam")?.stateCode).toBe("AS");
    expect(getPublicStateProfileBySlug("telangana")?.stateCode).toBe("TS");
    expect(getPublicStateProfileBySlug("andhra-pradesh")?.stateCode).toBe("AP");
    expect(getPublicStateProfileBySlug("arunachal-pradesh")?.stateCode).toBe("AR");
    expect(getPublicStateProfileBySlug("manipur")?.stateCode).toBe("MN");
    expect(getPublicStateProfileBySlug("kerala")?.stateCode).toBe("KL");
    expect(getPublicStateProfileBySlug("meghalaya")?.stateCode).toBe("ML");
    expect(getPublicStateProfileBySlug("karnataka")?.stateCode).toBe("KA");
    expect(getPublicStateProfileBySlug("tripura")?.stateCode).toBe("TR");
    expect(getPublicStateProfileBySlug("nagaland")?.stateCode).toBe("NL");
    expect(getPublicStateProfileBySlug("uttarakhand")?.stateCode).toBe("UK");
    expect(getPublicStateProfileBySlug("rajasthan")?.stateCode).toBe("RJ");
    expect(getPublicStateProfileBySlug("uttar-pradesh")?.stateCode).toBe("UP");
    expect(getPublicStateProfileBySlug("madhya-pradesh")?.stateCode).toBe("MP");
    expect(getPublicStateProfileBySlug("maharashtra")?.stateCode).toBe("MH");
    expect(getPublicStateProfileBySlug("bihar")?.stateCode).toBe("BR");
    expect(getPublicStateProfileBySlug("gujarat")?.stateCode).toBe("GJ");
    expect(getPublicStateProfileBySlug("odisha")?.stateCode).toBe("OD");
    expect(getPublicStateProfileBySlug("west-bengal")?.stateCode).toBe("WB");
    expect(getPublicStateProfileBySlug("jharkhand")?.stateCode).toBe("JH");
    expect(getPublicStateProfileBySlug("chhattisgarh")?.stateCode).toBe("CG");
    expect(getPublicStateProfileBySlug("goa")?.stateCode).toBe("GA");
    expect(getPublicStateProfileBySlug("sikkim")?.stateCode).toBe("SK");
    expect(getPublicStateProfileBySlug("mizoram")?.stateCode).toBe("MZ");
    expect(getPublicStateProfileBySlug("andaman-and-nicobar-islands")).toBeNull();
    expect(getPublicStateProfileBySlug("chandigarh")).toBeNull();
    expect(getPublicStateProfileBySlug("delhi")).toBeNull();
    expect(getPublicStateProfileBySlug("jammu-and-kashmir")).toBeNull();
    expect(getPublicStateProfileBySlug("ladakh")).toBeNull();
    expect(getPublicStateProfileBySlug("lakshadweep")).toBeNull();
    expect(getPublicStateProfileBySlug("puducherry")).toBeNull();
    expect(getPublicStateProfileBySlug("dadra-and-nagar-haveli-and-daman-and-diu")).toBeNull();
  });
});

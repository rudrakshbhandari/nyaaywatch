export interface NjdgStateProfile {
  stateCode: SupportedStateCode;
  stateName: string;
  stateSlug: string;
  njdgStateValue: string;
  publicAlpha: boolean;
  internalFetchEnabled?: boolean;
}

export type GeographyType = "state" | "union_territory";

export interface CourtGeography {
  geographyCode: string;
  geographyName: string;
  geographyType: GeographyType;
  lowerCourtStateCode?: SupportedStateCode;
}

export const SUPPORTED_STATE_CODES = [
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
] as const;

export type SupportedStateCode = (typeof SUPPORTED_STATE_CODES)[number];

const STATE_PROFILES: Record<SupportedStateCode, NjdgStateProfile> = {
  HP: {
    stateCode: "HP",
    stateName: "Himachal Pradesh",
    stateSlug: "himachal-pradesh",
    njdgStateValue: "2~5",
    publicAlpha: true,
  },
  PB: {
    stateCode: "PB",
    stateName: "Punjab",
    stateSlug: "punjab",
    njdgStateValue: "3~22",
    publicAlpha: true,
  },
  HR: {
    stateCode: "HR",
    stateName: "Haryana",
    stateSlug: "haryana",
    njdgStateValue: "6~14",
    publicAlpha: true,
  },
  TN: {
    stateCode: "TN",
    stateName: "Tamil Nadu",
    stateSlug: "tamil-nadu",
    njdgStateValue: "33~10",
    publicAlpha: true,
  },
  AS: {
    stateCode: "AS",
    stateName: "Assam",
    stateSlug: "assam",
    njdgStateValue: "18~6",
    publicAlpha: true,
  },
  TS: {
    stateCode: "TS",
    stateName: "Telangana",
    stateSlug: "telangana",
    njdgStateValue: "36~29",
    publicAlpha: true,
  },
  AP: {
    stateCode: "AP",
    stateName: "Andhra Pradesh",
    stateSlug: "andhra-pradesh",
    njdgStateValue: "28~2",
    publicAlpha: true,
  },
  AR: {
    stateCode: "AR",
    stateName: "Arunachal Pradesh",
    stateSlug: "arunachal-pradesh",
    njdgStateValue: "12~36",
    publicAlpha: true,
  },
  MN: {
    stateCode: "MN",
    stateName: "Manipur",
    stateSlug: "manipur",
    njdgStateValue: "14~25",
    publicAlpha: true,
  },
  KL: {
    stateCode: "KL",
    stateName: "Kerala",
    stateSlug: "kerala",
    njdgStateValue: "32~4",
    publicAlpha: true,
  },
  ML: {
    stateCode: "ML",
    stateName: "Meghalaya",
    stateSlug: "meghalaya",
    njdgStateValue: "17~21",
    publicAlpha: true,
  },
  KA: {
    stateCode: "KA",
    stateName: "Karnataka",
    stateSlug: "karnataka",
    njdgStateValue: "29~3",
    publicAlpha: true,
  },
  TR: {
    stateCode: "TR",
    stateName: "Tripura",
    stateSlug: "tripura",
    njdgStateValue: "16~20",
    publicAlpha: true,
  },
  NL: {
    stateCode: "NL",
    stateName: "Nagaland",
    stateSlug: "nagaland",
    njdgStateValue: "13~34",
    publicAlpha: true,
  },
  UK: {
    stateCode: "UK",
    stateName: "Uttarakhand",
    stateSlug: "uttarakhand",
    njdgStateValue: "5~15",
    publicAlpha: true,
  },
  RJ: {
    stateCode: "RJ",
    stateName: "Rajasthan",
    stateSlug: "rajasthan",
    njdgStateValue: "8~9",
    publicAlpha: true,
  },
  UP: {
    stateCode: "UP",
    stateName: "Uttar Pradesh",
    stateSlug: "uttar-pradesh",
    njdgStateValue: "9~13",
    publicAlpha: true,
  },
  MP: {
    stateCode: "MP",
    stateName: "Madhya Pradesh",
    stateSlug: "madhya-pradesh",
    njdgStateValue: "23~23",
    publicAlpha: true,
  },
  MH: {
    stateCode: "MH",
    stateName: "Maharashtra",
    stateSlug: "maharashtra",
    njdgStateValue: "27~1",
    publicAlpha: true,
  },
  BR: {
    stateCode: "BR",
    stateName: "Bihar",
    stateSlug: "bihar",
    njdgStateValue: "10~8",
    publicAlpha: true,
  },
  GJ: {
    stateCode: "GJ",
    stateName: "Gujarat",
    stateSlug: "gujarat",
    njdgStateValue: "24~17",
    publicAlpha: true,
  },
  OD: {
    stateCode: "OD",
    stateName: "Odisha",
    stateSlug: "odisha",
    njdgStateValue: "21~11",
    publicAlpha: true,
  },
  WB: {
    stateCode: "WB",
    stateName: "West Bengal",
    stateSlug: "west-bengal",
    njdgStateValue: "19~16",
    publicAlpha: true,
  },
  JH: {
    stateCode: "JH",
    stateName: "Jharkhand",
    stateSlug: "jharkhand",
    njdgStateValue: "20~7",
    publicAlpha: true,
  },
  CG: {
    stateCode: "CG",
    stateName: "Chhattisgarh",
    stateSlug: "chhattisgarh",
    njdgStateValue: "22~18",
    publicAlpha: true,
  },
  GA: {
    stateCode: "GA",
    stateName: "Goa",
    stateSlug: "goa",
    njdgStateValue: "30~30",
    publicAlpha: true,
  },
  SK: {
    stateCode: "SK",
    stateName: "Sikkim",
    stateSlug: "sikkim",
    njdgStateValue: "11~24",
    publicAlpha: true,
  },
  MZ: {
    stateCode: "MZ",
    stateName: "Mizoram",
    stateSlug: "mizoram",
    njdgStateValue: "15~19",
    publicAlpha: true,
  },
  AN: {
    stateCode: "AN",
    stateName: "Andaman and Nicobar Islands",
    stateSlug: "andaman-and-nicobar-islands",
    njdgStateValue: "35~28",
    publicAlpha: false,
    internalFetchEnabled: false,
  },
  CHD: {
    stateCode: "CHD",
    stateName: "Chandigarh",
    stateSlug: "chandigarh",
    njdgStateValue: "4~27",
    publicAlpha: false,
    internalFetchEnabled: false,
  },
  DL: {
    stateCode: "DL",
    stateName: "Delhi",
    stateSlug: "delhi",
    njdgStateValue: "7~26",
    publicAlpha: false,
    internalFetchEnabled: false,
  },
  JK: {
    stateCode: "JK",
    stateName: "Jammu and Kashmir",
    stateSlug: "jammu-and-kashmir",
    njdgStateValue: "1~12",
    publicAlpha: false,
    internalFetchEnabled: false,
  },
  LA: {
    stateCode: "LA",
    stateName: "Ladakh",
    stateSlug: "ladakh",
    njdgStateValue: "37~33",
    publicAlpha: false,
    internalFetchEnabled: false,
  },
  LD: {
    stateCode: "LD",
    stateName: "Lakshadweep",
    stateSlug: "lakshadweep",
    njdgStateValue: "31~37",
    publicAlpha: false,
    internalFetchEnabled: false,
  },
  PY: {
    stateCode: "PY",
    stateName: "Puducherry",
    stateSlug: "puducherry",
    njdgStateValue: "34~35",
    publicAlpha: false,
    internalFetchEnabled: false,
  },
  DNHDD: {
    stateCode: "DNHDD",
    stateName: "Dadra and Nagar Haveli and Daman and Diu",
    stateSlug: "dadra-and-nagar-haveli-and-daman-and-diu",
    njdgStateValue: "38~38",
    publicAlpha: false,
    internalFetchEnabled: false,
  },
};

export function getStateProfile(stateCode: SupportedStateCode): NjdgStateProfile {
  return STATE_PROFILES[stateCode];
}

export function getStateProfileByCode(stateCode: string): NjdgStateProfile | null {
  const normalized = stateCode.trim().toUpperCase();
  return normalized in STATE_PROFILES ? STATE_PROFILES[normalized as SupportedStateCode] : null;
}

export function listStateProfiles(): NjdgStateProfile[] {
  return [...SUPPORTED_STATE_CODES].map((stateCode) => STATE_PROFILES[stateCode]);
}

export function listPublicStateProfiles(): NjdgStateProfile[] {
  return listStateProfiles().filter((profile) => profile.publicAlpha);
}

export function listInternalFetchStateProfiles(): NjdgStateProfile[] {
  return listStateProfiles().filter((profile) => profile.internalFetchEnabled !== false);
}

export function getPublicStateProfileBySlug(stateSlug: string): NjdgStateProfile | null {
  const normalized = stateSlug.trim().toLowerCase();
  return listPublicStateProfiles().find((profile) => profile.stateSlug === normalized) ?? null;
}

export function getStateProfileByCodeOrSlug(value: string): NjdgStateProfile | null {
  return getStateProfileByCode(value) ?? listStateProfiles().find((profile) => profile.stateSlug === value.trim().toLowerCase()) ?? null;
}

export function buildStateCourtGeography(stateCode: SupportedStateCode): CourtGeography {
  const profile = getStateProfile(stateCode);
  return {
    geographyCode: profile.stateCode,
    geographyName: profile.stateName,
    geographyType: "state",
    lowerCourtStateCode: profile.stateCode,
  };
}

export function buildUnionTerritoryCourtGeography(geographyCode: string, geographyName: string): CourtGeography {
  return {
    geographyCode,
    geographyName,
    geographyType: "union_territory",
  };
}

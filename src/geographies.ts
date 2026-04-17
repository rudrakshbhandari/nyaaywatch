export interface NjdgStateProfile {
  stateCode: SupportedStateCode;
  stateName: string;
  stateSlug: string;
  njdgStateValue: string;
  publicAlpha: boolean;
}

export const SUPPORTED_STATE_CODES = ["HP", "PB", "HR", "TN", "AS", "KL", "ML", "UK", "RJ", "UP"] as const;

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
    publicAlpha: false,
  },
  KL: {
    stateCode: "KL",
    stateName: "Kerala",
    stateSlug: "kerala",
    njdgStateValue: "32~4",
    publicAlpha: false,
  },
  ML: {
    stateCode: "ML",
    stateName: "Meghalaya",
    stateSlug: "meghalaya",
    njdgStateValue: "17~21",
    publicAlpha: false,
  },
  UK: {
    stateCode: "UK",
    stateName: "Uttarakhand",
    stateSlug: "uttarakhand",
    njdgStateValue: "5~15",
    publicAlpha: false,
  },
  RJ: {
    stateCode: "RJ",
    stateName: "Rajasthan",
    stateSlug: "rajasthan",
    njdgStateValue: "8~9",
    publicAlpha: false,
  },
  UP: {
    stateCode: "UP",
    stateName: "Uttar Pradesh",
    stateSlug: "uttar-pradesh",
    njdgStateValue: "9~13",
    publicAlpha: false,
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

export function getPublicStateProfileBySlug(stateSlug: string): NjdgStateProfile | null {
  const normalized = stateSlug.trim().toLowerCase();
  return listPublicStateProfiles().find((profile) => profile.stateSlug === normalized) ?? null;
}

export function getStateProfileByCodeOrSlug(value: string): NjdgStateProfile | null {
  return getStateProfileByCode(value) ?? listStateProfiles().find((profile) => profile.stateSlug === value.trim().toLowerCase()) ?? null;
}

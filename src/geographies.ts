export interface NjdgStateProfile {
  stateCode: SupportedStateCode;
  stateName: string;
  stateSlug: string;
  njdgStateValue: string;
  publicAlpha: boolean;
}

export const SUPPORTED_STATE_CODES = ["HP", "PB", "HR"] as const;

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

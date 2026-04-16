export interface NjdgStateProfile {
  stateCode: SupportedStateCode;
  stateName: string;
  njdgStateValue: string;
  publicAlpha: boolean;
}

export const SUPPORTED_STATE_CODES = ["HP", "PB"] as const;

export type SupportedStateCode = (typeof SUPPORTED_STATE_CODES)[number];

const STATE_PROFILES: Record<SupportedStateCode, NjdgStateProfile> = {
  HP: {
    stateCode: "HP",
    stateName: "Himachal Pradesh",
    njdgStateValue: "2~5",
    publicAlpha: true,
  },
  PB: {
    stateCode: "PB",
    stateName: "Punjab",
    njdgStateValue: "3~22",
    publicAlpha: false,
  },
};

export function getStateProfile(stateCode: SupportedStateCode): NjdgStateProfile {
  return STATE_PROFILES[stateCode];
}

export function listStateProfiles(): NjdgStateProfile[] {
  return [...SUPPORTED_STATE_CODES].map((stateCode) => STATE_PROFILES[stateCode]);
}

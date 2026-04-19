import { getStateProfile, type SupportedStateCode } from "./geographies.js";

export interface HighCourtSourceUrls {
  hcNjdg: string;
  hcServices: string;
  officialSite?: string;
  sitemap?: string;
  annualReport2023_24?: string;
}

export type HighCourtSourceReviewStatus = "reviewed" | "queued";

export interface HighCourtProfile {
  courtCode: SupportedHighCourtCode;
  courtSlug: string;
  courtName: string;
  stateCode: SupportedStateCode;
  stateName: string;
  hcNjdgStateValue: string;
  publicBeta: boolean;
  sourceReviewStatus: HighCourtSourceReviewStatus;
  sourceUrls: HighCourtSourceUrls;
}

export const SUPPORTED_HIGH_COURT_CODES = [
  "HPHC",
  "APHC",
  "TSHC",
  "CGHC",
  "GJHC",
  "JHHC",
  "KAHC",
  "MPHC",
  "MNHC",
  "MLHC",
  "ODHC",
  "RJHC",
  "SKHC",
  "TRHC",
  "UKHC",
  "BRHC",
  "UPHC",
] as const;

export type SupportedHighCourtCode = (typeof SUPPORTED_HIGH_COURT_CODES)[number];

const HIGH_COURT_SOURCE_BASE = {
  hcNjdg: "https://njdg.ecourts.gov.in/hcnjdg_v2/",
  hcServices: "https://hcservices.ecourts.gov.in/hcservices/main.php",
} as const;

const HIGH_COURT_PROFILES: Record<SupportedHighCourtCode, HighCourtProfile> = {
  HPHC: buildHighCourtProfile({
    courtCode: "HPHC",
    courtSlug: "himachal",
    courtName: "High Court of Himachal Pradesh",
    stateCode: "HP",
    hcNjdgStateValue: "2~5",
    publicBeta: true,
    sourceReviewStatus: "reviewed",
    sourceUrls: {
      ...HIGH_COURT_SOURCE_BASE,
      officialSite: "https://hphighcourt.nic.in/",
      sitemap: "https://hphighcourt.nic.in/sitemap.html",
      annualReport2023_24: "https://hphighcourt.nic.in/pdf/AnnualReport23092024.pdf",
    },
  }),
  APHC: buildHighCourtProfile({
    courtCode: "APHC",
    courtSlug: "andhra-pradesh",
    courtName: "High Court of Andhra Pradesh",
    stateCode: "AP",
    hcNjdgStateValue: "28~2",
  }),
  TSHC: buildHighCourtProfile({
    courtCode: "TSHC",
    courtSlug: "telangana",
    courtName: "High Court for State of Telangana",
    stateCode: "TS",
    hcNjdgStateValue: "36~29",
  }),
  CGHC: buildHighCourtProfile({
    courtCode: "CGHC",
    courtSlug: "chhattisgarh",
    courtName: "High Court of Chhattisgarh",
    stateCode: "CG",
    hcNjdgStateValue: "22~18",
  }),
  GJHC: buildHighCourtProfile({
    courtCode: "GJHC",
    courtSlug: "gujarat",
    courtName: "High Court of Gujarat",
    stateCode: "GJ",
    hcNjdgStateValue: "24~17",
  }),
  JHHC: buildHighCourtProfile({
    courtCode: "JHHC",
    courtSlug: "jharkhand",
    courtName: "High Court of Jharkhand",
    stateCode: "JH",
    hcNjdgStateValue: "20~7",
  }),
  KAHC: buildHighCourtProfile({
    courtCode: "KAHC",
    courtSlug: "karnataka",
    courtName: "High Court of Karnataka",
    stateCode: "KA",
    hcNjdgStateValue: "29~3",
  }),
  MPHC: buildHighCourtProfile({
    courtCode: "MPHC",
    courtSlug: "madhya-pradesh",
    courtName: "High Court of Madhya Pradesh",
    stateCode: "MP",
    hcNjdgStateValue: "23~23",
  }),
  MNHC: buildHighCourtProfile({
    courtCode: "MNHC",
    courtSlug: "manipur",
    courtName: "High Court of Manipur",
    stateCode: "MN",
    hcNjdgStateValue: "14~25",
  }),
  MLHC: buildHighCourtProfile({
    courtCode: "MLHC",
    courtSlug: "meghalaya",
    courtName: "High Court of Meghalaya",
    stateCode: "ML",
    hcNjdgStateValue: "17~21",
  }),
  ODHC: buildHighCourtProfile({
    courtCode: "ODHC",
    courtSlug: "odisha",
    courtName: "High Court of Orissa",
    stateCode: "OD",
    hcNjdgStateValue: "21~11",
  }),
  RJHC: buildHighCourtProfile({
    courtCode: "RJHC",
    courtSlug: "rajasthan",
    courtName: "High Court of Rajasthan",
    stateCode: "RJ",
    hcNjdgStateValue: "8~9",
  }),
  SKHC: buildHighCourtProfile({
    courtCode: "SKHC",
    courtSlug: "sikkim",
    courtName: "High Court of Sikkim",
    stateCode: "SK",
    hcNjdgStateValue: "11~24",
  }),
  TRHC: buildHighCourtProfile({
    courtCode: "TRHC",
    courtSlug: "tripura",
    courtName: "High Court of Tripura",
    stateCode: "TR",
    hcNjdgStateValue: "16~20",
  }),
  UKHC: buildHighCourtProfile({
    courtCode: "UKHC",
    courtSlug: "uttarakhand",
    courtName: "High Court of Uttarakhand",
    stateCode: "UK",
    hcNjdgStateValue: "5~15",
  }),
  BRHC: buildHighCourtProfile({
    courtCode: "BRHC",
    courtSlug: "bihar",
    courtName: "Patna High Court",
    stateCode: "BR",
    hcNjdgStateValue: "10~8",
  }),
  UPHC: buildHighCourtProfile({
    courtCode: "UPHC",
    courtSlug: "uttar-pradesh",
    courtName: "Allahabad High Court",
    stateCode: "UP",
    hcNjdgStateValue: "9~13",
  }),
};

export function getHighCourtProfile(courtCode: SupportedHighCourtCode): HighCourtProfile {
  return HIGH_COURT_PROFILES[courtCode];
}

export function listHighCourtProfiles(): HighCourtProfile[] {
  return [...SUPPORTED_HIGH_COURT_CODES].map((courtCode) => HIGH_COURT_PROFILES[courtCode]);
}

export function listPublicHighCourtProfiles(): HighCourtProfile[] {
  return listHighCourtProfiles().filter((profile) => profile.publicBeta);
}

export function getHighCourtProfileBySlug(courtSlug: string): HighCourtProfile | null {
  const normalized = courtSlug.trim().toLowerCase();
  return listHighCourtProfiles().find((profile) => profile.courtSlug === normalized) ?? null;
}

export function getPublicHighCourtProfileBySlug(courtSlug: string): HighCourtProfile | null {
  const profile = getHighCourtProfileBySlug(courtSlug);
  return profile?.publicBeta ? profile : null;
}

function buildHighCourtProfile(input: {
  courtCode: SupportedHighCourtCode;
  courtSlug: string;
  courtName: string;
  stateCode: SupportedStateCode;
  hcNjdgStateValue: string;
  publicBeta?: boolean;
  sourceReviewStatus?: HighCourtSourceReviewStatus;
  sourceUrls?: HighCourtSourceUrls;
}): HighCourtProfile {
  return {
    courtCode: input.courtCode,
    courtSlug: input.courtSlug,
    courtName: input.courtName,
    stateCode: input.stateCode,
    stateName: getStateProfile(input.stateCode).stateName,
    hcNjdgStateValue: input.hcNjdgStateValue,
    publicBeta: input.publicBeta ?? false,
    sourceReviewStatus: input.sourceReviewStatus ?? "queued",
    sourceUrls: input.sourceUrls ?? HIGH_COURT_SOURCE_BASE,
  };
}

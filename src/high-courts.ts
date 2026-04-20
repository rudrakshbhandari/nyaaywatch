import {
  buildStateCourtGeography,
  getStateProfile,
  type CourtGeography,
  type SupportedStateCode,
} from "./geographies.js";

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
  hcNjdgStateValue: string;
  coveredGeographies: CourtGeography[];
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
    hcNjdgStateValue: "2~5",
    coveredGeographies: [buildStateCourtGeography("HP")],
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
    hcNjdgStateValue: "28~2",
    coveredGeographies: [buildStateCourtGeography("AP")],
    publicBeta: true,
    sourceReviewStatus: "reviewed",
    sourceUrls: {
      ...HIGH_COURT_SOURCE_BASE,
      officialSite: "https://aphc.gov.in/",
    },
  }),
  TSHC: buildHighCourtProfile({
    courtCode: "TSHC",
    courtSlug: "telangana",
    courtName: "High Court for State of Telangana",
    hcNjdgStateValue: "36~29",
    coveredGeographies: [buildStateCourtGeography("TS")],
    publicBeta: true,
    sourceReviewStatus: "reviewed",
    sourceUrls: {
      ...HIGH_COURT_SOURCE_BASE,
      officialSite: "https://tshc.gov.in/",
    },
  }),
  CGHC: buildHighCourtProfile({
    courtCode: "CGHC",
    courtSlug: "chhattisgarh",
    courtName: "High Court of Chhattisgarh",
    hcNjdgStateValue: "22~18",
    coveredGeographies: [buildStateCourtGeography("CG")],
  }),
  GJHC: buildHighCourtProfile({
    courtCode: "GJHC",
    courtSlug: "gujarat",
    courtName: "High Court of Gujarat",
    hcNjdgStateValue: "24~17",
    coveredGeographies: [buildStateCourtGeography("GJ")],
    publicBeta: true,
    sourceReviewStatus: "reviewed",
    sourceUrls: {
      ...HIGH_COURT_SOURCE_BASE,
      officialSite: "https://gujarathighcourt.nic.in/",
    },
  }),
  JHHC: buildHighCourtProfile({
    courtCode: "JHHC",
    courtSlug: "jharkhand",
    courtName: "High Court of Jharkhand",
    hcNjdgStateValue: "20~7",
    coveredGeographies: [buildStateCourtGeography("JH")],
  }),
  KAHC: buildHighCourtProfile({
    courtCode: "KAHC",
    courtSlug: "karnataka",
    courtName: "High Court of Karnataka",
    hcNjdgStateValue: "29~3",
    coveredGeographies: [buildStateCourtGeography("KA")],
  }),
  MPHC: buildHighCourtProfile({
    courtCode: "MPHC",
    courtSlug: "madhya-pradesh",
    courtName: "High Court of Madhya Pradesh",
    hcNjdgStateValue: "23~23",
    coveredGeographies: [buildStateCourtGeography("MP")],
    publicBeta: true,
    sourceReviewStatus: "reviewed",
    sourceUrls: {
      ...HIGH_COURT_SOURCE_BASE,
      officialSite: "https://mphc.gov.in/",
    },
  }),
  MNHC: buildHighCourtProfile({
    courtCode: "MNHC",
    courtSlug: "manipur",
    courtName: "High Court of Manipur",
    hcNjdgStateValue: "14~25",
    coveredGeographies: [buildStateCourtGeography("MN")],
  }),
  MLHC: buildHighCourtProfile({
    courtCode: "MLHC",
    courtSlug: "meghalaya",
    courtName: "High Court of Meghalaya",
    hcNjdgStateValue: "17~21",
    coveredGeographies: [buildStateCourtGeography("ML")],
  }),
  ODHC: buildHighCourtProfile({
    courtCode: "ODHC",
    courtSlug: "odisha",
    courtName: "High Court of Orissa",
    hcNjdgStateValue: "21~11",
    coveredGeographies: [buildStateCourtGeography("OD")],
  }),
  RJHC: buildHighCourtProfile({
    courtCode: "RJHC",
    courtSlug: "rajasthan",
    courtName: "High Court of Rajasthan",
    hcNjdgStateValue: "8~9",
    coveredGeographies: [buildStateCourtGeography("RJ")],
    publicBeta: true,
    sourceReviewStatus: "reviewed",
    sourceUrls: {
      ...HIGH_COURT_SOURCE_BASE,
      officialSite: "https://hcraj.nic.in/",
    },
  }),
  SKHC: buildHighCourtProfile({
    courtCode: "SKHC",
    courtSlug: "sikkim",
    courtName: "High Court of Sikkim",
    hcNjdgStateValue: "11~24",
    coveredGeographies: [buildStateCourtGeography("SK")],
  }),
  TRHC: buildHighCourtProfile({
    courtCode: "TRHC",
    courtSlug: "tripura",
    courtName: "High Court of Tripura",
    hcNjdgStateValue: "16~20",
    coveredGeographies: [buildStateCourtGeography("TR")],
  }),
  UKHC: buildHighCourtProfile({
    courtCode: "UKHC",
    courtSlug: "uttarakhand",
    courtName: "High Court of Uttarakhand",
    hcNjdgStateValue: "5~15",
    coveredGeographies: [buildStateCourtGeography("UK")],
  }),
  BRHC: buildHighCourtProfile({
    courtCode: "BRHC",
    courtSlug: "bihar",
    courtName: "Patna High Court",
    hcNjdgStateValue: "10~8",
    coveredGeographies: [buildStateCourtGeography("BR")],
  }),
  UPHC: buildHighCourtProfile({
    courtCode: "UPHC",
    courtSlug: "uttar-pradesh",
    courtName: "Allahabad High Court",
    hcNjdgStateValue: "9~13",
    coveredGeographies: [buildStateCourtGeography("UP")],
    publicBeta: true,
    sourceReviewStatus: "reviewed",
    sourceUrls: {
      ...HIGH_COURT_SOURCE_BASE,
      officialSite: "https://www.allahabadhighcourt.in/",
    },
  }),
};

export function getHighCourtProfile(courtCode: SupportedHighCourtCode): HighCourtProfile {
  return HIGH_COURT_PROFILES[courtCode];
}

export function getHighCourtProfileByCode(courtCode: string): HighCourtProfile | null {
  const normalized = courtCode.trim().toUpperCase();
  return normalized in HIGH_COURT_PROFILES ? HIGH_COURT_PROFILES[normalized as SupportedHighCourtCode] : null;
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
  hcNjdgStateValue: string;
  coveredGeographies: CourtGeography[];
  publicBeta?: boolean;
  sourceReviewStatus?: HighCourtSourceReviewStatus;
  sourceUrls?: HighCourtSourceUrls;
}): HighCourtProfile {
  if (input.coveredGeographies.length === 0) {
    throw new Error(`High Court ${input.courtCode} must define at least one covered geography.`);
  }

  return {
    courtCode: input.courtCode,
    courtSlug: input.courtSlug,
    courtName: input.courtName,
    hcNjdgStateValue: input.hcNjdgStateValue,
    coveredGeographies: input.coveredGeographies,
    publicBeta: input.publicBeta ?? false,
    sourceReviewStatus: input.sourceReviewStatus ?? "queued",
    sourceUrls: input.sourceUrls ?? HIGH_COURT_SOURCE_BASE,
  };
}

export function getPrimaryHighCourtGeography(profile: HighCourtProfile): CourtGeography {
  return profile.coveredGeographies[0]!;
}

export function getPrimaryHighCourtStateCode(profile: HighCourtProfile): SupportedStateCode | null {
  return getPrimaryHighCourtGeography(profile).lowerCourtStateCode ?? null;
}

export function getPrimaryHighCourtStateName(profile: HighCourtProfile): string | null {
  const stateCode = getPrimaryHighCourtStateCode(profile);
  return stateCode ? getStateProfile(stateCode).stateName : null;
}

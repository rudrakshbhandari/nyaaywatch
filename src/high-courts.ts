import { getStateProfile, type SupportedStateCode } from "./geographies.js";

export interface HighCourtSourceUrls {
  hcNjdg: string;
  hcServices: string;
  officialSite: string;
  sitemap: string;
  annualReport2023_24: string;
}

export interface HighCourtProfile {
  courtCode: SupportedHighCourtCode;
  courtSlug: string;
  courtName: string;
  stateCode: SupportedStateCode;
  stateName: string;
  publicBeta: boolean;
  sourceUrls: HighCourtSourceUrls;
}

export const SUPPORTED_HIGH_COURT_CODES = ["HPHC"] as const;

export type SupportedHighCourtCode = (typeof SUPPORTED_HIGH_COURT_CODES)[number];

const HIGH_COURT_PROFILES: Record<SupportedHighCourtCode, HighCourtProfile> = {
  HPHC: {
    courtCode: "HPHC",
    courtSlug: "himachal",
    courtName: "High Court of Himachal Pradesh",
    stateCode: "HP",
    stateName: getStateProfile("HP").stateName,
    publicBeta: false,
    sourceUrls: {
      hcNjdg: "https://njdg.ecourts.gov.in/hcnjdg_v2/",
      hcServices: "https://hcservices.ecourts.gov.in/hcservices/main.php",
      officialSite: "https://hphighcourt.nic.in/",
      sitemap: "https://hphighcourt.nic.in/sitemap.html",
      annualReport2023_24: "https://hphighcourt.nic.in/pdf/AnnualReport23092024.pdf",
    },
  },
};

export function getHighCourtProfile(courtCode: SupportedHighCourtCode): HighCourtProfile {
  return HIGH_COURT_PROFILES[courtCode];
}

export function listHighCourtProfiles(): HighCourtProfile[] {
  return [...SUPPORTED_HIGH_COURT_CODES].map((courtCode) => HIGH_COURT_PROFILES[courtCode]);
}

export function getHighCourtProfileBySlug(courtSlug: string): HighCourtProfile | null {
  const normalized = courtSlug.trim().toLowerCase();
  return listHighCourtProfiles().find((profile) => profile.courtSlug === normalized) ?? null;
}

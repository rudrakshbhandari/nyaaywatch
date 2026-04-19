export interface SupremeCourtSourceUrls {
  scNjdg: string;
  officialSite: string;
  onboardingNote: string;
  njdgManual: string;
  faq: string;
  ecommitteeNjdg: string;
}

export type SupremeCourtSourceReviewStatus = "reviewed" | "queued";

export interface SupremeCourtProfile {
  courtCode: "SCI";
  courtSlug: "supreme-court";
  courtName: "Supreme Court of India";
  publicBeta: boolean;
  sourceReviewStatus: SupremeCourtSourceReviewStatus;
  sourceUrls: SupremeCourtSourceUrls;
}

const SUPREME_COURT_PROFILE: SupremeCourtProfile = {
  courtCode: "SCI",
  courtSlug: "supreme-court",
  courtName: "Supreme Court of India",
  publicBeta: false,
  sourceReviewStatus: "reviewed",
  sourceUrls: {
    scNjdg: "https://scdg.sci.gov.in/scnjdg/",
    officialSite: "https://www.sci.gov.in/",
    onboardingNote: "https://www.sci.gov.in/onboarding-of-supreme-court-of-india-on-njdg/",
    njdgManual:
      "https://cdnbbsr.s3waas.gov.in/s388ef51f0bf911e452e8dbb1d807a81ab/uploads/2025/05/20250530524370674.pdf",
    faq: "https://www.sci.gov.in/faq-ready-reckoner-tips-for-obtaining-information-relating-to-supreme-court/",
    ecommitteeNjdg: "https://ecommitteesci.gov.in/service/national-judicial-data-grid/",
  },
};

export function getSupremeCourtProfile(): SupremeCourtProfile {
  return SUPREME_COURT_PROFILE;
}

import { listHighCourtProfiles, type HighCourtProfile } from "../high-courts.js";
import { getSupremeCourtProfile, type SupremeCourtProfile } from "../supreme-court.js";

export function listReviewedHighCourtProfilesForScheduledFetch(): HighCourtProfile[] {
  return listHighCourtProfiles().filter((profile) => profile.sourceReviewStatus === "reviewed");
}

export function getReviewedSupremeCourtProfileForScheduledFetch(): SupremeCourtProfile {
  const profile = getSupremeCourtProfile();
  if (profile.sourceReviewStatus !== "reviewed") {
    throw new Error("Supreme Court scheduled fetch is only allowed when the source review status is reviewed.");
  }

  return profile;
}

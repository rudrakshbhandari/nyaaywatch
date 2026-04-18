import type { HighCourtProfile } from "../high-courts.js";

export interface PublicHighCourtRoutes {
  index: string;
  home: string;
  methodology: string;
  api: string;
  data: string;
  statsApi: string;
  trendsApi: string;
}

export function buildPublicHighCourtRoutes(profile: HighCourtProfile): PublicHighCourtRoutes {
  const htmlBase = `/high-courts/${profile.courtSlug}`;

  return {
    index: "/high-courts",
    home: htmlBase,
    methodology: `${htmlBase}/methodology`,
    api: `${htmlBase}/api`,
    data: `${htmlBase}/data`,
    statsApi: `/v1/high-courts/${profile.courtSlug}/stats`,
    trendsApi: `/v1/high-courts/${profile.courtSlug}/trends`,
  };
}

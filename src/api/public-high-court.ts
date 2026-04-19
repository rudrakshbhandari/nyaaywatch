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

export interface PublicHighCourtLink {
  label: string;
  href: string;
  active: boolean;
}

export interface PublicHighCourtPageContext {
  profile: HighCourtProfile;
  routes: PublicHighCourtRoutes;
  navLinks: Array<{
    id: "home" | "data" | "methodology" | "api";
    href: string;
    label: string;
  }>;
  highCourtLinks: PublicHighCourtLink[];
  brandHref: string;
  brandTag: string;
  publicScopeDescription: string;
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

export function buildPublicHighCourtPageContext(
  currentProfile: HighCourtProfile,
  availableProfiles: HighCourtProfile[],
): PublicHighCourtPageContext {
  const routes = buildPublicHighCourtRoutes(currentProfile);
  const visibleProfiles = availableProfiles.length > 0 ? availableProfiles : [currentProfile];

  return {
    profile: currentProfile,
    routes,
    navLinks: [
      { id: "home", href: routes.home, label: "Overview" },
      { id: "data", href: routes.data, label: "Data" },
      { id: "methodology", href: routes.methodology, label: "Method" },
      { id: "api", href: routes.api, label: "API" },
    ],
    highCourtLinks: visibleProfiles.map((profile) => ({
      label: profile.courtName,
      href: buildPublicHighCourtRoutes(profile).home,
      active: profile.courtCode === currentProfile.courtCode,
    })),
    brandHref: routes.home,
    brandTag: `${currentProfile.courtName} observability`,
    publicScopeDescription: buildPublicScopeDescription(currentProfile, visibleProfiles),
  };
}

function buildPublicScopeDescription(currentProfile: HighCourtProfile, visibleProfiles: HighCourtProfile[]) {
  const otherCourtCount = Math.max(visibleProfiles.length - 1, 0);

  if (otherCourtCount === 0) {
    return `The public High Court beta currently covers ${currentProfile.courtName} only.`;
  }

  return `This page covers ${currentProfile.courtName}. ${otherCourtCount} other public High Court page${
    otherCourtCount === 1 ? " is" : "s are"
  } linked in the switcher.`;
}

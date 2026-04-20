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
  coverageLabel: string;
  coverageSentence: string;
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
    coverageLabel: formatHighCourtCoverageLabel(currentProfile),
    coverageSentence: buildHighCourtCoverageSentence(currentProfile),
    publicScopeDescription: buildPublicScopeDescription(currentProfile, visibleProfiles),
  };
}

function buildPublicScopeDescription(currentProfile: HighCourtProfile, visibleProfiles: HighCourtProfile[]) {
  const otherCourtCount = Math.max(visibleProfiles.length - 1, 0);
  const coverageSentence = buildHighCourtCoverageSentence(currentProfile);

  if (otherCourtCount === 0) {
    return `${coverageSentence} It is the only public High Court page in this runtime.`;
  }

  return `${coverageSentence} ${otherCourtCount} other public High Court page${
    otherCourtCount === 1 ? " is" : "s are"
  } linked in the switcher.`;
}

export function formatHighCourtCoverageLabel(profile: HighCourtProfile): string {
  return formatHumanList(profile.coveredGeographies.map((geography) => geography.geographyName));
}

export function buildHighCourtCoverageSentence(profile: HighCourtProfile): string {
  return `This page tracks ${profile.courtName} across ${formatHighCourtCoverageLabel(profile)}.`;
}

function formatHumanList(items: string[]): string {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0]!;
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

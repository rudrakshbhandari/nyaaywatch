import type { NjdgStateProfile } from "../geographies.js";

export interface PublicStateRoutes {
  home: string;
  districts: string;
  district: (districtId: string) => string;
  data: string;
  districtsCsv: string;
  districtCsv: (districtId: string) => string;
  methodology: string;
  api: string;
  statsApi: string;
  districtsApi: string;
  trendsApi: string;
}

export interface PublicStateLink {
  label: string;
  href: string;
  active: boolean;
}

export interface PublicPageContext {
  profile: NjdgStateProfile;
  routes: PublicStateRoutes;
  navLinks: Array<{
    id: "districts" | "data" | "methodology" | "api";
    href: string;
    label: string;
  }>;
  stateLinks: PublicStateLink[];
  brandHref: string;
  brandTag: string;
  publicScopeDescription: string;
}

const DEFAULT_PUBLIC_STATE_CODE = "HP";

export function buildPublicPageContext(
  currentProfile: NjdgStateProfile,
  availableProfiles: NjdgStateProfile[],
): PublicPageContext {
  const routes = buildPublicStateRoutes(currentProfile);
  const visibleProfiles = availableProfiles.length > 0 ? availableProfiles : [currentProfile];

  return {
    profile: currentProfile,
    routes,
    navLinks: [
      { id: "districts", href: routes.districts, label: "Districts" },
      { id: "data", href: routes.data, label: "Data" },
      { id: "methodology", href: routes.methodology, label: "Method" },
      { id: "api", href: routes.api, label: "API" },
    ],
    stateLinks: visibleProfiles.map((profile) => ({
      label: profile.stateName,
      href: buildPublicStateRoutes(profile).home,
      active: profile.stateCode === currentProfile.stateCode,
    })),
    brandHref: routes.home,
    brandTag: `Court transparency, ${currentProfile.stateName}`,
    publicScopeDescription: buildPublicScopeDescription(currentProfile, visibleProfiles),
  };
}

export function buildPublicStateRoutes(profile: NjdgStateProfile): PublicStateRoutes {
  const htmlBase = isDefaultPublicState(profile) ? "" : `/states/${profile.stateSlug}`;
  const home = isDefaultPublicState(profile) ? "/states/himachal" : `/states/${profile.stateSlug}`;
  const apiBase = isDefaultPublicState(profile)
    ? {
        stats: "/v1/stats/himachal",
        districts: "/v1/districts",
        trends: "/v1/trends",
      }
    : {
        stats: `/v1/states/${profile.stateSlug}/stats`,
        districts: `/v1/states/${profile.stateSlug}/districts`,
        trends: `/v1/states/${profile.stateSlug}/trends`,
      };

  return {
    home,
    districts: htmlBase ? `${htmlBase}/districts` : "/districts",
    district: (districtId) => `${htmlBase ? `${htmlBase}/districts` : "/districts"}/${districtId}`,
    data: htmlBase ? `${htmlBase}/data` : "/data",
    districtsCsv: htmlBase ? `${htmlBase}/data/districts.csv` : "/data/districts.csv",
    districtCsv: (districtId) =>
      `${htmlBase ? `${htmlBase}/data/districts` : "/data/districts"}/${districtId}.csv`,
    methodology: htmlBase ? `${htmlBase}/methodology` : "/methodology",
    api: htmlBase ? `${htmlBase}/api` : "/api",
    statsApi: apiBase.stats,
    districtsApi: apiBase.districts,
    trendsApi: apiBase.trends,
  };
}

function isDefaultPublicState(profile: NjdgStateProfile) {
  return profile.stateCode === DEFAULT_PUBLIC_STATE_CODE;
}

function buildPublicScopeDescription(
  currentProfile: NjdgStateProfile,
  visibleProfiles: NjdgStateProfile[],
): string {
  const otherStateCount = Math.max(visibleProfiles.length - 1, 0);
  const otherStatePages = `${otherStateCount} other approved state page${otherStateCount === 1 ? "" : "s"}`;

  if (isDefaultPublicState(currentProfile)) {
    if (otherStateCount === 0) {
      return "This page covers Himachal Pradesh. The national homepage lives at /, and the lower-court shortcuts stay available on the unscoped district, data, methodology, and API routes.";
    }

    return `This page covers Himachal Pradesh. The national homepage lives at /, and the switcher links ${otherStatePages}.`;
  }

  if (otherStateCount === 0) {
    return `This page covers ${currentProfile.stateName}. The national homepage lives at /.`;
  }

  return `This page covers ${currentProfile.stateName}. The national homepage lives at /, and the switcher links ${otherStatePages}.`;
}

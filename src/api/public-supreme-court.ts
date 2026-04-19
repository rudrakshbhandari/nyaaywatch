import type { SupremeCourtProfile } from "../supreme-court.js";

export interface PublicSupremeCourtRoutes {
  home: string;
  methodology: string;
  api: string;
  data: string;
  statsApi: string;
  trendsApi: string;
}

export interface PublicSupremeCourtPageContext {
  profile: SupremeCourtProfile;
  routes: PublicSupremeCourtRoutes;
  navLinks: Array<{
    id: "home" | "data" | "methodology" | "api";
    href: string;
    label: string;
  }>;
  brandHref: string;
  brandTag: string;
}

export function buildPublicSupremeCourtRoutes(): PublicSupremeCourtRoutes {
  return {
    home: "/supreme-court",
    methodology: "/supreme-court/methodology",
    api: "/supreme-court/api",
    data: "/supreme-court/data",
    statsApi: "/v1/supreme-court/stats",
    trendsApi: "/v1/supreme-court/trends",
  };
}

export function buildPublicSupremeCourtPageContext(profile: SupremeCourtProfile): PublicSupremeCourtPageContext {
  const routes = buildPublicSupremeCourtRoutes();

  return {
    profile,
    routes,
    navLinks: [
      { id: "home", href: routes.home, label: "Overview" },
      { id: "data", href: routes.data, label: "Data" },
      { id: "methodology", href: routes.methodology, label: "Method" },
      { id: "api", href: routes.api, label: "API" },
    ],
    brandHref: routes.home,
    brandTag: "Supreme Court observability",
  };
}

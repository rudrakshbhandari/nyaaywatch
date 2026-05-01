import express, { type NextFunction, type Request, type Response } from "express";
import type { Pool } from "pg";
import { registerOgRoutes } from "./share/og-routes.js";

import type { AppConfig } from "../config/env.js";
import type { SupportedStateCode, NjdgStateProfile } from "../geographies.js";
import { getPublicStateProfileBySlug, getStateProfile, getStateProfileByCodeOrSlug, listPublicStateProfiles } from "../geographies.js";
import {
  getHighCourtProfileBySlug,
  getPublicHighCourtProfileBySlug,
  listHighCourtProfiles,
  listPublicHighCourtProfiles,
  type HighCourtProfile,
  type SupportedHighCourtCode,
} from "../high-courts.js";
import { logError, logInfo } from "../lib/logger.js";
import { renderHome } from "./home/home.js";
import { renderNationalHome } from "./home/national-home.js";
import { renderApiPage } from "./pages/api.js";
import { renderDataPage } from "./pages/data.js";
import { renderDistrictPage } from "./pages/district-detail.js";
import { renderDistrictsPage } from "./pages/districts.js";
import { renderEmptyState } from "./pages/empty.js";
import { renderHighCourtApiPage } from "./pages/high-court-api.js";
import { renderHighCourtDataPage } from "./pages/high-court-data.js";
import { renderHighCourtMethodologyPage } from "./pages/high-court-methodology.js";
import { renderHighCourtOverviewPage } from "./pages/high-court-overview.js";
import { renderHighCourtsIndexPage } from "./pages/high-courts-index.js";
import { renderLearnPage } from "./pages/learn.js";
import { renderMethodologyPage } from "./pages/methodology.js";
import { renderPressPage } from "./pages/press.js";
import { renderComparePage, renderCompareNotFound } from "./pages/compare.js";
import { renderMoversPage, renderMoversUnavailable } from "./pages/movers.js";
import { renderDistrictEmbedWidget, renderStateEmbedWidget } from "./pages/embed.js";
import { buildDistrictEvidencePack, buildStateEvidencePack } from "./evidence-packs.js";
import { buildViewModel } from "./home/view-model.js";
import { renderSupremeCourtApiPage } from "./pages/supreme-court-api.js";
import { renderSupremeCourtDataPage } from "./pages/supreme-court-data.js";
import { renderSupremeCourtMethodologyPage } from "./pages/supreme-court-methodology.js";
import { renderSupremeCourtOverviewPage } from "./pages/supreme-court-overview.js";
import { PublishedHighCourtSnapshotService } from "../services/published-high-court-snapshot-service.js";
import { PublishedSupremeCourtSnapshotService } from "../services/published-supreme-court-snapshot-service.js";
import { PublishedSnapshotService } from "../services/published-snapshot-service.js";
import { NewsletterService } from "../services/newsletter-service.js";
import { buildPublicHighCourtPageContext, buildPublicHighCourtRoutes } from "./public-high-court.js";
import { buildPublicSupremeCourtPageContext } from "./public-supreme-court.js";
import { buildPublicPageContext, buildPublicStateRoutes } from "./public-state.js";
import { getSupremeCourtProfile } from "../supreme-court.js";
import { renderRssFeed } from "./pages/rss.js";
import {
  renderSubscribePage,
  renderSubscribeConfirmPending,
  renderSubscribeConfirmed,
  renderSubscribeAlreadyConfirmed,
  renderUnsubscribed,
} from "./pages/subscribe.js";

type PublicServiceMap = Partial<Record<SupportedStateCode, PublishedSnapshotService>>;
type HighCourtServiceMap = Partial<Record<SupportedHighCourtCode, PublishedHighCourtSnapshotService>>;
type SupremeCourtService = PublishedSupremeCourtSnapshotService | undefined;

const DEFAULT_PUBLIC_STATE_CODE: SupportedStateCode = "HP";
const LOWER_COURT_GEOGRAPHY_NOT_FOUND_TITLE = "Lower-Court Geography Not Found";
const LOWER_COURT_GEOGRAPHY_NOT_FOUND_BODY = "This lower-court geography is not available on the public site.";
const LOWER_COURT_GEOGRAPHY_NOT_FOUND_JSON = "Lower-court geography not found.";
const LOWER_COURT_GEOGRAPHY_NOT_FOUND_TEXT = "Lower-court geography not found.";
const LOWER_COURT_GEOGRAPHY_NOT_AVAILABLE_TITLE = "Lower-Court Geography Not Available Yet";
const LOWER_COURT_GEOGRAPHY_NOT_AVAILABLE_BODY = "No published snapshot is available for this lower-court geography yet.";

export function createApp(
  config: AppConfig,
  service: PublishedSnapshotService,
  publicServices: PublicServiceMap = { [config.STATE_CODE]: service },
  highCourtServices: HighCourtServiceMap = {},
  supremeCourtService?: PublishedSupremeCourtSnapshotService,
  pool?: Pool,
) {
  const newsletterService = pool ? new NewsletterService(pool, config) : null;
  const serviceMap = normalizeServiceMap(config, service, publicServices);
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.set("trust proxy", true);
  app.use((request, response, next) => {
    const requestHost = readRequestHost(request);
    if (!shouldRedirectToCanonicalHost(config, requestHost)) {
      next();
      return;
    }

    const protocol = request.get("x-forwarded-proto") ?? request.protocol;
    const queryIndex = request.originalUrl.indexOf("?");
    const path = queryIndex >= 0 ? request.originalUrl.slice(0, queryIndex) : request.originalUrl;
    const query = queryIndex >= 0 ? request.originalUrl.slice(queryIndex) : "";

    response.redirect(301, `${protocol}://${config.CANONICAL_HOST}${path}${query}`);
  });

  app.use((request, response, next) => {
    const startedAt = Date.now();

    response.on("finish", () => {
      if (request.path === "/health") {
        return;
      }

      logInfo("http_request", {
        method: request.method,
        path: redactSensitiveRequestUrl(request.originalUrl),
        statusCode: response.statusCode,
        durationMs: Date.now() - startedAt,
        isOperatorRoute: request.path.startsWith("/operator/"),
      });
    });

    next();
  });

  app.get("/health", (_request, response) => {
    response.json({ ok: true, region: config.AWS_REGION, stateCode: config.STATE_CODE });
  });

  app.get("/robots.txt", (_request, response) => {
    const trainingOnlyBots = [
      "GPTBot",
      "ClaudeBot",
      "anthropic-ai",
      "CCBot",
      "Google-Extended",
      "Applebot-Extended",
      "Meta-ExternalAgent",
      "Meta-ExternalFetcher",
      "FacebookBot",
      "Bytespider",
      "Amazonbot",
      "Diffbot",
      "Omgilibot",
      "Omgili",
      "ImagesiftBot",
      "PetalBot",
      "DataForSeoBot",
      "AwarioRssBot",
      "AwarioSmartBot",
      "magpie-crawler",
      "peer39_crawler",
      "TurnitinBot",
      "cohere-ai",
    ];

    const lines: string[] = [];
    for (const bot of trainingOnlyBots) {
      lines.push(`User-agent: ${bot}`, "Disallow: /", "");
    }
    lines.push("User-agent: *", "Allow: /", "Disallow: /operator/", "");
    lines.push("Sitemap: https://nyaaywatch.in/sitemap.xml", "");

    response.type("text/plain").send(lines.join("\n"));
  });

  app.get(
    "/sitemap.xml",
    asyncRoute(async (_request, response) => {
      const origin = config.CANONICAL_HOST ? `https://${config.CANONICAL_HOST}` : "https://nyaaywatch.in";
      const urls: string[] = [
        origin + "/",
        origin + "/districts",
        origin + "/data",
        origin + "/methodology",
        origin + "/api",
        origin + "/learn",
        origin + "/press",
        origin + "/high-courts",
        origin + "/supreme-court",
      ];

      for (const profile of listPublicStateProfiles()) {
        const routes = buildPublicStateRoutes(profile);
        urls.push(origin + routes.home);
        urls.push(origin + routes.districts);
        urls.push(origin + routes.methodology);
        urls.push(origin + routes.data);
        urls.push(origin + routes.api);
        const svc = serviceMap[profile.stateCode];
        if (svc) {
          const detail = await svc.listDistricts();
          if (detail) {
            for (const d of detail.districts) {
              urls.push(origin + routes.district(d.districtId));
            }
          }
        }
      }

      for (const profile of listPublicHighCourtProfiles()) {
        const routes = buildPublicHighCourtRoutes(profile);
        urls.push(origin + routes.home);
      }

      const xml = [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
        ...urls.map((u) => `  <url><loc>${u}</loc></url>`),
        `</urlset>`,
      ].join("\n");

      response.type("application/xml").send(xml);
    }),
  );

  app.get(
    "/v1/stats/himachal",
    asyncRoute(async (_request, response) => {
      const payload = await getRequiredPublicService(DEFAULT_PUBLIC_STATE_CODE, publicServices).getStats();
      if (!payload) {
        response.status(404).json({ error: "No published snapshot available." });
        return;
      }
      response.json(payload);
    }),
  );

  app.get(
    "/v1/districts",
    asyncRoute(async (_request, response) => {
      const payload = await getRequiredPublicService(DEFAULT_PUBLIC_STATE_CODE, publicServices).listDistricts();
      if (!payload) {
        response.status(404).json({ error: "No published snapshot available." });
        return;
      }
      response.json(payload);
    }),
  );

  app.get(
    "/v1/trends",
    asyncRoute(async (_request, response) => {
      const payload = await getRequiredPublicService(DEFAULT_PUBLIC_STATE_CODE, publicServices).getTrends();
      if (!payload) {
        response.status(404).json({ error: "No published snapshot available." });
        return;
      }
      response.json(payload);
    }),
  );

  app.get(
    "/v1/states/:stateSlug/stats",
    asyncRoute(async (request, response) => {
      const resolved = resolvePublicStateRequest(request, publicServices);
      if (!resolved) {
        response.status(404).json({ error: LOWER_COURT_GEOGRAPHY_NOT_FOUND_JSON });
        return;
      }

      const payload = await resolved.service.getStats();
      if (!payload) {
        response.status(404).json({ error: "No published snapshot available." });
        return;
      }
      response.json(payload);
    }),
  );

  app.get(
    "/v1/states/:stateSlug/districts",
    asyncRoute(async (request, response) => {
      const resolved = resolvePublicStateRequest(request, publicServices);
      if (!resolved) {
        response.status(404).json({ error: LOWER_COURT_GEOGRAPHY_NOT_FOUND_JSON });
        return;
      }

      const payload = await resolved.service.listDistricts();
      if (!payload) {
        response.status(404).json({ error: "No published snapshot available." });
        return;
      }
      response.json(payload);
    }),
  );

  app.get(
    "/v1/states/:stateSlug/trends",
    asyncRoute(async (request, response) => {
      const resolved = resolvePublicStateRequest(request, publicServices);
      if (!resolved) {
        response.status(404).json({ error: LOWER_COURT_GEOGRAPHY_NOT_FOUND_JSON });
        return;
      }

      const payload = await resolved.service.getTrends();
      if (!payload) {
        response.status(404).json({ error: "No published snapshot available." });
        return;
      }
      response.json(payload);
    }),
  );

  app.get(
    "/v1/high-courts/:courtSlug/stats",
    asyncRoute(async (request, response) => {
      const resolved = resolvePublicHighCourtRequest(request, highCourtServices);
      if (!resolved) {
        response.status(404).json({ error: "High Court not found." });
        return;
      }

      const payload = await resolved.service.getStats();
      if (!payload) {
        response.status(404).json({ error: "No published High Court snapshot available." });
        return;
      }

      response.json(payload);
    }),
  );

  app.get(
    "/v1/high-courts/:courtSlug/trends",
    asyncRoute(async (request, response) => {
      const resolved = resolvePublicHighCourtRequest(request, highCourtServices);
      if (!resolved) {
        response.status(404).json({ error: "High Court not found." });
        return;
      }

      const payload = await resolved.service.getTrends();
      if (!payload) {
        response.status(404).json({ error: "No published High Court snapshot available." });
        return;
      }

      response.json(payload);
    }),
  );

  app.get(
    "/v1/supreme-court/stats",
    asyncRoute(async (_request, response) => {
      const resolved = resolvePublicSupremeCourtRequest(supremeCourtService);
      if (!resolved) {
        response.status(404).json({ error: "Supreme Court not found." });
        return;
      }

      const payload = await resolved.service.getStats();
      if (!payload) {
        response.status(404).json({ error: "No published Supreme Court snapshot available." });
        return;
      }

      response.json(payload);
    }),
  );

  app.get(
    "/v1/supreme-court/trends",
    asyncRoute(async (_request, response) => {
      const resolved = resolvePublicSupremeCourtRequest(supremeCourtService);
      if (!resolved) {
        response.status(404).json({ error: "Supreme Court not found." });
        return;
      }

      const payload = await resolved.service.getTrends();
      if (!payload) {
        response.status(404).json({ error: "No published Supreme Court snapshot available." });
        return;
      }

      response.json(payload);
    }),
  );

  app.get(
    "/data/districts.csv",
    asyncRoute(async (_request, response) => {
      applyPublishedDataCacheHeaders(response);
      const csv = await getRequiredPublicService(DEFAULT_PUBLIC_STATE_CODE, publicServices).renderDistrictCsv();
      if (!csv) {
        response.status(404).type("text/plain").send("No published snapshot available.");
        return;
      }

      response.type("text/csv").send(csv);
    }),
  );

  app.get(
    "/data/districts/:districtId.csv",
    asyncRoute(async (request, response) => {
      applyPublishedDataCacheHeaders(response);
      const csv = await getRequiredPublicService(DEFAULT_PUBLIC_STATE_CODE, publicServices).renderDistrictHistoryCsv(
        readRouteParam(request.params.districtId),
      );
      if (!csv) {
        response.status(404).type("text/plain").send("District export not available.");
        return;
      }

      response.type("text/csv").send(csv);
    }),
  );

  app.get(
    "/data/evidence/state.json",
    asyncRoute(async (_request, response) => {
      applyPublishedDataCacheHeaders(response);
      const currentProfile = getStateProfile(DEFAULT_PUBLIC_STATE_CODE);
      const currentService = getRequiredPublicService(currentProfile.stateCode, publicServices);
      const snapshot = await currentService.getPublishedSnapshot();
      if (!snapshot) {
        response.status(404).json({ error: "No published snapshot available." });
        return;
      }

      const context = buildPublicPageContext(currentProfile, await listAvailablePublicProfiles(publicServices, currentProfile));
      response.json(buildStateEvidencePack(snapshot.payload, context));
    }),
  );

  app.get(
    "/data/evidence/districts/:districtId.json",
    asyncRoute(async (request, response) => {
      applyPublishedDataCacheHeaders(response);
      const districtId = readRouteParam(request.params.districtId);
      const currentProfile = getStateProfile(DEFAULT_PUBLIC_STATE_CODE);
      const currentService = getRequiredPublicService(currentProfile.stateCode, publicServices);
      const payload = await currentService.getDistrictDetail(districtId);
      if (!payload) {
        response.status(404).json({ error: "District evidence pack not available." });
        return;
      }

      const context = buildPublicPageContext(currentProfile, await listAvailablePublicProfiles(publicServices, currentProfile));
      response.json(buildDistrictEvidencePack(payload.snapshot, payload.district, payload.history, context));
    }),
  );

  app.get(
    "/",
    asyncRoute(async (_request, response) => {
      const currentProfile = getStateProfile(DEFAULT_PUBLIC_STATE_CODE);
      const currentService = getRequiredPublicService(currentProfile.stateCode, publicServices);
      const snapshot = await currentService.getPublishedSnapshot();
      if (!snapshot) {
        response.status(503).send(renderEmptyState("NyaayWatch", "No published snapshot is available yet."));
        return;
      }

      const stateMapEntries = await listAvailablePublicStateMapEntries(publicServices);
      const availableProfiles = stateMapEntries.map((entry) => entry.profile);
      const supremeCourtSnapshot = await supremeCourtService?.getPublishedSnapshot();
      const highCourtEntries = await listAvailablePublicHighCourtEntries(highCourtServices);

      response.send(
        renderNationalHome({
          supremeCourtSnapshot: supremeCourtSnapshot?.payload ?? null,
          highCourtEntries,
          lowerCourtSnapshot: snapshot.payload,
          lowerCourtContext: buildPublicPageContext(currentProfile, availableProfiles),
          availableStateProfiles: availableProfiles,
          stateMapEntries,
        }),
      );
    }),
  );

  app.get(
    "/districts",
    asyncRoute(async (_request, response) => {
      const currentProfile = getStateProfile(DEFAULT_PUBLIC_STATE_CODE);
      const currentService = getRequiredPublicService(currentProfile.stateCode, publicServices);
      const snapshot = await currentService.getPublishedSnapshot();
      if (!snapshot) {
        response.status(503).send(renderEmptyState("Districts", "No published snapshot is available yet."));
        return;
      }

      response.send(
        renderDistrictsPage(
          snapshot.payload,
          parseDistrictsQuery(_request.query),
          buildPublicPageContext(currentProfile, await listAvailablePublicProfiles(publicServices, currentProfile)),
        ),
      );
    }),
  );

  app.get(
    "/districts/:districtId",
    asyncRoute(async (request, response) => {
      const districtId = readRouteParam(request.params.districtId);
      const currentProfile = getStateProfile(DEFAULT_PUBLIC_STATE_CODE);
      const currentService = getRequiredPublicService(currentProfile.stateCode, publicServices);
      const payload = await currentService.getDistrictDetail(districtId);
      if (!payload) {
        response.status(404).send(renderEmptyState("District Not Found", "This district isn't in the latest data."));
        return;
      }

      response.send(
        renderDistrictPage(
          payload.snapshot,
          payload.district,
          payload.history,
          buildPublicPageContext(currentProfile, await listAvailablePublicProfiles(publicServices, currentProfile)),
        ),
      );
    }),
  );

  // ── Comparator (/compare/:a-vs-:b) ───────────────────────────────────────
  app.get(
    "/compare/:slug",
    asyncRoute(async (request, response) => {
      const slug = readRouteParam(request.params.slug);
      const vsIndex = slug.indexOf("-vs-");
      if (vsIndex === -1) {
        response.status(404).send(renderEmptyState("Comparison Not Found", "Use /compare/district-a-vs-district-b"));
        return;
      }
      const idA = slug.slice(0, vsIndex);
      const idB = slug.slice(vsIndex + 4);
      const currentProfile = getStateProfile(DEFAULT_PUBLIC_STATE_CODE);
      const currentService = getRequiredPublicService(currentProfile.stateCode, publicServices);
      const context = buildPublicPageContext(currentProfile, await listAvailablePublicProfiles(publicServices, currentProfile));
      const snapshot = await currentService.getPublishedSnapshot();
      if (!snapshot) {
        response.status(503).send(renderCompareNotFound(context));
        return;
      }
      const districtA = snapshot.payload.districts.find((d) => d.districtId === idA);
      const districtB = snapshot.payload.districts.find((d) => d.districtId === idB);
      if (!districtA || !districtB) {
        response.status(404).send(renderCompareNotFound(context));
        return;
      }
      response.send(renderComparePage(snapshot.payload, districtA, districtB, context));
    }),
  );

  app.get(
    "/states/:stateSlug/compare/:slug",
    asyncRoute(async (request, response) => {
      const slug = readRouteParam(request.params.slug);
      const vsIndex = slug.indexOf("-vs-");
      const resolved = resolvePublicStateRequest(request, publicServices);
      if (!resolved) {
        response.status(404).send(renderEmptyState(LOWER_COURT_GEOGRAPHY_NOT_FOUND_TITLE, LOWER_COURT_GEOGRAPHY_NOT_FOUND_BODY));
        return;
      }

      const context = buildPublicPageContext(resolved.profile, await listAvailablePublicProfiles(publicServices, resolved.profile));
      if (vsIndex === -1) {
        response.status(404).send(renderEmptyState("Comparison Not Found", `Use ${context.routes.compare("district-a", "district-b")}`));
        return;
      }

      const snapshot = await resolved.service.getPublishedSnapshot();
      if (!snapshot) {
        response.status(503).send(renderCompareNotFound(context));
        return;
      }

      const idA = slug.slice(0, vsIndex);
      const idB = slug.slice(vsIndex + 4);
      const districtA = snapshot.payload.districts.find((d) => d.districtId === idA);
      const districtB = snapshot.payload.districts.find((d) => d.districtId === idB);
      if (!districtA || !districtB) {
        response.status(404).send(renderCompareNotFound(context));
        return;
      }

      response.send(renderComparePage(snapshot.payload, districtA, districtB, context));
    }),
  );

  // ── Movers (/movers) ──────────────────────────────────────────────────────
  app.get(
    "/movers",
    asyncRoute(async (_request, response) => {
      const currentProfile = getStateProfile(DEFAULT_PUBLIC_STATE_CODE);
      const currentService = getRequiredPublicService(currentProfile.stateCode, publicServices);
      const context = buildPublicPageContext(currentProfile, await listAvailablePublicProfiles(publicServices, currentProfile));
      const result = await currentService.listMovers();
      if (!result) {
        response.send(renderMoversUnavailable(context));
        return;
      }
      response.send(renderMoversPage(result, context));
    }),
  );

  // State-scoped movers
  app.get(
    "/states/:stateSlug/movers",
    asyncRoute(async (request, response) => {
      const resolved = resolvePublicStateRequest(request, publicServices);
      if (!resolved) {
        response.status(404).send(renderEmptyState(LOWER_COURT_GEOGRAPHY_NOT_FOUND_TITLE, LOWER_COURT_GEOGRAPHY_NOT_FOUND_BODY));
        return;
      }
      const context = buildPublicPageContext(resolved.profile, await listAvailablePublicProfiles(publicServices, resolved.profile));
      const result = await resolved.service.listMovers();
      if (!result) {
        response.send(renderMoversUnavailable(context));
        return;
      }
      response.send(renderMoversPage(result, context));
    }),
  );

  // ── Embed widgets (/embed/district/:id, /embed/state/:slug) ───────────────
  app.get(
    "/embed/district/:districtId",
    asyncRoute(async (request, response) => {
      const districtId = readRouteParam(request.params.districtId);
      const currentProfile = getStateProfile(DEFAULT_PUBLIC_STATE_CODE);
      const currentService = getRequiredPublicService(currentProfile.stateCode, publicServices);
      const context = buildPublicPageContext(currentProfile, await listAvailablePublicProfiles(publicServices, currentProfile));
      const detail = await currentService.getDistrictDetail(districtId);
      if (!detail) {
        response.status(404).end();
        return;
      }
      response.removeHeader("X-Frame-Options");
      response.setHeader("Content-Security-Policy", "frame-ancestors *");
      response.send(renderDistrictEmbedWidget(detail.snapshot, detail.district, context.routes.district(districtId)));
    }),
  );

  app.get(
    "/embed/state/:stateSlug",
    asyncRoute(async (request, response) => {
      const resolved = resolvePublicStateRequest(request, publicServices);
      if (!resolved) { response.status(404).end(); return; }
      const record = await resolved.service.getPublishedSnapshot();
      if (!record) { response.status(404).end(); return; }
      const model = buildViewModel(record.payload);
      const routes = buildPublicStateRoutes(resolved.profile);
      response.removeHeader("X-Frame-Options");
      response.setHeader("Content-Security-Policy", "frame-ancestors *");
      response.send(renderStateEmbedWidget(record.payload.snapshot, model, routes.home));
    }),
  );

  app.get(
    "/data",
    asyncRoute(async (_request, response) => {
      applyPublishedDataCacheHeaders(response);
      const currentProfile = getStateProfile(DEFAULT_PUBLIC_STATE_CODE);
      const currentService = getRequiredPublicService(currentProfile.stateCode, publicServices);
      const snapshot = await currentService.getPublishedSnapshot();
      if (!snapshot) {
        response.status(503).send(renderEmptyState("Data Downloads", "No published snapshot is available yet."));
        return;
      }

      response.send(
        renderDataPage(
          snapshot.payload,
          buildPublicPageContext(currentProfile, await listAvailablePublicProfiles(publicServices, currentProfile)),
        ),
      );
    }),
  );

  app.get(
    "/methodology",
    asyncRoute(async (_request, response) => {
      const currentProfile = getStateProfile(DEFAULT_PUBLIC_STATE_CODE);
      const currentService = getRequiredPublicService(currentProfile.stateCode, publicServices);
      const snapshot = await currentService.getPublishedSnapshot();
      const history = await currentService.listPublicationHistory();
      response.send(
        renderMethodologyPage(
          snapshot?.payload.snapshot ?? null,
          history,
          buildPublicPageContext(currentProfile, await listAvailablePublicProfiles(publicServices, currentProfile)),
        ),
      );
    }),
  );

  app.get(
    "/api",
    asyncRoute(async (_request, response) => {
      const currentProfile = getStateProfile(DEFAULT_PUBLIC_STATE_CODE);
      response.send(
        renderApiPage(
          buildPublicPageContext(currentProfile, await listAvailablePublicProfiles(publicServices, currentProfile)),
        ),
      );
    }),
  );

  app.get("/press", (_request, response) => {
    response.send(renderPressPage());
  });

  app.get("/learn", (_request, response) => {
    response.send(renderLearnPage());
  });

  app.get("/press/logo-light.svg", (_request, response) => {
    response.setHeader("Content-Type", "image/svg+xml");
    response.setHeader("Content-Disposition", 'attachment; filename="nyaaywatch-logo-light.svg"');
    response.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 48" width="240" height="48"><rect width="48" height="48" rx="4" fill="#0c0a08"/><text x="24" y="26" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" letter-spacing="-1.2" fill="#f4efe3">NW</text><text x="64" y="26" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900" letter-spacing="-1" fill="#0c0a08">NyaayWatch</text></svg>`);
  });

  app.get("/press/logo-dark.svg", (_request, response) => {
    response.setHeader("Content-Type", "image/svg+xml");
    response.setHeader("Content-Disposition", 'attachment; filename="nyaaywatch-logo-dark.svg"');
    response.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 48" width="240" height="48"><rect width="240" height="48" rx="4" fill="#0c0a08"/><rect x="6" y="6" width="36" height="36" rx="3" fill="#f4efe3"/><text x="24" y="26" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" letter-spacing="-1.2" fill="#0c0a08">NW</text><text x="56" y="26" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900" letter-spacing="-1" fill="#f4efe3">NyaayWatch</text></svg>`);
  });

  app.get(
    "/states/:stateSlug",
    asyncRoute(async (request, response) => {
      const resolved = resolvePublicStateRequest(request, publicServices);
      if (!resolved) {
        response.status(404).send(renderEmptyState(LOWER_COURT_GEOGRAPHY_NOT_FOUND_TITLE, LOWER_COURT_GEOGRAPHY_NOT_FOUND_BODY));
        return;
      }

      const snapshot = await resolved.service.getPublishedSnapshot();
      if (!snapshot) {
        response.status(503).send(renderEmptyState(LOWER_COURT_GEOGRAPHY_NOT_AVAILABLE_TITLE, LOWER_COURT_GEOGRAPHY_NOT_AVAILABLE_BODY));
        return;
      }

      response.send(
        renderHome(
          snapshot.payload,
          buildPublicPageContext(resolved.profile, await listAvailablePublicProfiles(publicServices, resolved.profile)),
        ),
      );
    }),
  );

  app.get(
    "/states/:stateSlug/districts",
    asyncRoute(async (request, response) => {
      const resolved = resolvePublicStateRequest(request, publicServices);
      if (!resolved) {
        response.status(404).send(renderEmptyState(LOWER_COURT_GEOGRAPHY_NOT_FOUND_TITLE, LOWER_COURT_GEOGRAPHY_NOT_FOUND_BODY));
        return;
      }

      const snapshot = await resolved.service.getPublishedSnapshot();
      if (!snapshot) {
        response.status(503).send(renderEmptyState("Districts", "No published snapshot is available yet."));
        return;
      }

      response.send(
        renderDistrictsPage(
          snapshot.payload,
          parseDistrictsQuery(request.query),
          buildPublicPageContext(resolved.profile, await listAvailablePublicProfiles(publicServices, resolved.profile)),
        ),
      );
    }),
  );

  app.get(
    "/states/:stateSlug/districts/:districtId",
    asyncRoute(async (request, response) => {
      const resolved = resolvePublicStateRequest(request, publicServices);
      if (!resolved) {
        response.status(404).send(renderEmptyState(LOWER_COURT_GEOGRAPHY_NOT_FOUND_TITLE, LOWER_COURT_GEOGRAPHY_NOT_FOUND_BODY));
        return;
      }

      const payload = await resolved.service.getDistrictDetail(readRouteParam(request.params.districtId));
      if (!payload) {
        response.status(404).send(renderEmptyState("District Not Found", "This district isn't in the latest data."));
        return;
      }

      response.send(
        renderDistrictPage(
          payload.snapshot,
          payload.district,
          payload.history,
          buildPublicPageContext(resolved.profile, await listAvailablePublicProfiles(publicServices, resolved.profile)),
        ),
      );
    }),
  );

  app.get(
    "/states/:stateSlug/data",
    asyncRoute(async (request, response) => {
      applyPublishedDataCacheHeaders(response);
      const resolved = resolvePublicStateRequest(request, publicServices);
      if (!resolved) {
        response.status(404).send(renderEmptyState(LOWER_COURT_GEOGRAPHY_NOT_FOUND_TITLE, LOWER_COURT_GEOGRAPHY_NOT_FOUND_BODY));
        return;
      }

      const snapshot = await resolved.service.getPublishedSnapshot();
      if (!snapshot) {
        response.status(503).send(renderEmptyState("Data Downloads", "No published snapshot is available yet."));
        return;
      }

      response.send(
        renderDataPage(
          snapshot.payload,
          buildPublicPageContext(resolved.profile, await listAvailablePublicProfiles(publicServices, resolved.profile)),
        ),
      );
    }),
  );

  app.get(
    "/states/:stateSlug/data/districts.csv",
    asyncRoute(async (request, response) => {
      applyPublishedDataCacheHeaders(response);
      const resolved = resolvePublicStateRequest(request, publicServices);
      if (!resolved) {
        response.status(404).type("text/plain").send(LOWER_COURT_GEOGRAPHY_NOT_FOUND_TEXT);
        return;
      }

      const csv = await resolved.service.renderDistrictCsv();
      if (!csv) {
        response.status(404).type("text/plain").send("No published snapshot available.");
        return;
      }

      response.type("text/csv").send(csv);
    }),
  );

  app.get(
    "/states/:stateSlug/data/districts/:districtId.csv",
    asyncRoute(async (request, response) => {
      applyPublishedDataCacheHeaders(response);
      const resolved = resolvePublicStateRequest(request, publicServices);
      if (!resolved) {
        response.status(404).type("text/plain").send(LOWER_COURT_GEOGRAPHY_NOT_FOUND_TEXT);
        return;
      }

      const csv = await resolved.service.renderDistrictHistoryCsv(readRouteParam(request.params.districtId));
      if (!csv) {
        response.status(404).type("text/plain").send("District export not available.");
        return;
      }

      response.type("text/csv").send(csv);
    }),
  );

  app.get(
    "/states/:stateSlug/data/evidence/state.json",
    asyncRoute(async (request, response) => {
      applyPublishedDataCacheHeaders(response);
      const resolved = resolvePublicStateRequest(request, publicServices);
      if (!resolved) {
        response.status(404).json({ error: LOWER_COURT_GEOGRAPHY_NOT_FOUND_JSON });
        return;
      }

      const snapshot = await resolved.service.getPublishedSnapshot();
      if (!snapshot) {
        response.status(404).json({ error: "No published snapshot available." });
        return;
      }

      const context = buildPublicPageContext(resolved.profile, await listAvailablePublicProfiles(publicServices, resolved.profile));
      response.json(buildStateEvidencePack(snapshot.payload, context));
    }),
  );

  app.get(
    "/states/:stateSlug/data/evidence/districts/:districtId.json",
    asyncRoute(async (request, response) => {
      applyPublishedDataCacheHeaders(response);
      const resolved = resolvePublicStateRequest(request, publicServices);
      if (!resolved) {
        response.status(404).json({ error: LOWER_COURT_GEOGRAPHY_NOT_FOUND_JSON });
        return;
      }

      const payload = await resolved.service.getDistrictDetail(readRouteParam(request.params.districtId));
      if (!payload) {
        response.status(404).json({ error: "District evidence pack not available." });
        return;
      }

      const context = buildPublicPageContext(resolved.profile, await listAvailablePublicProfiles(publicServices, resolved.profile));
      response.json(buildDistrictEvidencePack(payload.snapshot, payload.district, payload.history, context));
    }),
  );

  app.get(
    "/states/:stateSlug/methodology",
    asyncRoute(async (request, response) => {
      const resolved = resolvePublicStateRequest(request, publicServices);
      if (!resolved) {
        response.status(404).send(renderEmptyState(LOWER_COURT_GEOGRAPHY_NOT_FOUND_TITLE, LOWER_COURT_GEOGRAPHY_NOT_FOUND_BODY));
        return;
      }

      const snapshot = await resolved.service.getPublishedSnapshot();
      const history = await resolved.service.listPublicationHistory();
      response.send(
        renderMethodologyPage(
          snapshot?.payload.snapshot ?? null,
          history,
          buildPublicPageContext(resolved.profile, await listAvailablePublicProfiles(publicServices, resolved.profile)),
        ),
      );
    }),
  );

  app.get(
    "/states/:stateSlug/api",
    asyncRoute(async (request, response) => {
      const resolved = resolvePublicStateRequest(request, publicServices);
      if (!resolved) {
        response.status(404).send(renderEmptyState(LOWER_COURT_GEOGRAPHY_NOT_FOUND_TITLE, LOWER_COURT_GEOGRAPHY_NOT_FOUND_BODY));
        return;
      }

      response.send(
        renderApiPage(
          buildPublicPageContext(resolved.profile, await listAvailablePublicProfiles(publicServices, resolved.profile)),
        ),
      );
    }),
  );

  app.get(
    "/supreme-court",
    asyncRoute(async (_request, response) => {
      const resolved = resolvePublicSupremeCourtRequest(supremeCourtService);
      if (!resolved) {
        response.status(404).send(renderEmptyState("Supreme Court", "No public Supreme Court page is available yet."));
        return;
      }

      const snapshot = await resolved.service.getPublishedSnapshot();
      if (!snapshot) {
        response.status(503).send(renderEmptyState("Supreme Court Not Available Yet", "No published Supreme Court snapshot is available yet."));
        return;
      }

      response.send(
        renderSupremeCourtOverviewPage(
          resolved.profile,
          snapshot.payload,
          buildPublicSupremeCourtPageContext(resolved.profile),
        ),
      );
    }),
  );

  app.get(
    "/supreme-court/data",
    asyncRoute(async (_request, response) => {
      applyPublishedDataCacheHeaders(response);
      const resolved = resolvePublicSupremeCourtRequest(supremeCourtService);
      if (!resolved) {
        response.status(404).send(renderEmptyState("Supreme Court", "No public Supreme Court page is available yet."));
        return;
      }

      const snapshot = await resolved.service.getPublishedSnapshot();
      if (!snapshot) {
        response.status(503).send(renderEmptyState("Supreme Court Data", "No published Supreme Court snapshot is available yet."));
        return;
      }

      response.send(renderSupremeCourtDataPage(snapshot.payload, buildPublicSupremeCourtPageContext(resolved.profile)));
    }),
  );

  app.get(
    "/supreme-court/methodology",
    asyncRoute(async (_request, response) => {
      const resolved = resolvePublicSupremeCourtRequest(supremeCourtService);
      if (!resolved) {
        response.status(404).send(renderEmptyState("Supreme Court", "No public Supreme Court page is available yet."));
        return;
      }

      const snapshot = await resolved.service.getPublishedSnapshot();
      const history = await resolved.service.listPublicationHistory();
      response.send(
        renderSupremeCourtMethodologyPage(
          snapshot?.payload.snapshot ?? null,
          history,
          buildPublicSupremeCourtPageContext(resolved.profile),
        ),
      );
    }),
  );

  app.get(
    "/supreme-court/api",
    asyncRoute(async (_request, response) => {
      const resolved = resolvePublicSupremeCourtRequest(supremeCourtService);
      if (!resolved) {
        response.status(404).send(renderEmptyState("Supreme Court", "No public Supreme Court page is available yet."));
        return;
      }

      response.send(renderSupremeCourtApiPage(buildPublicSupremeCourtPageContext(resolved.profile)));
    }),
  );

  app.get(
    "/high-courts",
    asyncRoute(async (_request, response) => {
      const available = await listAvailablePublicHighCourtEntries(highCourtServices);
      if (available.length === 0) {
        response.status(404).send(renderEmptyState("High Courts", "No public High Court page is available yet."));
        return;
      }

      const current = available[0];
      response.send(
        renderHighCourtsIndexPage(
          available,
          buildPublicHighCourtPageContext(current.profile, available.map((entry) => entry.profile)),
        ),
      );
    }),
  );

  app.get(
    "/high-courts/:courtSlug",
    asyncRoute(async (request, response) => {
      const resolved = resolvePublicHighCourtRequest(request, highCourtServices);
      if (!resolved) {
        response.status(404).send(renderEmptyState("High Court Not Found", "This High Court is not available on the public site."));
        return;
      }

      const snapshot = await resolved.service.getPublishedSnapshot();
      if (!snapshot) {
        response.status(503).send(renderEmptyState("High Court Not Available Yet", "No published High Court snapshot is available yet."));
        return;
      }

      response.send(
        renderHighCourtOverviewPage(
          resolved.profile,
          snapshot.payload,
          buildPublicHighCourtPageContext(resolved.profile, await listAvailablePublicHighCourtProfiles(highCourtServices, resolved.profile)),
        ),
      );
    }),
  );

  app.get(
    "/high-courts/:courtSlug/data",
    asyncRoute(async (request, response) => {
      applyPublishedDataCacheHeaders(response);
      const resolved = resolvePublicHighCourtRequest(request, highCourtServices);
      if (!resolved) {
        response.status(404).send(renderEmptyState("High Court Not Found", "This High Court is not available on the public site."));
        return;
      }

      const snapshot = await resolved.service.getPublishedSnapshot();
      if (!snapshot) {
        response.status(503).send(renderEmptyState("High Court Data", "No published High Court snapshot is available yet."));
        return;
      }

      response.send(
        renderHighCourtDataPage(
          resolved.profile,
          snapshot.payload,
          buildPublicHighCourtPageContext(resolved.profile, await listAvailablePublicHighCourtProfiles(highCourtServices, resolved.profile)),
        ),
      );
    }),
  );

  app.get(
    "/high-courts/:courtSlug/methodology",
    asyncRoute(async (request, response) => {
      const resolved = resolvePublicHighCourtRequest(request, highCourtServices);
      if (!resolved) {
        response.status(404).send(renderEmptyState("High Court Not Found", "This High Court is not available on the public site."));
        return;
      }

      const snapshot = await resolved.service.getPublishedSnapshot();
      const history = await resolved.service.listPublicationHistory();
      response.send(
        renderHighCourtMethodologyPage(
          resolved.profile,
          snapshot?.payload.snapshot ?? null,
          history,
          buildPublicHighCourtPageContext(resolved.profile, await listAvailablePublicHighCourtProfiles(highCourtServices, resolved.profile)),
        ),
      );
    }),
  );

  app.get(
    "/high-courts/:courtSlug/api",
    asyncRoute(async (request, response) => {
      const resolved = resolvePublicHighCourtRequest(request, highCourtServices);
      if (!resolved) {
        response.status(404).send(renderEmptyState("High Court Not Found", "This High Court is not available on the public site."));
        return;
      }

      response.send(
        renderHighCourtApiPage(
          buildPublicHighCourtPageContext(resolved.profile, await listAvailablePublicHighCourtProfiles(highCourtServices, resolved.profile)),
        ),
      );
    }),
  );

  if (config.ENABLE_OPERATOR_ROUTES) {
    app.get(
      "/operator/supreme-court",
      operatorOnly(config),
      asyncRoute(async (_request, response) => {
        const resolved = resolveSupremeCourtOperatorRequest(supremeCourtService);
        if (!resolved) {
          response.status(404).json({ error: "Supreme Court service is not configured." });
          return;
        }

        const snapshot = await resolved.service.getPublishedSnapshot();
        response.json({
          court: resolved.profile,
          snapshot,
          stats: snapshot?.payload.stats ?? null,
          trends: snapshot?.payload.trends ?? null,
          publications: await resolved.service.listPublicationHistory(),
        });
      }),
    );

    app.get(
      "/operator/supreme-court/runs",
      operatorOnly(config),
      asyncRoute(async (_request, response) => {
        const resolved = resolveSupremeCourtOperatorRequest(supremeCourtService);
        if (!resolved) {
          response.status(404).json({ error: "Supreme Court service is not configured." });
          return;
        }

        response.json({ court: resolved.profile, runs: await resolved.service.listRuns() });
      }),
    );

    app.get(
      "/operator/supreme-court/publications",
      operatorOnly(config),
      asyncRoute(async (_request, response) => {
        const resolved = resolveSupremeCourtOperatorRequest(supremeCourtService);
        if (!resolved) {
          response.status(404).json({ error: "Supreme Court service is not configured." });
          return;
        }

        response.json({ court: resolved.profile, publications: await resolved.service.listPublicationHistory() });
      }),
    );

    app.get(
      "/operator/supreme-court/runs/:runId",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const resolved = resolveSupremeCourtOperatorRequest(supremeCourtService);
        if (!resolved) {
          response.status(404).json({ error: "Supreme Court service is not configured." });
          return;
        }

        const inspection = await resolved.service.inspectRun(readRouteParam(request.params.runId));
        if (!inspection) {
          response.status(404).json({ error: "Run not found." });
          return;
        }

        response.json(inspection);
      }),
    );

    app.post(
      "/operator/supreme-court/runs/fetch",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const resolved = resolveSupremeCourtOperatorRequest(supremeCourtService);
        if (!resolved) {
          response.status(404).json({ error: "Supreme Court service is not configured." });
          return;
        }

        const result = await resolved.service.captureRun(request.body?.note);
        response.status(201).json(result);
      }),
    );

    app.post(
      "/operator/supreme-court/runs/:runId/publish",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const resolved = resolveSupremeCourtOperatorRequest(supremeCourtService);
        if (!resolved) {
          response.status(404).json({ error: "Supreme Court service is not configured." });
          return;
        }

        const runId = readRouteParam(request.params.runId);
        const inspection = await resolved.service.inspectRun(runId);
        if (!inspection) {
          response.status(404).json({ error: "Run not found." });
          return;
        }

        const result = await resolved.service.publishRun(runId, request.body?.note);
        response.status(201).json(result);
      }),
    );

    app.post(
      "/operator/supreme-court/runs/:runId/replay",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const resolved = resolveSupremeCourtOperatorRequest(supremeCourtService);
        if (!resolved) {
          response.status(404).json({ error: "Supreme Court service is not configured." });
          return;
        }

        const runId = readRouteParam(request.params.runId);
        const inspection = await resolved.service.inspectRun(runId);
        if (!inspection) {
          response.status(404).json({ error: "Run not found." });
          return;
        }

        const result = await resolved.service.replayRun(runId, request.body?.note);
        response.status(201).json(result);
      }),
    );

    app.post(
      "/operator/supreme-court/publications/:publicationId/rollback",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const resolved = resolveSupremeCourtOperatorRequest(supremeCourtService);
        if (!resolved) {
          response.status(404).json({ error: "Supreme Court service is not configured." });
          return;
        }

        const publicationId = readRouteParam(request.params.publicationId);
        const publication = (await resolved.service.listPublicationHistory()).find((entry) => entry.publication.id === publicationId);
        if (!publication) {
          response.status(404).json({ error: "Publication not found." });
          return;
        }

        const result = await resolved.service.rollbackPublication(publicationId, request.body?.note);
        response.status(201).json(result);
      }),
    );

    app.get(
      "/operator/high-courts",
      operatorOnly(config),
      asyncRoute(async (_request, response) => {
        response.json({ highCourts: await listConfiguredHighCourtServices(highCourtServices) });
      }),
    );

    app.get(
      "/operator/high-courts/:courtSlug",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const resolved = resolveHighCourtOperatorRequest(request, highCourtServices);
        if (!resolved) {
          response.status(404).json({ error: "High Court not found." });
          return;
        }

        const snapshot = await resolved.service.getPublishedSnapshot();
        response.json({
          court: resolved.profile,
          snapshot,
          stats: snapshot?.payload.stats ?? null,
          trends: snapshot?.payload.trends ?? null,
          publications: await resolved.service.listPublicationHistory(),
        });
      }),
    );

    app.get(
      "/operator/high-courts/:courtSlug/runs",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const resolved = resolveHighCourtOperatorRequest(request, highCourtServices);
        if (!resolved) {
          response.status(404).json({ error: "High Court not found." });
          return;
        }

        response.json({ court: resolved.profile, runs: await resolved.service.listRuns() });
      }),
    );

    app.get(
      "/operator/high-courts/:courtSlug/publications",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const resolved = resolveHighCourtOperatorRequest(request, highCourtServices);
        if (!resolved) {
          response.status(404).json({ error: "High Court not found." });
          return;
        }

        response.json({ court: resolved.profile, publications: await resolved.service.listPublicationHistory() });
      }),
    );

    app.get(
      "/operator/high-courts/:courtSlug/runs/:runId",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const resolved = resolveHighCourtOperatorRequest(request, highCourtServices);
        if (!resolved) {
          response.status(404).json({ error: "High Court not found." });
          return;
        }

        const inspection = await resolved.service.inspectRun(readRouteParam(request.params.runId));
        if (!inspection) {
          response.status(404).json({ error: "Run not found." });
          return;
        }

        response.json(inspection);
      }),
    );

    app.post(
      "/operator/high-courts/:courtSlug/runs/fetch",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const resolved = resolveHighCourtOperatorRequest(request, highCourtServices);
        if (!resolved) {
          response.status(404).json({ error: "High Court not found." });
          return;
        }

        const result = await resolved.service.captureRun(request.body?.note);
        response.status(201).json(result);
      }),
    );

    app.post(
      "/operator/high-courts/:courtSlug/runs/:runId/publish",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const resolved = resolveHighCourtOperatorRequest(request, highCourtServices);
        if (!resolved) {
          response.status(404).json({ error: "High Court not found." });
          return;
        }

        const runId = readRouteParam(request.params.runId);
        const inspection = await resolved.service.inspectRun(runId);
        if (!inspection) {
          response.status(404).json({ error: "Run not found." });
          return;
        }

        const result = await resolved.service.publishRun(runId, request.body?.note);
        response.status(201).json(result);
      }),
    );

    app.post(
      "/operator/high-courts/:courtSlug/runs/:runId/replay",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const resolved = resolveHighCourtOperatorRequest(request, highCourtServices);
        if (!resolved) {
          response.status(404).json({ error: "High Court not found." });
          return;
        }

        const runId = readRouteParam(request.params.runId);
        const inspection = await resolved.service.inspectRun(runId);
        if (!inspection) {
          response.status(404).json({ error: "Run not found." });
          return;
        }

        const result = await resolved.service.replayRun(runId, request.body?.note);
        response.status(201).json(result);
      }),
    );

    app.post(
      "/operator/high-courts/:courtSlug/publications/:publicationId/rollback",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const resolved = resolveHighCourtOperatorRequest(request, highCourtServices);
        if (!resolved) {
          response.status(404).json({ error: "High Court not found." });
          return;
        }

        const publicationId = readRouteParam(request.params.publicationId);
        const publication = (await resolved.service.listPublicationHistory()).find((entry) => entry.publication.id === publicationId);
        if (!publication) {
          response.status(404).json({ error: "Publication not found." });
          return;
        }

        const result = await resolved.service.rollbackPublication(publicationId, request.body?.note);
        response.status(201).json(result);
      }),
    );

    app.get(
      "/operator/runs",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const resolved = resolveOperatorServiceRequest(request, serviceMap, config.STATE_CODE);
        response.json({ state: resolved.profile, runs: await resolved.service.listRuns() });
      }),
    );

    app.get(
      "/operator/publications",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const resolved = resolveOperatorServiceRequest(request, serviceMap, config.STATE_CODE);
        response.json({ state: resolved.profile, publications: await resolved.service.listPublicationHistory() });
      }),
    );

    app.get(
      "/operator/runs/:runId",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const inspection = await findRunInspectionAcrossServices(readRouteParam(request.params.runId), serviceMap);
        if (!inspection) {
          response.status(404).json({ error: "Run not found." });
          return;
        }

        response.json(inspection);
      }),
    );

    app.post(
      "/operator/runs/fetch",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const resolved = resolveOperatorServiceRequest(request, serviceMap, config.STATE_CODE);
        const result = await resolved.service.captureRun(request.body?.note);
        response.status(201).json(result);
      }),
    );

    app.post(
      "/operator/runs/:runId/publish",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const runId = readRouteParam(request.params.runId);
        const resolved = await findRunServiceAcrossServices(runId, serviceMap);
        if (!resolved) {
          response.status(404).json({ error: "Run not found." });
          return;
        }

        const result = await resolved.service.publishRun(runId, request.body?.note);
        response.status(201).json(result);
        if (newsletterService) {
          const stateCode = result.snapshot.stateCode as SupportedStateCode;
          const stateProfile = getStateProfile(stateCode);
          const origin = config.CANONICAL_HOST ? `https://${config.CANONICAL_HOST}` : "https://nyaaywatch.in";
          const snap = await resolved.service.getPublishedSnapshot();
          if (snap) {
            newsletterService
              .sendDigest(snap.payload, origin, stateProfile.stateCode, stateProfile.stateSlug)
              .catch((err) => logError("[newsletter] sendDigest failed", err));
          }
        }
      }),
    );

    app.post(
      "/operator/runs/:runId/replay",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const runId = readRouteParam(request.params.runId);
        const resolved = await findRunServiceAcrossServices(runId, serviceMap);
        if (!resolved) {
          response.status(404).json({ error: "Run not found." });
          return;
        }

        const result = await resolved.service.replayRun(runId, request.body?.note);
        response.status(201).json(result);
      }),
    );

    app.post(
      "/operator/publications/:publicationId/rollback",
      operatorOnly(config),
      asyncRoute(async (request, response) => {
        const publicationId = readRouteParam(request.params.publicationId);
        const resolved = await findPublicationServiceAcrossServices(publicationId, serviceMap);
        if (!resolved) {
          response.status(404).json({ error: "Publication not found." });
          return;
        }

        const result = await resolved.service.rollbackPublication(publicationId, request.body?.note);
        response.status(201).json(result);
      }),
    );
  }

  // RSS feed routes
  app.get(
    "/states/:stateSlug/feed.xml",
    asyncRoute(async (request, response) => {
      const resolved = resolvePublicStateRequest(request, publicServices);
      if (!resolved) {
        response.status(404).send(LOWER_COURT_GEOGRAPHY_NOT_FOUND_TEXT);
        return;
      }

      const [entries, snapshot] = await Promise.all([
        resolved.service.listPublicationHistory(),
        resolved.service.getPublishedSnapshot(),
      ]);

      const origin = config.CANONICAL_HOST ? `https://${config.CANONICAL_HOST}` : "https://nyaaywatch.in";
      const stateUrl = `${origin}/states/${resolved.profile.stateSlug}`;
      const feedUrl = `${stateUrl}/feed.xml`;

      response.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
      response.send(
        renderRssFeed({
          title: `NyaayWatch — ${resolved.profile.stateName}`,
          description: `Court backlog snapshots for ${resolved.profile.stateName}`,
          link: stateUrl,
          feedUrl,
          entries,
          currentSnapshot: snapshot?.payload ?? null,
        }),
      );
    }),
  );

  // Subscribe / unsubscribe routes
  app.get(
    "/subscribe",
    asyncRoute(async (request, response) => {
      const stateSlug = typeof request.query.state === "string" ? request.query.state : config.STATE_CODE;
      const profile = resolvePublicStateProfile(stateSlug) ?? getStateProfile(config.STATE_CODE);
      const availableProfiles = await listAvailablePublicProfiles(publicServices, profile);
      const context = buildPublicPageContext(profile, availableProfiles);
      response.send(renderSubscribePage(context));
    }),
  );

  app.post(
    "/subscribe",
    asyncRoute(async (request, response) => {
      const rawEmail = typeof request.body?.email === "string" ? request.body.email.trim() : "";
      const rawScope = typeof request.body?.scope === "string" ? request.body.scope.trim() : config.STATE_CODE;
      const profile = resolvePublicStateProfile(rawScope) ?? getStateProfile(config.STATE_CODE);

      if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
        const availableProfiles = await listAvailablePublicProfiles(publicServices, profile);
        const context = buildPublicPageContext(profile, availableProfiles);
        response.status(400).send(renderSubscribePage(context, { error: "Please enter a valid email address." }));
        return;
      }

      if (!newsletterService) {
        const availableProfiles = await listAvailablePublicProfiles(publicServices, profile);
        const context = buildPublicPageContext(profile, availableProfiles);
        response.status(503).send(renderSubscribePage(context, { error: "Subscriptions are not available at this time." }));
        return;
      }

      const scope = profile.stateCode;
      const { token, alreadyConfirmed } = await newsletterService.subscribe(rawEmail, scope);

      const origin = config.CANONICAL_HOST ? `https://${config.CANONICAL_HOST}` : "https://nyaaywatch.in";
      const availableProfiles = await listAvailablePublicProfiles(publicServices, profile);
      const context = buildPublicPageContext(profile, availableProfiles);

      if (alreadyConfirmed) {
        response.send(renderSubscribeAlreadyConfirmed(context));
        return;
      }

      await newsletterService.sendConfirmationEmail(rawEmail, token, origin).catch((err) =>
        logError("[newsletter] sendConfirmationEmail failed", err),
      );
      response.send(renderSubscribeConfirmPending(rawEmail, context));
    }),
  );

  app.get(
    "/subscribe/confirm/:token",
    asyncRoute(async (request, response) => {
      const token = readRouteParam(request.params.token);
      const profile = getStateProfile(config.STATE_CODE);
      const availableProfiles = await listAvailablePublicProfiles(publicServices, profile);
      const context = buildPublicPageContext(profile, availableProfiles);

      if (!newsletterService) {
        response.status(503).send(renderSubscribePage(context, { error: "Subscriptions are not available at this time." }));
        return;
      }

      const confirmed = await newsletterService.confirm(token);
      if (confirmed) {
        response.send(renderSubscribeConfirmed(context));
      } else {
        response.send(renderSubscribeAlreadyConfirmed(context));
      }
    }),
  );

  app.get(
    "/unsubscribe/:token",
    asyncRoute(async (request, response) => {
      const token = readRouteParam(request.params.token);
      const profile = getStateProfile(config.STATE_CODE);
      const availableProfiles = await listAvailablePublicProfiles(publicServices, profile);
      const context = buildPublicPageContext(profile, availableProfiles);

      if (!newsletterService) {
        response.status(503).send(renderSubscribePage(context, { error: "Subscriptions are not available at this time." }));
        return;
      }

      await newsletterService.unsubscribe(token);
      response.send(renderUnsubscribed(context));
    }),
  );

  // OG card image routes (/og/*)
  app.use("/og", registerOgRoutes(publicServices, highCourtServices, supremeCourtService));

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const message = error instanceof Error ? error.message : "Unexpected error";
    logError("http_request_failed", {
      method: _request.method,
      path: redactSensitiveRequestUrl(_request.originalUrl),
      statusCode: 500,
      error: message,
    });
    response.status(500).json({ error: "Unexpected error" });
  });

  return app;
}

function normalizeServiceMap(
  config: AppConfig,
  service: PublishedSnapshotService,
  publicServices: PublicServiceMap,
) {
  return {
    ...publicServices,
    [config.STATE_CODE]: publicServices[config.STATE_CODE] ?? service,
  } satisfies PublicServiceMap;
}

function getRequiredPublicService(stateCode: SupportedStateCode, publicServices: PublicServiceMap) {
  const service = publicServices[stateCode];
  if (!service) {
    throw new Error(`Public service for ${stateCode} is not configured.`);
  }
  return service;
}

function resolvePublicStateRequest(request: Request, publicServices: PublicServiceMap) {
  const stateSlug = readRouteParam(request.params.stateSlug);
  const profile = resolvePublicStateProfile(stateSlug);
  if (!profile) {
    return null;
  }

  const service = publicServices[profile.stateCode];
  if (!service) {
    return null;
  }

  return { profile, service };
}

function resolvePublicStateProfile(stateSlug: string) {
  const normalized = stateSlug.trim().toLowerCase();
  if (normalized === "himachal") {
    return getStateProfile("HP");
  }

  return getPublicStateProfileBySlug(normalized);
}

function resolvePublicHighCourtRequest(request: Request, services: HighCourtServiceMap) {
  const courtSlug = readRouteParam(request.params.courtSlug);
  const profile = getPublicHighCourtProfileBySlug(courtSlug);
  if (!profile) {
    return null;
  }

  const service = services[profile.courtCode];
  if (!service) {
    return null;
  }

  return { profile, service };
}

function resolvePublicSupremeCourtRequest(service: SupremeCourtService) {
  const profile = getSupremeCourtProfile();
  if (!service || !profile.publicBeta) {
    return null;
  }

  return { profile, service };
}

async function listAvailablePublicStateMapEntries(publicServices: PublicServiceMap) {
  const entries = await Promise.all(
    listPublicStateProfiles().map(async (profile) => {
      const service = publicServices[profile.stateCode];
      if (!service) return null;
      const snapshot = await service.getPublishedSnapshot();
      if (!snapshot) return null;
      return {
        profile,
        stats: snapshot.payload.stats,
        districtCount: snapshot.payload.districts.length,
      };
    }),
  );
  return entries.filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

async function listAvailablePublicProfiles(publicServices: PublicServiceMap, currentProfile: NjdgStateProfile) {
  const profiles = await Promise.all(
    listPublicStateProfiles().map(async (profile) => {
      const service = publicServices[profile.stateCode];
      if (!service) {
        return null;
      }

      if (profile.stateCode === currentProfile.stateCode) {
        return profile;
      }

      const snapshot = await service.getPublishedSnapshot();
      return snapshot ? profile : null;
    }),
  );

  return profiles.filter((profile): profile is NjdgStateProfile => profile !== null);
}

async function listAvailablePublicHighCourtProfiles(highCourtServices: HighCourtServiceMap, currentProfile: HighCourtProfile) {
  const profiles = await Promise.all(
    listPublicHighCourtProfiles().map(async (profile) => {
      const service = highCourtServices[profile.courtCode];
      if (!service) {
        return null;
      }

      if (profile.courtCode === currentProfile.courtCode) {
        return profile;
      }

      const snapshot = await service.getPublishedSnapshot();
      return snapshot ? profile : null;
    }),
  );

  return profiles.filter((profile): profile is HighCourtProfile => profile !== null);
}

async function listAvailablePublicHighCourtEntries(highCourtServices: HighCourtServiceMap) {
  const entries = await Promise.all(
    listPublicHighCourtProfiles().map(async (profile) => {
      const service = highCourtServices[profile.courtCode];
      if (!service) {
        return null;
      }

      const snapshot = await service.getPublishedSnapshot();
      return snapshot ? { profile, snapshot: snapshot.payload } : null;
    }),
  );

  return entries.filter((entry): entry is { profile: HighCourtProfile; snapshot: NonNullable<typeof entry>["snapshot"] } => entry !== null);
}

function resolveOperatorServiceRequest(
  request: Request,
  services: PublicServiceMap,
  defaultStateCode: SupportedStateCode,
) {
  const requestedProfile = readOperatorRequestedProfile(request);
  const profile = requestedProfile ?? getStateProfile(defaultStateCode);
  const service = services[profile.stateCode];

  if (!service) {
    throw new Error(`Operator service for ${profile.stateCode} is not configured.`);
  }

  return { profile, service };
}

function resolveHighCourtOperatorRequest(request: Request, services: HighCourtServiceMap) {
  const courtSlug = readRouteParam(request.params.courtSlug);
  const profile = getHighCourtProfileBySlug(courtSlug);
  if (!profile) {
    return null;
  }

  const service = services[profile.courtCode];
  if (!service) {
    return null;
  }

  return { profile, service };
}

function resolveSupremeCourtOperatorRequest(service: SupremeCourtService) {
  if (!service) {
    return null;
  }

  return {
    profile: getSupremeCourtProfile(),
    service,
  };
}

function readOperatorRequestedProfile(request: Request) {
  const candidates = [
    request.query.stateSlug,
    request.query.stateCode,
    request.query.state,
    request.body?.stateSlug,
    request.body?.stateCode,
    request.body?.state,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }

    const profile = getStateProfileByCodeOrSlug(candidate);
    if (profile) {
      return profile;
    }
  }

  return null;
}

async function findRunInspectionAcrossServices(runId: string, services: PublicServiceMap) {
  for (const service of Object.values(services)) {
    if (!service) {
      continue;
    }

    const inspection = await service.inspectRun(runId);
    if (inspection) {
      return inspection;
    }
  }

  return null;
}

async function findRunServiceAcrossServices(runId: string, services: PublicServiceMap) {
  for (const service of Object.values(services)) {
    if (!service) {
      continue;
    }

    const inspection = await service.inspectRun(runId);
    if (inspection) {
      return { service, inspection };
    }
  }

  return null;
}

async function findPublicationServiceAcrossServices(publicationId: string, services: PublicServiceMap) {
  for (const service of Object.values(services)) {
    if (!service) {
      continue;
    }

    const publication = (await service.listPublicationHistory()).find((entry) => entry.publication.id === publicationId);
    if (publication) {
      return { service, publication };
    }
  }

  return null;
}

async function listConfiguredHighCourtServices(highCourtServices: HighCourtServiceMap) {
  const entries = await Promise.all(
    listHighCourtProfiles().map(async (profile) => {
      const service = highCourtServices[profile.courtCode];
      if (!service) {
        return null;
      }

      const snapshot = await service.getPublishedSnapshot();
      return {
        court: profile,
        hasPublishedSnapshot: snapshot !== null,
        snapshot: snapshot?.payload.snapshot ?? null,
      };
    }),
  );

  return entries.filter((entry) => entry !== null);
}

function readRequestHost(request: Request) {
  return (request.get("x-forwarded-host") ?? request.get("host") ?? "").split(":")[0].trim().toLowerCase();
}

function shouldRedirectToCanonicalHost(config: AppConfig, requestHost: string) {
  if (!config.CANONICAL_HOST || requestHost.length === 0) {
    return false;
  }

  return config.LEGACY_HOSTS.includes(requestHost) && requestHost !== config.CANONICAL_HOST;
}

function asyncRoute(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

function applyPublishedDataCacheHeaders(response: Response) {
  response.set({
    "Cache-Control": "no-store, max-age=0, must-revalidate",
    "CDN-Cache-Control": "no-store",
    "Cloudflare-CDN-Cache-Control": "no-store",
  });
}

function redactSensitiveRequestUrl(originalUrl: string): string {
  const [rawPath = "", rawQuery] = originalUrl.split("?", 2);
  const path = rawPath
    .replace(/^\/subscribe\/confirm\/[^/?#]+/, "/subscribe/confirm/[redacted]")
    .replace(/^\/unsubscribe\/[^/?#]+/, "/unsubscribe/[redacted]");

  if (!rawQuery) {
    return path;
  }

  const params = new URLSearchParams(rawQuery);
  for (const key of ["token", "confirmToken", "unsubscribeToken"]) {
    if (params.has(key)) {
      params.set(key, "[redacted]");
    }
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function operatorOnly(config: AppConfig) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (request.header("x-operator-token") !== config.OPERATOR_API_TOKEN) {
      response.status(401).json({ error: "Operator token required." });
      return;
    }

    next();
  };
}

function readRouteParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function parseDistrictsQuery(query: Request["query"]) {
  return {
    search: typeof query.q === "string" ? query.q : "",
    sort: normalizeSort(typeof query.sort === "string" ? query.sort : ""),
    view: normalizeView(typeof query.view === "string" ? query.view : ""),
  } as const;
}

function normalizeSort(value: string) {
  if (value === "backlog" || value === "disposal" || value === "age" || value === "gap" || value === "rank") {
    return value;
  }

  return "rank";
}

function normalizeView(value: string) {
  return value === "flagged" ? "flagged" : "all";
}

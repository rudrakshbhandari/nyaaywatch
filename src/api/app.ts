import express, { type NextFunction, type Request, type Response } from "express";

import type { AppConfig } from "../config/env.js";
import { logError, logInfo } from "../lib/logger.js";
import {
  renderApiPage,
  renderDataPage,
  renderDistrictPage,
  renderDistrictsPage,
  renderEmptyState,
  renderHomePage,
  renderMethodologyPage,
} from "./render.js";
import { PublishedSnapshotService } from "../services/published-snapshot-service.js";

export function createApp(config: AppConfig, service: PublishedSnapshotService) {
  const app = express();
  app.use(express.json());
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
        path: request.originalUrl,
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

  app.get(
    "/v1/stats/himachal",
    asyncRoute(async (_request, response) => {
      const payload = await service.getStats();
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
      const payload = await service.listDistricts();
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
      const payload = await service.getTrends();
      if (!payload) {
        response.status(404).json({ error: "No published snapshot available." });
        return;
      }
      response.json(payload);
    }),
  );

  app.get(
    "/data/districts.csv",
    asyncRoute(async (_request, response) => {
      const csv = await service.renderDistrictCsv();
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
      const csv = await service.renderDistrictHistoryCsv(readRouteParam(request.params.districtId));
      if (!csv) {
        response.status(404).type("text/plain").send("District export not available.");
        return;
      }

      response.type("text/csv").send(csv);
    }),
  );

  app.get(
    "/",
    asyncRoute(async (_request, response) => {
      const snapshot = await service.getPublishedSnapshot();
      if (!snapshot) {
        response.status(503).send(renderEmptyState("NyaayWatch", "No published snapshot is available yet."));
        return;
      }

      response.send(renderHomePage(snapshot.payload));
    }),
  );

  app.get(
    "/districts",
    asyncRoute(async (_request, response) => {
      const snapshot = await service.getPublishedSnapshot();
      if (!snapshot) {
        response.status(503).send(renderEmptyState("Districts", "No published snapshot is available yet."));
        return;
      }

      response.send(renderDistrictsPage(snapshot.payload, parseDistrictsQuery(_request.query)));
    }),
  );

  app.get(
    "/districts/:districtId",
    asyncRoute(async (request, response) => {
      const districtId = readRouteParam(request.params.districtId);
      const payload = await service.getDistrictDetail(districtId);
      if (!payload) {
        response.status(404).send(renderEmptyState("District Not Found", "This district was not found in the latest published snapshot."));
        return;
      }

      response.send(renderDistrictPage(payload.snapshot, payload.district, payload.history));
    }),
  );

  app.get(
    "/data",
    asyncRoute(async (_request, response) => {
      const snapshot = await service.getPublishedSnapshot();
      if (!snapshot) {
        response.status(503).send(renderEmptyState("Data Downloads", "No published snapshot is available yet."));
        return;
      }

      response.send(renderDataPage(snapshot.payload));
    }),
  );

  app.get(
    "/methodology",
    asyncRoute(async (_request, response) => {
      const snapshot = await service.getPublishedSnapshot();
      const history = await service.listSnapshotHistory();
      response.send(renderMethodologyPage(snapshot?.payload.snapshot ?? null, history));
    }),
  );

  app.get("/api", (_request, response) => {
    response.send(renderApiPage());
  });

  app.get(
    "/operator/runs",
    operatorOnly(config),
    asyncRoute(async (_request, response) => {
      response.json({ runs: await service.listRuns() });
    }),
  );

  app.get(
    "/operator/publications",
    operatorOnly(config),
    asyncRoute(async (_request, response) => {
      response.json({ publications: await service.listPublicationHistory() });
    }),
  );

  app.get(
    "/operator/runs/:runId",
    operatorOnly(config),
    asyncRoute(async (request, response) => {
      const inspection = await service.inspectRun(readRouteParam(request.params.runId));
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
      const result = await service.captureRun(request.body?.note);
      response.status(201).json(result);
    }),
  );

  app.post(
    "/operator/runs/:runId/publish",
    operatorOnly(config),
    asyncRoute(async (request, response) => {
      const result = await service.publishRun(readRouteParam(request.params.runId), request.body?.note);
      response.status(201).json(result);
    }),
  );

  app.post(
    "/operator/runs/:runId/replay",
    operatorOnly(config),
    asyncRoute(async (request, response) => {
      const result = await service.replayRun(readRouteParam(request.params.runId), request.body?.note);
      response.status(201).json(result);
    }),
  );

  app.post(
    "/operator/publications/:publicationId/rollback",
    operatorOnly(config),
    asyncRoute(async (request, response) => {
      const result = await service.rollbackPublication(
        readRouteParam(request.params.publicationId),
        request.body?.note,
      );
      response.status(201).json(result);
    }),
  );

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const message = error instanceof Error ? error.message : "Unexpected error";
    logError("http_request_failed", {
      method: _request.method,
      path: _request.originalUrl,
      statusCode: 500,
      error: message,
    });
    response.status(500).json({ error: message });
  });

  return app;
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

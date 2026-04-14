import express, { type NextFunction, type Request, type Response } from "express";

import type { AppConfig } from "../config/env.js";
import {
  renderApiPage,
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

      response.send(renderDistrictsPage(snapshot.payload));
    }),
  );

  app.get(
    "/districts/:districtId",
    asyncRoute(async (request, response) => {
      const districtId = readRouteParam(request.params.districtId);
      const payload = await service.getDistrict(districtId);
      if (!payload) {
        response.status(404).send(renderEmptyState("District Not Found", "This district was not found in the latest published snapshot."));
        return;
      }

      const snapshot = await service.getPublishedSnapshot();
      if (!snapshot) {
        response.status(404).send(renderEmptyState("District Not Found", "No published snapshot is available."));
        return;
      }

      response.send(renderDistrictPage(snapshot.payload, payload.district));
    }),
  );

  app.get(
    "/methodology",
    asyncRoute(async (_request, response) => {
      const snapshot = await service.getPublishedSnapshot();
      response.send(renderMethodologyPage(snapshot?.payload.snapshot ?? null));
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
      response.json({ publications: await service.listPublications() });
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
    response.status(500).json({ error: message });
  });

  return app;
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

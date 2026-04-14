import path from "node:path";

import express, { type NextFunction, type Request, type Response } from "express";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { SnapshotStore } from "./store/snapshot-store";
import { FileSnapshotStore } from "./store/snapshot-store";
import { PublishService } from "./services/publish-service";
import { PublishedSnapshotService } from "./services/read-model";
import { Layout } from "../../web/src/layout";
import { DistrictPage } from "../../web/src/pages/district-page";
import { HomePage } from "../../web/src/pages/home-page";

export interface AppOptions {
  store?: SnapshotStore;
  now?: () => Date;
  operatorToken?: string;
}

export function createApp(options: AppOptions = {}) {
  const store = options.store ?? new FileSnapshotStore();
  const now = options.now ?? (() => new Date());
  const operatorToken = options.operatorToken ?? process.env.OPERATOR_TOKEN ?? "dev-operator-token";
  const readModel = new PublishedSnapshotService(store, now);
  const publishService = new PublishService(store, now);

  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());
  app.use("/static", express.static(path.resolve(process.cwd(), "web/public")));

  app.get("/healthz", (_request, response) => {
    response.json({ ok: true });
  });

  app.get("/v1/stats/himachal", async (_request, response) => {
    const payload = await readModel.getHimachalStats();

    if (!payload) {
      response.status(404).json({
        error: "no_published_snapshot",
      });
      return;
    }

    response.json(payload);
  });

  app.get("/v1/districts/:slug", async (request, response) => {
    const payload = await readModel.getDistrictDetail(request.params.slug);

    if (!payload) {
      response.status(404).json({
        error: "district_not_found",
      });
      return;
    }

    response.json(payload);
  });

  app.use("/operator", (request, response, next) => requireOperator(request, response, next, operatorToken));

  app.get("/operator/runs", async (_request, response) => {
    response.json({
      runs: await readModel.listOperatorRuns(),
    });
  });

  app.post("/operator/publish/:runId", async (request, response) => {
    const result = await publishService.publish(request.params.runId);

    if (!result.publishable) {
      response.status(422).json({
        error: "publish_blocked",
        reasons: result.reasons,
      });
      return;
    }

    response.status(202).json({
      status: "published",
      runId: request.params.runId,
    });
  });

  app.get("/", async (_request, response) => {
    const payload = await readModel.getHimachalStats();
    response
      .status(200)
      .type("html")
      .send(
        renderDocument({
          title: "NyaayWatch",
          description: "Published Himachal snapshot scorecard and flagged district signals.",
          children: <HomePage data={payload} />,
        }),
      );
  });

  app.get("/districts/:slug", async (request, response) => {
    const payload = await readModel.getDistrictDetail(request.params.slug);
    response
      .status(payload ? 200 : 404)
      .type("html")
      .send(
        renderDocument({
          title: payload ? `${payload.district.name} | NyaayWatch` : "District not found | NyaayWatch",
          description: "District evidence page for the published Himachal snapshot.",
          children: <DistrictPage data={payload} districtSlug={request.params.slug} />,
        }),
      );
  });

  return app;
}

function renderDocument({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return `<!doctype html>${renderToStaticMarkup(
    <Layout title={title} description={description}>
      {children}
    </Layout>,
  )}`;
}

function requireOperator(
  request: Request,
  response: Response,
  next: NextFunction,
  operatorToken: string,
) {
  if (request.header("x-operator-token") !== operatorToken) {
    response.status(401).json({
      error: "operator_auth_required",
    });
    return;
  }

  next();
}

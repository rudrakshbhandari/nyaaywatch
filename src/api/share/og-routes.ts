/**
 * Express routes that serve OG card images as PNG.
 *
 * Routes:
 *   GET /og/state/:stateSlug.png       — state/district homepage card
 *   GET /og/district/:districtId.png   — individual district card
 *   GET /og/national.png               — national homepage card
 *   GET /og/high-court/:courtSlug.png  — high court overview card
 *   GET /og/supreme-court.png          — supreme court overview card
 *
 * All images are served with Cache-Control: public, max-age=3600 and the
 * satori/resvg render pipeline is called at most once per (type, id, snapshot)
 * combination within a single process lifetime.
 */

import { Router } from "express";
import type { SupportedStateCode } from "../../geographies.js";
import type { SupportedHighCourtCode } from "../../high-courts.js";
import { getPublicStateProfileBySlug } from "../../geographies.js";
import { getPublicHighCourtProfileBySlug } from "../../high-courts.js";
import { logError } from "../../lib/logger.js";
import type { PublishedSnapshotService } from "../../services/published-snapshot-service.js";
import type { PublishedHighCourtSnapshotService } from "../../services/published-high-court-snapshot-service.js";
import type { PublishedSupremeCourtSnapshotService } from "../../services/published-supreme-court-snapshot-service.js";
import { buildViewModel, formatDate, formatLakh } from "../home/view-model.js";
import {
  renderStateOgCard,
  renderDistrictOgCard,
  renderNationalOgCard,
  renderHighCourtOgCard,
  renderSquareDistrictCard,
  renderSquareStateCard,
  type StateOgCardData,
  type DistrictOgCardData,
  type NationalOgCardData,
  type HighCourtOgCardData,
} from "./og-card.js";

type PublicServiceMap = Partial<Record<SupportedStateCode, PublishedSnapshotService>>;
type HighCourtServiceMap = Partial<Record<SupportedHighCourtCode, PublishedHighCourtSnapshotService>>;

const DEFAULT_STATE_CODE: SupportedStateCode = "HP";

function logOgRouteError(route: string, err: unknown) {
  logError("og_image_render_failed", {
    route,
    error: err instanceof Error ? err.message : String(err),
  });
}

export function registerOgRoutes(
  publicServices: PublicServiceMap,
  highCourtServices: HighCourtServiceMap,
  supremeCourtService?: PublishedSupremeCourtSnapshotService,
): Router {
  const router = Router();

  // ── State homepage OG card ────────────────────────────────────────────────
  router.get("/state/:stateSlug.png", async (req, res) => {
    try {
      const profile = getPublicStateProfileBySlug(req.params.stateSlug ?? "");
      if (!profile) { res.status(404).end(); return; }

      const service = publicServices[profile.stateCode];
      if (!service) { res.status(404).end(); return; }

      const record = await service.getPublishedSnapshot();
      if (!record) { res.status(404).end(); return; }

      const model = buildViewModel(record.payload);
      const data: StateOgCardData = {
        stateName: record.payload.snapshot.stateName,
        headline: `How long is the wait for justice in ${record.payload.snapshot.stateName}?`,
        pendingLakh: model.pendingLakh,
        typicalWaitMonths: model.typicalWaitMonths,
        clearanceRate: model.clearanceRate,
        flaggedCount: model.flaggedCount,
        sourceDateLabel: model.sourceDateLabel,
      };
      const cacheKey = `state:${profile.stateCode}:${record.payload.snapshot.publishedAt}`;
      const png = await renderStateOgCard(data, cacheKey);

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
      res.send(png);
    } catch (err) {
      logOgRouteError("/og/state/:stateSlug.png", err);
      res.status(500).end();
    }
  });

  // ── Default state OG card (HP) ─────────────────────────────────────────────
  router.get("/home.png", async (_req, res) => {
    try {
      const service = publicServices[DEFAULT_STATE_CODE];
      if (!service) { res.status(404).end(); return; }

      const record = await service.getPublishedSnapshot();
      if (!record) { res.status(404).end(); return; }

      const model = buildViewModel(record.payload);
      const data: StateOgCardData = {
        stateName: record.payload.snapshot.stateName,
        headline: `How long is the wait for justice in ${record.payload.snapshot.stateName}?`,
        pendingLakh: model.pendingLakh,
        typicalWaitMonths: model.typicalWaitMonths,
        clearanceRate: model.clearanceRate,
        flaggedCount: model.flaggedCount,
        sourceDateLabel: model.sourceDateLabel,
      };
      const cacheKey = `home:HP:${record.payload.snapshot.publishedAt}`;
      const png = await renderStateOgCard(data, cacheKey);

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
      res.send(png);
    } catch (err) {
      logOgRouteError("/og/home.png", err);
      res.status(500).end();
    }
  });

  // ── District OG card ─────────────────────────────────────────────────────
  router.get("/district/:districtId.png", async (req, res) => {
    try {
      const districtId = req.params.districtId ?? "";
      const service = publicServices[DEFAULT_STATE_CODE];
      if (!service) { res.status(404).end(); return; }

      const detail = await service.getDistrictDetail(districtId);
      if (!detail) { res.status(404).end(); return; }

      const { district, snapshot } = detail;
      const typicalWaitMonths = Math.round(district.medianAgeDays / 30);
      const data: DistrictOgCardData = {
        stateName: snapshot.stateName,
        districtName: district.districtName,
        rank: district.rank,
        totalDistricts: 0,
        summary: district.summary,
        backlogCases: district.backlogCases,
        typicalWaitMonths,
        clearanceRate: district.disposalRate,
        sourceDateLabel: formatDate(snapshot.sourceSnapshotAt),
      };
      const cacheKey = `district:${districtId}:${snapshot.publishedAt}`;
      const png = await renderDistrictOgCard(data, cacheKey);

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
      res.send(png);
    } catch (err) {
      logOgRouteError("/og/district/:districtId.png", err);
      res.status(500).end();
    }
  });

  // ── District square (WhatsApp) card ──────────────────────────────────────
  router.get("/district/:districtId-square.png", async (req, res) => {
    try {
      const districtId = req.params.districtId ?? "";
      const service = publicServices[DEFAULT_STATE_CODE];
      if (!service) { res.status(404).end(); return; }

      const detail = await service.getDistrictDetail(districtId);
      if (!detail) { res.status(404).end(); return; }

      const { district, snapshot } = detail;
      const typicalWaitMonths = Math.round(district.medianAgeDays / 30);
      const data: DistrictOgCardData = {
        stateName: snapshot.stateName,
        districtName: district.districtName,
        rank: district.rank,
        totalDistricts: 0,
        summary: district.summary,
        backlogCases: district.backlogCases,
        typicalWaitMonths,
        clearanceRate: district.disposalRate,
        sourceDateLabel: formatDate(snapshot.sourceSnapshotAt),
      };
      const cacheKey = `district-sq:${districtId}:${snapshot.publishedAt}`;
      const png = await renderSquareDistrictCard(data, cacheKey);

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
      res.send(png);
    } catch (err) {
      logOgRouteError("/og/district/:districtId-square.png", err);
      res.status(500).end();
    }
  });

  // ── State square (WhatsApp) card ──────────────────────────────────────────
  router.get("/state/:stateSlug-square.png", async (req, res) => {
    try {
      const profile = getPublicStateProfileBySlug(req.params.stateSlug ?? "");
      if (!profile) { res.status(404).end(); return; }

      const service = publicServices[profile.stateCode];
      if (!service) { res.status(404).end(); return; }

      const record = await service.getPublishedSnapshot();
      if (!record) { res.status(404).end(); return; }

      const model = buildViewModel(record.payload);
      const data: StateOgCardData = {
        stateName: record.payload.snapshot.stateName,
        headline: `How long is the wait for justice in ${record.payload.snapshot.stateName}?`,
        pendingLakh: model.pendingLakh,
        typicalWaitMonths: model.typicalWaitMonths,
        clearanceRate: model.clearanceRate,
        flaggedCount: model.flaggedCount,
        sourceDateLabel: model.sourceDateLabel,
      };
      const cacheKey = `state-sq:${profile.stateCode}:${record.payload.snapshot.publishedAt}`;
      const png = await renderSquareStateCard(data, cacheKey);

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
      res.send(png);
    } catch (err) {
      logOgRouteError("/og/state/:stateSlug-square.png", err);
      res.status(500).end();
    }
  });

  // ── National OG card ─────────────────────────────────────────────────────
  router.get("/national.png", async (_req, res) => {
    try {
      const service = publicServices[DEFAULT_STATE_CODE];
      if (!service) { res.status(404).end(); return; }

      const record = await service.getPublishedSnapshot();
      if (!record) { res.status(404).end(); return; }

      const model = buildViewModel(record.payload);
      const statesWithData = Object.keys(publicServices).length;
      const data: NationalOgCardData = {
        headline: "How long is India waiting for justice?",
        totalPendingLakh: model.pendingLakh,
        statesCount: statesWithData,
        sourceDateLabel: model.sourceDateLabel,
      };
      const cacheKey = `national:${record.payload.snapshot.publishedAt}`;
      const png = await renderNationalOgCard(data, cacheKey);

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
      res.send(png);
    } catch (err) {
      logOgRouteError("/og/national.png", err);
      res.status(500).end();
    }
  });

  // ── High court OG card ────────────────────────────────────────────────────
  router.get("/high-court/:courtSlug.png", async (req, res) => {
    try {
      const profile = getPublicHighCourtProfileBySlug(req.params.courtSlug ?? "");
      if (!profile) { res.status(404).end(); return; }

      const service = highCourtServices[profile.courtCode];
      if (!service) { res.status(404).end(); return; }

      const record = await service.getPublishedSnapshot();
      if (!record) { res.status(404).end(); return; }

      const stats = record.payload.stats;
      const pending = stats.pendingTotalCases;
      const disposed = stats.disposedLastMonthTotalCases;
      const instituted = stats.institutedLastMonthTotalCases;
      const clearanceRate = instituted > 0 ? (disposed / instituted) * 100 : 0;

      const data: HighCourtOgCardData = {
        courtName: record.payload.snapshot.courtName,
        headline: `How long is the wait at ${record.payload.snapshot.courtName}?`,
        pendingLakh: formatLakh(pending),
        clearanceRate,
        sourceDateLabel: formatDate(record.payload.snapshot.referenceDateAt),
      };
      const cacheKey = `hc:${profile.courtCode}:${record.payload.snapshot.publishedAt}`;
      const png = await renderHighCourtOgCard(data, cacheKey);

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
      res.send(png);
    } catch (err) {
      logOgRouteError("/og/high-court/:courtSlug.png", err);
      res.status(500).end();
    }
  });

  // ── Supreme court OG card ─────────────────────────────────────────────────
  router.get("/supreme-court.png", async (_req, res) => {
    try {
      if (!supremeCourtService) { res.status(404).end(); return; }

      const record = await supremeCourtService.getPublishedSnapshot();
      if (!record) { res.status(404).end(); return; }

      const stats = record.payload.stats;
      const pending = stats.pendingTotalCases;
      const disposed = stats.disposedLastMonthTotalCases;
      const instituted = stats.institutedLastMonthTotalCases;
      const clearanceRate = instituted > 0 ? (disposed / instituted) * 100 : 0;

      const data: HighCourtOgCardData = {
        courtName: "Supreme Court of India",
        headline: "How long is the wait at the Supreme Court of India?",
        pendingLakh: formatLakh(pending),
        clearanceRate,
        sourceDateLabel: formatDate(record.payload.snapshot.referenceDateAt),
      };
      const cacheKey = `sc:${record.payload.snapshot.publishedAt}`;
      const png = await renderHighCourtOgCard(data, cacheKey);

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
      res.send(png);
    } catch (err) {
      logOgRouteError("/og/supreme-court.png", err);
      res.status(500).end();
    }
  });

  return router;
}

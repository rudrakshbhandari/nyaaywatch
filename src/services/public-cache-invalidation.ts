import type { AppConfig } from "../config/env.js";
import { buildPublicHighCourtRoutes } from "../api/public-high-court.js";
import { buildPublicSupremeCourtRoutes } from "../api/public-supreme-court.js";
import { getStateProfile, type SupportedStateCode } from "../geographies.js";
import type { HighCourtProfile } from "../high-courts.js";
import { logInfo } from "../lib/logger.js";
import { buildPublicStateRoutes } from "../api/public-state.js";

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";
const CLOUDFLARE_SINGLE_FILE_PURGE_MAX_OPERATIONS = 100;

export type PublicCacheInvalidationConfig = Pick<
  AppConfig,
  "CANONICAL_HOST" | "CLOUDFLARE_API_TOKEN" | "CLOUDFLARE_ZONE_ID" | "CLOUDFLARE_ZONE_NAME" | "PUBLIC_BASE_URL"
>;

export class PublicCacheInvalidationService {
  constructor(private readonly config: PublicCacheInvalidationConfig) {}

  isConfigured() {
    return Boolean(this.config.CLOUDFLARE_API_TOKEN && this.resolvePublicBaseUrl());
  }

  async invalidatePublishedData(stateCode: SupportedStateCode, districtIds: string[]) {
    if (!this.isConfigured()) {
      logInfo("public_cache_invalidation_skipped", {
        scope: `state:${stateCode}`,
        reason: "cloudflare_not_configured",
      });
      return;
    }

    await this.purgeUrls(this.buildPublicDataUrls(stateCode, districtIds), `state:${stateCode}`);
  }

  async invalidateHighCourtRoutes(profile: HighCourtProfile) {
    if (!this.isConfigured()) {
      logInfo("public_cache_invalidation_skipped", {
        scope: `high_court:${profile.courtSlug}`,
        reason: "cloudflare_not_configured",
      });
      return;
    }

    await this.purgeUrls(this.buildHighCourtUrls(profile), `high_court:${profile.courtSlug}`);
  }

  async invalidateSupremeCourtRoutes() {
    if (!this.isConfigured()) {
      logInfo("public_cache_invalidation_skipped", {
        scope: "supreme_court",
        reason: "cloudflare_not_configured",
      });
      return;
    }

    await this.purgeUrls(this.buildSupremeCourtUrls(), "supreme_court");
  }

  async invalidateExplicitUrls(urls: string[], scope: string) {
    if (!this.isConfigured()) {
      logInfo("public_cache_invalidation_skipped", {
        scope,
        reason: "cloudflare_not_configured",
      });
      return;
    }

    await this.purgeUrls(urls, scope);
  }

  private buildPublicDataUrls(stateCode: SupportedStateCode, districtIds: string[]) {
    const profile = getStateProfile(stateCode);
    const routes = buildPublicStateRoutes(profile);
    const baseUrl = this.requirePublicBaseUrl();

    return [
      routes.data,
      routes.districtsCsv,
      routes.stateEvidencePack,
      ...districtIds.flatMap((districtId) => [routes.districtCsv(districtId), routes.districtEvidencePack(districtId)]),
    ].map((path) => new URL(path, baseUrl).toString());
  }

  private buildHighCourtUrls(profile: HighCourtProfile) {
    const baseUrl = this.requirePublicBaseUrl();
    const routes = buildPublicHighCourtRoutes(profile);

    return [routes.index, routes.home, routes.data, routes.methodology, routes.api, routes.statsApi, routes.trendsApi].map((path) =>
      new URL(path, baseUrl).toString(),
    );
  }

  private buildSupremeCourtUrls() {
    const baseUrl = this.requirePublicBaseUrl();
    const routes = buildPublicSupremeCourtRoutes();

    return [routes.home, routes.data, routes.methodology, routes.api, routes.statsApi, routes.trendsApi].map((path) =>
      new URL(path, baseUrl).toString(),
    );
  }

  private async purgeUrls(urls: string[], scope: string) {
    const zoneId = await this.resolveZoneId();
    const chunks = chunkUrls(urls, CLOUDFLARE_SINGLE_FILE_PURGE_MAX_OPERATIONS);

    for (const [index, chunk] of chunks.entries()) {
      const response = await fetch(`${CLOUDFLARE_API_BASE}/zones/${zoneId}/purge_cache`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: chunk }),
      });
      const body = (await response.json()) as { success?: boolean; errors?: Array<{ message?: string }> };

      if (!response.ok || body.success !== true) {
        const detail = body.errors?.map((error) => error.message).filter(Boolean).join("; ") || response.statusText;
        throw new Error(`Cloudflare purge failed for ${scope} batch ${index + 1}/${chunks.length}: ${detail}`);
      }
    }

    logInfo("public_cache_invalidated", {
      scope,
      urlCount: urls.length,
      purgeRequestCount: chunks.length,
    });
  }

  private requirePublicBaseUrl() {
    const baseUrl = this.resolvePublicBaseUrl();
    if (!baseUrl) {
      throw new Error("PUBLIC_BASE_URL or CANONICAL_HOST is required for cache invalidation.");
    }

    return baseUrl;
  }

  private resolvePublicBaseUrl() {
    if (this.config.PUBLIC_BASE_URL) {
      return this.config.PUBLIC_BASE_URL;
    }

    if (this.config.CANONICAL_HOST) {
      return `https://${this.config.CANONICAL_HOST}`;
    }

    return null;
  }

  private async resolveZoneId() {
    if (this.config.CLOUDFLARE_ZONE_ID) {
      return this.config.CLOUDFLARE_ZONE_ID;
    }

    const zoneName = this.config.CLOUDFLARE_ZONE_NAME ?? this.config.CANONICAL_HOST;
    if (!zoneName) {
      throw new Error("CLOUDFLARE_ZONE_ID or CLOUDFLARE_ZONE_NAME is required for cache invalidation.");
    }

    const response = await fetch(`${CLOUDFLARE_API_BASE}/zones?name=${encodeURIComponent(zoneName)}`, {
      headers: {
        Authorization: `Bearer ${this.config.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    const body = (await response.json()) as {
      success?: boolean;
      result?: Array<{ id?: string }>;
      errors?: Array<{ message?: string }>;
    };

    const zoneId = body.result?.[0]?.id;
    if (!response.ok || body.success !== true || !zoneId) {
      const detail = body.errors?.map((error) => error.message).filter(Boolean).join("; ") || response.statusText;
      throw new Error(`Cloudflare zone lookup failed for ${zoneName}: ${detail}`);
    }

    return zoneId;
  }
}

function chunkUrls(urls: string[], size: number) {
  const chunks: string[][] = [];
  for (let index = 0; index < urls.length; index += size) {
    chunks.push(urls.slice(index, index + size));
  }

  return chunks;
}

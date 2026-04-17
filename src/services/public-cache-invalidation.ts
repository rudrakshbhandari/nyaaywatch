import type { AppConfig } from "../config/env.js";
import { getStateProfile, type SupportedStateCode } from "../geographies.js";
import { logInfo } from "../lib/logger.js";
import { buildPublicStateRoutes } from "../api/public-state.js";

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

export class PublicCacheInvalidationService {
  constructor(private readonly config: AppConfig) {}

  isConfigured() {
    return Boolean(this.config.CLOUDFLARE_API_TOKEN && this.resolvePublicBaseUrl());
  }

  async invalidatePublishedData(stateCode: SupportedStateCode, districtIds: string[]) {
    if (!this.isConfigured()) {
      logInfo("public_cache_invalidation_skipped", {
        stateCode,
        reason: "cloudflare_not_configured",
      });
      return;
    }

    const zoneId = await this.resolveZoneId();
    const urls = this.buildPublicDataUrls(stateCode, districtIds);
    const response = await fetch(`${CLOUDFLARE_API_BASE}/zones/${zoneId}/purge_cache`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files: urls }),
    });
    const body = (await response.json()) as { success?: boolean; errors?: Array<{ message?: string }> };

    if (!response.ok || body.success !== true) {
      const detail = body.errors?.map((error) => error.message).filter(Boolean).join("; ") || response.statusText;
      throw new Error(`Cloudflare purge failed for ${stateCode}: ${detail}`);
    }

    logInfo("public_cache_invalidated", {
      stateCode,
      urlCount: urls.length,
    });
  }

  private buildPublicDataUrls(stateCode: SupportedStateCode, districtIds: string[]) {
    const profile = getStateProfile(stateCode);
    const routes = buildPublicStateRoutes(profile);
    const baseUrl = this.resolvePublicBaseUrl();
    if (!baseUrl) {
      throw new Error("PUBLIC_BASE_URL or CANONICAL_HOST is required for cache invalidation.");
    }

    return [routes.data, routes.districtsCsv, ...districtIds.map((districtId) => routes.districtCsv(districtId))].map((path) =>
      new URL(path, baseUrl).toString(),
    );
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

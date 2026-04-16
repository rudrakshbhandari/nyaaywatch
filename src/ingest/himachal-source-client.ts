import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { NjdgCaptureBundleSchema, type NjdgCaptureBundle } from "../domain/njdg-capture-schema.js";
import { getStateProfile, type NjdgStateProfile } from "../geographies.js";
import { extractDistrictOptions } from "../extract/njdg-html.js";

export interface NjdgSourceClient {
  captureLatest(): Promise<NjdgCaptureBundle>;
}

export type HimachalSourceClient = NjdgSourceClient;

export class NjdgStateSourceClient implements NjdgSourceClient {
  constructor(private readonly profile: NjdgStateProfile) {}

  async captureLatest(): Promise<NjdgCaptureBundle> {
    const statePageUrl = buildStatePageUrl(this.profile);
    const stateHtml = await fetchHtml(statePageUrl);
    const districtOptions = extractDistrictOptions(stateHtml);
    const districtPages = [];

    for (const option of districtOptions) {
      const url = `${statePageUrl}&dist_code=${encodeURIComponent(option.districtCode)}`;
      districtPages.push({
        districtCode: option.districtCode,
        districtName: option.districtName,
        url,
        html: await fetchHtml(url),
      });
    }

    return NjdgCaptureBundleSchema.parse({
      capturedAt: new Date().toISOString(),
      stateCode: this.profile.stateCode,
      stateName: this.profile.stateName,
      expectedDistrictCount: districtOptions.length,
      sourceName: buildSourceName(this.profile),
      sourceAttribution: buildSourceAttribution(this.profile),
      statePage: {
        url: statePageUrl,
        html: stateHtml,
      },
      districtPages,
    });
  }
}

export class FixtureNjdgStateSourceClient implements NjdgSourceClient {
  constructor(
    private readonly profile: NjdgStateProfile,
    private readonly fixturesDirectory: string,
  ) {}

  async captureLatest(): Promise<NjdgCaptureBundle> {
    const stateHtml = await readFile(join(this.fixturesDirectory, "state.html"), "utf8");
    const districtOptions = extractDistrictOptions(stateHtml);
    const districtFileNames = new Set(await readdir(join(this.fixturesDirectory, "districts")));
    const statePageUrl = buildStatePageUrl(this.profile);

    const districtPages = await Promise.all(
      districtOptions.map(async (option) => {
        const fileName = `${option.districtCode}.html`;
        if (!districtFileNames.has(fileName)) {
          throw new Error(`Missing district fixture ${fileName}`);
        }

        return {
          districtCode: option.districtCode,
          districtName: option.districtName,
          url: `${statePageUrl}&dist_code=${encodeURIComponent(option.districtCode)}`,
          html: await readFile(join(this.fixturesDirectory, "districts", fileName), "utf8"),
        };
      }),
    );

    return NjdgCaptureBundleSchema.parse({
      capturedAt: "2026-04-14T00:00:00.000Z",
      stateCode: this.profile.stateCode,
      stateName: this.profile.stateName,
      expectedDistrictCount: districtOptions.length,
      sourceName: buildSourceName(this.profile),
      sourceAttribution: buildSourceAttribution(this.profile),
      statePage: {
        url: statePageUrl,
        html: stateHtml,
      },
      districtPages,
    });
  }
}

export class NjdgHimachalSourceClient extends NjdgStateSourceClient {
  constructor() {
    super(getStateProfile("HP"));
  }
}

export class FixtureHimachalSourceClient extends FixtureNjdgStateSourceClient {
  constructor(fixturesDirectory: string) {
    super(getStateProfile("HP"), fixturesDirectory);
  }
}

function buildSourceName(profile: NjdgStateProfile): string {
  return `NJDG ${profile.stateName} district dashboard`;
}

function buildSourceAttribution(profile: NjdgStateProfile): string {
  return `National Judicial Data Grid public district dashboard for ${profile.stateName}`;
}

function buildStatePageUrl(profile: NjdgStateProfile): string {
  return `https://njdg.ecourts.gov.in/njdg_v3/?p=home/index&state_code=${profile.njdgStateValue}`;
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "NyaayWatch/0.1 (+https://github.com/nyaaywatch)",
      accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch NJDG page ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { NjdgCaptureBundleSchema, type NjdgCaptureBundle } from "../domain/njdg-capture-schema.js";
import { extractDistrictOptions } from "../extract/njdg-html.js";

const SOURCE_NAME = "NJDG Himachal district dashboard";
const SOURCE_ATTRIBUTION = "National Judicial Data Grid public district dashboard for Himachal Pradesh";
const STATE_PAGE_URL = "https://njdg.ecourts.gov.in/njdg_v3/?p=home/index&state_code=2~5";

export interface HimachalSourceClient {
  captureLatest(): Promise<NjdgCaptureBundle>;
}

export class NjdgHimachalSourceClient implements HimachalSourceClient {
  async captureLatest(): Promise<NjdgCaptureBundle> {
    const stateHtml = await fetchHtml(STATE_PAGE_URL);
    const districtOptions = extractDistrictOptions(stateHtml);
    const districtPages = [];

    for (const option of districtOptions) {
      const url = `${STATE_PAGE_URL}&dist_code=${encodeURIComponent(option.districtCode)}`;
      districtPages.push({
        districtCode: option.districtCode,
        districtName: option.districtName,
        url,
        html: await fetchHtml(url),
      });
    }

    return NjdgCaptureBundleSchema.parse({
      capturedAt: new Date().toISOString(),
      stateCode: "HP",
      sourceName: SOURCE_NAME,
      sourceAttribution: SOURCE_ATTRIBUTION,
      statePage: {
        url: STATE_PAGE_URL,
        html: stateHtml,
      },
      districtPages,
    });
  }
}

export class FixtureHimachalSourceClient implements HimachalSourceClient {
  constructor(private readonly fixturesDirectory: string) {}

  async captureLatest(): Promise<NjdgCaptureBundle> {
    const stateHtml = await readFile(join(this.fixturesDirectory, "state.html"), "utf8");
    const districtOptions = extractDistrictOptions(stateHtml);
    const districtFileNames = new Set(await readdir(join(this.fixturesDirectory, "districts")));

    const districtPages = await Promise.all(
      districtOptions.map(async (option) => {
        const fileName = `${option.districtCode}.html`;
        if (!districtFileNames.has(fileName)) {
          throw new Error(`Missing district fixture ${fileName}`);
        }

        return {
          districtCode: option.districtCode,
          districtName: option.districtName,
          url: `${STATE_PAGE_URL}&dist_code=${encodeURIComponent(option.districtCode)}`,
          html: await readFile(join(this.fixturesDirectory, "districts", fileName), "utf8"),
        };
      }),
    );

    return NjdgCaptureBundleSchema.parse({
      capturedAt: "2026-04-14T00:00:00.000Z",
      stateCode: "HP",
      sourceName: SOURCE_NAME,
      sourceAttribution: SOURCE_ATTRIBUTION,
      statePage: {
        url: STATE_PAGE_URL,
        html: stateHtml,
      },
      districtPages,
    });
  }
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

import {
  HighCourtCaptureBundleSchema,
  type HighCourtCaptureBundle,
} from "../domain/high-court-capture-schema.js";
import { extractHighCourtBenchOptions } from "../extract/high-court-njdg-html.js";
import { getHighCourtProfile, type HighCourtProfile, type SupportedHighCourtCode } from "../high-courts.js";

export interface HighCourtSourceClient {
  captureLatest(): Promise<HighCourtCaptureBundle>;
}

export class HcNjdgSourceClient implements HighCourtSourceClient {
  constructor(private readonly profile: HighCourtProfile) {}

  async captureLatest(): Promise<HighCourtCaptureBundle> {
    const homePageUrl = buildHighCourtPageUrl(this.profile);
    const html = await fetchHtml(homePageUrl);

    return HighCourtCaptureBundleSchema.parse({
      capturedAt: new Date().toISOString(),
      courtCode: this.profile.courtCode,
      courtName: this.profile.courtName,
      stateCode: this.profile.stateCode,
      stateName: this.profile.stateName,
      sourceName: `HC NJDG ${this.profile.courtName} dashboard`,
      sourceAttribution: `High Courts of India National Judicial Data Grid for ${this.profile.courtName}`,
      homePage: {
        url: homePageUrl,
        html,
      },
      benchOptions: extractHighCourtBenchOptions(html),
    });
  }
}

export class HcNjdgHimachalSourceClient extends HcNjdgSourceClient {
  constructor() {
    super(getHighCourtProfile("HPHC"));
  }
}

export function buildHighCourtPageUrl(profile: HighCourtProfile): string {
  if (profile.hcNjdgStateValue.length === 0) {
    throw new Error(`Missing HC NJDG state selector value for ${profile.courtCode}.`);
  }

  return `${profile.sourceUrls.hcNjdg}?p=home&state_code=${encodeURIComponent(profile.hcNjdgStateValue)}`;
}

export function createHighCourtSourceClient(courtCode: SupportedHighCourtCode): HighCourtSourceClient {
  return new HcNjdgSourceClient(getHighCourtProfile(courtCode));
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "NyaayWatch/0.1 (+https://github.com/rudrakshbhandari/nyaaywatch)",
      accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch High Court NJDG page ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

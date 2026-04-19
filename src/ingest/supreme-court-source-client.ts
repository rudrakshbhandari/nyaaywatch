import { SupremeCourtCaptureBundleSchema, type SupremeCourtCaptureBundle } from "../domain/supreme-court-capture-schema.js";
import { getSupremeCourtProfile } from "../supreme-court.js";

export interface SupremeCourtSourceClient {
  captureLatest(): Promise<SupremeCourtCaptureBundle>;
}

export class SupremeCourtNjdgSourceClient implements SupremeCourtSourceClient {
  async captureLatest(): Promise<SupremeCourtCaptureBundle> {
    const profile = getSupremeCourtProfile();
    const html = await fetchHtml(profile.sourceUrls.scNjdg);

    return SupremeCourtCaptureBundleSchema.parse({
      capturedAt: new Date().toISOString(),
      courtCode: profile.courtCode,
      courtSlug: profile.courtSlug,
      courtName: profile.courtName,
      sourceName: "Supreme Court NJDG dashboard",
      sourceAttribution: "Supreme Court of India National Judicial Data Grid",
      homePage: {
        url: profile.sourceUrls.scNjdg,
        html,
      },
    });
  }
}

export function createSupremeCourtSourceClient(): SupremeCourtSourceClient {
  return new SupremeCourtNjdgSourceClient();
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
    throw new Error(`Failed to fetch Supreme Court NJDG page ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

import { NjdgCaptureBundleSchema, type NjdgCaptureBundle } from "../domain/njdg-capture-schema.js";

export interface AgeBucketTotals {
  lessThanOneYear: number;
  oneToThreeYears: number;
  threeToFiveYears: number;
  fiveToTenYears: number;
  aboveTenYears: number;
}

export interface ExtractedNjdgMetrics {
  pendingCases: number;
  institutedLastMonth: number;
  disposedLastMonth: number;
  ageBuckets: AgeBucketTotals;
}

export interface ExtractedNjdgDistrict extends ExtractedNjdgMetrics {
  districtCode: string;
  districtName: string;
}

export interface ExtractedNjdgSnapshot {
  capturedAt: string;
  sourceName: string;
  sourceAttribution: string;
  sourceSnapshotAt: string;
  state: ExtractedNjdgMetrics;
  districts: ExtractedNjdgDistrict[];
}

export function extractDistrictOptions(html: string): Array<{ districtCode: string; districtName: string }> {
  const selectHtml = captureRaw(html, /<select[^>]+id='dist_code1'[^>]*>([\s\S]*?)<\/select>/, "district select");
  return [...selectHtml.matchAll(/<option value="([^"]+)"[^>]*>([^<]+)<\/option>/g)]
    .map((match) => ({
      districtCode: match[1]?.trim() ?? "",
      districtName: stripTags(match[2] ?? "").trim(),
    }))
    .filter((option) => option.districtCode.length > 0);
}

export function extractSourceSnapshotAt(html: string): string {
  const rawDate = captureRaw(html, /Last Reviewed and Updated on\s*:\s*(\d{2}-\d{2}-\d{4})/, "source snapshot date");
  const [, day, month, year] = /(\d{2})-(\d{2})-(\d{4})/.exec(rawDate) ?? [];
  if (!day || !month || !year) {
    throw new Error("Could not parse NJDG source snapshot date.");
  }

  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toISOString();
}

export function extractCaptureBundle(bundle: NjdgCaptureBundle): ExtractedNjdgSnapshot {
  const parsedBundle = NjdgCaptureBundleSchema.parse(bundle);
  return {
    capturedAt: parsedBundle.capturedAt,
    sourceName: parsedBundle.sourceName,
    sourceAttribution: parsedBundle.sourceAttribution,
    sourceSnapshotAt: extractSourceSnapshotAt(parsedBundle.statePage.html),
    state: extractPageMetrics(parsedBundle.statePage.html),
    districts: parsedBundle.districtPages.map((page) => ({
      districtCode: page.districtCode,
      districtName: page.districtName,
      ...extractPageMetrics(page.html),
    })),
  };
}

function extractPageMetrics(html: string): ExtractedNjdgMetrics {
  return {
    pendingCases: parseIndianNumber(capture(html, /<h4 class="card-title mb-0 d-inline">Total Cases<\/h4><span[^>]*>([^<]+)/, "total cases")),
    institutedLastMonth: parseIndianNumber(capture(html, /fetchStateData\('ins',1\)[\s\S]*?>([\d,]+)</, "instituted in last month")),
    disposedLastMonth: parseIndianNumber(capture(html, /fetchStateData\('disp',1\)[\s\S]*?>([\d,]+)</, "disposed in last month")),
    ageBuckets: {
      lessThanOneYear: parseIndianNumber(capture(html, /fetchYearData\('tot0_1',1\)[\s\S]*?>([\d,]+(?:\s*\(\d+%\))?)</, "age bucket <1y")),
      oneToThreeYears: parseIndianNumber(capture(html, /fetchYearData\('tot1_3',1\)[\s\S]*?>([\d,]+(?:\s*\(\d+%\))?)</, "age bucket 1-3y")),
      threeToFiveYears: parseIndianNumber(capture(html, /fetchYearData\('tot3_5',1\)[\s\S]*?>([\d,]+(?:\s*\(\d+%\))?)</, "age bucket 3-5y")),
      fiveToTenYears: parseIndianNumber(capture(html, /fetchYearData\('tot5_10',1\)[\s\S]*?>([\d,]+(?:\s*\(\d+%\))?)</, "age bucket 5-10y")),
      aboveTenYears: parseIndianNumber(capture(html, /fetchYearData\('above_10',1\)[\s\S]*?>([\d,]+(?:\s*\(\d+%\))?)</, "age bucket >10y")),
    },
  };
}

function capture(html: string, pattern: RegExp, label: string): string {
  return stripTags(captureRaw(html, pattern, label)).trim();
}

function captureRaw(html: string, pattern: RegExp, label: string): string {
  const match = pattern.exec(html);
  const value = match?.[1];
  if (!value) {
    throw new Error(`Could not extract ${label} from NJDG HTML.`);
  }
  return value;
}

function parseIndianNumber(value: string): number {
  const digits = value.match(/[\d,]+/)?.[0];
  if (!digits) {
    throw new Error(`Could not parse numeric value from "${value}".`);
  }

  return Number(digits.replaceAll(",", ""));
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, "");
}

import {
  HighCourtCaptureBundleSchema,
  type HighCourtBenchOption,
  type HighCourtCaptureBundle,
  type HighCourtCoveredGeography,
} from "../domain/high-court-capture-schema.js";

export interface HighCourtMetricBreakdown {
  civilCases: number;
  criminalCases: number;
  totalCases: number;
}

export interface HighCourtAgeBucketTotals {
  lessThanOneYear: number;
  oneToThreeYears: number;
  threeToFiveYears: number;
  fiveToTenYears: number;
  aboveTenYears: number;
}

export interface ExtractedHighCourtSnapshot {
  capturedAt: string;
  courtCode: string;
  courtSlug: string;
  courtName: string;
  coveredGeographies: HighCourtCoveredGeography[];
  sourceName: string;
  sourceAttribution: string;
  sourceSnapshotAt: string | null;
  benchOptions: HighCourtBenchOption[];
  pendingCases: HighCourtMetricBreakdown;
  // `null` when NJDG is recomputing the monthly accumulator and has not published
  // the value yet (see extractMetricBreakdown). Callers carry the previous value
  // forward rather than treating the whole capture as a failure.
  institutedLastMonth: HighCourtMetricBreakdown | null;
  disposedLastMonth: HighCourtMetricBreakdown | null;
  ageBucketTotals: HighCourtAgeBucketTotals;
  caseTypes: string[];
}

export function extractHighCourtBenchOptions(html: string): HighCourtBenchOption[] {
  const selectHtml = captureRaw(html, /<select[^>]+id='dist_code'[^>]*>([\s\S]*?)<\/select>/, "High Court bench select");
  return [...selectHtml.matchAll(/<option value="([^"]+)"[^>]*>([^<]+)<\/option>/g)]
    .map((match) => ({
      benchCode: match[1]?.trim() ?? "",
      benchName: stripTags(match[2] ?? "").trim(),
    }))
    .filter((option) => option.benchCode.length > 0);
}

export function extractHighCourtCaseTypes(html: string): string[] {
  const selectHtml = captureRaw(html, /<select[^>]+id="case_type_gr"[^>]*>([\s\S]*?)<\/select>/, "High Court case type select");
  return [...selectHtml.matchAll(/<option value="[^"]+"[^>]*>([^<]+)<\/option>/g)]
    .map((match) => stripTags(match[1] ?? "").trim())
    .filter((label) => label.length > 0 && label !== "All");
}

export function extractHighCourtSourceSnapshotAt(html: string): string | null {
  const rawDate = /Last Reviewed and Updated on\s*:\s*(\d{2}-\d{2}-\d{4})/.exec(html)?.[1] ?? null;
  if (!rawDate) {
    return null;
  }

  const [, day, month, year] = /(\d{2})-(\d{2})-(\d{4})/.exec(rawDate) ?? [];
  if (!day || !month || !year) {
    return null;
  }

  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toISOString();
}

export function extractHighCourtCaptureBundle(bundle: HighCourtCaptureBundle): ExtractedHighCourtSnapshot {
  const parsedBundle = HighCourtCaptureBundleSchema.parse(bundle);
  const html = parsedBundle.homePage.html;

  return {
    capturedAt: parsedBundle.capturedAt,
    courtCode: parsedBundle.courtCode,
    courtSlug: parsedBundle.courtSlug,
    courtName: parsedBundle.courtName,
    coveredGeographies: parsedBundle.coveredGeographies,
    sourceName: parsedBundle.sourceName,
    sourceAttribution: parsedBundle.sourceAttribution,
    sourceSnapshotAt: extractHighCourtSourceSnapshotAt(html),
    benchOptions: parsedBundle.benchOptions,
    pendingCases: {
      civilCases: parseIndianNumber(capture(html, /<h4 class="card-title mb-0 d-inline">Civil Cases<\/h4><span[^>]*>([^<]+)/, "High Court civil pending cases")),
      criminalCases: parseIndianNumber(capture(html, /<h4 class="card-title mb-0 d-inline">Criminal Cases<\/h4><span[^>]*>([^<]+)/, "High Court criminal pending cases")),
      totalCases: parseIndianNumber(capture(html, /<h4 class="card-title mb-0 d-inline">Total Cases<\/h4><span[^>]*>([^<]+)/, "High Court total pending cases")),
    },
    institutedLastMonth: extractMetricBreakdown(html, "Instituted in last month"),
    disposedLastMonth: extractMetricBreakdown(html, "Disposal in last month"),
    ageBucketTotals: {
      lessThanOneYear: extractAgeBucketTotal(html, "Less than one year"),
      oneToThreeYears: extractAgeBucketTotal(html, "1 to 3 Years"),
      threeToFiveYears: extractAgeBucketTotal(html, "3 to 5 Years"),
      fiveToTenYears: extractAgeBucketTotal(html, "5 to 10 Years"),
      aboveTenYears: extractAgeBucketTotal(html, "Above 10 Years"),
    },
    caseTypes: extractHighCourtCaseTypes(html),
  };
}

function extractMetricBreakdown(html: string, label: string): HighCourtMetricBreakdown | null {
  const sectionHtml = captureRaw(
    html,
    new RegExp(`<span[^>]*>${escapeLabelForRegex(label)}<\\/span>[\\s\\S]*?<table[\\s\\S]*?<\\/table>`, "i"),
    `${label} section`,
  );

  const values = [...stripHtmlComments(sectionHtml).matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
    .map((match) => stripTags(match[1] ?? "").trim())
    .filter((value) => /[\d,]+/.test(value))
    .map((value) => parseIndianNumber(value));

  if (values.length >= 3) {
    const [civilCases, criminalCases, totalCases] = values;
    return { civilCases, criminalCases, totalCases };
  }

  // NJDG periodically recomputes the monthly accumulators (notably around the
  // calendar-month boundary). While it does, the High Court dashboard renders the
  // tile as an animated progress bar with the real value cells HTML-commented-out,
  // so no numeric cells survive. Treat that as "source has not published the value
  // yet" (null) instead of a hard failure, so one recomputing tile does not block
  // the whole capture and snowball into multi-day internal fetch lag. Genuine
  // markup drift (section present, no recompute placeholder) still fails loudly.
  if (isRecomputingMetricSection(sectionHtml)) {
    return null;
  }

  throw new Error(`Could not extract ${label.toLowerCase()} values from High Court HTML.`);
}

function isRecomputingMetricSection(sectionHtml: string): boolean {
  const hasProgressPlaceholder = /progress-bar|progressText/i.test(sectionHtml);
  const hasCommentedValueCells = /<!--[\s\S]*?<td[\s\S]*?-->/.test(sectionHtml);
  return hasProgressPlaceholder || hasCommentedValueCells;
}

function extractAgeBucketTotal(html: string, label: string): number {
  const sectionHtml = captureRaw(
    html,
    new RegExp(`<h6[^>]*>${escapeLabelForRegex(label)}<\\/h6>[\\s\\S]*?<tr>[\\s\\S]*?<\\/tr>`, "i"),
    `${label} age bucket section`,
  );
  const values = [...sectionHtml.matchAll(/<a[^>]*>([\d,]+(?:\s*\(\d+%\))?)<\/span>/g)].map((match) =>
    parseIndianNumber(match[1] ?? ""),
  );

  if (values.length < 3) {
    throw new Error(`Could not extract ${label.toLowerCase()} total from High Court HTML.`);
  }

  return values[2] ?? 0;
}

function capture(html: string, pattern: RegExp, label: string): string {
  return stripTags(captureRaw(html, pattern, label)).trim();
}

function captureRaw(html: string, pattern: RegExp, label: string): string {
  const match = pattern.exec(html);
  const value = match?.[1] ?? match?.[0];
  if (!value) {
    throw new Error(`Could not extract ${label} from High Court NJDG HTML.`);
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

function stripHtmlComments(value: string): string {
  return value.replace(/<!--[\s\S]*?-->/g, "");
}

function escapeLabelForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

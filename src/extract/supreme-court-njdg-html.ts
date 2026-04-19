import { SupremeCourtCaptureBundleSchema, type SupremeCourtCaptureBundle } from "../domain/supreme-court-capture-schema.js";

export interface SupremeCourtMetricBreakdown {
  civilCases: number;
  criminalCases: number;
  totalCases: number;
}

export interface SupremeCourtPendingBreakdown {
  registeredCases: number;
  unregisteredCases: number;
  totalCases: number;
}

export interface ExtractedSupremeCourtSnapshot {
  capturedAt: string;
  courtCode: "SCI";
  courtSlug: "supreme-court";
  courtName: "Supreme Court of India";
  sourceName: string;
  sourceAttribution: string;
  sourceSnapshotAt: string | null;
  pendingCivil: SupremeCourtPendingBreakdown;
  pendingCriminal: SupremeCourtPendingBreakdown;
  pendingRegisteredCases: number;
  pendingUnregisteredCases: number;
  pendingTotalCases: number;
  institutedLastMonth: SupremeCourtMetricBreakdown;
  disposedLastMonth: SupremeCourtMetricBreakdown;
  institutedCurrentYear: SupremeCourtMetricBreakdown;
  disposedCurrentYear: SupremeCourtMetricBreakdown;
}

export function extractSupremeCourtSourceSnapshotAt(_html: string): string | null {
  return null;
}

export function extractSupremeCourtCaptureBundle(bundle: SupremeCourtCaptureBundle): ExtractedSupremeCourtSnapshot {
  const parsedBundle = SupremeCourtCaptureBundleSchema.parse(bundle);
  const html = parsedBundle.homePage.html;
  const collapsed = collapseWhitespace(stripTags(html));
  const registeredValues = [...collapsed.matchAll(/\bRegistered Cases\b\s*([\d,]+)/gi)].map((match) =>
    parseIndianNumber(match[1] ?? ""),
  );
  const unregisteredValues = [...collapsed.matchAll(/\bUnregistered Cases\b\s*([\d,]+)/gi)].map((match) =>
    parseIndianNumber(match[1] ?? ""),
  );

  if (registeredValues.length < 2 || unregisteredValues.length < 2) {
    throw new Error("Could not extract registered and unregistered pending values from Supreme Court NJDG HTML.");
  }

  return {
    capturedAt: parsedBundle.capturedAt,
    courtCode: parsedBundle.courtCode,
    courtSlug: parsedBundle.courtSlug,
    courtName: parsedBundle.courtName,
    sourceName: parsedBundle.sourceName,
    sourceAttribution: parsedBundle.sourceAttribution,
    sourceSnapshotAt: extractSupremeCourtSourceSnapshotAt(html),
    pendingCivil: {
      totalCases: extractStandaloneMetric(html, "Pending Civil Cases"),
      registeredCases: registeredValues[0] ?? 0,
      unregisteredCases: unregisteredValues[0] ?? 0,
    },
    pendingCriminal: {
      totalCases: extractStandaloneMetric(html, "Pending Criminal Cases"),
      registeredCases: registeredValues[1] ?? 0,
      unregisteredCases: unregisteredValues[1] ?? 0,
    },
    pendingRegisteredCases: registeredValues[2] ?? registeredValues[0]! + registeredValues[1]!,
    pendingUnregisteredCases: unregisteredValues[2] ?? unregisteredValues[0]! + unregisteredValues[1]!,
    pendingTotalCases: extractStandaloneMetric(html, "Total Pending Cases"),
    institutedLastMonth: extractPeriodMetric(html, "Instituted in last month"),
    disposedLastMonth: extractPeriodMetric(html, "Disposal in last month"),
    institutedCurrentYear: extractPeriodMetric(html, "Instituted in current year"),
    disposedCurrentYear: extractPeriodMetric(html, "Disposal in current year"),
  };
}

function extractStandaloneMetric(html: string, label: string) {
  const collapsed = collapseWhitespace(stripTags(html));
  return parseIndianNumber(captureRaw(collapsed, new RegExp(`${escapeLabelForRegex(label)}\\s*([\\d,]+)`, "i"), label));
}

function extractPeriodMetric(html: string, label: string): SupremeCourtMetricBreakdown {
  const collapsed = collapseWhitespace(stripTags(html));
  const match = new RegExp(
    `${escapeLabelForRegex(label)} civil cases\\s*([\\d,]+)[\\s\\S]*?${escapeLabelForRegex(label)} criminal cases\\s*([\\d,]+)[\\s\\S]*?${escapeLabelForRegex(label)} total cases\\s*([\\d,]+)`,
    "i",
  ).exec(collapsed);

  if (!match) {
    throw new Error(`Could not extract ${label.toLowerCase()} values from Supreme Court NJDG HTML.`);
  }

  return {
    civilCases: parseIndianNumber(match[1] ?? ""),
    criminalCases: parseIndianNumber(match[2] ?? ""),
    totalCases: parseIndianNumber(match[3] ?? ""),
  };
}

function captureRaw(html: string, pattern: RegExp, label: string): string {
  const match = pattern.exec(html);
  const value = match?.[1] ?? match?.[0];
  if (!value) {
    throw new Error(`Could not extract ${label} from Supreme Court NJDG HTML.`);
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
  return value.replace(/<[^>]+>/g, " ");
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function escapeLabelForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

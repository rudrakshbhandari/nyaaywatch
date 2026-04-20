import { z } from "zod";

import { getHighCourtProfileByCode } from "../high-courts.js";

export const HighCourtPageCaptureSchema = z.object({
  url: z.string().url(),
  html: z.string().min(1),
});

export const HighCourtBenchOptionSchema = z.object({
  benchCode: z.string().min(1),
  benchName: z.string().min(1),
});

export const HighCourtCoveredGeographySchema = z.object({
  geographyCode: z.string().min(1),
  geographyName: z.string().min(1),
  geographyType: z.enum(["state", "union_territory"]),
  lowerCourtStateCode: z.string().min(1).optional(),
});

const HighCourtCaptureBundleCanonicalSchema = z.object({
  capturedAt: z.string().datetime(),
  courtCode: z.string().min(1),
  courtSlug: z.string().min(1),
  courtName: z.string().min(1),
  coveredGeographies: z.array(HighCourtCoveredGeographySchema).min(1),
  sourceName: z.string().min(1),
  sourceAttribution: z.string().min(1),
  homePage: HighCourtPageCaptureSchema,
  benchOptions: z.array(HighCourtBenchOptionSchema).min(1),
});

const HighCourtCaptureBundleLegacySchema = z
  .object({
    capturedAt: z.string().datetime(),
    courtCode: z.string().min(1),
    courtName: z.string().min(1),
    stateCode: z.string().min(1),
    stateName: z.string().min(1),
    sourceName: z.string().min(1),
    sourceAttribution: z.string().min(1),
    homePage: HighCourtPageCaptureSchema,
    benchOptions: z.array(HighCourtBenchOptionSchema).min(1),
  })
  .transform((legacy) => ({
    capturedAt: legacy.capturedAt,
    courtCode: legacy.courtCode,
    courtSlug: getHighCourtProfileByCode(legacy.courtCode)?.courtSlug ?? slugifyLegacyHighCourt(legacy.courtName, legacy.stateName),
    courtName: legacy.courtName,
    coveredGeographies: [
      {
        geographyCode: legacy.stateCode,
        geographyName: legacy.stateName,
        geographyType: "state" as const,
        lowerCourtStateCode: legacy.stateCode,
      },
    ],
    sourceName: legacy.sourceName,
    sourceAttribution: legacy.sourceAttribution,
    homePage: legacy.homePage,
    benchOptions: legacy.benchOptions,
  }));

export const HighCourtCaptureBundleSchema = z.union([
  HighCourtCaptureBundleCanonicalSchema,
  HighCourtCaptureBundleLegacySchema,
]);

export type HighCourtCaptureBundle = z.infer<typeof HighCourtCaptureBundleSchema>;
export type HighCourtBenchOption = z.infer<typeof HighCourtBenchOptionSchema>;
export type HighCourtCoveredGeography = z.infer<typeof HighCourtCoveredGeographySchema>;

function slugifyLegacyHighCourt(courtName: string, stateName: string) {
  const normalizedCourtName = courtName.trim().toLowerCase();
  if (normalizedCourtName.includes("himachal")) {
    return "himachal";
  }

  return stateName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

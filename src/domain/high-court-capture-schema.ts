import { z } from "zod";

export const HighCourtPageCaptureSchema = z.object({
  url: z.string().url(),
  html: z.string().min(1),
});

export const HighCourtBenchOptionSchema = z.object({
  benchCode: z.string().min(1),
  benchName: z.string().min(1),
});

export const HighCourtCaptureBundleSchema = z.object({
  capturedAt: z.string().datetime(),
  courtCode: z.string().min(1),
  courtName: z.string().min(1),
  stateCode: z.string().min(1),
  stateName: z.string().min(1),
  sourceName: z.string().min(1),
  sourceAttribution: z.string().min(1),
  homePage: HighCourtPageCaptureSchema,
  benchOptions: z.array(HighCourtBenchOptionSchema).min(1),
});

export type HighCourtCaptureBundle = z.infer<typeof HighCourtCaptureBundleSchema>;
export type HighCourtBenchOption = z.infer<typeof HighCourtBenchOptionSchema>;

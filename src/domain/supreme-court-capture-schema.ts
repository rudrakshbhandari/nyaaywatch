import { z } from "zod";

export const SupremeCourtPageCaptureSchema = z.object({
  url: z.string().url(),
  html: z.string().min(1),
});

export const SupremeCourtCaptureBundleSchema = z.object({
  capturedAt: z.string().datetime(),
  courtCode: z.literal("SCI"),
  courtSlug: z.literal("supreme-court"),
  courtName: z.literal("Supreme Court of India"),
  sourceName: z.string().min(1),
  sourceAttribution: z.string().min(1),
  homePage: SupremeCourtPageCaptureSchema,
});

export type SupremeCourtCaptureBundle = z.infer<typeof SupremeCourtCaptureBundleSchema>;

import { z } from "zod";

export const NjdgPageCaptureSchema = z.object({
  url: z.string().url(),
  html: z.string().min(1),
});

export const NjdgDistrictPageCaptureSchema = NjdgPageCaptureSchema.extend({
  districtCode: z.string().min(1),
  districtName: z.string().min(1),
});

export const NjdgCaptureBundleSchema = z.object({
  capturedAt: z.string().datetime(),
  stateCode: z.string().min(1),
  stateName: z.string().min(1),
  expectedDistrictCount: z.number().int().positive(),
  sourceName: z.string().min(1),
  sourceAttribution: z.string().min(1),
  statePage: NjdgPageCaptureSchema,
  districtPages: z.array(NjdgDistrictPageCaptureSchema).min(1),
});

export type NjdgCaptureBundle = z.infer<typeof NjdgCaptureBundleSchema>;
export type NjdgDistrictPageCapture = z.infer<typeof NjdgDistrictPageCaptureSchema>;

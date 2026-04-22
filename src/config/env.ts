import dotenv from "dotenv";
import { z } from "zod";

import { SUPPORTED_STATE_CODES } from "../geographies.js";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  AWS_REGION: z.literal("ap-south-1").default("ap-south-1"),
  AWS_ENDPOINT_URL_S3: z.string().url().optional(),
  AWS_S3_FORCE_PATH_STYLE: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z
    .string()
    .min(1)
    .regex(/^nyaaywatch-[a-z0-9-]+$/, "S3_BUCKET must be nyaaywatch-prefixed"),
  DEPLOY_ENV: z.enum(["dev", "staging"]).default("dev"),
  OPERATOR_API_TOKEN: z.string().min(8),
  ENABLE_OPERATOR_ROUTES: z
    .string()
    .optional()
    .transform((value) => value !== "false"),
  STATE_CODE: z.enum(SUPPORTED_STATE_CODES).default("HP"),
  CANONICAL_HOST: z.string().min(1).optional(),
  PUBLIC_BASE_URL: z.string().url().optional(),
  LEGACY_HOSTS: z
    .string()
    .optional()
    .transform((value) =>
      value
        ?.split(",")
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean) ?? [],
    ),
  CLOUDFLARE_API_TOKEN: z.string().min(1).optional(),
  CLOUDFLARE_ZONE_ID: z.string().min(1).optional(),
  CLOUDFLARE_ZONE_NAME: z.string().min(1).optional(),
  SES_SOURCE_EMAIL: z.string().email().optional(),
  AWS_RUM_APP_MONITOR_ID: z.string().min(1).optional(),
  AWS_RUM_IDENTITY_POOL_ID: z.string().min(1).optional(),
});

export type AppConfig = z.infer<typeof EnvSchema>;

export function loadConfig(rawEnv: NodeJS.ProcessEnv = process.env): AppConfig {
  return EnvSchema.parse(rawEnv);
}

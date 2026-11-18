import dotenv from "dotenv";
import { z } from "zod";

import { SUPPORTED_STATE_CODES } from "../geographies.js";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  RUNTIME_REGION: z.string().min(1).default("centralindia"),
  AZURE_STORAGE_ACCOUNT_URL: z.string().url().optional(),
  AZURE_STORAGE_CONNECTION_STRING: z.string().min(1).optional(),
  AZURE_STORAGE_CONTAINER: z.string().min(1).optional(),
  AZURE_CLIENT_ID: z.string().uuid().optional(),
  DEPLOY_ENV: z.enum(["dev", "staging", "production"]).default("dev"),
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
  MIGRATION_WRITE_FREEZE: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  CLOUDFLARE_API_TOKEN: z.string().min(1).optional(),
  CLOUDFLARE_ZONE_ID: z.string().min(1).optional(),
  CLOUDFLARE_ZONE_NAME: z.string().min(1).optional(),
  CLOUDFLARE_WEB_ANALYTICS_TOKEN: z.string().min(1).optional(),
  AZURE_COMMUNICATION_CONNECTION_STRING: z.string().min(1).optional(),
  AZURE_EMAIL_SENDER: z.string().email().optional(),
  ALARM_EMAIL_TO: z.string().email().optional(),
}).superRefine((value, context) => {
  if (!value.AZURE_STORAGE_CONNECTION_STRING && !value.AZURE_STORAGE_ACCOUNT_URL) {
    context.addIssue({ code: "custom", path: ["AZURE_STORAGE_ACCOUNT_URL"], message: "AZURE_STORAGE_ACCOUNT_URL or AZURE_STORAGE_CONNECTION_STRING is required for artifact storage." });
  }
  if (!value.AZURE_STORAGE_CONTAINER) {
    context.addIssue({ code: "custom", path: ["AZURE_STORAGE_CONTAINER"], message: "AZURE_STORAGE_CONTAINER is required for artifact storage." });
  }
});

export type AppConfig = z.infer<typeof EnvSchema>;

export function loadConfig(rawEnv: NodeJS.ProcessEnv = process.env): AppConfig {
  return EnvSchema.parse(rawEnv);
}

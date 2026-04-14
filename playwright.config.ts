import { defineConfig } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 4211);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `tsx tests/e2e/test-server.ts`,
    url: `${baseURL}/health`,
    timeout: 30_000,
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: "test",
      E2E_PORT: String(port),
    },
  },
});

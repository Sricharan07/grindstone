import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseUrl ?? "http://127.0.0.1:3010";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: "line",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command:
          "NEXT_DIST_DIR=.next-e2e DATABASE_URL='' REDIS_URL='' AUTH_REQUIRED=false NEXT_PUBLIC_E2E_CLOCK=true PISTON_URL=http://127.0.0.1:9 node_modules/.bin/next dev --hostname 127.0.0.1 --port 3010",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});

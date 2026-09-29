import { config as loadEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

loadEnv({ path: ".env.test.local", quiet: true });
loadEnv({ path: ".env.local", quiet: true });

// The dev server and the spec's PrismaClient must share one database, so the
// seeded user is visible to the app under test.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

const port = 3100;
const baseURL = `http://localhost:${port}`;
const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const secret = process.env.NEXTAUTH_SECRET ?? "playwright-smoke-secret";

export default defineConfig({
  testDir: "tests/smoke",
  timeout: 30_000,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npx next dev -p ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: databaseUrl ?? "",
      DATABASE_URL_UNPOOLED: databaseUrl ?? "",
      NEXTAUTH_SECRET: secret,
    },
  },
});

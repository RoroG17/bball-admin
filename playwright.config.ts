import { defineConfig, devices } from "@playwright/test";
import { APP_URL, APP_URL_BACK_DELIVERED, E2E_SESSION_SECRET, MOCK_API_URL } from "./tests/e2e/helpers";

export default defineConfig({
  testDir: "./tests/e2e",
  // Le scénario du faux back est global : les tests s'exécutent un par un.
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: {
    baseURL: APP_URL,
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npx tsx tests/e2e/mock-api/server.ts",
      url: `${MOCK_API_URL}/__hits`,
      reuseExistingServer: false,
    },
    {
      command: "npx next dev --port 3100",
      url: `${APP_URL}/favicon.ico`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { BBALL_API_URL: MOCK_API_URL, SESSION_SECRET: E2E_SESSION_SECRET, HISTORY_REVALIDATE_SECONDS: "0" },
    },
    {
      // Second serveur : simule le « back livré » des journaux (B-LOG-1 à B-LOG-4). `LOG_BACK_SUPPORT_OVERRIDE` n'est lu que
      // si NODE_ENV=test ; dossier de build séparé pour cohabiter avec le serveur ci-dessus.
      command: "npx next dev --port 3101",
      url: `${APP_URL_BACK_DELIVERED}/favicon.ico`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        BBALL_API_URL: MOCK_API_URL,
        SESSION_SECRET: E2E_SESSION_SECRET,
        HISTORY_REVALIDATE_SECONDS: "0",
        NODE_ENV: "test",
        LOG_BACK_SUPPORT_OVERRIDE: "all",
        NEXT_DIST_DIR: ".next-e2e-logs",
      },
    },
  ],
});

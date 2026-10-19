import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "server-only", replacement: `${root}tests/mocks/server-only.ts` },
      { find: /^@\//, replacement: root },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    env: {
      BBALL_API_URL: "http://api.test",
      SESSION_SECRET: "test-secret-test-secret-test-secret-0123",
    },
  },
});

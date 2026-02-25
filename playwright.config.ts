import { defineConfig } from "@playwright/test"

export default defineConfig({
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:4000",
    video: "off",
    screenshot: "off",
    trace: "off",
  },
  webServer: {
    command: "bun run build && bun tests/server.tsx",
    port: 4000,
    reuseExistingServer: !process.env.CI,
  },
  testDir: "./tests",
})

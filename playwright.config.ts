import { defineConfig } from "@playwright/test";

type Options = { renderer: "html" | "react" | "vue" };

const ci = !!process.env.CI;

export default defineConfig<Options>({
	fullyParallel: true,
	forbidOnly: ci,
	retries: ci ? 1 : 0,
	reporter: ci ? [["github"], ["html", { open: "never" }]] : [["list"]],
	use: {
		baseURL: "http://localhost:4000",
		video: "off",
		screenshot: "off",
		trace: ci ? "on-first-retry" : "off",
	},
	projects: [
		{ name: "html", use: { renderer: "html", browserName: "chromium" } },
		{ name: "react", use: { renderer: "react", browserName: "chromium" } },
		{ name: "vue", use: { renderer: "vue", browserName: "chromium" } },
		{ name: "html-webkit", use: { renderer: "html", browserName: "webkit" } },
		{ name: "html-firefox", use: { renderer: "html", browserName: "firefox" } },
	],
	webServer: {
		command: process.env.CI
			? "bun tests/server.ts"
			: "bun run build && bun tests/server.ts",
		port: 4000,
		reuseExistingServer: !process.env.CI,
	},
	testDir: "./tests",
});

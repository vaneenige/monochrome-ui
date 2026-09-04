import { defineConfig } from "@playwright/test";

type Options = { renderer: "html" | "react" | "vue" };

export default defineConfig<Options>({
	fullyParallel: true,
	use: {
		baseURL: "http://localhost:4000",
		video: "off",
		screenshot: "off",
		trace: "off",
	},
	projects: [
		{ name: "html", use: { renderer: "html" } },
		{ name: "react", use: { renderer: "react" } },
		{ name: "vue", use: { renderer: "vue" } },
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

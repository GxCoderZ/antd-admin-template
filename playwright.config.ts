import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	reporter: "list",
	use: {
		baseURL: "http://127.0.0.1:4173",
		screenshot: "only-on-failure",
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"], locale: "zh-CN" },
		},
	],
	webServer: {
		command:
			"pnpm run build:prod && pnpm exec vite preview --host 127.0.0.1 --port 4173",
		url: "http://127.0.0.1:4173/login",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});

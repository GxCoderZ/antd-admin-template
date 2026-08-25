import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: !process.env.CI,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	...(process.env.CI ? { workers: 1 } : {}),
	reporter: process.env.CI
		? [["list"], ["html", { open: "never" }]]
		: "list",
	timeout: 30_000,
	use: {
		baseURL: "http://127.0.0.1:4173",
		actionTimeout: 10_000,
		navigationTimeout: 15_000,
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

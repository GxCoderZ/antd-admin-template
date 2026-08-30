import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";
import { vitePluginFakeServer } from "vite-plugin-fake-server";

import packageJson from "./package.json" with { type: "json" };

export default defineConfig(({ mode }) => {
	const isGithubPages = process.env.GITHUB_PAGES === "true";
	const githubPagesBasePath = isGithubPages
		? process.env.GITHUB_PAGES_BASE_PATH?.replace(/^\/+|\/+$/g, "")
		: undefined;
	const buildMetadata = {
		builtAt: new Date().toISOString(),
		commitSha:
			process.env.GITHUB_SHA ??
			process.env.CF_PAGES_COMMIT_SHA ??
			process.env.GIT_COMMIT_SHA ??
			"local",
		environment: isGithubPages
			? "github-pages"
			: process.env.CF_PAGES === "1"
				? "cloudflare-pages"
				: mode === "production"
					? "local-production"
					: "local-development",
		version: packageJson.version,
	};

	return {
		base: githubPagesBasePath ? `/${githubPagesBasePath}/` : "/",
		define: {
			__BUILD_METADATA__: JSON.stringify(buildMetadata),
		},
		plugins: [
			react(),
			mode !== "test" &&
				vitePluginFakeServer({
					basename: "/api",
					enableDev: true,
					enableProd: true,
					timeout: 180,
				}),
		],
		resolve: {
			alias: [
				{
					find: "#src",
					replacement: fileURLToPath(new URL("./src", import.meta.url)),
				},
				...(mode === "test"
					? [
							{
								find: /^@ant-design\/pro-components$/,
								replacement: fileURLToPath(
									new URL(
										"./node_modules/@ant-design/pro-components/es/index.js",
										import.meta.url,
									),
								),
							},
						]
					: []),
			],
		},
		server: {
			port: 3003,
		},
		preview: {
			port: 3003,
		},
		test: {
			environment: "jsdom",
			setupFiles: ["./src/test/setup.ts"],
			css: true,
			exclude: [...configDefaults.exclude, "e2e/**"],
			server: {
				deps: {
					inline: [/@ant-design\/pro-components/, /\/antd\/es\//],
				},
			},
			testTimeout: 20_000,
		},
	};
});

import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";
import { vitePluginFakeServer } from "vite-plugin-fake-server";

import packageJson from "./package.json" with { type: "json" };

const installedDependencies = {
	...packageJson.dependencies,
	...packageJson.devDependencies,
};

export default defineConfig(({ mode }) => {
	const buildMetadata = {
		builtAt: new Date().toISOString(),
		commitSha:
			process.env.CF_PAGES_COMMIT_SHA ?? process.env.GIT_COMMIT_SHA ?? "local",
		environment:
			process.env.CF_PAGES === "1"
				? "cloudflare-pages"
				: mode === "production"
					? "local-production"
					: "local-development",
		version: packageJson.version,
	};

	return {
		define: {
			__ADMIN_WEB_DEPENDENCIES__: JSON.stringify(packageJson.dependencies),
			__BUILD_METADATA__: JSON.stringify(buildMetadata),
			__INSTALLED_DEPENDENCIES__: JSON.stringify(installedDependencies),
			__WORKSPACE_TOOL_VERSIONS__: JSON.stringify({
				node: packageJson.engines.node,
				pnpm: packageJson.packageManager.replace("pnpm@", ""),
			}),
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

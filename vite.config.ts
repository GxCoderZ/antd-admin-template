import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import { vitePluginFakeServer } from "vite-plugin-fake-server";

import packageJson from "./package.json" with { type: "json" };

const installedDependencies = {
	...packageJson.dependencies,
	...packageJson.devDependencies,
};

export default defineConfig(({ mode }) => ({
	define: {
		__ADMIN_WEB_DEPENDENCIES__: JSON.stringify(packageJson.dependencies),
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
		alias: {
			"#src": fileURLToPath(new URL("./src", import.meta.url)),
		},
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
		testTimeout: 20_000,
	},
}));

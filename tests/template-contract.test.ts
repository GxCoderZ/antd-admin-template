import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

function read(relativePath: string) {
	const filePath = path.join(root, relativePath);
	return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

describe("product UI template contract", () => {
	it("runs exclusively on the local Fake Server in development and preview", () => {
		const viteConfig = read("vite.config.ts");

		expect(viteConfig).toContain("vitePluginFakeServer");
		expect(viteConfig).toContain("basename: \"/api\"");
		expect(viteConfig).toContain("enableProd: true");
		expect(viteConfig).toContain("mode !== \"test\"");
		expect(viteConfig).not.toContain("proxy:");
		expect(viteConfig).not.toContain("localhost:8082");
	});

	it("ships the common Fake domains required by every product UI repository", () => {
		const requiredFiles = [
			"fake/auth.fake.ts",
			"fake/system.fake.ts",
			"fake/dashboard.fake.ts",
			"fake/audit.fake.ts",
		];
		const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(root, file)));

		expect(missingFiles).toEqual([]);
	});

	it("documents the Fake-only and independent-snapshot repository model", () => {
		const agents = read("AGENTS.md");
		const readme = read("README.md");

		expect(agents).toContain("Fake-only");
		expect(agents).toContain("禁止连接真实后端");
		expect(readme).toContain("独立快照");
	});
});

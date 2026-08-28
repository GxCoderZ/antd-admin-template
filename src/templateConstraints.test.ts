import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

function listRuntimeSourceFiles(directory: string): string[] {
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			return listRuntimeSourceFiles(entryPath);
		}
		if (!/\.(?:ts|tsx)$/.test(entry.name) || entry.name.includes(".test.")) {
			return [];
		}
		return [entryPath];
	});
}

describe("product UI template constraints", () => {
	it("keeps every API domain split into index.ts and types.ts", () => {
		const apiRoot = path.join(root, "src", "api");
		const domains = fs
			.readdirSync(apiRoot, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name);
		const missingFiles = domains.flatMap((domain) =>
			["index.ts", "types.ts"]
				.filter((file) => !fs.existsSync(path.join(apiRoot, domain, file)))
				.map((file) => `${domain}/${file}`),
		);

		expect(missingFiles).toEqual([]);
	});

	it("keeps every API domain behind a corresponding Fake HTTP module", () => {
		const apiRoot = path.join(root, "src", "api");
		const domains = fs
			.readdirSync(apiRoot, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name);
		const missingFakeDomains = domains.filter(
			(domain) => !fs.existsSync(path.join(root, "fake", `${domain}.fake.ts`)),
		);

		expect(missingFakeDomains).toEqual([]);
	});

	it("does not expose Fake transport URLs to UI code", () => {
		const sourceRoot = path.join(root, "src");
		const violations = listRuntimeSourceFiles(sourceRoot).flatMap((file) => {
			const source = fs.readFileSync(file, "utf8");
			const relativeFile = path.relative(root, file).replaceAll("\\", "/");
			const reasons = [
				relativeFile !== "src/api/client.ts" && /["'`]\/api\//.test(source)
					? "contains a raw /api URL"
					: undefined,
			].filter(Boolean);

			return reasons.map((reason) => `${relativeFile}: ${reason}`);
		});

		expect(violations).toEqual([]);
	});

	it("keeps Fake modules portable and their route URLs basename-free", () => {
		const fakeFiles = listRuntimeSourceFiles(path.join(root, "fake"));
		const violations = fakeFiles.flatMap((file) => {
			const source = fs.readFileSync(file, "utf8");
			const relativeFile = path.relative(root, file).replaceAll("\\", "/");
			const reasons = [
				/from\s+["']node:/.test(source) ? "imports a Node module" : undefined,
				/url:\s*["'`]\/api\//.test(source)
					? "contains the configured /api basename"
					: undefined,
			].filter(Boolean);

			return reasons.map((reason) => `${relativeFile}: ${reason}`);
		});

		expect(violations).toEqual([]);
	});

	it("enables only the Fake Server in development and production preview", () => {
		const viteConfig = fs.readFileSync(
			path.join(root, "vite.config.ts"),
			"utf8",
		);
		const runtimeSources = listRuntimeSourceFiles(path.join(root, "src"))
			.map((file) => fs.readFileSync(file, "utf8"))
			.join("\n");

		expect(viteConfig).toContain('basename: "/api"');
		expect(viteConfig).toContain("enableDev: true");
		expect(viteConfig).toContain("enableProd: true");
		expect(viteConfig).not.toMatch(/\bproxy\s*:/);
		expect(runtimeSources).not.toMatch(/https?:\/\//);
	});
});

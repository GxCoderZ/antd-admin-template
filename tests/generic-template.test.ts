import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

function read(relativePath: string) {
	return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function collectSourceText(directory: string) {
	const files: string[] = [];
	const walk = (current: string) => {
		for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
			const target = path.join(current, entry.name);
			if (entry.isDirectory())
				walk(target);
			else if (/\.(?:ts|tsx)$/.test(entry.name))
				files.push(target);
		}
	};
	walk(path.join(root, directory));
	return files.map(file => fs.readFileSync(file, "utf8")).join("\n");
}

describe("generic template cleanup", () => {
	it("uses a generic auth domain and login route", () => {
		expect(fs.existsSync(path.join(root, "src/api/auth/index.ts"))).toBe(true);
		expect(fs.existsSync(path.join(root, "src/api/tenant"))).toBe(false);
		expect(read("src/router/extra-info/route-path.ts")).toContain("/login");
		expect(read("src/pages/login/components/password-login.tsx")).toContain("admin123");
		expect(read("src/pages/login/components/password-login.tsx")).toContain("viewer123");
	});

	it("contains no tenant backend paths or tenant-only page", () => {
		const source = `${collectSourceText("src")}\n${collectSourceText("fake")}`;

		expect(source).not.toContain("/api/tenant");
		expect(source).not.toContain("/tenant/");
		expect(fs.existsSync(path.join(root, "src/pages/tenant-info"))).toBe(false);
		expect(fs.existsSync(path.join(root, "src/router/routes/static/account.ts"))).toBe(false);
	});
});

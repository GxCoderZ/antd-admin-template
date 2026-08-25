import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

function read(relativePath: string) {
	return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("authentication and dashboard UI contract", () => {
	it("uses one focused auth shell and keeps both demo identities discoverable", () => {
		const loginPage = read("src/pages/login/index.tsx");
		const passwordLogin = read("src/pages/login/components/password-login.tsx");
		const authShell = read("src/pages/login/components/auth-page-shell.tsx");

		expect(loginPage).toContain("AuthPageShell");
		expect(authShell).toContain("maxWidth: 440");
		expect(passwordLogin).toContain("admin123");
		expect(passwordLogin).toContain("viewer123");
		expect(loginPage).not.toContain("Banner");
		expect(loginPage).not.toContain("pageTitle");
	});

	it("registers forgot-password as a public core route", () => {
		const routePaths = read("src/router/extra-info/route-path.ts");
		const routeIndex = read("src/router/routes/index.ts");
		const authRoutes = read("src/router/routes/core/auth.ts");

		expect(routePaths).toContain("/forgot-password");
		expect(routeIndex).toContain("forgotPasswordPath");
		expect(authRoutes).toContain("#src/pages/forgot-password");
	});

	it("keeps dashboard data behind the API and metadata outside the page orchestrator", () => {
		const dashboard = read("src/pages/dashboard/index.tsx");
		const constants = read("src/pages/dashboard/constants.tsx");

		expect(dashboard).toContain("fetchDashboardSummary");
		expect(dashboard).toContain("usePermission");
		expect(dashboard).not.toContain("用户数");
		expect(dashboard).not.toContain("fake/");
		expect(constants).toContain("createDashboardMetrics");
	});
});

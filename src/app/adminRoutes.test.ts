import { describe, expect, it } from "vitest";

import {
	adminNavigationGroups,
	adminRouteDefinitions,
	getAdminRouteMetadata,
} from "./adminRoutes";

describe("admin route template", () => {
	it("contains the complete reference administration surface", () => {
		expect(adminRouteDefinitions.map((route) => route.key)).toEqual([
			"/dashboard",
			"/organization/users",
			"/access/roles",
			"/system/announcements",
			"/operations/audit-logs",
			"/operations/login-logs",
			"/examples/lists/basic",
			"/examples/lists/search/articles",
			"/examples/lists/search/projects",
			"/examples/lists/search/applications",
			"/examples/lists/cards",
			"/examples/detail",
			"/result/success",
			"/result/fail",
			"/examples/files",
			"/examples/forms/basic",
			"/examples/forms/step",
			"/system/settings",
			"/system/about",
			"/exception/403",
			"/exception/404",
			"/exception/500",
			"/account/notifications",
			"/account/profile",
			"/account/settings",
		]);
	});

	it("keeps result and exception pages as first-level navigation groups", () => {
		expect(adminNavigationGroups.map((group) => group.key)).toEqual(
			expect.arrayContaining(["results", "exceptions"]),
		);
	});

	it("maps unknown authenticated locations to the 404 page metadata", () => {
		expect(getAdminRouteMetadata("/missing-page").key).toBe("/exception/404");
	});

	it("keeps system settings subpages in the same route workspace", () => {
		expect(getAdminRouteMetadata("/system/settings/appearance").key).toBe(
			"/system/settings",
		);

		const settingsRoute = adminRouteDefinitions.find(
			(route) => route.key === "/system/settings",
		);
		const appearanceRoute = settingsRoute?.aliases?.find(
			(alias) => alias.path === "/system/settings/appearance",
		);

		expect(appearanceRoute).toBeDefined();
		expect(appearanceRoute?.lazy).toEqual(expect.any(Function));
		expect(appearanceRoute?.lazy).not.toBe(settingsRoute?.lazy);
	});
});

import { describe, expect, it } from "vitest";

import {
	adminCollapsibleSidebarGroupKeys,
	adminNavigationGroups,
	adminRouteDefinitions,
	getAdminRouteMetadata,
	getAdminRouteOpenKeys,
} from "./adminRoutes";

describe("admin route template", () => {
	it("contains the complete reference administration surface", () => {
		expect(adminRouteDefinitions.map((route) => route.key)).toEqual([
			"/dashboard",
			"/organization/users",
			"/access/roles",
			"/organization/departments",
			"/organization/positions",
			"/system/dictionaries",
			"/system/announcements",
			"/operations/audit-logs",
			"/operations/login-logs",
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

	it("keeps showcase pages out of the administration navigation", () => {
		const navigationGroupKeys = adminNavigationGroups.map((group) => group.key);
		const routeKeys = adminRouteDefinitions.map((route) => route.key);

		expect(navigationGroupKeys).toEqual(["operations", "system"]);
		expect(adminCollapsibleSidebarGroupKeys).toEqual(["operations", "system"]);
		expect(routeKeys.some((key) => key.startsWith("/examples/"))).toBe(false);
		expect(routeKeys.some((key) => key.startsWith("/result/"))).toBe(false);
		expect(navigationGroupKeys).not.toContain("exceptions");
		expect(
			adminNavigationGroups.flatMap((group) =>
				group.nodes.map((node) => node.routeKey),
			),
		).not.toEqual(expect.arrayContaining(["/exception/403"]));
	});

	it("opens only foundation groups in sidebar navigation", () => {
		const usersRoute = getAdminRouteMetadata("/organization/users");
		const auditRoute = getAdminRouteMetadata("/operations/audit-logs");
		const forbiddenRoute = getAdminRouteMetadata("/exception/403");

		expect(getAdminRouteOpenKeys(usersRoute)).toEqual(["system"]);
		expect(getAdminRouteOpenKeys(auditRoute)).toEqual(["operations"]);
		expect(getAdminRouteOpenKeys(forbiddenRoute)).toEqual([]);
		expect(getAdminRouteMetadata("/examples/forms/basic").key).toBe(
			"/exception/404",
		);
		expect(getAdminRouteMetadata("/examples/lists/search/articles").key).toBe(
			"/exception/404",
		);
		expect(getAdminRouteMetadata("/result/success").key).toBe("/exception/404");
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

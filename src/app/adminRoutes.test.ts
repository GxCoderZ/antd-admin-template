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
			"/operations/audit-logs",
			"/operations/login-logs",
			"/system/settings",
			"/system/about",
			"/result/success",
			"/result/fail",
			"/exception/403",
			"/exception/404",
			"/exception/500",
			"/account/profile",
			"/account/settings",
		]);
	});

	it("exposes the original result and exception menu groups", () => {
		expect(adminNavigationGroups.map((group) => group.key)).toEqual([
			"operations",
			"system",
			"result",
			"exception",
		]);
		expect(
			adminNavigationGroups.find((group) => group.key === "result")?.nodes,
		).toEqual([{ routeKey: "/result/success" }, { routeKey: "/result/fail" }]);
		expect(
			adminNavigationGroups.find((group) => group.key === "exception")?.nodes,
		).toEqual([
			{ routeKey: "/exception/403" },
			{ routeKey: "/exception/404" },
			{ routeKey: "/exception/500" },
		]);
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

import { describe, expect, it } from "vitest";

import { adminRouteDefinitions, getAdminRouteMetadata } from "./adminRoutes";

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
			"/exception/403",
			"/exception/404",
			"/exception/500",
			"/account/profile",
			"/account/settings",
		]);
	});

	it("maps unknown authenticated locations to the 404 page metadata", () => {
		expect(getAdminRouteMetadata("/missing-page").key).toBe("/exception/404");
	});

	it("keeps system settings subpages in the same route workspace", () => {
		expect(getAdminRouteMetadata("/system/settings/appearance").key).toBe(
			"/system/settings",
		);
	});
});

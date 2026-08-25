import { describe, expect, it } from "vitest";

import roleRoutes from "./roles.fake";

interface TestRoute {
	method?: string;
	response?: () => unknown;
	url: string;
}

describe("Fake roles", () => {
	it("uses Chinese display names for built-in roles", () => {
		const listRoles = (roleRoutes as unknown as TestRoute[]).find(
			(route) => route.method === "get" && route.url === "/platform/roles",
		)?.response;

		expect(listRoles).toBeDefined();
		expect(listRoles?.()).toMatchObject({
			data: {
				items: [
					{ displayName: "平台管理员" },
					{ displayName: "运营管理员" },
					{ displayName: "只读审计员" },
				],
			},
		});
	});
});

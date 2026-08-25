import { describe, expect, it } from "vitest";

import type { PlatformRole } from "../src/api/roles";
import roleRoutes from "./roles.fake";

interface RoleListPayload {
	data: { items: PlatformRole[] };
}

interface TestRoute {
	method?: string;
	response?: (request?: { params: Record<string, string> }) => unknown;
	url: string;
}

describe("Fake roles", () => {
	it("uses Chinese display names for built-in roles", () => {
		const listRoles = (roleRoutes as unknown as TestRoute[]).find(
			(route) => route.method === "get" && route.url === "/platform/roles",
		)?.response;

		expect(listRoles).toBeDefined();
		const response = listRoles?.() as RoleListPayload | undefined;

		expect(response).toMatchObject({
			data: {
				items: [
					{
						builtIn: true,
						displayName: "平台管理员",
					},
					{ builtIn: false, displayName: "运营管理员" },
					{ builtIn: false, displayName: "只读审计员" },
				],
			},
		});
		expect(
			response?.data.items.every(
				(role) =>
					Number.isFinite(Date.parse(role.createdAt)) &&
					Number.isFinite(Date.parse(role.updatedAt)),
			),
		).toBe(true);
	});

	it("rejects deletion of built-in roles at the Fake API boundary", () => {
		const deleteRole = (roleRoutes as unknown as TestRoute[]).find(
			(route) =>
				route.method === "delete" && route.url === "/platform/roles/:roleId",
		)?.response;

		expect(deleteRole).toBeDefined();
		expect(deleteRole?.({ params: { roleId: "role-admin" } })).toEqual({
			code: 409,
			data: null,
			msg: "Built-in roles cannot be deleted",
		});
	});
});

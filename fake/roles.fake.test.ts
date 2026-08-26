import { describe, expect, it } from "vitest";

import type { PlatformRole } from "../src/api/roles";
import roleRoutes from "./roles.fake";
import { findFakeRoute } from "./route-helpers";

describe("Fake roles", () => {
	it("uses Chinese display names for built-in roles", () => {
		const listRoles = findFakeRoute(roleRoutes, "get", "/platform/roles");

		const result = listRoles({ query: { page_size: "100" } }) as {
			data: { items: PlatformRole[] };
		};
		expect(result.data.items).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ displayName: "平台管理员" }),
				expect.objectContaining({ displayName: "运营管理员" }),
				expect.objectContaining({ displayName: "只读审计员" }),
			]),
		);
		expect(result.data.items).toContainEqual(
			expect.objectContaining({ builtIn: true, id: "role-admin" }),
		);
		expect(
			result.data.items.every(
				(role) =>
					Number.isFinite(Date.parse(role.createdAt)) &&
					Number.isFinite(Date.parse(role.updatedAt)),
			),
		).toBe(true);
	});

	it("filters, sorts, and paginates the management list", () => {
		const listRoles = findFakeRoute(roleRoutes, "get", "/platform/roles");

		expect(
			listRoles({
				query: {
					order: "desc",
					page: "1",
					page_size: "1",
					q: "管理",
					sort: "member_count",
				},
			}),
		).toMatchObject({
			data: {
				items: [{ displayName: "运营管理员", memberCount: 11 }],
				page: 1,
				page_size: 1,
				total: 2,
			},
		});
	});

	it("rejects deletion of built-in roles at the Fake API boundary", () => {
		const deleteRole = findFakeRoute(
			roleRoutes,
			"delete",
			"/platform/roles/:roleId",
		);

		expect(deleteRole({ params: { roleId: "role-admin" }, query: {} })).toEqual(
			{
				code: 409,
				data: null,
				msg: "Built-in roles cannot be deleted",
			},
		);
	});
});

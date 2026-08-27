import { describe, expect, it } from "vitest";

import type { PlatformUserDetail } from "../src/api/users";
import userRoutes from "./users.fake";
import { findFakeRoute } from "./route-helpers";

interface UserListPayload {
	data: {
		items: PlatformUserDetail[];
		page: number;
		page_size: number;
		total: number;
	};
}

interface UserMutationPayload {
	code: number;
	data: PlatformUserDetail | null;
}

function listUsers(query: Record<string, string>) {
	return findFakeRoute(
		userRoutes,
		"get",
		"/platform/users",
	)({
		query,
	}) as UserListPayload;
}

describe("Fake users", () => {
	it("provides enough deterministic records to demonstrate pagination", () => {
		const firstPage = listUsers({ page: "1", page_size: "10" });
		const secondPage = listUsers({ page: "2", page_size: "10" });

		expect(firstPage.data.total).toBeGreaterThanOrEqual(24);
		expect(firstPage.data.items).toHaveLength(10);
		expect(secondPage.data.items).toHaveLength(10);
		expect(secondPage.data.items.map((user) => user.id)).not.toEqual(
			firstPage.data.items.map((user) => user.id),
		);
	});

	it("keeps generated records useful for status and keyword filters", () => {
		const disabledUsers = listUsers({
			page: "1",
			page_size: "100",
			status: "disabled",
		});
		const keywordUsers = listUsers({
			page: "1",
			page_size: "100",
			q: "chen",
		});
		const phoneUsers = listUsers({
			page: "1",
			page_size: "100",
			q: "13800138000",
		});

		expect(disabledUsers.data.items.length).toBeGreaterThan(1);
		expect(
			disabledUsers.data.items.every((user) => user.status === "disabled"),
		).toBe(true);
		expect(keywordUsers.data.items.length).toBeGreaterThan(1);
		expect(
			keywordUsers.data.items.every((user) =>
				`${user.username} ${user.displayName} ${user.email} ${user.phone}`
					.toLowerCase()
					.includes("chen"),
			),
		).toBe(true);
		expect(phoneUsers.data.items).toHaveLength(1);
		expect(phoneUsers.data.items[0]?.username).toBe("admin");
	});

	it("returns complete generic account metadata for table columns", () => {
		const firstUser = listUsers({ page: "1", page_size: "1" }).data.items[0];

		expect(firstUser).toBeDefined();
		expect(typeof firstUser?.authSource).toBe("string");
		expect(typeof firstUser?.departmentId).toBe("string");
		expect(typeof firstUser?.jobTitle).toBe("string");
		expect(typeof firstUser?.lastLoginAt).toBe("string");
		expect(typeof firstUser?.lastLoginIp).toBe("string");
		expect(typeof firstUser?.mfaEnabled).toBe("boolean");
		expect(typeof firstUser?.phone).toBe("string");
		expect(Array.isArray(firstUser?.roles)).toBe(true);
	});

	it("keeps user deletion in the current Fake preview session", () => {
		const createUser = findFakeRoute(userRoutes, "post", "/platform/users");
		const deleteUser = findFakeRoute(
			userRoutes,
			"delete",
			"/platform/users/:userId",
		);

		const username = `delete-test-${Date.now()}`;
		const created = createUser?.({
			body: {
				displayName: "Delete Test",
				email: `${username}@example.com`,
				password: "test-password",
				username,
			},
		}) as UserMutationPayload;
		expect(created.code).toBe(0);
		expect(created.data).not.toBeNull();

		const deleted = deleteUser?.({
			params: { userId: created.data!.id },
		}) as UserMutationPayload;
		expect(deleted.code).toBe(0);
		expect(
			listUsers({ page: "1", page_size: "100", q: username }).data.items,
		).toHaveLength(0);
	});

	it("persists editable profile fields through the user PATCH route", () => {
		const createUser = findFakeRoute(userRoutes, "post", "/platform/users");
		const updateUser = findFakeRoute(
			userRoutes,
			"patch",
			"/platform/users/:userId",
		);
		const deleteUser = findFakeRoute(
			userRoutes,
			"delete",
			"/platform/users/:userId",
		);

		const username = `update-test-${Date.now()}`;
		const created = createUser?.({
			body: {
				displayName: "Update Test",
				email: `${username}@example.com`,
				password: "test-password",
				username,
			},
		}) as UserMutationPayload;
		const updated = updateUser?.({
			body: {
				departmentId: "dept-operations",
				displayName: "Updated User",
				email: "updated@example.com",
				expectedVersion: created.data!.version,
				jobTitle: "Operations Lead",
				phone: "+86 139 0013 9000",
				status: "disabled",
			},
			params: { userId: created.data!.id },
		}) as UserMutationPayload;

		expect(updated.code).toBe(0);
		expect(updated.data).toEqual(
			expect.objectContaining({
				departmentId: "dept-operations",
				displayName: "Updated User",
				email: "updated@example.com",
				jobTitle: "Operations Lead",
				phone: "+86 139 0013 9000",
				status: "disabled",
			}),
		);

		deleteUser?.({ params: { userId: created.data!.id } });
	});

	it("rejects deleting the current signed-in user", () => {
		const deleteUser = findFakeRoute(
			userRoutes,
			"delete",
			"/platform/users/:userId",
		);

		const result = deleteUser?.({
			params: { userId: "user-admin" },
		}) as UserMutationPayload;
		expect(result.code).toBe(409);
		expect(
			listUsers({ page: "1", page_size: "100", q: "admin" }).data.items,
		).toContainEqual(expect.objectContaining({ id: "user-admin" }));
	});

	it("includes role and recent sign-in data required by the user table", () => {
		const response = listUsers({ page: "1", page_size: "10" });

		expect(response.data.items).not.toHaveLength(0);
		expect(
			response.data.items.every(
				(user) => Array.isArray(user.roles) && "lastLoginAt" in user,
			),
		).toBe(true);
	});
});

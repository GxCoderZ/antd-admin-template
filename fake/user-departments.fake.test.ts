import { describe, expect, it } from "vitest";

import type { PlatformDepartment } from "../src/api/departments";
import type { PlatformUserDetail } from "../src/api/users";
import departmentRoutes from "./departments.fake";
import userRoutes from "./users.fake";
import { findFakeRoute } from "./route-helpers";

const createDepartment = findFakeRoute(
	departmentRoutes,
	"post",
	"/platform/departments",
);
const updateDepartment = findFakeRoute(
	departmentRoutes,
	"patch",
	"/platform/departments/:departmentId",
);
const deleteDepartment = findFakeRoute(
	departmentRoutes,
	"delete",
	"/platform/departments/:departmentId",
);
const listDepartments = findFakeRoute(
	departmentRoutes,
	"get",
	"/platform/departments",
);
const createUser = findFakeRoute(userRoutes, "post", "/platform/users");
const updateUser = findFakeRoute(
	userRoutes,
	"patch",
	"/platform/users/:userId",
);
const getUser = findFakeRoute(userRoutes, "get", "/platform/users/:userId");
const deleteUser = findFakeRoute(
	userRoutes,
	"delete",
	"/platform/users/:userId",
);

describe("Fake user department membership", () => {
	it("derives member counts and names after creation, reassignment, rename and deletion", () => {
		const department = (
			createDepartment({
				body: {
					code: "membership-test",
					name: "Membership Test",
					status: "active",
				},
			}) as { data: PlatformDepartment }
		).data;
		const user = (
			createUser({
				body: {
					username: "membership-test",
					displayName: "Membership Test",
					email: "membership@example.com",
					password: "test-password",
					departmentId: department.id,
				},
			}) as { data: PlatformUserDetail }
		).data;
		const memberCount = () =>
			(
				listDepartments({ query: { name: "membership-test" } }) as {
					data: PlatformDepartment[];
				}
			).data[0]!.memberCount;
		try {
			expect(user).toMatchObject({
				departmentId: department.id,
				departmentName: "Membership Test",
			});
			expect(memberCount()).toBe(1);
			expect(
				deleteDepartment({ params: { departmentId: department.id } }),
			).toMatchObject({ code: 409 });
			updateDepartment({
				params: { departmentId: department.id },
				body: { ...department, name: "Renamed Department" },
			});
			expect(getUser({ params: { userId: user.id } })).toMatchObject({
				data: { departmentName: "Renamed Department" },
			});
			updateUser({
				params: { userId: user.id },
				body: { ...user, departmentId: "dept-platform" },
			});
			expect(memberCount()).toBe(0);
			updateUser({
				params: { userId: user.id },
				body: { ...user, departmentId: department.id },
			});
			expect(memberCount()).toBe(1);
			deleteUser({ params: { userId: user.id } });
			expect(memberCount()).toBe(0);
		} finally {
			deleteUser({ params: { userId: user.id } });
			deleteDepartment({ params: { departmentId: department.id } });
		}
	});

	it("rejects missing or disabled departments without changing membership", () => {
		const department = (
			createDepartment({
				body: {
					code: "disabled-membership-test",
					name: "Disabled Test",
					status: "disabled",
				},
			}) as { data: PlatformDepartment }
		).data;
		const user = (
			createUser({
				body: {
					username: "unassigned-test",
					displayName: "Unassigned",
					email: "unassigned@example.com",
					password: "test-password",
				},
			}) as { data: PlatformUserDetail }
		).data;
		try {
			for (const [departmentId, code] of [
				["missing-department", 404],
				[department.id, 422],
			] as const) {
				expect(
					updateUser({
						params: { userId: user.id },
						body: { ...user, departmentId },
					}),
				).toMatchObject({ code, data: null });
				expect(
					createUser({
						body: { ...user, username: "invalid-membership", departmentId },
					}),
				).toMatchObject({ code, data: null });
			}
			expect(getUser({ params: { userId: user.id } })).toMatchObject({
				data: { departmentId: null, departmentName: null },
			});
		} finally {
			deleteUser({ params: { userId: user.id } });
			deleteDepartment({ params: { departmentId: department.id } });
		}
	});
});

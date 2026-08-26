import { describe, expect, it } from "vitest";

import type { PlatformDepartment } from "../src/api/departments";
import departmentRoutes from "./departments.fake";
import { findFakeRoute } from "./route-helpers";

interface DepartmentListPayload {
	code: number;
	data: PlatformDepartment[];
}

function findRoute(method: string, url: string) {
	return findFakeRoute(departmentRoutes, method, url);
}

describe("Fake departments", () => {
	it("returns filterable tree data with representative hierarchy", () => {
		const listDepartments = findRoute("get", "/platform/departments");
		const all = listDepartments({ query: {} }) as DepartmentListPayload;
		const filtered = listDepartments({
			query: { name: "运营", status: "active" },
		}) as DepartmentListPayload;

		expect(all.data.length).toBeGreaterThanOrEqual(3);
		expect(all.data.some((item) => item.children.length > 0)).toBe(true);
		expect(filtered.data.every((item) => item.status === "active")).toBe(true);
		expect(JSON.stringify(filtered.data)).toContain("运营");
	});

	it("persists create, update, disable and delete operations in the preview session", () => {
		const listDepartments = findRoute("get", "/platform/departments");
		const createDepartment = findRoute("post", "/platform/departments");
		const updateDepartment = findRoute(
			"patch",
			"/platform/departments/:departmentId",
		);
		const deleteDepartment = findRoute(
			"delete",
			"/platform/departments/:departmentId",
		);
		const created = createDepartment({
			body: {
				code: "quality_assurance",
				name: "质量保障组",
				parentId: "dept-operations",
				status: "active",
			},
		}) as { data: PlatformDepartment };

		updateDepartment({
			body: { ...created.data, name: "质量管理组", status: "disabled" },
			params: { departmentId: created.data.id },
		});
		const afterUpdate = listDepartments({
			query: { name: "质量管理组", status: "disabled" },
		}) as DepartmentListPayload;
		expect(JSON.stringify(afterUpdate.data)).toContain(created.data.id);

		deleteDepartment({ params: { departmentId: created.data.id } });
		const afterDelete = listDepartments({
			query: { name: "质量管理组" },
		}) as DepartmentListPayload;
		expect(JSON.stringify(afterDelete.data)).not.toContain(created.data.id);
	});

	it("protects departments that still have children, positions or members", () => {
		const deleteDepartment = findRoute(
			"delete",
			"/platform/departments/:departmentId",
		);

		const protectedResult = deleteDepartment({
			params: { departmentId: "dept-operations" },
		}) as { code: number; msg: string };

		expect(protectedResult.code).toBe(409);
		expect(protectedResult.msg).toMatch(/children|positions|members/i);
	});
});

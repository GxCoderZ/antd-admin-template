import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

function read(relativePath: string) {
	return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("role and permission management UI contract", () => {
	it("protects built-in roles and keeps destructive confirmation isolated", () => {
		const columns = read("src/pages/system/role/constants.tsx");
		const page = read("src/pages/system/role/index.tsx");
		const deleteModal = read("src/pages/system/role/components/delete-role-modal.tsx");

		expect(columns).toContain("role.is_system");
		expect(columns).toContain("builtInDeleteHint");
		expect(page).toContain("!role.is_system");
		expect(deleteModal).toContain("DangerConfirmation");
	});

	it("owns grouped permission configuration in a domain drawer", () => {
		const drawer = read("src/pages/system/role/components/permission-drawer.tsx");

		expect(drawer).toContain("PermissionTreeNode");
		expect(drawer).toContain("fetchBindRoleMenus");
		expect(drawer).toContain("checkedKeys");
		expect(drawer).toContain("expandedKeys");
		expect(drawer).toContain("common.checkAll");
		expect(drawer).not.toContain("fake/");
	});

	it("navigates role membership maintenance through the user page", () => {
		const rolePage = read("src/pages/system/role/index.tsx");
		const userPage = read("src/pages/system/user/index.tsx");
		const store = read("fake/store.ts");

		expect(rolePage).toContain("/system/user?role_id=");
		expect(userPage).toContain("searchParams.get(\"role_id\")");
		expect(store).toContain("params.role_id");
	});

	it("hides write actions behind role permissions and keeps permission viewing API-backed", () => {
		const rolePage = read("src/pages/system/role/index.tsx");
		const permissionPage = read("src/pages/system/menu/index.tsx");
		const permissionTree = read("src/pages/system/menu/tree-menu.tsx");

		for (const permission of ["system:role:add", "system:role:edit", "system:role:delete", "system:role:assign-permission"])
			expect(rolePage).toContain(permission);

		expect(permissionPage).toContain("fetchMenuList");
		expect(permissionPage).toContain("fetchMenuTree");
		expect(permissionTree).not.toContain("parent 1");
		expect(permissionPage).not.toContain("fake/");
	});
});

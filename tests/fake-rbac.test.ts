import { beforeEach, describe, expect, it } from "vitest";

const storeModules = import.meta.glob("../fake/store.ts", { eager: true });
const storeModule = storeModules["../fake/store.ts"] as any | undefined;

describe("fake RBAC store", () => {
	beforeEach(() => {
		storeModule?.resetFakeStore();
	});

	it("provides administrator and viewer identities with different UI permissions", () => {
		expect(storeModule).toBeDefined();
		if (!storeModule)
			return;

		const administrator = storeModule.authenticate("admin", "admin123");
		const viewer = storeModule.authenticate("viewer", "viewer123");

		expect(administrator?.permissions).toContain("system:user:add");
		expect(administrator?.permissions).toContain("audit:view");
		expect(viewer?.permissions).toContain("system:user:view");
		expect(viewer?.permissions).not.toContain("system:user:add");
	});

	it("keeps user and role changes in memory for the current preview session", () => {
		expect(storeModule).toBeDefined();
		if (!storeModule)
			return;

		const role = storeModule.createRole({ name: "产品运营", remark: "演示角色" });
		const user = storeModule.createUser({ username: "product", password: "product123" });
		storeModule.bindUserRoles(user.id, [role.id]);

		expect(storeModule.listRoles({ page: 1, page_size: 20 }).items).toContainEqual(
			expect.objectContaining({ id: role.id, name: "产品运营" }),
		);
		expect(storeModule.getUserRoles(user.id)).toEqual([role.id]);
		expect(storeModule.listUsers({ page: 1, page_size: 20 }).items).toContainEqual(
			expect.objectContaining({ id: user.id, username: "product" }),
		);
	});
});

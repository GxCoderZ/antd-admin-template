import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const userPagePath = path.join(root, "src/pages/system/user");

function read(relativePath: string) {
	return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("user management UI contract", () => {
	it("keeps the page as an API-backed orchestrator", () => {
		const page = read("src/pages/system/user/index.tsx");

		expect(page).toContain("fetchUserList");
		expect(page).toContain("useQuery");
		expect(page).not.toContain("fake/");
		expect(page).not.toContain("const users = [");
		expect(fs.statSync(path.join(userPagePath, "index.tsx")).size).toBeLessThan(30_000);
	});

	it("splits large user flows into controlled domain components", () => {
		for (const file of [
			"create-user-drawer.tsx",
			"edit-user-modal.tsx",
			"role-assign.tsx",
			"reset-password-modal.tsx",
			"reset-password-result.tsx",
			"force-logout-modal.tsx",
		]) {
			expect(fs.existsSync(path.join(userPagePath, "components", file))).toBe(true);
		}
	});

	it("routes every write through typed fetch functions and permission gates", () => {
		const page = read("src/pages/system/user/index.tsx");

		for (const functionName of [
			"fetchCreateUser",
			"fetchUpdateUser",
			"fetchDeleteUser",
			"fetchBindUserRoles",
			"fetchResetUserPassword",
			"fetchForceLogoutUser",
		]) {
			expect(page).toContain(functionName);
		}

		for (const permission of [
			"system:user:add",
			"system:user:edit",
			"system:user:assign-role",
			"system:user:reset-password",
			"system:user:force-logout",
		]) {
			expect(page).toContain(permission);
		}
	});
});

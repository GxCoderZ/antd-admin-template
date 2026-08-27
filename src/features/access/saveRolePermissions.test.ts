import { beforeEach, describe, expect, it, vi } from "vitest";

import { platformPermissions } from "../../app/permissions";
import {
	RolePermissionSaveError,
	saveRolePermissions,
} from "./saveRolePermissions";

const mocks = vi.hoisted(() => ({ change: vi.fn() }));
vi.mock("#src/api/roles", () => ({ setPlatformRolePermission: mocks.change }));

beforeEach(() => mocks.change.mockReset().mockResolvedValue(undefined));

describe("saveRolePermissions", () => {
	it("submits only added and removed permissions", async () => {
		await saveRolePermissions({
			permissions: [
				platformPermissions.logsRead,
				platformPermissions.usersRead,
			],
			role: {
				id: "reviewer",
				permissions: [
					platformPermissions.logsRead,
					platformPermissions.rolesManage,
				],
			},
		});
		expect(mocks.change.mock.calls).toEqual([
			[
				{
					granted: true,
					permission: platformPermissions.usersRead,
					roleId: "reviewer",
				},
			],
			[
				{
					granted: false,
					permission: platformPermissions.rolesManage,
					roleId: "reviewer",
				},
			],
		]);
	});

	it("does not submit unchanged permissions", async () => {
		await saveRolePermissions({
			permissions: [platformPermissions.logsRead],
			role: { id: "reviewer", permissions: [platformPermissions.logsRead] },
		});
		expect(mocks.change).not.toHaveBeenCalled();
	});

	it("reports partial failure and retries only the remaining difference", async () => {
		const cause = new Error("Permission rejected");
		mocks.change.mockRejectedValueOnce(cause);
		const permissions = [
			platformPermissions.usersRead,
			platformPermissions.logsRead,
		];
		await expect(
			saveRolePermissions({
				permissions,
				role: { id: "reviewer", permissions: [] },
			}),
		).rejects.toEqual(new RolePermissionSaveError(1, 1, cause));
		mocks.change.mockClear();
		await saveRolePermissions({
			permissions,
			role: { id: "reviewer", permissions: [platformPermissions.logsRead] },
		});
		expect(mocks.change.mock.calls).toEqual([
			[
				{
					granted: true,
					permission: platformPermissions.usersRead,
					roleId: "reviewer",
				},
			],
		]);
	});
});

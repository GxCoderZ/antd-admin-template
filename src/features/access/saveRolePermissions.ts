import { setPlatformRolePermission, type PlatformRole } from "#src/api/roles";
import type { PlatformPermission } from "../../app/permissions";

export class RolePermissionSaveError extends Error {
	constructor(
		readonly savedCount: number,
		readonly failedCount: number,
		cause: unknown,
	) {
		super("Role permission changes failed", { cause });
		this.name = "RolePermissionSaveError";
	}
}

export async function saveRolePermissions({
	permissions,
	role,
}: {
	permissions: PlatformPermission[];
	role: Pick<PlatformRole, "id" | "permissions">;
}) {
	const current = new Set(role.permissions);
	const next = new Set(permissions);
	const changes = [
		...Array.from(next)
			.filter((permission) => !current.has(permission))
			.map((permission) => ({ granted: true, permission })),
		...Array.from(current)
			.filter((permission) => !next.has(permission))
			.map((permission) => ({ granted: false, permission })),
	];
	const results = await Promise.allSettled(
		changes.map((change) =>
			setPlatformRolePermission({ ...change, roleId: role.id }),
		),
	);
	const failures = results.filter((result) => result.status === "rejected");
	const [firstFailure] = failures;
	if (firstFailure) {
		throw new RolePermissionSaveError(
			results.length - failures.length,
			failures.length,
			firstFailure.reason,
		);
	}
}

import { createContext, useCallback, useContext } from "react";

import type { PlatformPermission } from "#src/api/types";

export type { PlatformPermission } from "#src/api/types";

export const platformPermissions = {
	announcementsManage: "platform.announcements.manage",
	announcementsRead: "platform.announcements.read",
	departmentsManage: "platform.departments.manage",
	dictionariesManage: "platform.dictionaries.manage",
	importExportManage: "platform.import-export.manage",
	logsRead: "platform.logs.read",
	positionsManage: "platform.positions.manage",
	settingsManage: "platform.settings.manage",
	rolesManage: "platform.roles.manage",
	usersManage: "platform.users.manage",
	usersRead: "platform.users.read",
} as const satisfies Record<string, PlatformPermission>;

export const PermissionContext =
	createContext<ReadonlySet<PlatformPermission> | null>(null);

export function usePermissionChecker() {
	const permissions = useContext(PermissionContext);

	if (!permissions) {
		throw new Error("PermissionContext is not available.");
	}

	return useCallback(
		(permission?: PlatformPermission) =>
			permission === undefined || permissions.has(permission),
		[permissions],
	);
}

export function usePermission(permission?: PlatformPermission) {
	return usePermissionChecker()(permission);
}
